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
            get: function() {
                return this.metaConfig;
            },
            set: function(key, value) {
                this.metaConfig[key] = value;
            },
            toString: function(spaces) {
                return JSON.stringify(this.metaConfig, null, spaces);
            }
        },
        template = {
            init: function(name, filepath) {
                var content = grunt.file.read(filepath);

                // create template handler.
                if (!content) {
                    return null;
                }

                this[name] = Handlebars.compile(Handlebars.parse(content));

                return this[name];
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