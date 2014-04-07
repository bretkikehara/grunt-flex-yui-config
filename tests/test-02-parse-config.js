
var fs = require('fs'),
	grunt = require('grunt'),
	libpath = __dirname + '/../lib/yui-lib.js',
	libyui = require(libpath)(grunt),
	checkArrays = function(array1, array2) {
		var foundUnexpected = false;
		array1.forEach(function(array1Element) {
			var index = array2.indexOf(array1Element);
			if (index > -1) {
				array2.splice(index, 1);
			}
			else {
				foundUnexpected = true;
			}
		});
		return !foundUnexpected && array2.length === 0;
	};

// global config
libyui.options.buildDir = 'tests/mock/build';
libyui.options.srcDir = 'tests/mock/src';

/**
* Mock the YUI object.
*/
GLOBAL.YUI = {
	config: null,
	applyConfig: function(config) {
		this.config = config;
	}
};

module.exports = {
	setUp: function(callback) {
		var options = libyui.options;

        libyui.template.init(options);
		libyui.config.write(options);

		// simulate loading the modules
		require(__dirname + '/mock/build/config.js');

		callback();
	},
	// finds all the meta files.
	findMetaFiles: function(test) {
		var metaFiles = libyui.config.find(libyui.options),
			actual;

		test.equal(metaFiles.length, 4, "Found all 4 meta files: " + metaFiles.length);
		test.deepEqual(metaFiles, [
			'star-widget-plugin/meta/star-plugin.json',
			'star-widget/meta/star-overlay.json',
			'star-widget/meta/star-panel.json',
			'star-widget/meta/star-tooltip.json'
		], 'Found all meta files');

		test.done();
	},
	// ensure that the written config will load the modules.
	checkConfiguration: function(test) {
		var checkModule = function(name, opts) {
			var module = GLOBAL.YUI.config.modules[name],
				expectedKeys;
			test.ok(module, 'Expect module: ' + name);

			expectedkeys = Object.keys(module);
			Object.keys(opts).forEach(function(optProp) {
				var index = expectedkeys.indexOf(optProp);
				if (index > -1) {
					expectedkeys.splice(index, 1);
				}
				else {
					throw new Exception("Expected property was not found in configuration");
				}

				test.deepEqual(module[optProp], opts[optProp], optProp + ' was expected');
			});
		};

		// check the whether the templates worked.
		test.ok(GLOBAL.YUI.config, "Config is not null");
		test.ok(GLOBAL.YUI.config.modules, "Modules is not null");

		checkModule('star-plugin-widget-visible-anim', {
			"requires": [
				"anim",
				"plugin"
			]
		});
		checkModule('star-plugin-widget-content-anim', {
			"requires": [
				"anim",
				"plugin"
			]
		});
		checkModule('star-plugin-widget-button-anim', {
			"requires": [
				"transition",
				"plugin"
			]
		});
		checkModule('star-overlay', {
		    "requires": [
		    	"overlay",
		    	"star-plugin-widget-visible-anim",
		    	"star-plugin-widget-content-anim",
		    	"dd-plugin"
		    ],
		    "skinnable": true
		});
		checkModule('star-panel', {
		    "requires": [
		    	"panel",
		    	"star-plugin-widget-visible-anim",
		    	"star-plugin-widget-button-anim",
		    	"dd-plugin",
		    	"io"
		    ],
		    "skinnable": true
		});
		checkModule('star-tooltip', {
		    "requires": [
		    	"overlay",
		    	"transition",
		    	"star-plugin-widget-visible-anim"
		    ],
		    "skinnable": true
		});

		test.done();
	}
};