require('source-map-support').install()

$path = require('path')
$exec = require('child_process').exec
$fs = require('fs')

Flbuild = require('../libs/flbuild')

flbuild = new Flbuild
flbuild.setEnv('FLEX_HOME')
flbuild.setEnv('PROJECT_HOME', $path.join(__dirname, 'project'))
flbuild.setEnv('PLAYER_VERSION', 11.9)
flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
flbuild.addSourceDirectory('$PROJECT_HOME/src')

exec = (cmd, callback) ->
	exe = $exec(cmd)
	exe.stdout.on 'data', (data) ->
		console.log(data.toString('utf8'))
	exe.stderr.on 'data', (data) ->
		console.log(data.toString('utf8'))
	exe.on 'close', (code) ->
		callback(code)

describe 'compile', ->
	before ->
		# clean
		files = [
			flbuild.applyEnv('$PROJECT_HOME/lib.swc')
			flbuild.applyEnv('$PROJECT_HOME/app.swf')
			flbuild.applyEnv('$PROJECT_HOME/app.xml')
			flbuild.applyEnv('$PROJECT_HOME/modules/Module.swf')
		]
		
		directories = [
			flbuild.applyEnv('$PROJECT_HOME/modules')
		]
		
		for file in files
			if $fs.existsSync(file)
				$fs.unlinkSync(file)
				
		for directory in directories
			if $fs.existsSync(directory)
				$fs.rmdirSync(directory)
	
	it 'should exists FLEX_HOME environment variable', () ->
		flbuild.getEnv('FLEX_HOME').should.be.ok

	it 'should maked swc', (done) ->
		@timeout(0)
		fllib = flbuild.getLibraryCreator()
		fllib.setFilterFunction (file) -> file.class.indexOf('mailer.') is 0
		fllib.createBuildCommand '$PROJECT_HOME/lib.swc', (cmd) ->
			console.log('fllib :', cmd)
			if typeof(cmd) is 'string'
				exec cmd, (code) ->
					if code is 0
						if $fs.existsSync(flbuild.applyEnv('$PROJECT_HOME/lib.swc'))
							done()
						else
							done(new Error('not exists $PROJECT_HOME/lib.swc'))
					else
						done(new Error("compc process exit with #{code}"))
			else
				done(new Error("cmd isnt string : #{cmd}"))
				
	it 'should maked swf, xml', (done) ->
		@timeout(0)
		flapp = flbuild.getApplicationCreator()
		flapp.createBuildCommand '$PROJECT_HOME/src/App.mxml', '$PROJECT_HOME/app.swf', (cmd) ->
			console.log('flapp :', cmd)
			if typeof(cmd) is 'string'
				exec cmd, (code) ->
					if code is 0
						if $fs.existsSync(flbuild.applyEnv('$PROJECT_HOME/app.swf')) and $fs.existsSync(flbuild.applyEnv('$PROJECT_HOME/app.xml'))
							done()
						else
							done(new Error('not exists $PROJECT_HOME/app.swf, app.xml'))
					else
						done(new Error("mxmlc process exit with #{code}"))
			else
				done(new Error("cmd isnt string : #{cmd}"))
				
	it 'should maked module', (done) ->
		@timeout(0)
		flmodule = flbuild.getModuleCreator()
		flmodule.createBuildCommand '$PROJECT_HOME/app.xml', '$PROJECT_HOME/src/modules/Module.mxml', '$PROJECT_HOME/modules/Module.swf', (cmd) ->
			console.log('flmodule :', cmd)
			if typeof(cmd) is 'string'
				exec cmd, (code) ->
					if code is 0
						if $fs.existsSync(flbuild.applyEnv('$PROJECT_HOME/modules/Module.swf'))
							done()
						else
							done(new Error('not exists $PROJECT_HOME/modules/Module.swf'))
					else
						done(new Error("mxmlc process exit with #{code}"))
			else
				done(new Error("cmd isnt string : #{cmd}"))