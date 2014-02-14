# grunt-flex-yui-group v0.0.1

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


## Why is this tool different from other handlebars compiler?

This uses Handlebars to precompile Handlebars templates. O_o o_O

Fundamentally, the grunt-contrib-handlebars was flawed because any new option would need to be added to the code. Not only would this continue to increase the code complexity, but it would mean that users are left to wait until a certain option was added to the main plugin. In the end, the user may need to compile their own version just to add missing functionality.

This tool tries to eradicate the need to continually upgrade the tool when a new option is needed by controlling the precompiled output by using Handlebar templates. This tool precompiles the templates, then passes on the neccessary values to a template to create the precompiled file.

## Handlebars task
_Run this task with the `grunt yui-group` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Options



## Release History
 
 * 2014-02-13   v0.0.1   Refactored the code to be more modular.
