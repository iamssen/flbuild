fs = require('fs')
async = require('async')
pick = require('file-picker').pick
{SourceCollector} = require('./flutils')

class Fldoc
	constructor: (@build) ->
	    @collector = new SourceCollector(build)
		@build = build
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
		
	setAdobeAsdoc: (url) =>
		@adobeAsdoc = url
		
	setApacheFlexAsdoc: (url) =>
		@apacheFlexAsdoc = url
		
    setExternalAsdoc: (url) =>
        @externalAsdocs.push(url)
        
    setExternalFldoc: (url) =>
        @externalFldocs.push(url)
        
    build: (outputDirectory, complete) =>
    	
    	
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