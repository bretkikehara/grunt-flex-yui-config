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
        'yui-meta': {
            test: {
                files: [{
                    'tests/build/config-meta.json': [
                        'tests/src/**/meta/*.json'
                    ]
                }]
            }
        },
        'yui-config': {
            test: {
                files: [{
                    'tests/build/config.js': [
                        'tests/build/config-meta.json'
                    ]
                }]
            }
        },
        'yui-build': {
            test: {
                files: [{
                    expand: false,
                    cwd: 'tests',
                    src: 'src/**/build.json',
                    dest: 'tests/build/'
                }]
            }
        }
    });

    grunt.loadTasks('tasks');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('test', [
        'yui-meta',
        'yui-config',
        'yui-build',
        'nodeunit'
    ]);
    grunt.registerTask('default', [
        'jshint',
        'test'
    ]);
};