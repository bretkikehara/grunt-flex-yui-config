module.exports = function(grunt) {

    var libfs = require('fs'),
        libpath = require('path'),
        libutil = require('util'),
        Handlebars = require('handlebars'),
        MODULE_REGEX = /^([^\/]+)\/.+$/i,
        lib = {
            /*
            * Default options. Do NOT overwrite
            */
            options: {
                buildDir: 'build',
                srcDir: 'src',
                version: 'dev',
                spaces: 2,
                configWrapper: __dirname + '/template/config-wrapper.hbs',
                moduleWrapper: __dirname + '/template/module-wrapper.hbs'
            },
            config: {
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
                }
            },
            template: {
                init: function(name, filepath) {
                    var content;

                    grunt.log.debug('Initializing template: %s', filepath);

                    content = grunt.file.read(filepath);

                    // create template handler.
                    if (!content) {
                        return null;
                    }

                    if (name === 'init') {
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
            module: {
                read: function(options, cwd, files) {
                    var content = [];
                
                    // append all module the files together
                    files.forEach(function(jsfile) {
                        var data = grunt.file.read(libpath.join(cwd, jsfile));
                        grunt.log.writeln('Reading module: %s', jsfile);
                        content.push(data);
                    }, this);

                    return content.join('\n');
                },
                write: function(options, moduleName, ext, content) {
                    // Write joined contents to destination filepath.
                    var destPath = libpath.join(options.buildDir, moduleName, moduleName + '.' + ext);
                    grunt.log.writeln('Writing file: %s', destPath);
                    grunt.file.write(destPath, content);
                }, 
                find: function(options) {
                    return grunt.file.expand({
                            cwd: options.srcDir
                        }, '**/build.json');
                }
            },
            init: function(options) {
                grunt.log.debug('Library init');
                this.template.init('wrapConfig', options.configWrapper);
                this.template.init('wrapModule', options.moduleWrapper);
            },
            writeConfig: function(options) {
                var files,
                    config,
                    configContent;

                grunt.log.debug('Executing writeConfig');

                // read the config
                files = this.config.find(options);

                grunt.log.debug('Meta Files');

                config = this.config.read(options, files);

                grunt.log.debug('Meta Configs');

                // wrap meta in the config.
                configContent = this.template.wrapConfig({
                    meta: JSON.stringify(config, null, options.spaces)
                });

                grunt.log.debug('Meta Content');
                grunt.file.write(options.buildDir + '/config.js', configContent);
            },
            writeModuleFiles: function(options, buildPath, moduleName, files, ext) {
                var content;

                if (!files) {
                    return null;
                }

                content = this.module.read(options, libpath.join(buildPath, ext), files);
                content = this.template.wrapModule({
                    script: content,
                    name: moduleName,
                    meta: JSON.stringify(lib.config.get(moduleName), null, options.spaces),
                    version: options.version
                });
                
                this.module.write(options, moduleName, ext, content);
            },
            writeModule: function(options, buildFile) {
                var build,
                    buildPath;

                // build.json file and path.
                buildFile = libpath.join(options.srcDir, buildFile);
                buildPath = libpath.dirname(buildFile)

                grunt.log.writeln('Reading build: %s', buildFile);
                build = JSON.parse(grunt.file.read(buildFile));

                // loop through modules to build
                Object.keys(build.builds).forEach(function(moduleName) {
                    //TODO need to handle the options: http://yui.github.io/shifter/#build.json-builds
                    this.writeModuleFiles(options, buildPath, moduleName,  build.builds[moduleName].jsfiles, 'js');
                    this.writeModuleFiles(options, buildPath, moduleName,  build.builds[moduleName].cssfiles, 'css');
                }, this);

                //TODO handle rollups: http://yui.github.io/shifter/#build.json-rollups
            },
            writeModules: function(options) {
                var files = this.module.find(options);
                grunt.log.debug('Executing writeModules');

                this.build.init(options, files);

                // read the config
                Object.keys(this.build.modules).forEach(function(moduleName) {
                    grunt.log.debug('Compiling module: %s', moduleName);
                    this.build.compile(options, moduleName);
                }, this);
            },
            build: {
                modules: {},
                init: function(options, files) {
                    files.forEach(function(buildFile) {
                        var name = this.getModuleName(buildFile),
                            buildPath;

                        grunt.log.debug("Caching file: %s", name);

                        // store module data in memory.
                        buildPath = libpath.join(options.srcDir, buildFile);
                        this.modules[name] = JSON.parse(grunt.file.read(buildPath));
                        this.modules[name].mtime = 0;
                        this.modules[name].buildFile = buildFile;
                    }, this);
                },
                getModuleName: function(buildFile) {
                    return MODULE_REGEX.exec(buildFile)[1];
                },
                shouldBuild: function(options, moduleName) {
                    var module = this.modules[moduleName],
                        buildFile = libpath.join(options.srcDir, module.buildFile),
                        stats = libfs.statSync(buildFile),
                        time = stats.mtime.getTime();

                    return time > module.mtime;
                },
                compile: function(options, moduleName) {
                    var module = this.modules[moduleName],
                        buildFile = libpath.join(options.srcDir, module.buildFile),
                        stats,
                        time;

                    grunt.log.debug('Reading build file: %s', buildFile);

                    // check last modified time is different
                    if (this.shouldBuild(options, moduleName)) {
                        // build prepend modules
                        if (module.prebuilds) {
                            module.prebuilds.forEach(function(prebuildModule) {
                                grunt.log.debug('Prepend: %s', prebuildModule);
                                this.compile(options, prebuildModule);
                            }, this);
                        }

                        // write module
                        // build the modules.
                        grunt.log.debug('Module: %s', moduleName);

                        // build append modules
                        if (module.postbuilds) {
                            module.postbuilds.forEach(function(postbuildModule) {
                                grunt.log.debug('Prepend: %s', postbuildModule);
                                this.compile(options, postbuildModule);
                            }, this);
                        }

                        this.modules[moduleName].mtime = Date.now();
                    }
                }
            }
        };
    return lib;
};