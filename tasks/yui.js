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
        libfilter = require(__dirname + '/filter.js');

    grunt.registerMultiTask(
        'yui-group',
        'Generates a config file for a custom YUI group.',
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
                    var metaConfig = {};

                    // store the meta data in the modules object.
                    file.src.map(function(filepath) {
                        var filecontent = grunt.file.read(filepath),
                            meta = JSON.parse(filecontent),
                            key;

                        for (key in meta) {
                            metaConfig[key] = meta[key];
                        }
                    }, this);

                    // Write joined contents to destination filepath.
                    grunt.file.write(file.dest, JSON.stringify(metaConfig, null, options.space));
                }, this);
            }
            else {
                grunt.verbose.writeln('Failed to find files');
            }
        }
    );
};