///<reference path="./definition/libs.d.ts"/>

import * as picker from 'file-picker'
import * as $path from 'path'
import * as $fs from 'fs'
import * as xml2js from 'xml2js'
import * as moment from 'moment'

export class Config {
	private systemEnvironments:{[name:string]:string}
	private libraryDirectories:string[]
	private externalLibraryDirectories:string[]
	private sourceDirectories:string[]
	private args:string[]
	private sdkDescription:string
	private configXml:string

	constructor(private parent?:Config) {
		this.systemEnvironments = {}
		this.libraryDirectories = []
		this.externalLibraryDirectories = []
		this.sourceDirectories = []
		this.args = []
	}

	//----------------------------------------------------------------
	// Config xml
	//----------------------------------------------------------------
	public setConfigXml(path:string) {
		this.configXml = path
	}

	public getConfigXml():string {
		if (this.configXml) {
			return this.resolvePath(this.configXml)
		} else if (this.parent) {
			return this.parent.getConfigXml()
		} else {
			return $path.join(this.getEnv('FLEX_HOME'), 'frameworks', 'flex-config.xml')
		}
	}

	//----------------------------------------------------------------
	// Path and args
	//----------------------------------------------------------------
	//---------------------------------------------
	// setters
	//---------------------------------------------
	public addLibraryDirectory(path:string) {
		this.libraryDirectories.push(path)
	}

	public addExternalLibraryDirectory(path:string) {
		this.externalLibraryDirectories.push(path)
	}

	public addSourceDirectory(path:string) {
		this.sourceDirectories.push(path)
	}

	public addArg(arg:string) {
		this.args.push(arg)
	}

	//---------------------------------------------
	// getters
	//---------------------------------------------
	public getLibraryDirectories():string[] {
		var directories:string[] = this.libraryDirectories.slice(0)
		if (this.parent) directories = directories.concat(this.parent.getLibraryDirectories())
		return directories
	}

	public getExternalLibraryDirectories():string[] {
		var directories:string[] = this.externalLibraryDirectories.slice(0)
		if (this.parent) directories = directories.concat(this.parent.getExternalLibraryDirectories())
		return directories
	}

	public getSourceDirectories():string[] {
		var directories:string[] = this.sourceDirectories.slice(0)
		if (this.parent) directories = directories.concat(this.parent.getSourceDirectories())
		return directories
	}

	public getArgs():string[] {
		var args:string[] = this.args.slice(0)
		if (this.parent) args = args.concat(this.parent.getArgs())
		return args
	}

	//----------------------------------------------------------------
	// export
	//----------------------------------------------------------------
	private getLibraries():string[] {
		var directories:string[] = this.resolvePaths(this.getLibraryDirectories())
		var libraries:string[] = []

		if (directories && directories.length > 0) {
			var f:number = -1;
			var fmax:number = directories.length;
			while (++f < fmax) {
				libraries = libraries.concat(Config.getSwcListFromDirectory(directories[f]))
			}
		}

		return libraries
	}

	private getExternalLibraries():string[] {
		var directories:string[] = this.resolvePaths(this.getExternalLibraryDirectories())
		var libraries:string[] = []

		if (directories && directories.length > 0) {
			var f:number = -1;
			var fmax:number = directories.length;
			while (++f < fmax) {
				libraries = libraries.concat(Config.getSwcListFromDirectory(directories[f]))
			}
		}

		return libraries
	}

	protected getSourcePaths():string[] {
		return this.resolvePaths(this.getSourceDirectories())
	}

	//----------------------------------------------------------------
	// environment variables control
	//----------------------------------------------------------------
	public getEnv(name:string):string {
		if (this.systemEnvironments[name] !== undefined) {
			return this.systemEnvironments[name]
		} else if (this.parent) {
			return this.parent.getEnv(name)
		}
		return undefined
	}

	public setEnv(name:string, value?:string) {
		if (!value) value = process.env[name]
		this.systemEnvironments[name] = value
	}

	protected applyEnv(str:string):string {
		for (var name in this.systemEnvironments) {
			if (this.systemEnvironments.hasOwnProperty(name)) {
				var value:any = this.systemEnvironments[name]
				var reg:RegExp = new RegExp('\\$' + name, 'g')
				str = str.replace(reg, value)
			}
		}

		if (this.parent) str = this.parent.applyEnv(str)

		return str
	}

