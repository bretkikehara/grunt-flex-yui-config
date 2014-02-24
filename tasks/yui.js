/*
 * grunt-flex-yui-group
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Bret K. Ikehara
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
    "use strict";

    var lib = require('./yui-lib.js')(grunt);

    grunt.registerTask('yui',
        'Defines the YUI task',
        function(phase) {

            // write to global options
            var options = this.options(lib.options);
            lib.template.init(options);

            // run task phases.
            if (phase === 'config') {
                lib.config.write(options);
            }
            else {
                lib.config.write(options);
                lib.modules.compile(options);
            }
        }
    );
};