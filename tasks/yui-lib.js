module.exports = function(grunt) {

    var libfs = require('fs'),
        libpath = require('path'),
        libutil = require('util'),
        Handlebars = require('handlebars'),
        FILE_NAME_REGEX = /^(.+\/)?([^\/]+\.[^\/]+)+$/i,
        MODULE_NAME_REGEX = /^([^\/]+)\/.+$/i,
        MODULE_EXT_REGEX = /^[^\/]+/i,
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
            compile: function(options, moduleName, prop) {
                var fileCache = {};
                
                // precache the files.
                Object.keys(prop.builds).forEach(function(submoduleName) {
                    prop.builds[submoduleName].jsfiles.forEach(function(jsfile) {
                        var filename = FILE_NAME_REGEX.exec(jsfile)[2],
                            path = libpath.join(options.src, 'js', filename);

                        grunt.log.debug('Caching file: %s', filename);
                        fileCache[filename] = {
                            content: grunt.file.read(path),

                        };
                    }, this);
                }, this);

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
            getName: function(path) {
                return MODULE_NAME_REGEX.exec(path)[1];
            },
            compile: function(options, moduleName) {
                var prop = buildProperties.get(moduleName);
                
                grunt.log.debug('Building module: %s', moduleName);

                // build prepend modules
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

                // build append modules
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
                        buildFile = libpath.join(options.srcDir, buildProp.buildFile);
                        this.update(options, buildFile);
                    }, this);
                }
            },
            find: function(options) {
                return grunt.file.expand({
                        cwd: options.srcDir
                    }, '**/build.json');
            },
            update: function(options, buildFile) {
                var moduleName = module.getName(buildFile);

                this.cache[moduleName] = JSON.parse(grunt.file.read(buildPath));
                this.cache[moduleName].file = buildFile;

                // loop through the submodules
                this.cache[moduleName].builds.forEach(function(submoduleName) {
                    this.cache[moduleName].builds[submoduleName].mtime = 0;
                }, this);
            },
            get: function(moduleName) {
                return this.cache[moduleName];
            },
            each: function(handler, thisObj) {
                Object.keys(this.cache).forEach(handler, thisObj || this);
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
        options: options,
        template: template,
        modules: modules,
        module: module,
        config: config
    };
};