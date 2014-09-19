$fs = require('fs-extra')
$path = require('path')
async = require('async')
pick = require('file-picker').pick
exec = require('done-exec')
{SourceCollector} = require('./flutils')

class Fldoc
	constructor: (@build) ->
	    @collector = new SourceCollector(@build)
		@externalAsdocs = []
		@externalFldocs = []
		@adobeAsdoc = 'http://help.adobe.com/ko_KR/FlashPlatform/reference/actionscript/3/'
		@apacheFlexAsdoc = 'http://flex.apache.org/asdoc/'
		
		# source > externalFldocs > externalAsdocs > apacheFlexAsdoc > adobeAsdoc
		
	#==========================================================================================
	# setting
	#==========================================================================================
	# @param func `boolean function(file)`
	setFilterFunction: (func) =>
		@filterFunction = func
	
	# external document setting	
	setAdobeAsdoc: (url) =>
		@adobeAsdoc = url
		
	setApacheFlexAsdoc: (url) =>
		@apacheFlexAsdoc = url
		
    setExternalAsdoc: (url) =>
        @externalAsdocs.push(url)
        
    setExternalFldoc: (url) =>
        @externalFldocs.push(url)
    
    # library setting    
    addLibraryDirectory: (path) =>
		@collector.addLibraryDirectory(path)

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
		bin = 'asdoc'

		@build.getSDKVersion (version) =>
			if process.platform.indexOf('win') is 0
				if version > '4.6.0'
					bin = 'asdoc.bat'
				else
					bin = 'asdoc.exe'
					
			#----------------------------------------------------------------
			# 1 create path args
			#----------------------------------------------------------------
			args = []

			args.push(@build.wrap(@build.getEnv('FLEX_HOME') + '/bin/' + bin))

			for library in @collector.getLibraries()
				args.push('-library-path ' + @build.wrap(library))

			for library in @collector.getExternalLibraries()
				args.push('-library-path ' + @build.wrap(library))

			for directory in @collector.getSourceDirectories()
				args.push('-source-path ' + @build.wrap(directory))
				
			#----------------------------------------------------------------
			# 2 create include classes args
			#----------------------------------------------------------------
			@collector.getIncludeClasses @filterFunction, (classPaths) =>
				args.push('-doc-classes ' + classPaths.join(' '))

				#----------------------------------------------------------------
				# 3 args, output
				#----------------------------------------------------------------
				for arg in @collector.getArgs()
					args.push(@build.applyEnv(arg))

				args.push('-output ' + @build.wrap(@build.resolvePath(output)))
				
				args.push('-keep-xml=true')
				args.push('-skip-xsl=true')

				complete(args.join(' ')) if complete?
	
	create: (outputDirectory, complete) =>
		cacheDirectory = $path.normalize('.asdoc_cache')
		
		# remove cache directory if exists
		$fs.removeSync(cacheDirectory) if $fs.existsSync(cacheDirectory)
		
		@createBuildCommand cacheDirectory, (command) ->
			exec(command).run (err) ->
				complete()
        
    
    # complete = `function(error, dic)`
    # dic[name.space.Class]	[property]		= http://~/name/space/Class.html#property
    # dic[name.space.Class]	[method()]		= http://~/name/space/Class.html#method()
    # dic[name.space]		[method()]		= http://~/name/space/#method() ???
    # dic[name.space.Class]	[style:name]	= http://~/name/space/Class.html#style:name
	getAsdocIndex: (url, complete) ->
		# http://help.adobe.com/ko_KR/FlashPlatform/reference/actionscript/3/all-index-A.html
		# http://flex.apache.org/asdoc/all-index-B.html
		
		
		
		# get all-index-A ~ Z
			# parse and find class="idxrow"
				# dic[..][..] = url
					# complete(error, dic)
					
					
					
module.exports = Fldoc