require('source-map-support')

import Config = require('../src/Config')
import App = require('../src/App')
import Lib = require('../src/Lib')

import exec = require('done-exec')
import path = require('path')

var config:Config = new Config
config.setEnv('FLEX_HOME')
config.setEnv('PROJECT_HOME', path.join(__dirname, 'project'))
config.setEnv('WWW_HOME', path.join(__dirname, 'bin-debug'))
config.setEnv('PLAYER_VERSION', '16.0')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
config.addLibraryDirectory('$PROJECT_HOME/libs/')
config.addSourceDirectory('$PROJECT_HOME/src')

//var app:App = new App(config)
//app.addLibraryDirectory('$FLEX_HOME/frameworks/libs/')
//app.addLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
//app.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
//app.addArg('-debug=true')
//app.addArg('-compress=false')
//app.addArg('-optimize=false')
//app.createBuildCommand('$PROJECT_HOME/src/App.mxml', '$WWW_HOME/App.swf', function (cmd) {
//	console.log('app =>', cmd)
//})

var lib:Lib = new Lib(config)
lib.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/')
lib.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
lib.addExternalLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
lib.filterFunction = function (asclass:ASClass):boolean {
	return asclass.classpath.indexOf('mailer.') > -1
}
lib.createBuildCommand('$WWW_HOME/lib.swc', function (cmd) {
	console.log('lib =>', cmd)
	exec(cmd).run(function () {
		console.log('<= lib')
	})
})
