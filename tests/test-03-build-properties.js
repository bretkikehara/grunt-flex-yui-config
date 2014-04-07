
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
    getFileName: function(test) {
        var libyui = libyuiInstance(grunt),
            checkFile = function(filepath, expected) {
                var actual = libyui.buildProperties.getFilePath(libyui.options, filepath);
                test.equal(actual, expected, 'Module name should be found from path: ' + actual);
            };
        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';

        // valid unix paths
        checkFile('star-widget-plugin/build.json', 'js/star-widget-plugin/build.json');
        checkFile('/star-widget-plugin/build.json', '/star-widget-plugin/build.json');
        checkFile('./star-widget-plugin/build.json', 'js/star-widget-plugin/build.json');

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
    cacheFilesFailure: function(test) {
        var libyui = libyuiInstance(grunt),
            options = libyui.options;
        options.buildDir = 'tests/mock/build';
        options.srcDir = 'tests/mock/src';

        try {
            libyui.buildProperties.cacheFiles(options);
        }
        catch(e) {
            test.equal(e.message, libyui.MESSAGE_CACHE_NOT_INITIALIZED);            
        }

        test.done();
    },
    cacheFiles: function(test) {
        var libyui = libyuiInstance(grunt),
            moduleName = 'star-widget',
            cache,
            expected = [
                'star-panel',
                'star-tooltip'
            ];


        // set default options.
        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';

        // create a cache
        libyui.buildProperties.cache = {};
        libyui.buildProperties.cache[moduleName] = {
            "name": moduleName,
            "builds": {
                "star-panel": {
                    "jsfiles": ["star-panel.js", "star-tooltip.js"]
                },
                "star-tooltip": {
                    "jsfiles": ["star-tooltip.js"]
                }
            }
        };
        libyui.buildProperties.cacheFiles(libyui.options, moduleName);

        // check the cache
        cache = libyui.buildProperties.cache[moduleName].jsfiles;

        Object.keys(cache).forEach(function(submoduleFile) {
            // ensure the build time has been set
            test.equal(cache[submoduleFile].mtime, 0, 'Build time is afterwards');

            // check whether the file content is null.
            test.ok(!cache[submoduleFile].content, 'Module content has been stored');
        });

        // check whether the files are correctly associating the modules
        cache['js/star-panel.js'].modules.forEach(function(submoduleName) {
            test.ok(expected.indexOf(submoduleName) > -1, 'Module exists: ' + submoduleName);
        });
        test.equal(cache['js/star-tooltip.js'].modules[0], 'star-panel', 'Module exists');

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
            time = Date.now();

        // set default options.
        libyui.options.buildDir = 'tests/mock/build';
        libyui.options.srcDir = 'tests/mock/src';

        test.ok(!libyui.buildProperties.cache, 'Cache has been created');

        // initialize cache
        libyui.buildProperties.init(libyui.options);
        test.ok(libyui.buildProperties.cache, 'Cache has been created');

        test.done();
    }
};