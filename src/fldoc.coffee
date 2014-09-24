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
	#----------------------------------------------------------------
	# external document sources
	#----------------------------------------------------------------
	setAdobeAsdoc: (url) =>
		@adobeAsdoc = url

	setApacheFlexAsdoc: (url) =>
		@apacheFlexAsdoc = url

	setExternalAsdoc: (url) =>
		@externalAsdocs.push(url)

	setExternalFldoc: (url) =>
		@externalFldocs.push(url)

	#----------------------------------------------------------------
	# asdoc filter function
	#----------------------------------------------------------------
	# @param func `boolean function(file)`
	setFilterFunction: (func) =>
		@filterFunction = func

	#----------------------------------------------------------------
	# asdoc sources
	#----------------------------------------------------------------
	addLibraryDirectory: (path) =>
		@collector.addLibraryDirectory(path)

	addSourceDirectory: (path) =>
		@collector.addSourceDirectory(path)

	addArg: (arg) =>
		@collector.addArg(arg)

	#==========================================================================================
	# create
	#==========================================================================================
	create: (@outputDirectory, complete) =>
		@store =
			interfaces: {}
			classes: {}
			namespaces: {}
			methods: {}
			properties: {}
			manifests: {}

		tasks = [
			#@createAsdocDataXML
			@readAsdocDataXML
			@readNamespaceYaml
			@readClassYaml
			@printStore
		]

		async.series(tasks, complete)

	#==========================================================================================
	# @ create asdoc xml source
	#==========================================================================================
	cacheDirectoryName: '.asdoc_cache'

	createAsdocBuildCommand: (output, complete) =>
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


	createAsdocDataXML: (callback) =>
		cacheDirectory = $path.normalize(@cacheDirectoryName)

		# remove cache directory if exists
		if $fs.existsSync(cacheDirectory)
			$fs.removeSync(cacheDirectory)

		@createAsdocBuildCommand cacheDirectory, (command) ->
			exec(command).run(callback)

	#==========================================================================================
	# @ read asdoc source (toplevel.xml)
	#==========================================================================================
	readAsdocDataXML: (callback) =>
		parser = new xml2js.Parser()
		parser.parseString $fs.readFileSync($path.join(@cacheDirectoryName, 'toplevel.xml')), (err, data) =>
			for name, value of data.asdoc
				console.log('asdoc xml :', name)

			interfaceRec = data.asdoc.interfaceRec
			classRec = data.asdoc.classRec
			method = data.asdoc.method
			field = data.asdoc.field
			packageRec = data.asdoc.packageRec

			@readAsdocInterfaceRec(interfaceRec)
			@readAsdocClassRec(classRec)
			@readAsdocMethod(method)
			@readAsdocField(field)

			callback()

	readAsdocClassRec: (list) =>
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

			attrs['interfaces']=@semicolonStringToArray(attrs['interfaces'])
			attrs['see']=@convertSee(attrs['see']) if attrs['see']?

			if not store.classes[fullname]?
				store.classes[fullname] = attrs

			if not store.namespaces[namespace]?
				store.namespaces[namespace] = {}


	readAsdocInterfaceRec: (list) =>
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

			attrs['baseClasses']=@semicolonStringToArray(attrs['baseClasses'])
			attrs['see']=@convertSee(attrs['see']) if attrs['see']?

			if not store.interfaces[fullname]?
				store.interfaces[fullname] = attrs

			if not store.namespaces[namespace]?
				store.namespaces[namespace] = {}

	readAsdocMethod: (list) =>
		store = @store
		isAccessor = /\/(get|set)$/
		
		properties = {}
		methods = []
		
		for source in list
			attrs = source['$']
			fullname = attrs['fullname']
			
			if isAccessor.test(fullname)
				getset = fullname.substring(fullname.length - 3)
				fullname = fullname.substring(0, fullname.length - 4)
				
				properties[fullname] ?= {}
				
				if getset is 'get'
					properties[fullname]['get'] = source
				else
					properties[fullname]['set'] = source
					
			else 
				methods.push(source)

		for fullname, getset of properties
			attrs = {}
			get = getset['get']
			set = getset['set']
			
			arr = fullname.split('/')
			classFullName = arr[0]
			namespace = if classFullName.indexOf(':') > -1 then classFullName.split(':', 1)[0] else ''
			{accessor, propertyName} = @splitAccessor(arr[1])
			fullname = "#{classFullName}##{propertyName}"
				
			attrs['fullname'] = fullname
			attrs['accessor'] = if accessor is namespace then 'internal' else accessor
			attrs['propertyType'] = 'accessor'
			attrs['isConst'] = false
			
			if get? and set?
				attrs['readwrite'] = 'readwrite'
			else if get?
				attrs['readwrite'] = 'readonly'
			else 
				attrs['readwrite'] = 'writeonly'
			
			if get?
				attrs['name'] = get['$']['name']
				attrs['type'] = get['$']['result_type']
				attrs['isStatic'] = get['$']['isStatic']
					
			else if set?
				attrs['name'] = set['$']['name']
				attrs['type'] = set['$']['param_types']
				attrs['isStatic'] = set['$']['isStatic']
				
			if get?
				for name, value of get
					if name is '$' then continue
					attrs[name] = value
					
			if set?
				for name, value of set
					if name is '$' then continue
					if attrs[name]? and attrs[name] instanceof Array and value instanceof Array
						attrs[name] = attrs[name].concat(value)
			
			if store.classes[classFullName]?
				store.properties[fullname] = attrs
				store.classes[classFullName]['properties'] ?= []
				store.classes[classFullName]['properties'].push(attrs['name'])

	readAsdocField: (list) =>
		store = @store

		# attrs ----------------------------------
		# name: 'testProp',
		# fullname: 'docSamples:Test1/testProp',
		# type: 'String',
		# isStatic: 'false',
		# isConst: 'false'
		# elements -------------------------------
		# description:array<string>
		# metadata:array<object>

		for source in list
			if @isPrivateField(source) then continue

			attrs = source['$']
			arr = attrs['fullname'].split('/')
			classFullName = arr[0]
			namespace = if classFullName.indexOf(':') > -1 then classFullName.split(':', 1)[0] else ''
			{accessor, propertyName} = @splitAccessor(arr[1])
			fullname = "#{classFullName}##{propertyName}"
			
			#console.log(attrs['fullname'], namespace)

			for name, value of source
				if name is '$' then continue
				attrs[name] = value

			attrs['fullname'] = fullname
			attrs['accessor'] = if accessor is namespace then 'internal' else accessor
			
			if attrs['isConst'].toString() is 'true'
				attrs['propertyType'] = 'constant'
				attrs['readwrite'] = 'readonly'
			else
				attrs['propertyType'] = 'variable'
				attrs['readwrite'] = 'readwrite'
			
			#console.log(attrs)

			if store.classes[classFullName]?
				store.properties[fullname] = attrs
				store.classes[classFullName]['properties'] ?= []
				store.classes[classFullName]['properties'].push(attrs['name'])
				
	
	# ns_internal:*
	# protected:*
	# private:*
	# name.space:*
	# *
	# @return { accessor : 'public', propertyName : '*' }
	splitAccessor: (name) ->
		accessorIndex = name.indexOf(':')
		if accessorIndex > -1
			accessor = name.substring(0, accessorIndex)
			propertyName = name.substring(accessorIndex)
		else
			accessor = 'public'
			propertyName = name
			
		return { accessor : accessor, propertyName : propertyName }

	#==========================================================================================
	# @ read Class.yaml
	#==========================================================================================
	readClassYaml: (callback) =>
		store = @store
		async.eachSeries(store.classes, @readClassYamlTaskFunction, callback)

	#----------------------------------------------------------------
	# task function
	#----------------------------------------------------------------
	readClassYamlTaskFunction: (classInfo, callback) =>
		sourcefile = classInfo['sourcefile']
		yamlPath = sourcefile.replace($path.extname(sourcefile), '.yaml')

		#---------------------------------------------
		# cancel task if not exists yaml file
		#---------------------------------------------
		if not $fs.existsSync(yamlPath)
			callback()
			return

		source = yaml.safeLoad($fs.readFileSync(yamlPath, {encoding:'utf8'}))



	#==========================================================================================
	# @ read namespace.yaml
	#==========================================================================================
	readNamespaceYaml: (callback) =>
		store = @store
		sourceDirectories = @collector.getSourceDirectories()
		namespaceInfos = []

		#---------------------------------------------
		# namespaceInfo = store.namespace * source directories
		#---------------------------------------------
		for namespace, values of store.namespaces
			namespacePath = namespace.split('.').join($path.sep)

			for sourceDirectory in sourceDirectories
				yamlPath = $path.join(sourceDirectory, namespacePath, 'namespace.yaml')

				# add namespaceInfos
				namespaceInfos.push
					yamlPath: yamlPath
					namespace: namespace
					values: values

		#---------------------------------------------
		# each namespaceInfos
		#---------------------------------------------
		async.eachSeries(namespaceInfos, @readNamespaceYamlTaskFunction, callback)

	#----------------------------------------------------------------
	# task function
	#----------------------------------------------------------------
	readNamespaceYamlTaskFunction: (namespaceInfo, callback) =>
		store = @store
		yamlPath = namespaceInfo['yamlPath']

		#---------------------------------------------
		# cancel task if not exists yaml file
		#---------------------------------------------
		if not $fs.existsSync(yamlPath)
			callback()
			return


		values = namespaceInfo['values']
		namespace = namespaceInfo['namespace']
		source = yaml.safeLoad($fs.readFileSync(yamlPath, {encoding:'utf8'}))

		#---------------------------------------------
		# read manifest spec
		#---------------------------------------------
		if source['namespace']? and source['components']? and source['components'].length > 0
			# convert classname to fullname if exists namespace
			# Component --> name.space:Component
			if namespace isnt ''
				newComponents = []
				for component in source['components']
					newComponents.push(namespace + ':' + component)
				source['components'] = newComponents

			# manifestNamespace = 'http://ns.com/ns'
			manifestNamespace = @clearBlank(source['namespace'])

			# create manifest object if not exists
			store.manifests[manifestNamespace] ?= {}
			manifest = store.manifests[manifestNamespace]

			# save manifest components
			# sotre.manifests['http://ns.com/ns']['components'] = 'name.space:Component'
			manifest['components'] ?= []

			for component in source['components']
				manifest['components'].push(component)

		#---------------------------------------------
		# save namespace.yaml values to namespace info
		# store.namespaces['name.space'][name] = value
		#---------------------------------------------
		for name, value of source
			values[name] = value

		#---------------------------------------------
		# end task
		#---------------------------------------------
		callback()

	#==========================================================================================
	# utils
	#==========================================================================================
	#----------------------------------------------------------------
	# toplevel.xml utils
	#----------------------------------------------------------------
	isPrivateField: (source) ->
		return source['$']['fullname'].indexOf('/private:') > -1 or source['private']?

	convertSee: (list) =>
		if not list? or list.length is 0
			return []

		cleared = []

		for see in list
			see = @clearBlank(see)
			cleared.push(see)

		return cleared

	#----------------------------------------------------------------
	# basic utils
	#----------------------------------------------------------------
	# remove all front and back space character of string
	clearBlank: (str) ->
		return str.replace(/^\s*|\s*$/g, '')

	# name.space:Class1;name.space.Class2 --> [name.space.Class1, name.space.Class2]
	semicolonStringToArray: (str) ->
		if str? or str is ''
			str.split(';')
		else
			''

	#==========================================================================================
	# debug : trace store object
	#==========================================================================================
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
# getAsdocIndex: (url, complete) ->
# http://help.adobe.com/ko_KR/FlashPlatform/reference/actionscript/3/all-index-A.html
# http://flex.apache.org/asdoc/all-index-B.html



# get all-index-A ~ Z
# parse and find class="idxrow"
# dic[..][..] = url
# complete(error, dic)



module.exports = Fldoc