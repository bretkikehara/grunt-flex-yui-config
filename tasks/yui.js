/*
 * grunt-flex-yui-group
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Bret K. Ikehara
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
    "use strict";

    var libpath = require('path'),
        libutil = require('util'),
        Handlebars = require('handlebars'),
        options = {
            buildDir: 'build',
            srcDir: 'src',
            version: 'dev',
            spaces: 2,
            configWrapper: __dirname + '/template/config-wrapper.hbs',
            moduleWrapper: __dirname + '/template/module-wrapper.hbs'
        },
        metaConfig = {
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
        template = {
            init: function(options, name, filepath) {
                var content = grunt.file.read(filepath);

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
        module = {
            read: function(options, cwd, files) {
                var content = [];
            
                // append all module the files together
                files.forEach(function(jsfile) {
                    var data = grunt.file.read(libpath.join(cwd, 'js', jsfile));
                    grunt.log.writeln('Reading module: %s', jsfile);
                    content.push(data);
                }, this);

                return content.join('\n');
            },
            wrap: function(options, moduleName, content) {
                // wrap module
                return template.wrapModule({
                    script: content,
                    name: moduleName,
                    meta: JSON.stringify(metaConfig.get(moduleName), null, options.spaces),
                    version: options.version
                });
            },
            write: function(options, moduleName, content) {
                // Write joined contents to destination filepath.
                var destPath = libpath.join(options.buildDir, moduleName, moduleName + '.js');
                grunt.log.writeln('Writing file: %s', destPath);
                grunt.file.write(destPath, content);
            }, 
            find: function(options) {
                return grunt.file.expand({
                        cwd: options.srcDir
                    }, '**/build.json');
            }
        };


    var writeConfig = function(grunt, options) {
            var files,
                configContent;

            // read the config
            files = metaConfig.find(options);
            metaConfig.read(options, files);

            // wrap meta in the config.
            configContent = template.wrapConfig({
                meta: JSON.stringify(metaConfig.get(), null, options.spaces)
            });
            grunt.file.write(options.buildDir + '/config.js', configContent);
        },
        writeModules = function(grunt, options) {
            var files = module.find(options);

            // read the config
            files.forEach(function(buildFile) {
                var build,
                    buildPath;

                // build.json file and path.
                buildFile = libpath.join(options.srcDir, buildFile);
                buildPath = libpath.dirname(buildFile)

                grunt.log.writeln('Reading build: %s', buildFile);
                build = JSON.parse(grunt.file.read(buildFile));

                // loop through modules to build
                Object.keys(build.builds).forEach(function(moduleName) {
                    var content = module.read(options, buildPath, build.builds[moduleName].jsfiles);

                    content = module.wrap(options, moduleName, content);
                    module.write(options, moduleName, content);
                }, this);
            }, this);
        };

    grunt.registerTask('yui',
        'Defines the YUI task',
        function(phase) {
            // write to global options
            options = this.options(options);

            template.init('wrapConfig', options.configWrapper);
            template.init('wrapModule', options.moduleWrapper);

            // run task phases.
            if (phase === 'config') {
                writeConfig(grunt, options);
            }
            else {
                writeConfig(grunt, options);
                writeModules(grunt, options);
            }
        }
    );
};