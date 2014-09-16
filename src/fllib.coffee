fs = require('fs')
async = require('async')
exec = require('done-exec')
pick = require('file-picker').pick
{SourceCollector} = require('./flutils')

class Fllib
	constructor: (build) ->
		@collector = new SourceCollector(build)
		@build = build

	#==========================================================================================
	# setting
	#==========================================================================================
	# @param func `boolean function(file)`
	setFilterFunction: (func) =>
		@filterFunction = func

	addLibraryDirectory: (path) =>
		@collector.addLibraryDirectory(path)

	addExternalLibraryDirectory: (path) =>
		@collector.addExternalLibraryDirectory(path)

	addSourceDirectory: (path) =>
		@collector.addSourceDirectory(path)

	addArg: (arg) =>
		@collector.addArg(arg)

	#==========================================================================================
	# process
	#==========================================================================================
	createBuildCommand: (output, complete) =>
		#----------------------------------------------------------------
		# 0 get exec file
		#----------------------------------------------------------------
		bin = 'compc'

		@build.getSDKVersion (version) =>
			if process.platform.indexOf('win') is 0
				if version > '4.6.0'
					bin = 'compc.bat'
				else
					bin = 'compc.exe'

			#----------------------------------------------------------------
			# 1 create path args
			#----------------------------------------------------------------
			args = []

			args.push(@build.wrap(@build.getEnv('FLEX_HOME') + '/bin/' + bin))

			for library in @collector.getLibraries()
				args.push('-library-path ' + @build.wrap(library))

			for library in @collector.getExternalLibraries()
				args.push('-external-library-path ' + @build.wrap(library))

			for directory in @collector.getSourceDirectories()
				args.push('-source-path ' + @build.wrap(directory))

			#----------------------------------------------------------------
			# 2 create include classes args
			#----------------------------------------------------------------
			@collector.getIncludeClasses @filterFunction, (classPaths) =>
				args.push('-include-classes ' + classPaths.join(' '))

				#----------------------------------------------------------------
				# 3 create manifest files
				#
				# manifest.xml spec
				# ------------------
				# -namespace http://ssen.name/ns/ssen manifest.xml
				# -include-namespace http://ssen.name/ns/ssen
				#
				# <componentPackage>
				# 	<component id="Stripe" class="ssen.components.fills.Stripe"/>
				# </componentPackage>
				#
				# manifest object
				# ----------------
				# - namespace['http://ssen.name/ns/ssen'][0] = 
				# 										name:'Stripe'
				# 										path:'ssen.components.fills.Stripe'
				#----------------------------------------------------------------
				@collector.getManifest (namespaces) =>
				
					manifestCount = 0
					
					for namespace, components of namespaces
						# create manifest file source
						manifestSource = '<?xml version="1.0" encoding="utf-8"?>\n'
						manifestSource += '<componentPackage>\n'
						for component in components
							if classPaths.indexOf(component.path) > -1
								manifestSource += "<component id='#{component.name}' class='#{component.path}'/>\n" 
						manifestSource += '</componentPackage>'
						
						# write manifest file
						manifestFile = "manifest#{manifestCount}.xml"
						fs.writeFileSync(manifestFile, manifestSource, {encoding:'utf8'})
						
						# add manifest file info to args 
						args.push("-namespace #{namespace} #{manifestFile}")
						args.push("-include-namespaces #{namespace}")
						
						manifestCount++

					#----------------------------------------------------------------
					# 4 args, output
					#----------------------------------------------------------------
					for arg in @collector.getArgs()
						args.push(@build.applyEnv(arg))
	
					args.push('-output ' + @build.wrap(@build.resolvePath(output)))

					complete(args.join(' ')) if complete?
	
	build: (output, complete) =>
		@createBuildCommand output, (command) ->
			exec(command).run(complete)

module.exports = Fllib