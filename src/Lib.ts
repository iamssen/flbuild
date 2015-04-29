///<reference path="./definition/libs.d.ts"/>

import picker = require('file-picker')
import yaml = require('js-yaml')
import xml2js = require('xml2js')

import $path = require('path')
import $fs = require('fs')

import Config = require('./Config')

class Lib extends Config {
	constructor(config:Config) {
		super(config)
	}

	public filterFunction:(asclass:ASClass)=>boolean

	private getManifest(classPaths:string[], callback:(namespaces:{[namespace:string]:Component[]}) => void) {
		var sourceDirectories:string[] = this.getSourcePaths()

		picker.pick(sourceDirectories, ['.yaml'], function (files:picker.File[]) {
			var namespaces:{[namespace:string]:Component[]} = {}

			files.forEach(function (file:picker.File) {
				if (file.name !== 'namespace') return

				var namespaceYaml:NamespaceYaml = yaml.safeLoad($fs.readFileSync(file.realpath, 'utf8'))
				var base_namespace:string = file.relative_base.split('/').join('.')

				namespaceYaml.components.forEach(function (component:string) {
					var component_path:string = `${base_namespace}.${component}`

					if (classPaths.indexOf(component_path) > -1) {
						if (component_path.indexOf('.') === 0) component_path = component_path.substring(1)
						if (!namespaces[namespaceYaml.namespace]) namespaces[namespaceYaml.namespace] = []

						namespaces[namespaceYaml.namespace].push({
							name: component,
							path: component_path
						})
					}
				})
			}.bind(this))

			callback(namespaces)
		}.bind(this))
	}

	private getIncludeClasses(callback:(classPaths:string[])=>void) {
		var sourceDirectories:string[] = this.getSourcePaths()

		picker.pick(sourceDirectories, ['.as', '.mxml'], function (files:picker.File[]) {
			var classPaths:string[] = []

			files.forEach(function (file:picker.File) {
				var asclass:ASClass = <ASClass>file
				asclass.classpath = Config.classfy(file)

				if (this.filterFunction === null || this.filterFunction(asclass)) {
					classPaths.push(asclass.classpath)
				}
			}.bind(this))

			callback(classPaths)
		}.bind(this))
	}

	private createManifest(components:Component[]):string {
		var manifest:Object = {componentPackage: {component: []}}

		components.forEach(function (component:Component) {
			manifest['componentPackage']['component'].push({
				'$': {
					'id': component.name,
					'class': component.path
				}
			})
		})

		var xml:string = new xml2js.Builder({attrkey: '$'}).buildObject(manifest)

		var cacheDirectory:string = $path.resolve('.flbuild-cache')
		if (!$fs.existsSync(cacheDirectory)) $fs.mkdirSync(cacheDirectory)

		var xmlFile:string = $path.join(cacheDirectory, `manifest-${(Math.random() * 1000000)}.xml`)

		console.log('Lib.ts..createManifest()', xml)

		$fs.writeFileSync(xmlFile, xml, {encoding: 'utf8'})

		return xmlFile
	}

	protected getConfig(complete:(config:Object)=>void) {
		super.getConfig(function (config:Object) {
			this.getIncludeClasses(function (classPaths:string[]) {
				// TODO 여기...
				if (!config['flex-config']) config['flex-config'] = {}
				if (!config['flex-config']['include-classes']) config['flex-config']['include-classes'] = {}
				if (!config['flex-config']['include-classes']['class']) config['flex-config']['include-classes']['class'] = []
				classPaths.forEach(function (classPath:string) {
					config['flex-config']['include-classes']['class'].push(classPath)
				})
				// flex-config.include-classes
				//      class[]
				this.getManifest(classPaths, function (namespaces:{[namespace:string]:Component[]}) {
					// TODO 여기...
					if (!config['flex-config']) config['flex-config'] = {}
					if (!config['flex-config']['compiler']) config['flex-config']['compiler'] = {}

					for (var namespace:string in namespaces) {
						if (namespaces.hasOwnProperty(namespace)) {
							var components:Component[] = namespaces[namespace]
							var manifest:string = this.createManifest(components)

							if (!config['flex-config']['compiler']['namespaces']) config['flex-config']['compiler']['namespaces'] = {namespace: []}
							config['flex-config']['compiler']['namespaces']['namespace'].push({
								uri: namespace,
								manifest: manifest
							})

							if (!config['flex-config']['include-namespaces']) config['flex-config']['include-namespaces'] = {uri: []}
							config['flex-config']['include-namespaces']['uri'].push(namespace)
						}
					}
					// flex-config.compiler.namespaces
					//     namespace[]
					//          uri
					//          manifest
					// flex-config.include-namespaces
					//     uri[]
					complete(config)
				}.bind(this))
			}.bind(this))
		}.bind(this))
	}

	public createBuildCommand(swcPath:string, complete:(command:string) => void) {
		var bin:string = 'compc'

		this.getSDKVersion(function (version:string) {
			this.createConfig(function (xml:string) {
				var args:string[] = []

				// mxmlc
				if (Config.isWindow()) bin = Config.isVersionHigher(version, '4.6.0') ? 'compc.bat' : 'compc.exe'
				args.push(Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)))

				// mxml
				//args.push(Config.wrapPath(this.resolvePath(mxmlPath)))

				// load-config local
				args.push(`-load-config+=${Config.wrapPath(xml)}`)

				// merge args
				this.getArgs().forEach(function (arg:string) {
					args.push(this.applyEnv(arg))
				}.bind(this))

				swcPath = Config.wrapPath(this.resolvePath(swcPath))

				//// link-report
				//args.push(`-link-report ${swfPath.replace('.swf', '.xml')}`)
				//
				//// size-report
				//args.push(`-size-report ${swfPath.replace('.swf', '.size.xml')}`)

				// swf
				args.push(`-output ${swcPath}`)

				complete(args.join(' '))
			}.bind(this))
		}.bind(this))
	}
}

export = Lib