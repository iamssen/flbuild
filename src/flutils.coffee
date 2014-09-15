pick = require('file-picker').pick
yaml = require('js-yaml')
fs = require('fs')

class SourceCollector
	constructor: (build) ->
		@build = build
		@libraryDirectories = []
		@externalLibraryDirectories = []
		@sourceDirectories = []
		@args = []

	#==========================================================================================
	# setters
	#==========================================================================================
	addLibraryDirectory: (path) =>
		@libraryDirectories.push(path)

	addExternalLibraryDirectory: (path) =>
		@externalLibraryDirectories.push(path)

	addSourceDirectory: (path) =>
		@sourceDirectories.push(path)

	addArg: (arg) =>
		@args.push(arg)

	#==========================================================================================
	# getters
	#==========================================================================================
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


	getManifest: (callback) =>
		sourceDirectories = @build.resolvePaths(@sourceDirectories.concat(@build.getSourceDirectories()))

		pick sourceDirectories, ['.yaml'], (files) =>
			# namespace['http://ssen.name/ns/ssen'][0] =
			# 										name:'Stripe'
			# 										path:'ssen.components.fills.Stripe'
			namespaces = {}

			for file in files
				if file.name isnt 'namespace'
					continue
				
				# realpath: '/Users/.../ns/namespace.yaml'
				# path: '/Users/.../ns/namespace.yaml'
				# relative_path: 'ns/namespace.yaml'
				# base: '/Usrs/.../ns'
				# name: 'namespace'
				# extension: '.yaml'
				# atime
				# mtime
				# ctime
				
				spec = yaml.safeLoad(fs.readFileSync(file.realpath, 'utf8'))
				namespace = spec.namespace
				components = spec.components
				description = spec.description
				
				for component in components
					paths = component.split('.')
					
					namespaces[namespace] = [] if namespaces[namespace] is undefined
					namespaces[namespace].push
								name: paths[paths.length - 1]
								path: component

			callback(namespaces)


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