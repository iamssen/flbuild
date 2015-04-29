///<reference path="./definition/libs.d.ts"/>

import $path = require('path')
import $fs = require('fs')

import Config = require('./Config')

class Module extends Config {
	constructor(config:Config) {
		super(config)
	}

	public createBuildCommand(appReportPath:string, mxmlPath:string, swfPath:string, complete:(command:string) => void) {
		var bin:string = 'mxmlc'

		this.getSDKVersion(function (version:string) {
			this.createConfig(function (xml:string) {
				var args:string[] = []

				// mxmlc
				if (Config.isWindow()) bin = Config.isVersionHigher(version, '4.6.0') ? 'mxmlc.bat' : 'mxmlc.exe'
				args.push(Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)))

				// mxml
				args.push(Config.wrapPath(this.resolvePath(mxmlPath)))

				// load-config local
				args.push(`-load-config+=${Config.wrapPath(xml)}`)

				// merge args
				this.getArgs().forEach(function (arg:string) {
					args.push(this.applyEnv(arg))
				}.bind(this))

				swfPath = Config.wrapPath(this.resolvePath(swfPath))

				// link-report
				args.push(`-link-report ${swfPath.replace('.swf', '.xml')}`)

				// size-report
				args.push(`-size-report ${swfPath.replace('.swf', '.size.xml')}`)

				// swf
				args.push(`-output ${swfPath}`)

				// report
				if (appReportPath) {
					appReportPath = Config.wrapPath(this.resolvePath(appReportPath))
					args.push(`-load-externs ${appReportPath}`)
				}

				complete(args.join(' '))
			}.bind(this))
		}.bind(this))
	}
}

export = Module