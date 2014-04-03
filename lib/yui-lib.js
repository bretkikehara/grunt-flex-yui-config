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

                    Object.keys(meta).forEach(function(module) {
                        if (meta[module].submodules) {
                            Object.keys(meta[module].submodules).forEach(function(submodule) {
                                this.set(submodule, meta[module].submodules[submodule]);
                            }, this);
                        }
                        else {
                            this.set(module, meta[module]);
                        }
                    }, this);
                }, this);
                return this.metaConfig;
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
            /**
            * Compiles the submodule.
            */
            compile: function(options, moduleName) {
                var prop = buildProperties.get(moduleName),
                    build = { };

                // updated files are counted in the build object as a key
                Object.keys(prop.jsfiles).forEach(function(jsfile) {
                    var filepath,
                        stat,
                        lastModifiedTime;

                    if (jsfile.charAt(0) === '/') {
                        filepath = jsfile;
                    }
                    else {
                        filepath = libpath.join(options.srcDir, moduleName, jsfile);    
                    }

                    stat = libfs.statSync(filepath);
                    lastModifiedTime = stat.mtime.getTime();

                    // store the file into memory
                    if (lastModifiedTime > prop.jsfiles[jsfile].mtime) {
                        prop.jsfiles[jsfile].content = grunt.file.read(filepath);
                        prop.jsfiles[jsfile].modules.forEach(function(submoduleName) {
                            // set the build number
                            if (build[submoduleName]) {
                                build[submoduleName] += 1;
                            }
                            else {
                                build[submoduleName] = 1;
                            }
                        });
                    }
                });

                // write updated files to disk.
                Object.keys(build).forEach(function(submoduleName) {
                    var submoduleContent = [],
                        opt = {
                            prependFiles: this.getFilesAsString(options, prop.builds[submoduleName].prependFiles),
                            appendFiles: this.getFilesAsString(options, prop.builds[submoduleName].appendFiles),
                            name: prop.builds[submoduleName].name || submoduleName,
                            version: options.version,
                            script: submoduleContent
                        },
                        submodulePath = libpath.join(options.buildDir, submoduleName, submoduleName + '.js');

                    // format config
                    opt.config = config.get(opt.name);
                    opt.config = JSON.stringify(opt.config, null, options.spaces);
                    grunt.log.debug('submodule meta %s - %s : %s', submoduleName, opt.name, opt.config);

                    if (!opt.config) {
                        throw new Error("Submodule " + opt.name + " config is null");
                    }

                    // join all submodule content into an array
                    prop.builds[submoduleName].jsfiles.forEach(function(jsfile) {
                        var path = buildProperties.getFilePath(options, jsfile);
                        submoduleContent.push(prop.jsfiles[path].content);
                    });
                    submoduleContent = submoduleContent.join('\n');

                    // write raw file to disk.
                    grunt.file.write(submodulePath.replace('.js', '-raw.js'), submoduleContent);

                    // wrap the submodule using YUI loader template.
                    submoduleContent = template.wrapModule(opt);

                    // write wrapped module to disk.
                    grunt.file.write(submodulePath, submoduleContent);
                }, this);

                return build;
            },
            /**
            * Reads the files as a string.
            */
            getFilesAsString: function(options, files) {
                var contentArray = [];
                if (files) {
                    files.forEach(function(filename) {
                        var path = libpath.join(options.srcDir, moduleName, filename),
                            content = grunt.file.read(filepath);
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
                var prop = buildProperties.get(moduleName);

                grunt.log.debug('Building module: %s', moduleName);

                // Build these modules beforehand
                if (prop.prebuilds) {
                    prop.prebuilds.forEach(function(prebuildModule) {
                        grunt.log.debug('Prebuild: %s', prebuildModule);
                        this.compile(options, prebuildModule);
                    }, this);
                }

                // compiles the submodules.
                submodule.compile(options, moduleName, prop);

                // Build these modules afterwards
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
                }
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
            cacheBuildFile: function(options, buildFile, moduleName) {

                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }

                if (!buildFile) {
                    throw new Error(MESSAGE_BUILD_FILE_UNDEFINED);   
                }

                if (!moduleName) {
                    moduleName = this.getModuleName(buildFile);
                }

                grunt.log.debug('Caching build: %s %s', moduleName, buildFile);

                this.cache[moduleName] = JSON.parse(grunt.file.read(buildFile));
                this.cache[moduleName].file = buildFile;

                this.cacheFiles(options, moduleName);
            },
            /**
            * Cache the files associated with a module.
            */
            cacheFiles: function(options, moduleName) {
                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }

                // cache files here
                this.cache[moduleName].jsfiles = {};
                Object.keys(this.cache[moduleName].builds).forEach(function(submoduleName) {
                    grunt.log.debug('Reading submodule: %s', submoduleName);

                    // grabs all the jsfiles names.
                    if (this.cache[moduleName].builds[submoduleName].jsfiles)  {
                        // cache all jsfiles.
                        this.cache[moduleName].builds[submoduleName].jsfiles.forEach(function(jsfile) {
                            var jsfile = this.getFilePath(options, jsfile),
                                path = libpath.join(options.srcDir, moduleName, jsfile);

                            grunt.log.debug('Caching file: %s', jsfile);
                            // does cache file already exist
                            if (this.cache[moduleName].jsfiles[jsfile]) {
                                this.cache[moduleName].jsfiles[jsfile].modules.push(submoduleName);
                            }
                            else {
                                this.cache[moduleName].jsfiles[jsfile] = {
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
                var matches = FILE_PATH_REGEX.exec(path);

                if (path.charAt(0) === '\\' || path.charAt(0) === '/') {
                    return path;
                }

                // module does not have js on path.
                if (matches === null) {
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
            /*
            * Compiles the modules.
            */
            compile: function(options) {
                grunt.log.debug('Executing writeModules');

                buildProperties.init(options);

                buildProperties.each(function(moduleName) {
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