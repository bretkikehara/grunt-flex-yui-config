
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

deleteFolderRecursive(buildDir);

module.exports = {
  init: function(test) {
    var libyui = libyuiInstance(grunt),
        options = libyui.options;

    // set default options.
    options.buildDir = 'tests/mock/build';
    options.srcDir = 'tests/mock/src';

    // initiate the build properties
    libyui.buildProperties.init(libyui.options);
    
    // initiate the modules.
    libyui.modules.init(options)
    
    // initiated the tests.
    test.ok(libyui.modules.cache, 'Cache has been initiated');

    // initiated the modules.
    test.deepEqual(Object.keys(libyui.modules.cache), [
      'star-widget-plugin',
      'star-widget'
    ], 'Testing the cached modules');


    test.deepEqual(libyui.modules.cache['star-widget-plugin']['js/star-plugin-widget-visible-anim.js'], {
      modules: ['star-plugin-widget-visible-anim'],
      content: null,
      mtime: 0
    }, 'Test the js/star-plugin-widget-visible-anim.js cache');

    test.deepEqual(libyui.modules.cache['star-widget-plugin']['js/star-plugin-widget-content-anim.js'], {
      modules: [ 'star-plugin-widget-content-anim' ],
      content: null,
      mtime: 0
    }, 'Test the js/star-plugin-widget-content-anim.js cache');

    test.done();
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

    test.equal(actual.length, 7, "Expected 7 modules, found: " + actual.length);
    expected.forEach(function(expected) {
      var index = actual.indexOf(expected);
      test.equal(actual[index], expected, 'Module found: ' + actual[index]);
    });

    test.done();
  }
};