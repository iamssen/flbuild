///<reference path="./definition/libs.d.ts"/>

import picker = require('file-picker')
import yaml = require('js-yaml')
import xml2js = require('xml2js')

import $path = require('path')
import $fs = require('fs')

import {Config} from './Config'

export class Lib extends Config {
	//----------------------------------------------------------------
	// constructor
	//----------------------------------------------------------------
	constructor(config:Config) {
		super(config)
	}

	//----------------------------------------------------------------
	// settings
	//----------------------------------------------------------------
	public filterFunction:(asclass:ASClass)=>boolean

	//----------------------------------------------------------------
	// util functions
	//----------------------------------------------------------------
	private getManifest(classPaths:string[], callback:(namespaces:{[namespace:string]:Component[]}) => void) {
		var sourceDirectories:string[] = this.getSourcePaths()

		// get local manifests
		picker.pick(sourceDirectories, ['.yaml'], function (files:picker.File[]) {
			var namespaces:{[namespace:string]:Component[]} = {}

			var f:number = -1
			var fmax:number = files.length
			var s:number
			var smax:number

			while (++f < fmax) {
				var file:picker.File = files[f]

				if (file.name !== 'namespace') continue

				var namespaceYaml:NamespaceYaml = yaml.safeLoad($fs.readFileSync(file.realpath, 'utf8'))
				var base_namespace:string = file.relative_base.split('/').join('.')

				s = -1
				smax = namespaceYaml.components.length

				while (++s < smax) {
					var component:string = namespaceYaml.components[s]
					var component_path:string = `${base_namespace}.${component}`

					if (classPaths.indexOf(component_path) > -1) {
						if (component_path.indexOf('.') === 0) component_path = component_path.substring(1)
						if (!namespaces[namespaceYaml.namespace]) namespaces[namespaceYaml.namespace] = []

						namespaces[namespaceYaml.namespace].push({
							name: component,
							path: component_path
						})
					}
				}
			}

			callback(namespaces)
		}.bind(this))
	}

	private getIncludeClasses(callback:(classPaths:string[])=>void) {
		var sourceDirectories:string[] = this.getSourcePaths()

		picker.pick(sourceDirectories, ['.as', '.mxml'], function (files:picker.File[]) {
			var classPaths:string[] = []

			var f:number = -1
			var fmax:number = files.length
			var file:picker.File
			while (++f < fmax) {
				file = files[f]

				var asclass:ASClass = <ASClass>file
				asclass.classpath = Config.classfy(file)

				if (!this.filterFunction || this.filterFunction(asclass)) {
					classPaths.push(asclass.classpath)
				}
			}

			callback(classPaths)
		}.bind(this))
	}

