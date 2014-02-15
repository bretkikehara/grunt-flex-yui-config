var fs = require('fs'),
    Handlebars = require('handlebars');

module.exports = {
    initTemplate: function(filepath) {
        var file = filepath,
            readOptions = {
                encoding: 'utf-8'
            },
            content = fs.readFileSync(file, readOptions);

        // create template handler.
        if (!content) {
            return null;
        }

        return Handlebars.compile(Handlebars.parse(content));
    },
    get: function(grunt, options) {

        var wrapHandler;

        grunt.verbose.writeln('Compiling wrapper template: %s', options.wrapperFile);
        wrapHandler = this.initTemplate(options.wrapperFile);

        // create the templates
        return {
            wrap: wrapHandler
        };
    }
};