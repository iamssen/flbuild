$path = require('path')
$fs = require('fs')

Fllib = require('./fllib')
Flapp = require('./flapp')
Flmodule = require('./flmodule')

class Flbuild
	constructor: () ->
		@envs = {}
		@envs['FLEX_HOME'] ?= process.env['FLEX_HOME']

		@libraryDirectories = []
		@externalLibraryDirectories = []
		@sourceDirectories = []
		@args = ['-locale en_US']

	# ================================================================================
	# source collect
	# ================================================================================
	# ------------------------------------------------------------
	# setters
	# ------------------------------------------------------------
	addLibraryDirectory: (path) =>
		@libraryDirectories.push(path)

	addExternalLibraryDirectory: (path) =>
		@externalLibraryDirectories.push(path)

	addSourceDirectory: (path) =>
		@sourceDirectories.push(path)

	addArg: (arg) =>
		@args.push(arg)

	# ------------------------------------------------------------
	# getters
	# ------------------------------------------------------------
	getLibraryDirectories: => @libraryDirectories

	getExternalLibraryDirectories: => @externalLibraryDirectories

	getSourceDirectories: => @sourceDirectories

	getArgs: => @args

	# ================================================================================
	# environment variables control
	# ================================================================================
	setEnv: (name, value) =>
		@envs[name] = value

	applyEnv: (str) =>
		for name, value of @envs
			reg = new RegExp('\\$' + name, 'g')
			str = str.replace(reg, value)
		str

	getEnv: (name) =>
		@envs[name]

	# ================================================================================
	# resolve path control : dependent environment variables control
	# ================================================================================
	resolvePath: (path) =>
		path = @applyEnv(path)
		$path.resolve(path)

	resolvePaths: (paths) =>
		newPaths = []
		for path in paths
			newPaths.push(@resolvePath(path))
		newPaths

	# ================================================================================
	# create instance
	# ================================================================================
	createLibraryMaker: () => new Fllib(@)

	createApplicationMaker: () => new Flapp(@)

	createModuleMaker: () => new Flmodule(@)

	# ================================================================================
	# utils
	# ================================================================================
	wrap: (path) ->
		"'#{path}'"

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