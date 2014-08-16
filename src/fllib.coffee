pick = require('file-picker').pick
{SourceCollector} = require('./flutils')

class Fllib
	constructor: (build) ->
		@collector = new SourceCollector(build)
		@build = build

	# ================================================================================
	# options
	# ================================================================================
	# @param func function(file)
	setFilterFunction: (func) => @filterFunction = func

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
	createBuildCommand: (output, complete) =>
		#------------------------------------
		# 0 get exec file
		#------------------------------------
		bin = 'compc'

		@build.getSDKVersion (version) =>
			if process.platform.indexOf('win') is 0
				if version > '4.6.0'
					bin = 'compc.bat'
				else
					bin = 'compc.exe'

			# ------------------------------------------------------------
			# 1 : create path args
			# ------------------------------------------------------------
			args = []

			args.push(@build.wrap(@build.getEnv('FLEX_HOME') + '/bin/' + bin))

			for library in @collector.getLibraries()
				args.push('-library-path ' + @build.wrap(library))

			for library in @collector.getExternalLibraries()
				args.push('-external-library-path ' + @build.wrap(library))

			for directory in @collector.getSourceDirectories()
				args.push('-source-path ' + @build.wrap(directory))

			# ------------------------------------------------------------
			# 2 : create include classes args
			# ------------------------------------------------------------
			@collector.getIncludeClasses @filterFunction, (classPaths) =>
				args.push('-include-classes ' + classPaths.join(' '))

				# ------------------------------------------------------------
				# 3 : args, output
				# ------------------------------------------------------------
				for arg in @collector.getArgs()
					args.push(@build.applyEnv(arg))

				args.push('-output ' + @build.wrap(@build.resolvePath(output)))

				if complete?
					complete(args.join(' '))

module.exports = Fllib