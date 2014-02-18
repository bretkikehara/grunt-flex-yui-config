
var fs = require('fs');

GLOBAL.YUI = {
	config: null,
	applyConfig: function(config) {
		this.config = config;
	}
}

exports.options = {
	parseConfig: function (test) {
		var modules = [
			'star-plugin',
			'star-overlay',
			'star-panel',
			'star-tooltip'
		];

		require(__dirname + '/build/config.js');

		test.ok(GLOBAL.YUI.config, "Config is not null");
		test.ok(GLOBAL.YUI.config.modules, "Modules is not null");

		modules.forEach(function(name) {
			test.ok(GLOBAL.YUI.config.modules[name], "Name is not null: " + name);
		});

		test.done();
	}
};