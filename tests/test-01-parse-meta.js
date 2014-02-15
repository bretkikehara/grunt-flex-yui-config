/*
 * grunt-flex-yui-group
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Bret K. Ikehara
 * Licensed under the MIT license.
 */
var fs = require('fs'),
    readConfig = function(filepath, testHandler) {
        fs.readFile(filepath, function(err, data) {
            if (err) {
                console.log('Failed to read data: %s', filepath);
                return;
            }

            testHandler.call(this, err, data);
        });
    };

exports.run = {
    parseMeta: function(test) {
        var filepath = __dirname + '/build/config.js';

        test.expect(2);
        readConfig(filepath, function(err, data) {
            actual = JSON.parse(data);
            test.equal(actual['star-overlay'].requires.length, 4, 'Length is 4');
            test.equal(actual['star-overlay'].requires[0], 'overlay', 'First module is overly');

            test.done();
        });
    }
};