
var fs = require('fs'),
	grunt = require('grunt'),
	libpath = __dirname + '/../lib/yui-lib.js',
	libyui = require(libpath)(grunt),
	options = libyui.options;

grunt.option('debug', true);

// set default options.
options.srcDir = 'tests/src';
options.buildDir = 'tests/build';

module.exports = {
	getModuleName: function(test) {
		var checkPath = function(filepath, expected) {
				var actual = libyui.buildProperties.getName(filepath);
				test.equal(actual, expected, 'Module name should be found from path');
			};

		// valid unix paths
		checkPath('star-widget-plugin/build.json', 'star-widget-plugin');
		checkPath('/star-widget-plugin/build.json', 'star-widget-plugin');
		checkPath('./star-widget-plugin/build.json', 'star-widget-plugin');

		// valid windows paths
		checkPath('star-widget-plugin\\build.json', 'star-widget-plugin');
		checkPath('\\star-widget-plugin\\build.json', 'star-widget-plugin');
		checkPath('.\\star-widget-plugin\\build.json', 'star-widget-plugin');

		// long path.
		checkPath('tests/src/star-widget-plugin/build.json', 'star-widget-plugin');

		test.done();
	},
	init: function(test) {
		var msg = 'Tests the build property cache',
			module = 'star-widget',
			cache;

		console.log('Test build property cache');

		// initialize cache
        libyui.buildProperties.init(options);
        cache = libyui.buildProperties.cache;

        // test module
        test.ok(cache['star-widget'], 'Has star-widget');
        test.ok(cache['star-widget-plugin'], 'Has star-widget');

        // check submodule modified time.
        Object.keys(cache).forEach(function(moduleName) {
            Object.keys(cache[moduleName].builds).forEach(function(submoduleName) {
                test.equals(cache[moduleName].builds[submoduleName].mtime, 0, 'Default modified time');
            }, this);
        });

		test.done();
	}
};