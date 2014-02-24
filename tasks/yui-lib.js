module.exports = function(grunt) {

    var libfs = require('fs'),
        libpath = require('path'),
        libutil = require('util'),
        Handlebars = require('handlebars'),
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
        module = {
            getName: function(path) {
                return MODULE_NAME_REGEX.exec(path)[1];
            },
            read: function(options, cwd, files, ext) {
                var content = [];
            
                // append all module the files together
                files.forEach(function(filePath) {
                    var data,
                        matchList = MODULE_EXT_REGEX.exec(filePath);

                    if (!matchList || matchList.length < 1 || ext !== matchList[0]) {
                        filePath = libpath.join(ext, filePath);
                    }
                    filePath = libpath.join(cwd, filePath);

                    grunt.log.debug('Reading module: %s', filePath);    
                    data = grunt.file.read(filePath);   
                    content.push(data);
                }, this);

                return content.join('\n');
            },
            find: function(options) {
                return grunt.file.expand({
                        cwd: options.srcDir
                    }, '**/build.json');
            },
            _write: function(options, buildPath, moduleName, files, ext) {
                var content,
                    destPath;

                if (!files) {
                    return null;
                }

                content = this.read(options, buildPath, files, ext);
                content = template.wrapModule({
                    script: content,
                    name: moduleName,
                    meta: JSON.stringify(config.get(moduleName), null, options.spaces),
                    version: options.version
                });

                // Write joined contents to destination filepath.
                destPath = libpath.join(options.buildDir, moduleName, moduleName + '.' + ext);
                grunt.log.debug('Writing file: %s', destPath);
                grunt.file.write(destPath, content);
            },
            write: function(options, buildFile) {
                var build,
                    buildPath;

                // build.json file and path.
                buildPath = libpath.dirname(buildFile)

                grunt.log.debug('Reading build: %s', buildFile);
                build = JSON.parse(grunt.file.read(buildFile));

                // loop through modules to build
                Object.keys(build.builds).forEach(function(moduleName) {
                    //TODO need to handle the options: http://yui.github.io/shifter/#build.json-builds
                    this._write(options, buildPath, moduleName, build.builds[moduleName].jsfiles, 'js');
                    this._write(options, buildPath, moduleName, build.builds[moduleName].cssfiles, 'css');
                }, this);
            }
        },
        modules = {
            buildCache: null,
            /**
            * Initializes the build.json cache.
            */
            init: function(options) {
                var files = module.find(options);

                // only need to build the cache once.
                if (!this.buildCache) {
                    this.buildCache = {};
                    files.forEach(function(buildFile) {
                        this.updateCache(options, buildFile);
                    }, this);
                }
            },
            updateCache: function(options, buildFile, mtime) {
                var name = module.getName(buildFile),
                    buildPath;

                grunt.log.debug("Updating module cache: %s", name);

                // store module data in memory.
                buildPath = libpath.join(options.srcDir, buildFile);
                this.buildCache[name] = JSON.parse(grunt.file.read(buildPath));
                this.buildCache[name].mtime = (mtime) ? mtime : 0;
                this.buildCache[name].buildFile = buildFile;

            },
            shouldBuild: function(options, moduleName) {
                var module = this.buildCache[moduleName],
                    buildFile = libpath.join(options.srcDir, module.buildFile),
                    stats = libfs.statSync(buildFile),
                    time = stats.mtime.getTime();

                return time > module.mtime;
            },
            compile: function(options) {
                grunt.log.debug('Executing writeModules');

                this.init(options);

                // read the config
                Object.keys(this.buildCache).forEach(function(moduleName) {
                    grunt.log.debug('Compiling module: %s', moduleName);
                    this._compile(options, moduleName);
                }, this);
            },
            _compile: function(options, moduleName) {
                var buildProp = this.buildCache[moduleName],
                    buildFile = libpath.join(options.srcDir, buildProp.buildFile),
                    stats,
                    time;

                grunt.log.debug('Reading build file: %s', buildFile);

                // check last modified time is different
                if (this.shouldBuild(options, moduleName)) {
                    // build prepend modules
                    if (buildProp.prebuilds) {
                        buildProp.prebuilds.forEach(function(prebuildModule) {
                            grunt.log.debug('Prepend: %s', prebuildModule);
                            this._compile(options, prebuildModule);
                        }, this);
                    }

                    // TODO handle exec and copy

                    // write module to disk.
                    // TODO handle replace
                    grunt.log.debug('Module: %s', moduleName);
                    module.write(options, buildFile);

                    // build append modules
                    if (buildProp.postbuilds) {
                        buildProp.postbuilds.forEach(function(postbuildModule) {
                            grunt.log.debug('Prepend: %s', postbuildModule);
                            this._compile(options, postbuildModule);
                        }, this);
                    }

                    // TODO handle rollups

                    // update build time.
                    this.buildCache[moduleName].mtime = Date.now();
                }
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