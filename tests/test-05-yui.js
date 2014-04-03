
var grunt = require('grunt'),
    libyuiPath = __dirname + '/../lib/yui-lib.js',
    cp = require('child_process'),
    os = require('os'),
    libyui = require(libyuiPath)(grunt);

// global config
libyui.options.buildDir = 'tests/basic/build';
libyui.options.srcDir = 'tests/basic/src';



module.exports = {
    build: function (test) {
        var cmd = (os.platform() === 'win32' ? 'grunt.cmd' : 'grunt'),
            process = cp.spawn(cmd, [
                '--force',
                'yui'
            ]);
        // console.log("\n");
        // process.stdout.on('data', function(data) {
        //     // relay output to console
        //     console.log("%s", data);
        // });
        process.on('exit', function() {
            //TODO CHECK BUILD

            test.done();
        });
    }
};