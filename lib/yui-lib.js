module.exports = function(grunt) {

    var libfs = require('fs'),
        libpath = require('path'),
        libutil = require('util'),
        Handlebars = require('handlebars'),
        FILE_PATH_REGEX = /^(js[\/\\])/i,
        MODULE_NAME_REGEX = /([^\/\\]+)[\/\\]build\.json$/i,
        MODULE_EXT_REGEX = /^[^\/\\]+/i,
        MESSAGE_CACHE_NOT_INITIALIZED = "Cache must be initialized",
        MESSAGE_BUILD_FILE_UNDEFINED = "Build file is not defined",
        /*
        * Default options. Do NOT overwrite
        */
        options = {
            buildDir: 'build',
            srcDir: 'src',
            version: '@VERSION@',
            spaces: 2,
            configWrapper: __dirname + '/template/config-wrapper.hbs',
            moduleWrapper: __dirname + '/template/module-wrapper.hbs'
        },
        config = {
            metaConfig: {},
            /**
            * Find all meta configuration files.
            */
            find: function(options) {
                return grunt.file.expand({
                    cwd: options.srcDir
                }, '**/meta/*.json');
            },
            /**
            * Cache the meta config files.
            */
            read: function(options, files) {
                files.map(function(filepath) {
                    var metaPath = libpath.join(options.srcDir, filepath),
                        meta = JSON.parse(grunt.file.read(metaPath));

                    grunt.log.debug('Reading meta file - %s', metaPath);
                    grunt.log.debug(meta);

                    // build modules
                    Object.keys(meta).forEach(function(propName) {
                        var property = meta[propName];

                        if (propName === 'builds') {
                            // module has multiple modules.
                            grunt.log.debug('Reading module');
                            this.readModule(property);                            
                        }
                        else if (property.submodules) {
                            // module has submodules.
                            grunt.log.debug('Reading submodules');
                            this.readModule(property.submodules);
                        }
                        else if (property.requires) {
                            // single module.
                            grunt.log.debug('Reading a module : ' + propName);
                            this.set(propName, property);   
                        }
                    }, this);
                }, this);
                return this.metaConfig;
            },
            readModule: function(modules) {
                Object.keys(modules).forEach(function(module) {
                    grunt.log.debug('Module %s', module);
                    this.set(module, modules[module]);
                }, this);
            },
            /**
            * Retives a module.
            */
            get: function(module) {

                if (module) {
                    return this.metaConfig[module];
                }
                return null;
            },
            /**
            * Cache a module.
            */
            set: function(module, config) {
                this.metaConfig[module] = config;
            },
            /**
            * Writes the meta configuration to disk.
            */
            write: function(options) {
                var files,
                    config,
                    configContent;

                grunt.log.debug('Executing writeConfig');

                // read the config
                files = this.find(options);

                grunt.log.debug('Meta Files');

                config = this.read(options, files);

                grunt.log.debug('Meta Configs');

                // wrap meta in the config.
                configContent = template.wrapConfig({
                    meta: JSON.stringify(config, null, options.spaces)
                });

                grunt.log.debug('Meta Content');
                grunt.file.write(options.buildDir + '/config.js', configContent);
            }
        },
        template = {
            /**
            * Initialize the templates
            */
            init: function(options) {
                grunt.log.debug('Library init');
                this.setup('wrapConfig', options.configWrapper);
                this.setup('wrapModule', options.moduleWrapper);
            },
            /**
            * Setup a template.
            */
            setup: function(name, filepath) {
                var content;

                grunt.log.debug('Initializing template: %s', filepath);

                try {
                    content = grunt.file.read(filepath);
                }
                catch(e) {
                    return null;
                }

                // create template handler.
                if (!content) {
                    return null;
                }

                if (name === 'init' || name === 'setup') {
                    grunt.log.error("The init function cannot be overridden!");
                    return null;
                }
                else if (this[name]) {
                    grunt.log.warn("The %s will be overridden", name);
                }

                this[name] = Handlebars.compile(Handlebars.parse(content));

                return this[name];
            }
        },
        submodule = {
            updateCache: function(options, prop, submoduleName) {
                var jsfiles = prop.builds[submoduleName].jsfiles,
                    cache = modules.cache[prop.name];

                if (jsfiles) {
                    jsfiles.forEach(function(jsfile) {
                        var filepath,
                            stat,
                            lastModifiedTime;

                        jsfile = buildProperties.getFilePath(jsfile);

                        grunt.log.debug('Caching submodule: %s', jsfile);

                        // read the file stats.
                        filepath = libpath.join(options.srcDir, prop.name, jsfile);
                        stat = libfs.statSync(filepath);
                        lastModifiedTime = stat.mtime.getTime();

                        // store the file into memory
                        if (lastModifiedTime > cache[jsfile].mtime) {
                            cache[jsfile].content = grunt.file.read(filepath);
                        }
                    });
                }
            },
            write: function(options, prop, submoduleName) {
                var opt = {},
                    prependFiles,
                    appendFiles,
                    name = prop.builds[submoduleName].name || submoduleName,
                    version = options.version,
                    cfg = config.get(submoduleName) || {},
                    outputFile = libpath.join(options.buildDir, submoduleName, submoduleName + '.js'),
                    outputContent;

                // gather the properties needed to create the module.
                prependFiles = prop.builds[submoduleName].prependFiles;
                prependFiles = this.getFilesAsString(options, prop.name, prependFiles);

                appendFiles = prop.builds[submoduleName].appendFiles;
                appendFiles = this.getFilesAsString(options, prop.name, appendFiles);

                grunt.log.debug('Reading cache: %s - %s', submoduleName);

                // join all submodule content into an array
                outputContent = this.getFilesAsString(options, prop.name, prop.builds[submoduleName].jsfiles);

                // write raw file to disk.
                grunt.file.write(outputFile.replace('.js', '-raw.js'), outputContent);

                opt = {
                    prependFiles: prependFiles,
                    appendFiles: appendFiles,
                    name: name,
                    version: version,
                    config: JSON.stringify(cfg, null, options.spaces),
                    script: outputContent
                };

                // wrap the submodule using YUI loader template.
                outputContent = template.wrapModule(opt);

                // write wrapped module to disk.
                grunt.file.write(outputFile, outputContent);
            },
            /**
            * Reads the files as a string.
            */
            getFilesAsString: function(options, moduleName, files) {
                var contentArray = [];
                if (files) {
                    files.forEach(function(filename) {
                        var path,
                            content;
                        filename = buildProperties.getFilePath(options, filename);
                        path = libpath.join(options.srcDir, moduleName, filename);
                        content = grunt.file.read(path);
                        if (!content) {
                            content = "// Couldn't read file : " + path;
                        }
                        contentArray.push(content);
                    });
                }

                return contentArray.join('\n');
            }
        },
        module = {
            /**
            * Compile a module in this order: prebuild modules, module, and postbuilds.
            */
            compile: function(options, moduleName) {
                var prop = buildProperties.get(moduleName),
                    cache = modules.cache[moduleName];

                grunt.log.debug('Reading module build.json: %s', moduleName);
                grunt.log.debug(JSON.stringify(prop, null, options.spaces));


                grunt.log.debug('Excuting prebuilds: %s', moduleName);
                // Build these modules beforehand
                if (prop.prebuilds) {
                    prop.prebuilds.forEach(function(prebuildModule) {
                        grunt.log.debug('Prebuild: %s', prebuildModule);
                        this.compile(options, prebuildModule);
                    }, this);
                }

                // compiles the submodules.
                grunt.log.debug('Compiling submodules: %s', moduleName);

                // update the cache if the file has been modified.
                Object.keys(prop.builds).forEach(function(submoduleName) {
                    submodule.updateCache(options, prop, submoduleName);
                });

                // write updated files to disk.
                Object.keys(prop.builds).forEach(function(submoduleName) {
                    submodule.write(options, prop, submoduleName);
                });

                // Build these modules afterwards
                grunt.log.debug('Excuting postbuilds: %s', moduleName);
                if (prop.postbuilds) {
                    prop.postbuilds.forEach(function(postbuildModule) {
                        grunt.log.debug('Postbuild: %s', postbuildModule);
                        this.compile(options, postbuildModule);
                    }, this);
                }
            }
        },
        buildProperties = {
            cache: null,
            /**
            * Build the initial build file cache.
            */
            init: function(options) {
                var buildFiles = this.find(options);

                if (!this.cache) {
                    // build the build.json cache
                    this.cache = {};
                    buildFiles.forEach(function(buildFile) {
                        buildFile = libpath.join(options.srcDir, buildFile);
                        this.cacheBuildFile(options, buildFile);
                    }, this);

                    return true;
                }

                return false;
            },
            /**
            * Located the build files.
            */
            find: function(options) {
                return grunt.file.expand({
                        cwd: options.srcDir
                    }, '**/build.json');
            },
            /**
            * Cache the modules in build files into memory.
            */
            cacheBuildFile: function(options, buildFile) {
                var moduleName;

                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }

                if (!buildFile) {
                    throw new Error(MESSAGE_BUILD_FILE_UNDEFINED);   
                }

                moduleName = this.getModuleName(buildFile);

                grunt.log.debug('Caching build: %s %s', moduleName, buildFile);

                this.cache[moduleName] = JSON.parse(grunt.file.read(buildFile));
            },
            /**
            * Retrieve the module cache.
            */
            get: function(moduleName) {
                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }
                return this.cache[moduleName];
            },
            /**
            * Loops through each of the modules based on array of keys.
            */
            each: function(handler, thisObj) {
                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }
                Object.keys(this.cache).forEach(handler, thisObj || this);
            },
            /*
            * Gets the file name from the path.
            */
            getFilePath: function(options, path) {
                // module does not have js on path.
                if (!FILE_PATH_REGEX.test(path)) {
                    path = libpath.join('js', path);
                }

                return path.replace(/\\/g, '/');
            },
            /**
            * Gets the module name from the path.
            */
            getModuleName: function(path) {
                var matches = MODULE_NAME_REGEX.exec(path);

                if (!matches || matches.length < 1) {
                    return null;
                }

                return matches[1];
            }
        },
        modules = {
            cache: null,
            /**
            * Cache the files associated with a module.
            */
            cacheFiles: function(options, moduleName) {
                var moduleBuildProp;

                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }

                moduleBuildProp = buildProperties.cache[moduleName];
                Object.keys(moduleBuildProp.builds).forEach(function(submoduleName) {
                    var submoduleBuildProp = moduleBuildProp.builds[submoduleName];

                    grunt.log.debug('Reading submodule: %s', submoduleName);

                    // grabs all the jsfiles names.
                    if (submoduleBuildProp.jsfiles)  {
                        // cache all jsfiles.
                        submoduleBuildProp.jsfiles.forEach(function(jsfile) {
                            var jsfile = buildProperties.getFilePath(options, jsfile),
                                path = libpath.join(options.srcDir, moduleName, jsfile);

                            // does cache file already exist
                            if (this.cache[moduleName][jsfile]) {
                                grunt.log.debug('Cache already exists: %s', jsfile);
                                this.cache[moduleName][jsfile].modules.push(submoduleName);
                            }
                            else {
                                grunt.log.debug('Initalize cache: %s', jsfile);
                                this.cache[moduleName][jsfile] = {
                                    modules: [ submoduleName ],
                                    content: null,
                                    mtime: 0
                                };
                            }
                        }, this);
                    }
                }, this);
            },
            /**
            * Initiated the module options.
            */
            init: function(options) {
                if (!this.cache) {
                    this.cache = {};

                    grunt.log.debug('\nBuilding modules cache');
                    grunt.log.debug('--------------------------------');

                    buildProperties.each(function(moduleName) {
                        grunt.log.debug('Initiating module cache: %s', moduleName);
                        this.cache[moduleName] = {};
                        this.cacheFiles(options, moduleName);
                    }, this);
                    return true;
                }
                return false;
            },
            /*
            * Compiles the modules.
            */
            compile: function(options) {
                // cache build files
                var created = buildProperties.init(options);

                // cache modules
                if (created) {
                    this.init(options);
                }

                grunt.log.debug('\nCompiling all modules');
                grunt.log.debug('--------------------------------');

                // compile modules
                buildProperties.each(function(moduleName) {
                    grunt.log.debug('Compiling module: %s', moduleName);
                    module.compile(options, moduleName);
                }, this);
            }
        };
    return {
        MESSAGE_CACHE_NOT_INITIALIZED: MESSAGE_CACHE_NOT_INITIALIZED,
        MESSAGE_BUILD_FILE_UNDEFINED: MESSAGE_BUILD_FILE_UNDEFINED,
        options: options,
        buildProperties: buildProperties,
        template: template,
        modules: modules,
        module: module,
        submodule: submodule,
        config: config
    };
};