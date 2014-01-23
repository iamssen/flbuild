pick = require('file-picker').pick

class SourceCollector
	constructor: (build) ->
		@build = build
		@libraryDirectories = []
		@externalLibraryDirectories = []
		@sourceDirectories = []
		@args = []

	# ================================================================================
	# setters
	# ================================================================================
	addLibraryDirectory: (path) =>
		@libraryDirectories.push(path)

	addExternalLibraryDirectory: (path) =>
		@externalLibraryDirectories.push(path)

	addSourceDirectory: (path) =>
		@sourceDirectories.push(path)

	addArg: (arg) =>
		@args.push(arg)

	# ================================================================================
	# getters
	# ================================================================================
	getLibraries: =>
		libraryDirectories = @build.resolvePaths(@libraryDirectories.concat(@build.getLibraryDirectories()))
		libraries = []
		if libraryDirectories and libraryDirectories.length > 0
			for directory in libraryDirectories
				libraries = libraries.concat(@build.getSwcListFromDirectory(directory))
		libraries

	getExternalLibraries: =>
		libraryDirectories = @build.resolvePaths(@externalLibraryDirectories.concat(@build.getExternalLibraryDirectories()))
		libraries = []
		if libraryDirectories and libraryDirectories.length > 0
			for directory in libraryDirectories
				libraries = libraries.concat(@build.getSwcListFromDirectory(directory))
		libraries

	getSourceDirectories: =>
		@build.resolvePaths(@sourceDirectories.concat(@build.getSourceDirectories()))

	getIncludeClasses: (filterFunction, callback) =>
		sourceDirectories = @build.resolvePaths(@sourceDirectories.concat(@build.getSourceDirectories()))

		pick sourceDirectories, ['.as', '.mxml'], (files) =>
			classPaths = []

			for file in files
				file.class = @build.classfy(file)

				if filterFunction?
					if filterFunction(file)
						classPaths.push(file.class)
				else
					classPaths.push(file.class)

			callback(classPaths)

	getArgs: =>
		@args.concat(@build.getArgs())

exports.SourceCollector = SourceCollector