$fs = require('fs-extra')
$path = require('path')
async = require('async')
pick = require('file-picker').pick
exec = require('done-exec')
{SourceCollector} = require('./flutils')
xml2js = require('xml2js')
yaml = require('js-yaml')
marked = require('marked')
cheerio = require('cheerio')
request = require('request')

class Fldoc
	constructor: (@build) ->
		@collector = new SourceCollector(@build)
		@externalAsdocs = []
		@externalFldocs = []
		@adobeAsdoc = 'http://help.adobe.com/ko_KR/FlashPlatform/reference/actionscript/3/'
		@apacheFlexAsdoc = 'http://flex.apache.org/asdoc/'
		@reflowFldoc = 'http://reflow.ssen.name/fldoc/'

		# source > externalFldocs > externalAsdocs > apacheFlexAsdoc > adobeAsdoc

	#==========================================================================================
	# setting
	#==========================================================================================
	#----------------------------------------------------------------
	# external document sources
	#----------------------------------------------------------------
	refreshExternalAsdocCache: () =>
		@removeExternalAsdocCache = true
	
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
	create: (@output, complete) =>
		@store =
			sourceDirectories: []
			interfaces: {}
			classes: {}
			namespaces: {}
			methods: {}
			properties: {}
			manifests: {}
			external: {}

		tasks = [
			#@createAsdocDataXML
			@readAsdocDataXML
			@readNamespaceYaml
			@readClassYaml
			@getExternalAsdoc
			@saveStoreToFile
			#@printStore
			#@printFields
		]

		async.series(tasks, complete)

	#==========================================================================================
	# @ save
	#==========================================================================================
	saveStoreToFile: (callback) =>
		for directory in @collector.getSourceDirectories()
			directory = directory.replace(/\//g, "\\") if @build.isWindow()
			@store.sourceDirectories.push(directory)
		
		json = JSON.stringify(@store, null, '\t')
		$fs.writeFile @output, json, {encoding:'utf8'}, callback
		
	#==========================================================================================
	# @ get external asdoc list
	#==========================================================================================
	externalAsdocCacheDirectoryName: '.external_asdoc_cache'
	
	convertUrlToCacheName: (url) ->
		url.replace(/[^a-zA-Z0-9]/g, '_')
	
	getExternalAsdoc: (callback) =>
		externalCacheDirectory = $path.normalize(@externalAsdocCacheDirectoryName)

		# remove cache directory if exists
		if @removeExternalAsdocCache and $fs.existsSync(externalCacheDirectory)
			$fs.removeSync(externalCacheDirectory)

		# create cache directory
		if not $fs.existsSync(externalCacheDirectory)
			$fs.mkdirSync(externalCacheDirectory)

		asdocs = [@adobeAsdoc, @apacheFlexAsdoc]
		asdocs = asdocs.concat(@externalAsdocs) if @externalAsdocs? and @externalAsdocs.length > 0
		a2z = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
		check = /\/$/

		reqs = []
		for asdoc in asdocs
			if not check.test(asdoc)
				asdoc = asdoc + '/' 
				
			for char in a2z
				url = "#{asdoc}all-index-#{char}.html"
				cacheFile = $path.join(externalCacheDirectory, @convertUrlToCacheName(url) + '.json')
				
				reqs.push
					cache: cacheFile
					asdoc: asdoc
					url: url
		
		async.eachSeries(reqs, @getExternalAsdocTaskFunction, callback)

	#----------------------------------------------------------------
	# task function
	#----------------------------------------------------------------
	getExternalAsdocTaskFunction: (req, callback) =>
		external = @store.external

		# register cache object (a json cache file contents)
		register = (cache) ->
			for item in cache
				fullname = item['fullname']
				url = item['url']
				external[fullname] = url

		#----------------------------------------------------------------
		# if has cache file
		#----------------------------------------------------------------
		if $fs.existsSync(req.cache)
			$fs.readFile req.cache, {encoding:'utf8'}, (err, data) ->
				if not err? and data?
					register(JSON.parse(data))
					callback()

		#----------------------------------------------------------------
		# if not has cache file
		#----------------------------------------------------------------
		else
			#---------------------------------------------
			# 0 get asdoc web page
			#---------------------------------------------
			request req.url, (err, res, body) ->
				if err? or res.statusCode isnt 200
					console.load(err, res.statusCode)
					callback()
					return

				#---------------------------------------------
				# 1 create jquery object
				#---------------------------------------------
				$ = cheerio.load(body)
					
				classes = {}
				classMembers = {}
				classpath = null

				#---------------------------------------------
				# 2 select all <td class="idxrow"/> object
				#---------------------------------------------
				nodes = $('td.idxrow')
				nodes.each (index) ->
					href = $(@).children('a').first().attr('href')
					arr = href.split('#')
					html = null
					anchor = null
					
					if arr.length is 2
						html = arr[0]
						anchor = arr[1]
					else if arr.length is 1
						html = arr[0]
					else
						return
						
					classpath = html.substring(0, html.length - 5).replace(/\//g, '.').replace(/^\.*/g, '')

					if anchor?
						classMembers[classpath] ?= {}
						classMembers[classpath][anchor] = req.asdoc + href
					else
						classes[classpath] ?= req.asdoc + href

				#---------------------------------------------
				# 3 create a cache object
				#---------------------------------------------
				cache = []
				
				for classpath, url of classes
					cache.push
						fullname: classpath.replace(/([a-zA-Z0-9\_\.]+)\.([a-zA-Z0-9\_]+)($|\#)/, '$1:$2$3')
						url: url
					
				for classpath, members of classMembers
					for member, url of members
						cache.push
							fullname: "#{classpath}##{member}".replace(/([a-zA-Z0-9\_\.]+)\.([a-zA-Z0-9\_]+)($|\#)/, '$1:$2$3')
							url: url
				
				#---------------------------------------------
				# 4 write to cache.json file and register to @store.external[0]=cache
				#---------------------------------------------
				$fs.writeFile req.cache, JSON.stringify(cache), {encoding:'utf8'}, (err) ->
					register(cache)
					callback()
						
			

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
				attrs[name] = @clearBlank(value)

			attrs['interfaces']=@semicolonStringToArray(attrs['interfaces'])

			if not store.classes[fullname]?
				store.classes[fullname] = attrs

			store.namespaces[namespace] ?= {}
			store.namespaces[namespace]['classes'] ?= []
			store.namespaces[namespace]['classes'].push(fullname)


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
				attrs[name] = @clearBlank(value)

			attrs['baseClasses']=@semicolonStringToArray(attrs['baseClasses'])

			if not store.interfaces[fullname]?
				store.interfaces[fullname] = attrs

			store.namespaces[namespace] ?= {}
			store.namespaces[namespace]['interfaces'] ?= []
			store.namespaces[namespace]['interfaces'].push(fullname)
				

	readAsdocMethod: (list) =>
		store = @store
		isAccessor = /\/(get|set)$/

		properties = {}
		methods = []

		#----------------------------------------------------------------
		# collect accessor properties and methods
		# ---------------------------------------
		# properties[fullname]['get'|'set'] = source
		# methods[fullname] = source
		#----------------------------------------------------------------
		for source in list
			if @isPrivateField(source) then continue
			
			attrs = source['$']
			fullname = attrs['fullname']

			# accessor property
			if isAccessor.test(fullname)
				getset = fullname.substring(fullname.length - 3)
				fullname = fullname.substring(0, fullname.length - 4)

				properties[fullname] ?= {}

				if getset is 'get'
					properties[fullname]['get'] = source
				else
					properties[fullname]['set'] = source
				# method
			else
				methods.push(source)

		#----------------------------------------------------------------
		# process accessor properties
		#----------------------------------------------------------------
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
					attrs[name] = @clearBlank(value)

			if set?
				for name, value of set
					if name is '$' then continue
					attrs[name] = @joinProperties(attrs[name], @clearBlank(value))

			if store.classes[classFullName]?
				store.properties[fullname] = attrs
				store.classes[classFullName]['properties'] ?= []
				store.classes[classFullName]['properties'].push(attrs['name'])

		#----------------------------------------------------------------
		# process methods
		#----------------------------------------------------------------
		for source in methods
			attrs = source['$']
			arr = attrs['fullname'].split('/')
			classFullName = arr[0]
			namespace = if classFullName.indexOf(':') > -1 then classFullName.split(':', 1)[0] else ''
			{accessor, propertyName} = @splitAccessor(arr[1])
			fullname = "#{classFullName}##{propertyName}()"
			
			for name, value of source
				if name is '$' then continue
				attrs[name] = @clearBlank(value)

			attrs['fullname'] = fullname
			attrs['assessor'] = if accessor is namespace then 'internal' else accessor
			
			if attrs['param_names']?
				param_names = attrs['param_names'].split(';')
				param_types = attrs['param_types'].split(';')
				param_defaults = attrs['param_defaults'].split(';')
				params = []
				
				for i in [0..param_names.length - 1]
					param = {}
					param['name'] = param_names[i]
					param['type'] = param_types[i]
					param['default'] = param_defaults[i]
					
					if attrs['param']? and attrs['param'][i]?
						param['description'] = attrs['param'][i]
						
					params.push(param)
						
				attrs['params'] = params

			if store.classes[classFullName]?
				store.methods[fullname] = attrs
				store.classes[classFullName]['methods'] ?= []
				store.classes[classFullName]['methods'].push("#{attrs['name']}()")


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
				attrs[name] = @clearBlank(value)

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
			propertyName = name.substring(accessorIndex + 1)
		else
			accessor = 'public'
			propertyName = name

		return { accessor : accessor, propertyName : propertyName }

	#==========================================================================================
	# @ read Class.yaml
	#==========================================================================================
	readClassYaml: (callback) =>
		store = @store
		
		arr = []
		
		for name, value of store.classes
			arr.push(value)
			
		for name, vlaue of store.interfaces
			arr.push(value)
		
		async.eachSeries(arr, @readClassYamlTaskFunction, callback)

	#----------------------------------------------------------------
	# task function
	#----------------------------------------------------------------
	readClassYamlTaskFunction: (typeInfo, callback) =>
		sourcefile = typeInfo['sourcefile']
		yamlPath = sourcefile.replace($path.extname(sourcefile), '.yaml')
		
		#---------------------------------------------
		# cancel task if not exists yaml file
		#---------------------------------------------
		if not $fs.existsSync(yamlPath)
			callback()
			return

		source = yaml.safeLoad($fs.readFileSync(yamlPath, {encoding:'utf8'}))
		
		typeFullName = typeInfo['fullname']
		
		methodNameReg = /[a-zA-Z0-9\_]+\(\)/
		
		for name, value of source
			if name is 'class' or name is 'interface'
				@joinClassYamlClassInfo(typeInfo, value)
				
			else if methodNameReg.test(name)
				methodInfo = @store.methods["#{typeFullName}##{name}"]
				if methodInfo? then @joinClassYamlMethodInfo(methodInfo, value)
				
			else
				propertyInfo = @store.properties["#{typeFullName}##{name}"]
				if propertyInfo? then @joinClassYamlFieldInfo(propertyInfo, value)
		
		callback()
		
		
	joinClassYamlClassInfo: (origin, source) =>
		avalableProperties = 
			description: true
			see: true
			throws: true
			includeExample: true
		
		@joinInfo(origin, source, avalableProperties)
		
	joinClassYamlFieldInfo: (origin, source) =>
		avalableProperties = 
			description: true
			see: true
			throws: true
			includeExample: true
		
		@joinInfo(origin, source, avalableProperties)
		
	joinClassYamlMethodInfo: (origin, source) =>
		avalableProperties = 
			description: true
			see: true
			throws: true
			includeExample: true
			'return': true
		
		@joinInfo(origin, source, avalableProperties)
		
	joinInfo: (origin, source, avalableProperties) =>
		for name, value of source
			if avalableProperties[name] is true
				origin[name] = @joinProperties(origin[name], @clearBlank(source[name]), true)
		

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
				manifest['components'].push(@clearBlank(component))

		#---------------------------------------------
		# save namespace.yaml values to namespace info
		# store.namespaces['name.space'][name] = value
		#---------------------------------------------
		values['description'] = @joinProperties(values['description'], source['description'])

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

	#----------------------------------------------------------------
	# basic utils
	#----------------------------------------------------------------
	# remove all front and back space character of string
	clearBlank: (obj) ->
		regexp = /^\s*|\s*$/g
		
		if typeof obj is 'string'
			return obj.replace(regexp, '')
			
		else if obj instanceof Array and obj.length > 0
			for i in [0..obj.length-1]
				if typeof obj[i] is 'string'
					obj[i] = obj[i].replace(regexp, '')
					
		return obj

	# name.space:Class1;name.space.Class2 --> [name.space.Class1, name.space.Class2]
	semicolonStringToArray: (str) ->
		if str? or str is ''
			str.split(';')
		else
			''

	joinProperties: (primary, secondary, overrideToSecondary = false) ->
		if primary? and secondary? and primary instanceof Array
			if secondary instanceof Array
				return primary.concat(secondary)
			else
				primary.push(secondary)
				return primary
		else if primary? and secondary?
			return if overrideToSecondary then secondary else primary
		else if not primary? and secondary?
			return secondary
		else
			return primary

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
			
	
		
	printFields : () =>
		store = @store
		
		print = (collection) ->
			fields = {}
			
			for collectionName, collectionValue of collection
				for name, value of collectionValue
					fields[name] = typeof value if not fields[name]?
					
			for name, value of fields
				console.log(name, ':', value)
				
		console.log('==================== : field infos')
		console.log('----------- : namespace fields')
		print(store.namespaces)
		
		console.log('----------- : interface fields')
		print(store.interfaces)
		
		console.log('----------- : class fields')
		print(store.classes)
		
		console.log('----------- : method fields')
		print(store.methods)
		
		console.log('----------- : property fields')
		print(store.properties)
		
		console.log('----------- : manifest fields')
		print(store.manifests)

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