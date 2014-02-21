/*
 * grunt-flex-yui-group
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Bret K. Ikehara
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
    "use strict";

    var liboptions = require(__dirname + '/options.js'),
        libprecompile = require(__dirname + '/precompile.js'),
        libfilter = require(__dirname + '/filter.js'),
        libpath = require('path'),
        libutil = require('util'),
        Handlebars = require('handlebars'),
        metaConfig = {
            metaConfig: {},
            read: function(cwd, files) {
                files.map(function(filepath) {
                    var filecontent = grunt.file.read(cwd + '/' + filepath),
                        meta = JSON.parse(filecontent);

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
            toString: function(spaces, module) {
                if (typeof spaces === 'string') {
                    module = spaces;
                }

                if (typeof spaces !== 'number') {
                    spaces = options.spaces;
                }

                return JSON.stringify(this.get(module), null, spaces);
            }
        },
        template = {
            init: function(name, filepath) {
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
            read: function(cwd, files) {
                var content = [];
            
                // append all module the files together
                files.forEach(function(jsfile) {
                    var data = grunt.file.read(libpath.join(cwd, 'js', jsfile));
                    grunt.log.writeln('Reading module: %s', jsfile);
                    content.push(data);
                }, this);

                return content.join('\n');
            },
            wrap: function(moduleName, content) {
                // wrap module
                return template.wrapModule({
                    script: content,
                    name: moduleName,
                    meta: metaConfig.toString(moduleName),
                    version: options.version
                });
            },
            write: function(moduleName, content) {
                // Write joined contents to destination filepath.
                var destPath = libpath.join(options.buildDir, moduleName, moduleName + '.js');
                grunt.log.writeln('Writing file: %s', destPath);
                grunt.file.write(destPath, content);
            }, 
            findBuildFiles: function() {
                return grunt.file.expand({
                        cwd: options.srcDir
                    }, '**/build.json');
            }
        },
        options = {
            buildDir: 'build',
            srcDir: 'src',
            spaces: 2,
            configWrapper: __dirname + '/template/config-wrapper.hbs',
            moduleWrapper: __dirname + '/template/module-wrapper.hbs'
        };


    grunt.registerTask('yui-config', function() {
        var files,
            configContent;

        // read the config
        files = grunt.file.expand({
            cwd: options.srcDir
        }, '**/meta/*.json');

        metaConfig.read(options.srcDir, files);

        // wrap meta in the config.
        configContent = template.wrapConfig({
            meta: metaConfig.toString(options.spaces)
        });
        grunt.file.write(options.buildDir + '/config.js', configContent);
    });

    grunt.registerTask('yui',
        'Defines the YUI task',
        function() {
            // write to global options
            options = this.options(options);

            template.init('wrapConfig', options.configWrapper);
            template.init('wrapModule', options.moduleWrapper);

            grunt.task.run('yui-config');
        }
    );
};