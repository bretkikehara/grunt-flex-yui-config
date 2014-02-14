/*
 * grunt-handlebars-template
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 Bret K. Ikehara
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
    "use strict";

    var liboptions = require('./options.js'),
        libprecompile = require('./precompile.js'),
        libfilter = require('./filter.js'),
        Handlebars = require('handlebars');

    grunt.registerMultiTask(
        'yui-group',
        'Generates a config file for a custom YUI group.',
        function() {
            var options = liboptions.get(this.options()),
                filter = libfilter.get(grunt, options);

            grunt.verbose.writeflags(options, 'Options');

            /**
            * Run the program.
            */
            if (this.files.length > 0) {
                this.files.forEach(function(file) {
                    var modules = {

                    };

                    files.map(function(filepath) {
                        var filecontent = grunt.file.read(filepath),
                            meta = JSON.parse(filecontent),
                            key;

                        for (key in meta) {
                            modules[key] = meta[key];
                        }
                    }, this);

                    // Write joined contents to destination filepath.
                    grunt.file.write(file.dest, JSON.stringify(modules));
                }, this);
            }
            else {
                grunt.verbose.writeln('Failed to find files');
            }
        }
    );
};