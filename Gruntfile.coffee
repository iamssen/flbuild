module.exports = (grunt) ->
	grunt.initConfig
		pkg: grunt.file.readJSON('package.json')

		mochaTest:
			local:
				options:
					require: ['coffee-script', 'should']
				src: ['test/**/*.coffee']

			withoutCompile:
				options:
					require: ['coffee-script', 'should']
				src: ['test/**/methods-*.coffee']

	grunt.loadNpmTasks 'grunt-mocha-test'

	grunt.registerTask 'default', () ->
		grunt.task.run 'mochaTest:local'

	grunt.registerTask 'travis', () ->
		grunt.task.run 'mochaTest:withoutCompile'