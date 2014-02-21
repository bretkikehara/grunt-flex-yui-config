

module.exports = function(grunt) {

    var libpath = require('path'),
        libutil = require('util'),
        Handlebars = require('handlebars'),
        lib = {
            /*
            * Default options. Do NOT overwrite
            */
            options: {
                buildDir: 'build',
                srcDir: 'src',
                version: 'dev',
                spaces: 2,
                configWrapper: __dirname + '/template/config-wrapper.hbs',
                moduleWrapper: __dirname + '/template/module-wrapper.hbs'
            },
            config: {
                metaConfig: {},
                find: function(options) {
                    return grunt.file.expand({
                        cwd: options.srcDir
                    }, '**/meta/*.json');
                },
                read: function(options, files) {
                    files.map(function(filepath) {
                        var metaPath = libpath.join(options.srcDir, filepath),
                            meta = JSON.parse(grunt.file.read(metaPath));

                        Object.keys(meta).forEach(function(module) {
                            if (meta[module].submodules) {
                                Object.keys(meta[module].submodules).forEach(function(submodule) {
                                    this.set(submodule, meta[module].submodules[submodule]);
                                }, this);
                            }
                            else {
                                this.set(module, meta[module]);
                            }
                        }, this);
                    }, this);
                    return this.get();
                },
                get: function(module) {

                    if (module) {
                        return this.metaConfig[module];
                    }
                    return this.metaConfig;
                },
                set: function(module, config) {
                    this.metaConfig[module] = config;
                }
            },
            template: {
                init: function(name, filepath) {
                    var content;

                    grunt.log.debug('Initializing template: %s', filepath);

                    content = grunt.file.read(filepath);

                    // create template handler.
                    if (!content) {
                        return null;
                    }

                    if (name === 'init') {
                        grunt.log.error("The init function cannot be overridden!");
                        return null;
                    }
                    else if (this[name]) {
                        grunt.log.warn("The %s will be overridden", name);
                    }

                    this[name] = Handlebars.compile(Handlebars.parse(content));

                    return this[name];
                }
            },
            module: {
                read: function(options, cwd, files) {
                    var content = [];
                
                    // append all module the files together
                    files.forEach(function(jsfile) {
                        var data = grunt.file.read(libpath.join(cwd, 'js', jsfile));
                        grunt.log.writeln('Reading module: %s', jsfile);
                        content.push(data);
                    }, this);

                    return content.join('\n');
                },
                write: function(options, moduleName, content) {
                    // Write joined contents to destination filepath.
                    var destPath = libpath.join(options.buildDir, moduleName, moduleName + '.js');
                    grunt.log.writeln('Writing file: %s', destPath);
                    grunt.file.write(destPath, content);
                }, 
                find: function(options) {
                    return grunt.file.expand({
                            cwd: options.srcDir
                        }, '**/build.json');
                }
            },
            init: function(options) {
                grunt.log.debug('Library init');
                this.template.init('wrapConfig', options.configWrapper);
                this.template.init('wrapModule', options.moduleWrapper);
            },
            writeConfig: function(options) {
                var files,
                    config,
                    configContent;

                grunt.log.debug('Executing writeConfig');

                // read the config
                files = this.config.find(options);

                grunt.log.debug('Meta Files');

                config = this.config.read(options, files);

                grunt.log.debug('Meta Configs');

                // wrap meta in the config.
                configContent = this.template.wrapConfig({
                    meta: JSON.stringify(config, null, options.spaces)
                });

                grunt.log.debug('Meta Content');
                grunt.file.write(options.buildDir + '/config.js', configContent);
            },
            writeModules: function(options) {
                var files = this.module.find(options);

                grunt.log.debug('Executing writeModules');

                // read the config
                files.forEach(function(buildFile) {
                    var build,
                        buildPath;

                    // build.json file and path.
                    buildFile = libpath.join(options.srcDir, buildFile);
                    buildPath = libpath.dirname(buildFile)

                    grunt.log.writeln('Reading build: %s', buildFile);
                    build = JSON.parse(grunt.file.read(buildFile));

                    // loop through modules to build
                    Object.keys(build.builds).forEach(function(moduleName) {
                        var content = this.module.read(options, buildPath, build.builds[moduleName].jsfiles);

                        content = this.template.wrapModule({
                            script: content,
                            name: moduleName,
                            meta: JSON.stringify(lib.config.get(moduleName), null, options.spaces),
                            version: options.version
                        });

                        this.module.write(options, moduleName, content);
                    }, this);
                }, this);
            }
        };
    return lib;
};