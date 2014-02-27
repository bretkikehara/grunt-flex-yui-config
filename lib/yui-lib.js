module.exports = function(grunt) {

    var libfs = require('fs'),
        libpath = require('path'),
        libutil = require('util'),
        Handlebars = require('handlebars'),
        FILE_NAME_REGEX = /([^\/\\]+\.[^\\\/]+)$/i,
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
            version: 'dev',
            spaces: 2,
            configWrapper: __dirname + '/template/config-wrapper.hbs',
            moduleWrapper: __dirname + '/template/module-wrapper.hbs'
        },
        config = {
            metaConfig: {},
            find: function(options) {
                return grunt.file.expand({
                    cwd: options.srcDir
                }, '**/meta/*.json');
            },
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
                return this.get();
            },
            get: function(module) {

                if (module) {
                    return this.metaConfig[module];
                }
                return this.metaConfig;
            },
            set: function(module, config) {
                this.metaConfig[module] = config;
            },
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
            init: function(options) {
                grunt.log.debug('Library init');
                this.setup('wrapConfig', options.configWrapper);
                this.setup('wrapModule', options.moduleWrapper);
            },
            setup: function(name, filepath) {
                var content;

                grunt.log.debug('Initializing template: %s', filepath);

                content = grunt.file.read(filepath);

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
            compile: function(options, moduleName) {
                var fileCache = {},
                    prop = buildProperties.get(moduleName);

                // joins the content together.
                Object.keys(prop.builds).forEach(function(submoduleName) {
                    var moduleContent = [];
                    prop.builds[submoduleName].jsfiles.forEach(function(jsfile) {
                        var filename = FILE_NAME_REGEX.exec(jsfile)[2];
                        moduleContent.push(fileCache[filename]);
                    }, this);

                    // create the content
                    moduleContent = moduleContent.join('\n');
                    Object.keys(prop.builds[submoduleName].replace).forEach(function(key, value) {
                        moduleContent = moduleContent.replace(key, value);
                    }, this);

                    // cache content
                    prop.builds[submoduleName].content = moduleContent;
                }, this);
            },
            write: function(options, moduleName, prop) {



            }
        },
        module = {
            compile: function(options, moduleName) {
                var prop = buildProperties.get(moduleName);
                
                grunt.log.debug('Building module: %s', moduleName);

                // Build these modules beforehand
                if (prop.prebuilds) {
                    prop.prebuilds.forEach(function(prebuildModule) {
                        var prop = buildProperties.get(prebuildModule);
                        grunt.log.debug('Prepend: %s', prebuildModule);
                        this.compile(options, prop);
                    }, this);
                }

                // compiles the submodules.
                submodule.compile(options, moduleName, prop);
                submodule.write(options, moduleName, prop);

                // Build these modules afterwards
                if (prop.postbuilds) {
                    prop.postbuilds.forEach(function(postbuildModule) {
                        var prop = buildProperties.get(postbuildModule);
                        grunt.log.debug('Append: %s', postbuildModule);
                        this.compile(options, prop);
                    }, this);
                }
            }
        },
        buildProperties = {
            cache: null,
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
            find: function(options) {
                return grunt.file.expand({
                        cwd: options.srcDir
                    }, '**/build.json');
            },
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
            cacheFiles: function(options, moduleName) {
                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }

                // cache files here
                this.cache[moduleName].jsfiles = {};
                Object.keys(this.cache[moduleName].builds).forEach(function(submoduleName) {
                    var jsfiles = this.cache[moduleName].builds[submoduleName].jsfiles.map(function(jsfile) {
                            return this.getFileName(jsfile)
                        }, this);

                    jsfiles.forEach(function(jsfile) {
                        var path = libpath.join(options.srcDir, moduleName, 'js', jsfile);

                        grunt.log.debug('Caching file: %s', jsfile);
                        this.cache[moduleName].jsfiles[jsfile] = {
                            content: grunt.file.read(path),
                            mtime: Date.now()
                        };
                    }, this);
                }, this);
            },
            get: function(moduleName) {
                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }
                return this.cache[moduleName];
            },
            each: function(handler, thisObj) {
                if (!this.cache) {
                    throw new Error(MESSAGE_CACHE_NOT_INITIALIZED);
                }
                Object.keys(this.cache).forEach(handler, thisObj || this);
            },
            getFileName: function(path) {
                var matches = FILE_NAME_REGEX.exec(path);

                if (!matches || matches.length < 1) {
                    return null;
                }

                return matches[1];
            },
            getModuleName: function(path) {
                var matches = MODULE_NAME_REGEX.exec(path);

                if (!matches || matches.length < 1) {
                    return null;
                }

                return matches[1];
            }
        },
        modules = {
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