	protected getSDKVersion(done:(string)=>void) {
		if (!this.sdkDescription) {
			var sdkDescription:string = $path.join(this.getEnv('FLEX_HOME'), 'flex-sdk-description.xml')
			var xmlstr:string = $fs.readFileSync(sdkDescription, {encoding: 'utf8'})
			xml2js.parseString(xmlstr, function (err:Error, result:Object) {
				this.sdkDescription = result['flex-sdk-description']
				done(this.sdkDescription['version'][0])
			}.bind(this))
		} else {
			done(this.sdkDescription['version'][0])
		}
	}

	public static isVersionHigher(version1:string, version2:string) {
		var v1:string[] = version1.split('.')
		var v2:string[] = version2.split('.')

		return Number(v1[0]) > Number(v2[0]) || Number(v1[1]) > Number(v2[1]) || Number(v1[2]) > Number(v1[2])
	}

	//----------------------------------------------------------------
	// resolve path control : dependent environment variables control
	//----------------------------------------------------------------
	/**
	 * Convert env strings and relative file path to absolute file path
	 * @param path File path
	 * @returns {string} Converted file path
	 */
	protected resolvePath(path:string):string {
		path = this.applyEnv(path)
		return $path.resolve(path)
	}

	/** resolvePath() */
	protected resolvePaths(paths:string[]):string[] {
		var newPaths:string[] = []
		var f:number = -1
		var fmax:number = paths.length
		while (++f < fmax) {
			newPaths.push(this.resolvePath(paths[f]))
		}
		return newPaths
	}

	//----------------------------------------------------------------
	// utils
	//----------------------------------------------------------------
	public static isWindow():boolean {
		return process.platform.indexOf('win') === 0
	}

	/** Convert `path` to `"path"` for execute safty in command line */
	public static wrapPath(path:string):string {
		path = Config.fixPath(path)
		path = `"${path}"`
		return path
	}

	/** Convert directory string `/` to `\\` if os is windows */
	public static fixPath(path:string):string {
		return Config.isWindow() ? path.replace(/\//g, "\\") : path
	}

	public static getSwcListFromDirectory(path:string):string[] {
		var swcs:string[] = []

		if ($fs.existsSync(path)) {
			var files:string[] = $fs.readdirSync(path)
			var file:string;

			var f:number = -1
			var fmax:number = files.length
			while (++f < fmax) {
				file = files[f];
				if (file.lastIndexOf('.swc') > -1) {
					swcs.push($path.join(path, file))
				}
			}
		}

		return swcs
	}

	public static getTime():string {
		return moment().format('YYYY.MM.DD.HH.mm.ss')
	}

	/** Create class path `name.space.Class` from `name/space/Class.as` */
	public static classfy(file:picker.File):string {
		var classpath:string = file.relative_base.split('/').join('.') + '.' + file.name
		if (classpath.charAt(0) === '.') classpath = classpath.substr(1)
		return classpath
	}

	//----------------------------------------------------------------
	// export
	//----------------------------------------------------------------
	private static addPaths(compiler:Object, category:string, paths:string[]) {
		if (paths.length > 0) {
			if (!compiler[category]) compiler[category] = {}
			if (!compiler[category]['path-element']) compiler[category]['path-element'] = []

			var f:number = -1
			var fmax:number = paths.length
			while (++f < fmax) {
				compiler[category]['path-element'].push(Config.fixPath(paths[f]))
			}
		}
	}

	protected getConfig(complete:(config:Object)=>void) {
		var config:Object = {}

		if (!config['flex-config']) config['flex-config'] = {}
		if (!config['flex-config']['compiler']) config['flex-config']['compiler'] = {}

		Config.addPaths(config['flex-config']['compiler'], 'library-path', this.getLibraries())
		Config.addPaths(config['flex-config']['compiler'], 'external-library-path', this.getExternalLibraries())
		Config.addPaths(config['flex-config']['compiler'], 'source-path', this.getSourcePaths())

		complete(config)
	}

	public createConfig(complete:(xmlFile:string)=>void) {
		this.getConfig(function (config:Object) {
			var xml:string = new xml2js.Builder().buildObject(config)
			//console.log('Config.ts..createConfig()', xml)
			//console.log('Config.ts..createConfig()', JSON.stringify(config))
			var cacheDirectory:string = $path.resolve('.flbuild-cache')
			if (!$fs.existsSync(cacheDirectory)) $fs.mkdirSync(cacheDirectory)

			var xmlFile:string = $path.join(cacheDirectory, `config-${Config.getTime()}.xml`)

			$fs.writeFileSync(xmlFile, xml, {encoding: 'utf8'})

			complete(xmlFile)
		}.bind(this))
	}
}