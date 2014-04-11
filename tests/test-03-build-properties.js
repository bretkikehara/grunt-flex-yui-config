
var fs = require('fs'),
    grunt = require('grunt'),
    libpath = require('path'),
    libyuiInstance = require(__dirname + '/../lib/yui-lib.js');

module.exports = {
    getModuleName: function(test) {
        var libyui = libyuiInstance(grunt),
            _checkPath = function(filepath, expected) {
                var actual = libyui.buildProperties.getModuleName(filepath);
                test.equal(actual, expected, 'Module name should be found from path: ' + actual);
            },
            checkPath = function(filepath, expected) {
                _checkPath(filepath, expected);
                _checkPath(filepath.replace(/\//g, '\\'), expected);

                filepath = '/' + filepath;
                _checkPath(filepath, expected);
                _checkPath(filepath.replace(/\//g, '\\'), expected);

                filepath = '.' + filepath;
                _checkPath(filepath, expected);
                _checkPath(filepath.replace(/\//g, '\\'), expected);
            },
            expected,
            path;

        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';

        // valid unix paths
        path = 'star-widget-plugin/build.json';
        expected = 'star-widget-plugin';
        checkPath(path, expected);

        // long path.
        path = 'really/long/pathname//tests/src/asdf-jkl/build.json';
        expected = 'asdf-jkl';
        checkPath(path, expected);

        test.done();
    },
    getFilePath: function(test) {
        var libyui = libyuiInstance(grunt),
            _checkFilePath = function(filepath, expected) {
                var actual = libyui.buildProperties.getFilePath(filepath);
                test.equal(actual, expected, 'Module name should be found from path: ' + actual);
            },
            checkFilePath = function(filepath, expected) {
                _checkFilePath(filepath, expected);
                _checkFilePath(filepath.replace(/\//g, '\\'), expected);

                filepath = './' + filepath;
                _checkFilePath(filepath, expected);
                _checkFilePath(filepath.replace(/\//g, '\\'), expected);
            };
        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';

        // get relative file paths
        checkFilePath('star-widget-plugin/build.json', 'js/star-widget-plugin/build.json');

        test.done();
    },
    find: function(test) {
        var libyui = libyuiInstance(grunt),
            actual,
            expected = {
                'star-widget': true,
                'star-widget-plugin': true
            };

        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';

        actual = libyui.buildProperties.find(libyui.options);

        actual = actual.map(function(filepath) {
            return libyui.buildProperties.getModuleName(filepath);
        });
        actual.forEach(function(moduleName) {
            test.ok(expected[moduleName], 'Modules are all found: ' + moduleName);
        });     
        test.done();
    },
    cacheBuildFileFailure: function(test) {
        var libyui = libyuiInstance(grunt);

        test.expect(2);

        // set default options.
        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';

        // cache not initialized.
        try {
            libyui.buildProperties.cacheBuildFile(libyui.options);
        }
        catch(e) {
            test.equal(e.message, libyui.MESSAGE_CACHE_NOT_INITIALIZED);
        }

        // build file not defined.
        libyui.buildProperties.cache = {};
        try {
            libyui.buildProperties.cacheBuildFile(libyui.options);
        }
        catch(e) {
            test.equal(e.message, libyui.MESSAGE_BUILD_FILE_UNDEFINED);
        }

        test.done();
    },
    cacheBuildFile: function(test) {
        var libyui = libyuiInstance(grunt),
            buildFile;

        // set default options.
        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';
        
        buildFile = libpath.join(libyui.options.srcDir, "star-widget/build.json");

        libyui.buildProperties.cache = {};
        libyui.buildProperties.cacheBuildFile(libyui.options, buildFile);

        test.ok(libyui.buildProperties.cache['star-widget'], 'Has star-widget');

        test.done();
    },
    init: function(test) {
        var libyui = libyuiInstance(grunt),
            msg = 'Tests the build property cache',
            moduleName = 'star-widget',
            cache,
            expected = {
                'star-panel.js': true,
                'star-overlay.js': true,
                'star-tooltip.js': true
            },
            checkCache = function(moduleName, build) {
                var moduleCachedMsg = 'Module build.json cached: ' + moduleName,
                    buildPropMsg = 'Build cached: ' + moduleName;
                test.ok(libyui.buildProperties.cache[moduleName], moduleCachedMsg);

                test.deepEqual(libyui.buildProperties.cache[moduleName], build, buildPropMsg);
            },
            time = Date.now();

        // set default options.
        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';

        test.ok(!libyui.buildProperties.cache, 'Cache has been created');

        // initialize cache
        libyui.buildProperties.init(libyui.options);

        test.ok(libyui.buildProperties.cache, 'Cache has been created');
        checkCache('star-widget-plugin', {
          "name": "star-widget-plugin",
          "builds": {
            "star-plugin-widget-visible-anim": {
              "jsfiles": ["star-plugin-widget-visible-anim.js"]
            },
            "star-plugin-widget-content-anim": {
              "jsfiles": ["star-plugin-widget-content-anim.js"]
            },
            "star-plugin-widget-button-anim": {
              "jsfiles": ["star-plugin-widget-button-anim.js"]
            }
          }
        });
        checkCache('star-widget', {
          "name": "star-widget",
          "exec": [
            "less-compile"
          ],
          "builds": {
            "star-panel": {
              "jsfiles": ["star-panel.js"]
            },
            "star-overlay": {
              "jsfiles": ["star-overlay.js"]
            },    
            "star-tooltip": {
              "jsfiles": ["star-tooltip.js"]
            }
          }
        });

        test.done();
    }
};