	private static createManifest(components:Component[], namespace:string):string {
		namespace = namespace.replace(/^[a-zA-Z]+:\/\//g, '')
		namespace = namespace.replace(/\//g, '.')

		var manifest:Object = {componentPackage: {component: []}}

		var f:number = -1
		var fmax:number = components.length
		var component:Component
		while (++f < fmax) {
			component = components[f]
			manifest['componentPackage']['component'].push({
				'$': {
					'id': component.name,
					'class': component.path
				}
			})
		}

		var xml:string = new xml2js.Builder({attrkey: '$'}).buildObject(manifest)

		var cacheDirectory:string = $path.resolve('.flbuild-cache')
		if (!$fs.existsSync(cacheDirectory)) $fs.mkdirSync(cacheDirectory)

		var xmlFile:string = $path.join(cacheDirectory, `manifest-${Config.getTime()}-${namespace}.xml`)

		$fs.writeFileSync(xmlFile, xml, {encoding: 'utf8'})

		return xmlFile
	}

	protected getConfig(complete:(config:Object)=>void) {
		var f:number
		var fmax:number

		//---------------------------------------------
		// 1 : Get parent config
		//---------------------------------------------
		super.getConfig(function (config:Object) {
			//---------------------------------------------
			// 2 : Get include classes
			//---------------------------------------------
			this.getIncludeClasses(function (classPaths:string[]) {
				if (!config['flex-config']) config['flex-config'] = {}
				if (!config['flex-config']['include-classes']) config['flex-config']['include-classes'] = {}
				if (!config['flex-config']['include-classes']['class']) config['flex-config']['include-classes']['class'] = []

				// 2-1 : Set include classes to result config
				f = -1
				fmax = classPaths.length
				while (++f < fmax) {
					// flex-config.include-classes.class[]
					config['flex-config']['include-classes']['class'].push(classPaths[f])
				}

				//---------------------------------------------
				// 3 : Get manifest files
				//---------------------------------------------
				this.getManifest(classPaths, function (namespaces:{[namespace:string]:Component[]}) {
					if (!config['flex-config']) config['flex-config'] = {}
					if (!config['flex-config']['compiler']) config['flex-config']['compiler'] = {}

					// 3-1 : Set manifest info to result config
					for (var namespace in namespaces) {
						if (namespaces.hasOwnProperty(namespace)) {
							var components:Component[] = namespaces[namespace]
							var manifest:string = Lib.createManifest(components, namespace)

							// flex-config.compiler.namespaces.namespace[] = {uri, manifest}
							if (!config['flex-config']['compiler']['namespaces']) config['flex-config']['compiler']['namespaces'] = {namespace: []}
							config['flex-config']['compiler']['namespaces']['namespace'].push({
								uri: namespace,
								manifest: manifest
							})

							// flex-config.include-namespaces.uri[]
							if (!config['flex-config']['include-namespaces']) config['flex-config']['include-namespaces'] = {uri: []}
							config['flex-config']['include-namespaces']['uri'].push(namespace)
						}
					}

					//---------------------------------------------
					// 4 : Get flex-config.xml manifest files
					//---------------------------------------------
					var flexConfig:string = this.getConfigXml()
					var frameworks:string = $path.dirname(flexConfig)
					var xmlstr:string = $fs.readFileSync(flexConfig, {encoding: 'utf8'})

					// 4-1 : Parse flex-config.xml
					xml2js.parseString(xmlstr, function (err:Error, result:Object) {
						var compiler:any = result['flex-config']['compiler'][0]
						var nss:any[] = result['flex-config']['compiler'][0]['namespaces'][0]['namespace']
						var ns:any

						// 4-2 : Set flex-config.xml manifest to result config
						f = -1
						fmax = nss.length
						while (++f < fmax) {
							ns = nss[f]
							//console.log('Lib.ts..()', ns)

							var uri:string = ns.uri[0]
							var manifest:string = ns.manifest[0]
							if (!$fs.existsSync(manifest)) manifest = $path.join(frameworks, manifest)

							// flex-config.compiler.namespaces.namespace[] = {uri, manifest}
							if (!config['flex-config']['compiler']['namespaces']) config['flex-config']['compiler']['namespaces'] = {namespace: []}
							config['flex-config']['compiler']['namespaces']['namespace'].push({
								uri: uri,
								manifest: manifest
							})

							// flex-config.include-namespaces.uri[]
							//if (!config['flex-config']['include-namespaces']) config['flex-config']['include-namespaces'] = {uri: []}
							//config['flex-config']['include-namespaces']['uri'].push(uri)
						}
					})

					//---------------------------------------------
					// 5 : complete
					//---------------------------------------------
					complete(config)
				}.bind(this))
			}.bind(this))
		}.bind(this))
	}

	public createBuildCommand(swcPath:string, complete:(command:string) => void) {
		var bin:string = 'compc'

		this.getSDKVersion(function (version:string) {
			this.createConfig(function (configXmlPath:string) {
				console.log('Lib.ts..() case 2')
				swcPath = Config.wrapPath(this.resolvePath(swcPath))
				configXmlPath = Config.wrapPath(configXmlPath)

				var cmd:string[] = []
				var f:number
				var fmax:number

				// mxmlc
				if (Config.isWindow()) bin = Config.isVersionHigher(version, '4.6.0') ? 'compc.bat' : 'compc.exe'
				cmd.push(Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)))

				// load-config local
				cmd.push(`-load-config+=${configXmlPath}`)

				// include args
				var args:string[] = this.getArgs()
				f = -1
				fmax = args.length
				while (++f < fmax) {
					cmd.push(this.applyEnv(args[f]))
				}

				// swc
				cmd.push(`-output ${swcPath}`)

				complete(cmd.join(' '))
			}.bind(this))
		}.bind(this))
	}
}