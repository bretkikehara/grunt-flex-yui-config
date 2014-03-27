
var fs = require('fs'),
	grunt = require('grunt'),
	libpath = __dirname + '/../lib/yui-lib.js',
	libyui = require(libpath)(grunt),
	checkRequiredModules = function(module, modules) {
		var foundUnexpectedModule = false;
		module.requires.forEach(function(reqModule) {
			var index = modules.indexOf(reqModule);
			if (index > -1) {
				modules.splice(index, 1);
			}
			else {
				foundUnexpectedModule = true;
			}
		});
		return !foundUnexpectedModule && modules.length === 0;
	};

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

		// set default options.
		options.srcDir = 'tests/src';
		options.buildDir = 'tests/build';

        libyui.template.init(options);
		libyui.config.write(options);

		// simulate loading the modules
		require(__dirname + '/build/config.js');

		callback();
	},
	// ensure that the written config will load the modules.
	checkAvailable: function(test) {
		// check the whether the templates worked.
		test.ok(GLOBAL.YUI.config, "Config is not null");
		test.ok(GLOBAL.YUI.config.modules, "Modules is not null");
		test.done();
	}, 
	// ensure that the module was been written verbatim
	checkStarOverlay: function (test) {
		var name = 'star-overlay',
			modules, isFound;

		// test the individual modules.
		modules = GLOBAL.YUI.config.modules;
		isFound = checkRequiredModules(modules[name], [
			"overlay",
			"star-plugin-widget-visible-anim",
			"star-plugin-widget-content-anim",
			"dd-plugin"
		]);
		test.ok(isFound, "Found all modules");
		test.ok(modules[name].skinnable, 'Module is skinnable');
		test.equal(Object.keys(modules[name]).length, 2, 'Module has 2 properties');
		test.done();
	}, 
	// ensure that the module was been written verbatim
	checkWidgetButtonPlugin: function (test) {
		var name = "star-plugin-widget-button-anim",
			modules, isFound;

		// test the individual modules.
		modules = GLOBAL.YUI.config.modules;
		isFound = checkRequiredModules(modules[name], [
			"transition",
			"plugin"
		]);
		test.ok(isFound, "Found all modules");
		test.equal(Object.keys(modules[name]).length, 1, 'Module has only 1 property');
		test.done();
	}
};