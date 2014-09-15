$path = require('path')
$fs = require('fs')
parseXml = require('xml2js').parseString

Fllib = require('./fllib')
Flapp = require('./flapp')
Flmodule = require('./flmodule')
Flasset = require('./flasset')

class Flbuild
	constructor: () ->
		@envs = {}

		@libraryDirectories = []
		@externalLibraryDirectories = []
		@sourceDirectories = []
		@args = ['-locale en_US']

	#==========================================================================================
	# source collect
	#==========================================================================================
	#----------------------------------------------------------------
	# setters
	#----------------------------------------------------------------
	addLibraryDirectory: (path) =>
		@libraryDirectories.push(path)

	addExternalLibraryDirectory: (path) =>
		@externalLibraryDirectories.push(path)

	addSourceDirectory: (path) =>
		@sourceDirectories.push(path)

	addArg: (arg) =>
		@args.push(arg)

	#----------------------------------------------------------------
	# getters
	#----------------------------------------------------------------
	getLibraryDirectories: => @libraryDirectories

	getExternalLibraryDirectories: => @externalLibraryDirectories

	getSourceDirectories: => @sourceDirectories

	getArgs: => @args

	#==========================================================================================
	# environment variables control
	#==========================================================================================
	setEnv: (name, value) =>
		value = process.env[name] if not value?
		@envs[name] = value

	applyEnv: (str) =>
		for name, value of @envs
			reg = new RegExp('\\$' + name, 'g')
			str = str.replace(reg, value)
		str

	getEnv: (name) =>
		@envs[name]

	getSDKVersion: (done) =>
		if not @sdkDescription
			xmlstr = $fs.readFileSync(@getEnv('FLEX_HOME') + '/flex-sdk-description.xml', {encoding:'utf8'})
			parseXml xmlstr, (err, result)->
				@sdkDescription = result
				done(@sdkDescription.version)
		else
			done(@sdkDescription.version)


	#==========================================================================================
	# resolve path control : dependent environment variables control
	#==========================================================================================
	resolvePath: (path) =>
		path = @applyEnv(path)
		$path.resolve(path)

	resolvePaths: (paths) =>
		newPaths = []
		for path in paths
			newPaths.push(@resolvePath(path))
		newPaths

	#==========================================================================================
	# create instance
	#==========================================================================================
	getLibraryCreator: () => new Fllib(@)

	getApplicationCreator: () => new Flapp(@)

	getModuleCreator: () => new Flmodule(@)

	getAssetCreator: () => new Flasset(@)

	#==========================================================================================
	# utils
	#==========================================================================================
	isWindow: () -> process.platform.indexOf('win') is 0
	
	wrap: (path) ->
		path = "\"#{path}\""
		path.replace(/\//g, "\\") if isWindow()
		return path

	getSwcListFromDirectory: (path) ->
		swcs = []
		if $fs.existsSync(path)
			files = $fs.readdirSync(path)

			for file in files
				if file.lastIndexOf('.swc') > -1
					swcs.push($path.join(path, file))
		swcs

	# file from require('file-picker')
	classfy: (file) ->
		classPath = file.relative_base.split('/').join('.') + '.' + file.name
		classPath = classPath.substr(1) if classPath.charAt(0) is '.'
		classPath

module.exports = Flbuild