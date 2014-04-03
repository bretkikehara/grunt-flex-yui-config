
var grunt = require('grunt'),
	libyuiPath = __dirname + '/../lib/yui-lib.js',
	libyui = require(libyuiPath)(grunt);

// global config
libyui.options.buildDir = 'tests/basic/build';
libyui.options.srcDir = 'tests/basic/src';

module.exports = {
	init: function(test) {
		var options = libyui.options;

		libyui.template.init(options);

		test.equal(typeof libyui.template.wrapConfig, 'function', 'Config template has been loaded');
		test.equal(typeof libyui.template.wrapModule, 'function', 'Module template has been loaded');

		test.done();
	},
	// Unknown file will not be loaded.
	failUnknownFile: function(test) {
		var options = libyui.options,
			nullVal;

		nullVal = libyui.template.setup('fakeFile', __dirname + '/template/fakeFile.hbs');
		test.ok(!nullVal, "Setup will return null");
		test.done();
	},
	failEmptyFile: function(test) {
		var options = libyui.options,
			nullVal;

		nullVal = libyui.template.setup('emptyFile', __dirname + '/template/emptyFile.hbs');
		test.ok(!nullVal, "Setup will return null");
		test.done();
	},
	// ensure that setup and init are not overridded.
	failReservedTemplateNames: function(test) {
		var options = libyui.options,
			nullVal;

		nullVal = libyui.template.setup('init', __dirname + '/template/init.hbs');
		test.ok(!nullVal, "Setup will return null");

		nullVal = libyui.template.setup('init', __dirname + '/template/setup.hbs');
		test.ok(!nullVal, "Setup will return null");

		test.done();
	}
};