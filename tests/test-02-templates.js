
var grunt = require('grunt'),
	libyuiPath = __dirname + '/../lib/yui-lib.js',
	libyui = require(libyuiPath)(grunt);

module.exports = {
	init: function(test) {
		var options = libyui.options;

		libyui.template.init(options);

		test.equal(typeof libyui.template.wrapConfig, 'function', 'Config template has been loaded');
		test.equal(typeof libyui.template.wrapModule, 'function', 'Module template has been loaded');

		test.done();
	}
};