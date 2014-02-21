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

                    Object.keys(meta).forEach(function(key) {
                        this.set(key, meta[key]);
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

    grunt.registerMultiTask(
        'yui-meta',
        'Generates a meta file for a custom YUI group.',
        function() {
            var options = liboptions.get(this.options()),
                filter = libfilter.get(grunt, options);

            grunt.verbose.writeflags(options, 'Options');

            grunt.verbose.writeln('Reading configs from %s files', this.files.length);

            /**
            * Run the program.
            */
            if (this.files && this.files.length > 0) {
                this.files.forEach(function(file) {
                    // store the meta data in the modules object.
                    var metaConfig = getMetaConfig.call(this, file.src);

                    // Write joined contents to destination filepath.
                    grunt.file.write(file.dest, JSON.stringify(metaConfig, null, options.space));
                }, this);
            }
            else {
                grunt.verbose.writeln('Failed to find files');
            }
        }
    );

    grunt.registerMultiTask(
        'yui-config',
        'Generates a custom YUI group config.',
        function() {
            var options = liboptions.get(this.options()),
                precompiler = libprecompile.get(grunt, options),
                filter = libfilter.get(grunt, options);

            grunt.verbose.writeflags(options, 'Options');

            grunt.verbose.writeln('Reading configs from %s files', this.files.length);

            /**
            * Run the program.
            */
            if (this.files && this.files.length > 0) {
                this.files.forEach(function(file) {
                    var meta,
                        configContent;

                    // store the meta data in the modules object.
                    meta = file.src.map(function(filepath) {
                        return grunt.file.read(filepath);
                    }, this).join('');

                    // wrap meta in the config.
                    configContent = precompiler.wrap({
                        meta: meta
                    });

                    // Write joined contents to destination filepath.
                    grunt.file.write(file.dest, configContent);
                }, this);
            }
            else {
                grunt.verbose.writeln('Failed to find files');
            }
        }
    );

    grunt.registerMultiTask(
        'yui-build',
        'Builds each module',
        function() {
            var options = liboptions.get(this.options()),
                precompiler = libprecompile.get(grunt, options),
                filter = libfilter.get(grunt, options),
                modules = {};

            grunt.verbose.writeflags(options, 'Options');

            grunt.verbose.writeln('Reading configs from %s files', this.files.length);

            /**
            * Run the program.
            */
            if (this.files && this.files.length > 0) {
                this.files.forEach(function(file) {

                    file.src.forEach(function(buildFile) {
                        var build;

                        buildFile = libpath.join(file.cwd, buildFile);

                        grunt.log.writeln('Reading build: %s', buildFile);
                        build = JSON.parse(grunt.file.read(buildFile));

                        // loop through modules to build
                        Object.keys(build.builds).forEach(function(moduleName) {
                            var content = [],
                                destPath;

                            // join the js files.
                            build.builds[moduleName].jsfiles.forEach(function(jsfile) {
                                var data = grunt.file.read(libpath.join(libpath.dirname(buildFile), 'js', jsfile));
                                grunt.log.writeln('Reading module: %s', jsfile);
                                content.push(data);
                            });

                            destPath = libpath.join(file.dest, moduleName, moduleName + '.js');

                            // Write joined contents to destination filepath.
                            grunt.log.writeln('Writing file: %s', destPath);
                            grunt.file.write(destPath, content.join('\n'));
                        });
                    }, this);
                }, this);
            }
            else {
                grunt.verbose.writeln('Failed to find files');
            }
        }
    );
};