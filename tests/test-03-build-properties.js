
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
				var actual = libyui.buildProperties.getModuleName(filepath);
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
	getFileName: function(test) {
		var checkFile = function(filepath, expected) {
				var actual = libyui.buildProperties.getFileName(filepath);
				test.equal(actual, expected, 'Module name should be found from path');
			};

		// valid unix paths
		checkFile('star-widget-plugin/build.json', 'build.json');
		checkFile('/star-widget-plugin/build.json', 'build.json');
		checkFile('./star-widget-plugin/build.json', 'build.json');

		// valid windows paths
		checkFile('star-widget-plugin\\build.json', 'build.json');
		checkFile('\\star-widget-plugin\\build.json', 'build.json');
		checkFile('.\\star-widget-plugin\\build.json', 'build.json');

		// long path.
		checkFile('tests/src/star-widget-plugin/build.json', 'build.json');

		test.done();
	},
	find: function(test) {
		var actual = libyui.buildProperties.find(options),
			expected = {
				'star-widget': true,
				'star-widget-plugin': true
			};

		actual = actual.map(function(filepath) {
			return libyui.buildProperties.getModuleName(filepath);
		});
		actual.forEach(function(moduleName) {
			test.ok(expected[moduleName], 'Modules are all found');
		});		
		test.done();
	},
	cacheBuildFileFailure: function(test) {
		var libyui = require(libyuiPath)(grunt);

		test.expect(2);

		// cache not initialized.
		try {
			libyui.buildProperties.cacheBuildFile(options);
		}
		catch(e) {
			test.equal(e.message, libyui.MESSAGE_CACHE_NOT_INITIALIZED);
		}

		// build file not defined.
		libyui.buildProperties.cache = {};
		try {
			libyui.buildProperties.cacheBuildFile(options);
		}
		catch(e) {
			test.equal(e.message, libyui.MESSAGE_BUILD_FILE_UNDEFINED);
		}

		test.done();
	},
	cacheBuildFile: function(test) {
		var libyui = require(libyuiPath)(grunt),
			buildFile = libpath.join(options.srcDir, "star-widget/build.json");

		libyui.buildProperties.cache = {};
		libyui.buildProperties.cacheBuildFile(options, buildFile);

        test.ok(libyui.buildProperties.cache['star-widget'], 'Has star-widget');

		test.done();
	},
	init: function(test) {
		var msg = 'Tests the build property cache',
			moduleName = 'star-widget',
			cache,
			expected = {
				'star-panel.js': true,
				'star-overlay.js': true,
				'star-tooltip.js': true
			},
			time = Date.now();

		// initialize cache
        libyui.buildProperties.init(options);
        cache = libyui.buildProperties.cache;

        // check submodule modified time.
        Object.keys(cache[moduleName].jsfiles).forEach(function(jsfile) {
            test.ok(expected[jsfile], "File info has been cached");
            test.notEqual(cache[moduleName].jsfiles[jsfile].content, null, "File is in memory");
            test.ok(cache[moduleName].jsfiles[jsfile].mtime > time, "Last modified time is stored");
        }, this);

		test.done();
	}
};