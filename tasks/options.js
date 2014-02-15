/*
 * grunt-handlebars-template
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 Bret K. Ikehara
 * Licensed under the MIT license.
 */
module.exports = {
    get: function(userOpt) {
        return this.getOptions(userOpt || {}, this.getDefaultOptions());
    },
    getOptions: function (userOpt, defOpt) {
        var obj,
            key;
        if (Object.prototype.toString.call(defOpt) === '[object Object]') {
            obj = {};
            for (key in defOpt) {
                // console.log('key: ' + key);
                // console.log('user val: ' + userOpt[key]);
                // console.log('def val: ' + defOpt[key]);
                if (key !== 'opts') {
                    obj[key] = this.getOptions(userOpt[key], defOpt[key]);
                }
                else {
                    obj[key] = userOpt[key];
                }
            }

            return obj;
        }
        
        obj = (userOpt) ? userOpt : defOpt;
        // console.log('value: ' + obj);
        return obj;
    },
    getDefaultOptions: function() {
        return {
            space: 2,
            wrapperFile: __dirname + '/template/default-wrapper.hbs'
        };
    }   
};