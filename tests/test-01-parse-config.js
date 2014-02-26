
var fs = require('fs');

GLOBAL.YUI = {
	config: null,
	applyConfig: function(config) {
		this.config = config;
	}
}

exports.options = {
    parseMeta: function(test) {
        var filepath = __dirname + '/build/config-meta.json';

        test.expect(2);
        readConfig(filepath, function(err, data) {
            actual = JSON.parse(data);
            test.equal(actual['star-overlay'].requires.length, 4, 'Length is 4');
            test.equal(actual['star-overlay'].requires[0], 'overlay', 'First module is overly');

            test.done();
        });
    },
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