'use strict';

module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		appcJs: {
			src: [
				'Gruntfile.js',
				'index.js',
				'tests/**/*.js'
			]
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-appc-js');

	// register tasks
	grunt.registerTask('lint', [ 'appcJs' ]);

	// Tasks for formatting the source code according to our clang/eslint rules
	grunt.registerTask('format:js', [ 'appcJs:src:lint:fix' ]);
	grunt.registerTask('format', [ 'format:js' ]);

	grunt.registerTask('default', [ 'lint' ]);
};
