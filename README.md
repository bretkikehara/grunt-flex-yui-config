# grunt-flex-yui-group v0.0.3

> Creates a configuration for a YUI group. First party support for this option can be found in `Shifter` or `Yogi`, but this tool provides an alternative method of working with a YUI repository.


## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-flex-yui-group --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-flex-yui-group');
```

*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4), but in case you can't please use [v0.3.3](https://github.com/gruntjs/grunt-flex-handlebars/tree/grunt-0.3-stable).*


## Why is this tool different from Yogi?

Yogi seemed to be made to release modules to the YUI gallery. For modules that will not be released in this fashion, this grunt plugin enables easy YUI configuration.

## YUI-group task
_Run this task with the `grunt yui-group` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Options

#### buildDir
Type: `String`
Default: 'build'

Defines the path the compiled modules should be written.

#### srcDir
Type: `String`
Default: 'src'

Defines the path the modules' source folder.

#### spaces
Type: `Number`
Default: 2

Defines the number of spaces to use to format the JSON. Please look at the [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) function for more information.


#### version
Type: `String`
Default: 'dev'

Defines the version to pass the YUI loader Handlebars template.

#### configWrapper
Type: `File`
Default: '~/template/config-wrapper.hbs'

The Handlebars template used to wrap the meta configuration.

#### moduleWrapper
Type: `File`
Default: '~/template/module-wrapper.hbs'

The Handlebars template used to wrap the submodules in the YUI Loader.

## TODO

* Handle `build.json` properties: `rollups` and `exec`
* Handle `build.json` submodule properties: `cssfiles`, `skinnable`, `regex`, `replace`, `config`, `copy`

## Release History

 * 2014-04-01   v0.0.3   Caches the module files in memory to speed up build. Regression on cssfiles.
 * 2014-02-20   v0.0.2   Added option to build jsfiles and cssfiles.
 * 2014-02-13   v0.0.1   Refactored the code to be more modular.
