module.exports = function(grunt) {

    const config = require("./.screeps.json")

    grunt.loadNpmTasks('grunt-screeps');

    grunt.initConfig({
        screeps: {
            options: {
                email: config.email,
                token: config.token,
                branch: config.branch,
                // server: 'season'
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['src/*.js'],
                    flatten: true
                }]
            }
        }
    });
}