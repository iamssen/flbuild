pick = require('file-picker').pick
{SourceCollector} = require('./flutils')

class Flapp
	constructor: (build) ->
		@collector = new SourceCollector(build)
		@build = build

	# ================================================================================
	# implements
	# ================================================================================
	addLibraryDirectory: (path) =>
		@collector.addLibraryDirectory(path)

	addExternalLibraryDirectory: (path) =>
		@collector.addExternalLibraryDirectory(path)

	addSourceDirectory: (path) =>
		@collector.addSourceDirectory(path)

	addArg: (arg) =>
		@collector.addArg(arg)

	# ================================================================================
	# process
	# ================================================================================
	createBuildCommand: (source, output, complete) =>
		# ------------------------------------------------------------
		# 1 : create path args
		# ------------------------------------------------------------
		args = []

		args.push(@build.wrap(@build.getEnv('FLEX_HOME') + '/bin/mxmlc'))
		
		args.push(@build.wrap(@build.resolvePath(source)))

		for library in @collector.getLibraries()
			args.push('-library-path ' + @build.wrap(library))

		for library in @collector.getExternalLibraries()
			args.push('-external-library-path ' + @build.wrap(library))

		for directory in @collector.getSourceDirectories()
			args.push('-source-path ' + @build.wrap(directory))

		# ------------------------------------------------------------
		# 2 : args, output
		# ------------------------------------------------------------
		for arg in @collector.getArgs()
			args.push(@build.applyEnv(arg))

		output = @build.wrap(@build.resolvePath(output))

		# link-report
		args.push('-link-report ' + output.replace('.swf', '.xml'))

		# swf
		args.push('-output ' + output)

		if complete?
			complete(args.join(' '))

module.exports = Flapp