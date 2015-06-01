module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
        options: {
            banner: '/*! rozinah.min.js <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        build: {
            options: {
                mangle: true,
                compress: true
            },
            src: 'public/js/rozinah.js',
            dest: 'public/build/rozinah.min.js'
        }
    },
    cssmin: {
        options: {
            banner: '/*! rozinah.min.css <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        build: {
            src: 'public/css/rozinah.css',
            dest: 'public/build/rozinah.min.css'
        }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  var target = grunt.option('target') || 'build';
  grunt.registerTask('default', ['uglify:' + target, 'cssmin']);

};
