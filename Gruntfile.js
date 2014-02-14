/*
 * grunt-flex-yui
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Bret K. Ikehara
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        jshint: {
            src: [
                'Gruntfile.js',
                'tasks/*.js',
                'tasks/lib/*.js',
                '<%= nodeunit.tests %>'
            ]
        },
        nodeunit: {
            tests: [ 
                'tests/test-*.js'
            ]
        },
        'yui-group': {
            test: {
                files: {
                    'tests/build/config.js': [
                        'tests/src/**/meta/*.json'
                    ]
                }
            }
        }
    });

    grunt.loadTasks('tasks');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('test', [
        'nodeunit',
        'yui-group'
    ]);
    grunt.registerTask('default', [
        'jshint',
        'test'
    ]);
};