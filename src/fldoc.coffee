$fs = require('fs-extra')
$path = require('path')
async = require('async')
pick = require('file-picker').pick
exec = require('done-exec')
{SourceCollector} = require('./flutils')
xml2js = require('xml2js')
yaml = require('js-yaml')
marked = require('marked')

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
			if @build.isWindow()
				if version > '4.6.0'
					bin = 'asdoc.bat'
				else
					bin = 'asdoc.exe'
					
			#----------------------------------------------------------------
			# 1 create path args
			#----------------------------------------------------------------
			args = []

			args.push(@build.wrap($path.join(@build.getEnv('FLEX_HOME'), 'bin', bin)))

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
	
	#==========================================================================================
	# create
	#==========================================================================================
	cacheDirectoryName: '.asdoc_cache'
	
	create: (@outputDirectory, complete) =>
		@store = 
			interfaces: {}
			classes: {}
			namespaces: {}
			methods: {}
			properties: {}
			manifests: {}
		
		tasks = [
			@createASDocDataXML
			@readASDocDataXML
			@readNamespaceYaml
			@readClassYaml
			#@printStore
		]
		
		async.series(tasks, complete)
	
	#==========================================================================================
	# execute asdoc
	#==========================================================================================
	createASDocDataXML: (callback) =>
		cacheDirectory = $path.normalize(@cacheDirectoryName)
	
		# remove cache directory if exists
		if $fs.existsSync(cacheDirectory)
			$fs.removeSync(cacheDirectory) 
		
		@createBuildCommand cacheDirectory, (command) ->
			exec(command).run (err) -> 
				callback()
	
	#==========================================================================================
	# read source datas
	# -----------------------------
	# asdoc toplevel.xml
	# namespace.yaml
	# Class.yaml
	#==========================================================================================
	# 1 : read and store asdoc toplevel.xml
	readASDocDataXML: (callback) =>
		parser = new xml2js.Parser()
		parser.parseString $fs.readFileSync($path.join(@cacheDirectoryName, 'toplevel.xml')), (err, data) =>
			for name, value of data.asdoc
				console.log('asdoc xml :', name)
				
			interfaceRec = data.asdoc.interfaceRec
			classRec = data.asdoc.classRec
			method = data.asdoc.method
			field = data.asdoc.field
			packageRec = data.asdoc.packageRec
			
			@read_interfaceRec_from_toplevel_xml(interfaceRec)
			@read_classRec_from_toplevel_xml(classRec)
			@read_method_from_toplevel_xml(method)
			@read_field_from_toplevel_xml(field)
			
			callback()
			
	# 3 : read and store Class.yaml
	readClassYaml: (callback) =>
		store = @store
		classInfos = []
		
		async.eachSeries(store.classes, @read_classPath, callback)
		
	read_classPath: (classInfo, callback) =>
		sourcefile = values['sourcefile']
		yamlPath = sourcefile.replace($path.extname(sourcefile), '.yaml')
		
		if not $fs.existsSync(yamlPath)
			callback()
			return
			
		#source = yaml.safeLoad($fs.readFileSync(yamlPath, {encoding:'utf8'}))
		#
		#for prop, value of source
			#if prop is 'class' then continue
			
			
			

	# 2 : read and store namespace.yaml			
	readNamespaceYaml: (callback) =>
		store = @store
		sourceDirectories = @collector.getSourceDirectories()
		namespaceInfos = []
		
		for namespace, values of store.namespaces
			namespacePath = namespace.split('.').join($path.sep)
			for sourceDirectory in sourceDirectories
				yamlPath = $path.join(sourceDirectory, namespacePath, 'namespace.yaml')
				namespaceInfos.push
					yamlPath: yamlPath
					namespace: namespace
					values: values
					
		async.eachSeries(namespaceInfos, @read_namespacePath, callback)
	
	# 2-1 : each task function				
	read_namespacePath: (namespaceInfo, callback) =>
		store = @store
		yamlPath = namespaceInfo['yamlPath']
		
		if not $fs.existsSync(yamlPath)
			callback()
			return
		
		values = namespaceInfo['values']	
		namespace = namespaceInfo['namespace']
		source = yaml.safeLoad($fs.readFileSync(yamlPath, {encoding:'utf8'}))
		
		if source['namespace']? and source['components']? and source['components'].length > 0
			if namespace isnt ''
				newComponents = []
				for component in source['components']
					newComponents.push(namespace + ':' + component)
				source['components'] = newComponents
			
			manifest_ns = source['namespace']
				
			store.manifests[manifest_ns] ?= {}
			
			manifest = store.manifests[manifest_ns]
			manifest['components'] ?= []
			
			for component in source['components']
				manifest['components'].push(component)
				
		for name, value of source
			values[name] = value
		
		callback()	
	
	
	
	# 1-1 : read classRec
	read_classRec_from_toplevel_xml: (list) =>
		store = @store
		
		# attrs ----------------------
		# name:string 'EmailRenderer',
		# fullname:string 'mailer.views:EmailRenderer',
		# sourcefile:string '/home/ubuntu/workspace/flbuild/test/project/src/mailer/views/EmailRenderer.mxml',
		# namespace:string 'mailer.views',
		# access:string 'public',
		# baseclass:string 'spark.components.supportClasses:ItemRenderer',
		# interfaces:string 'docSamples:ITest1;docSamples:ITest2',
		# isFinal:boolean 'false',
		# isDynamic:boolean 'false'
		# elements ------------------
		# description:array<string>
		# see:array<string>
		# includeExample:array<string>
		# throws:array<string>
		# metadata:array<object>
		
		for source in list
			attrs = source['$']
			fullname = attrs['fullname']
			namespace = attrs['namespace']
			
			for name, value of source
				if name is '$' then continue
				attrs[name] = value
			
			attrs['interfaces']=@parse_interfaceString(attrs['interfaces'])
			attrs['see']=@clear_see(attrs['see']) if attrs['see']?
			
			if not store.classes[fullname]?
				store.classes[fullname] = attrs
				
			if not store.namespaces[namespace]?
				store.namespaces[namespace] = {}
	
	# 1-2 : read interfaceRec
	read_interfaceRec_from_toplevel_xml: (list) =>
		store = @store
		
		# attrs ----------------------------
		# name: 'ITest3',
		# fullname: 'docSamples:ITest3',
		# sourcefile: '/home/ubuntu/workspace/flbuild/test/project/src/docSamples/ITest3.as',
		# namespace: 'docSamples',
		# access: 'public',
		# baseClasses: 'flash.events:IEventDispatcher;flash.display:IGraphicsData;docSamples:ITest1',
		# isFinal: 'false',
		# isDynamic: 'false'
		# elements ------------------
		# description:array<string>
		# see:array<string>
		# includeExample:array<string>
		# throws:array<string>
		# metadata:array<object>
		
		for source in list
			attrs = source['$']
			fullname = attrs['fullname']
			namespace = attrs['namespace']
			
			for name, value of source
				if name is '$' then continue
				attrs[name] = value
				
			attrs['baseClasses']=@parse_interfaceString(attrs['baseClasses'])
			attrs['see']=@clear_see(attrs['see']) if attrs['see']?
			
			if not store.interfaces[fullname]?
				store.interfaces[fullname] = attrs
				
			if not store.namespaces[namespace]?
				store.namespaces[namespace] = {}
	
	read_method_from_toplevel_xml: (list) =>
		console.log('read_method_from_toplevel_xml')
	
	read_field_from_toplevel_xml: (list) =>
		store = @store
		
		for source in list
			if @is_private_field(source) then continue
			
			console.log(source)
			attr = source['$']
			
	is_private_field: (source) ->
		return source['$']['fullname'].indexOf('/private:') > -1 or source['private']?
	
	# dev utils		
	clear_see: (list) =>
		if not list? or list.length is 0
			return []
		
		cleared = []
		
		for see in list
			see = @clear_blank(see)
			cleared.push(see)
	
		return cleared
		
	clear_blank: (str) ->
		return str.replace(/^\s*|\s*$/g, '')
		
	
	parse_interfaceString: (str) ->
		if str? or str is '' 
			str.split(';') 
		else 
			''
	printStore: () =>
		store = @store
		interfaces = store.interfaces
		classes = store.classes
		namespaces = store.namespaces
		methods = store.methods
		properties = store.properties
		manifests = store.manifests
		
		console.log('==================== : namespaces')
		for name, value of namespaces
			console.log('------------ :', name)
			console.log(value)
		
		console.log('==================== : interfaces')
		for name, value of interfaces
			console.log('------------ :', name)
			console.log(value)
		
		console.log('==================== : classes')
		for name, value of classes
			console.log('------------ :', name)
			console.log(value)
			
		console.log('==================== : methods')
		for name, value of methods
			console.log('------------ :', name)
			console.log(value)
			
		console.log('==================== : properties')
		for name, value of properties
			console.log('------------ :', name)
			console.log(value)
			
		console.log('==================== : manifests')
		for name, value of manifests
			console.log('------------ :', name)
			console.log(value)
			
    
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