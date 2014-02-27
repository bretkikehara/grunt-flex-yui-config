
var fs = require('fs'),
	grunt = require('grunt'),
	libpath = __dirname + '/../lib/yui-lib.js',
	libyui = require(libpath)(grunt),
	options = libyui.options;

// set default options.
options.srcDir = 'tests/src';
options.buildDir = 'tests/build';

GLOBAL.YUI = {
	config: null,
	applyConfig: function(config) {
		this.config = config;
	}
};

module.exports = {
	parseConfig: function (test) {
		var modules = [
			'star-plugin',
			'star-overlay',
			'star-panel',
			'star-tooltip'
		];

        libyui.template.init(options);
		libyui.config.write(options);

		require(__dirname + '/build/config.js');

		test.ok(GLOBAL.YUI.config, "Config is not null");
		test.ok(GLOBAL.YUI.config.modules, "Modules is not null");

		modules.forEach(function(name) {
			test.ok(GLOBAL.YUI.config.modules[name], "Name is not null: " + name);
		});

		test.done();
	}
};