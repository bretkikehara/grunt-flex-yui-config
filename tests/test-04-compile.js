
var libfs = require('fs'),
    grunt = require('grunt'),
    libpath = require('path'),
    libyuiInstance = require(__dirname + '/../lib/yui-lib.js'),
    srcDir = 'tests/mock/src',
    buildDir = 'tests/mock/build',
    PATH_REGEX = /([^\\\/]+\.js)$/i;

/**
* http://www.geedew.com/2012/10/24/remove-a-directory-that-is-not-empty-in-nodejs/
*/
var deleteFolderRecursive = function(path) {
  if (libfs.existsSync(path)) {
    libfs.readdirSync(path).forEach(function(file,index) {
      var curPath = path + "/" + file;
      if(libfs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      }
      else {
        // delete file
        libfs.unlinkSync(curPath);
      }
    });
    libfs.rmdirSync(path);
  }
};


module.exports = {
  setUp: function(callback) {
    deleteFolderRecursive(buildDir);
    callback();
  },
  compile: function(test) {
    var libyui = libyuiInstance(grunt),
      expected = [
        'config.js',
        'star-panel/star-panel.js',
        'star-overlay/star-overlay.js',
        'star-tooltip/star-tooltip.js',
        'star-plugin-widget-content-anim/star-plugin-widget-content-anim.js',
        'star-plugin-widget-button-anim/star-plugin-widget-button-anim.js',
        'star-plugin-widget-visible-anim/star-plugin-widget-visible-anim.js'
      ],
      actual;

    // set default options.
    libyui.options.srcDir = srcDir;
    libyui.options.buildDir = buildDir;

    // initialize the values.
    libyui.template.init(libyui.options);
    libyui.config.write(libyui.options);

    // compile the modules.
    libyui.modules.compile(libyui.options);

    actual = grunt.file.expand({
      cwd: buildDir
    }, "**/*[^-raw].js");

    expected.forEach(function(file) {
      var index = actual.indexOf(file);
      test.ok(index > -1, 'Module must be found');
      actual.splice(index, 1);
    });
    test.equal(actual.length, 0, "All modules expected have been found.");

    test.done();
  }
};