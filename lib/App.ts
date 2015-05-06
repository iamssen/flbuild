///<reference path="./definition/libs.d.ts"/>

import $path = require('path')
import $fs = require('fs')

import Config = require('./Config')

class App extends Config {
	constructor(config:Config) {
		super(config)
	}

	public createBuildCommand(mxmlPath:string, swfPath:string, complete:(command:string) => void) {
		var bin:string = 'mxmlc'

		this.getSDKVersion(function (version:string) {
			this.createConfig(function (configXmlPath:string) {
				mxmlPath = Config.wrapPath(this.resolvePath(mxmlPath))
				swfPath = Config.wrapPath(this.resolvePath(swfPath))
				configXmlPath = Config.wrapPath(configXmlPath)

				var cmd:string[] = []
				var f:number
				var fmax:number

				// mxmlc
				if (Config.isWindow()) bin = Config.isVersionHigher(version, '4.6.0') ? 'mxmlc.bat' : 'mxmlc.exe'
				cmd.push(Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)))

				// mxml
				cmd.push(mxmlPath)

				// load-config local
				cmd.push(`-load-config+=${configXmlPath}`)

				// include args
				var args:string[] = this.getArgs()
				f = -1
				fmax = args.length
				while(++f < fmax) {
					cmd.push(this.applyEnv(args[f]))
				}

				// link-report
				cmd.push(`-link-report ${swfPath.replace('.swf', '.xml')}`)

				// size-report
				cmd.push(`-size-report ${swfPath.replace('.swf', '.size.xml')}`)

				// swf
				cmd.push(`-output ${swfPath}`)

				complete(cmd.join(' '))
			}.bind(this))
		}.bind(this))
	}
}

export = App