
var fs = require('fs'),
	grunt = require('grunt'),
	libpath = require('path'),
	libyuiPath = __dirname + '/../lib/yui-lib.js',
	libyui = require(libyuiPath)(grunt),
	options = libyui.options;
	
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
	find: function(test) {
		var actual = libyui.buildProperties.find(options),
			expected = {
				'star-widget': true,
				'star-widget-plugin': true
			};

		actual = actual.map(function(filepath) {
			return libyui.buildProperties.getName(filepath);
		});
		actual.forEach(function(moduleName) {
			test.ok(expected[moduleName], 'Modules are all found');
		});		
		test.done();
	},
	updateFailure: function(test) {
		var libyui = require(libyuiPath)(grunt);

		test.expect(2);

		// cache not initialized.
		try {
			libyui.buildProperties.update(options);
		}
		catch(e) {
			test.equal(e.message, libyui.MESSAGE_CACHE_NOT_INITIALIZED);
		}

		// build file not defined.
		libyui.buildProperties.cache = {};
		try {
			libyui.buildProperties.update(options);
		}
		catch(e) {
			test.equal(e.message, libyui.MESSAGE_BUILD_FILE_UNDEFINED);
		}

		test.done();
	},
	update: function(test) {
		var libyui = require(libyuiPath)(grunt),
			buildFile = libpath.join(options.srcDir, "star-widget/build.json");

		libyui.buildProperties.cache = {};
		libyui.buildProperties.update(options, buildFile);

        test.ok(libyui.buildProperties.cache['star-widget'], 'Has star-widget');

		test.done();
	},
	init: function(test) {
		var msg = 'Tests the build property cache',
			module = 'star-widget',
			cache;

		// initialize cache
        libyui.buildProperties.init(options);
        cache = libyui.buildProperties.cache;

        // check submodule modified time.
        Object.keys(cache).forEach(function(moduleName) {
            Object.keys(cache[moduleName].builds).forEach(function(submoduleName) {
                test.equals(cache[moduleName].builds[submoduleName].mtime, 0, 'Default modified time');
            }, this);
        });

		test.done();
	}
};