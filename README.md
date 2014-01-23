# Flash / Flex Build Support
[![Build Status](https://travis-ci.org/iamssen/flbuild.png)](https://travis-ci.org/iamssen/flbuild)
[![Dependency Status](https://gemnasium.com/iamssen/flbuild.png)](https://gemnasium.com/iamssen/flbuild)

# Install

	$ npm install flbuild

# API

- `class Flbuild`
	- Path
		- `void addLibraryDirectory(string path)` Include swc library classes into your swf or swc file
			- example : `flbuild.addLibraryDirectory('/Users/you/project/libs')`
		- `void addExternalLibraryDirectory(string path)` Exclude swc library classes into your swf or swc file
			- example : `flbuild.addExternalLibraryDirectory('/Users/you/project/libs')`
		- `void addSourceDirectory(string path)` Source directory (src)
			- example : `fibuild.addSourceDirectory('/Users/you/project/src')`
	- Compiler auguments
		- `void addArg(string arg)` Additional argument for mxmlc, compc
			- example : `flbuild.addArg('-keep-generated-actionscript=true')`
	- Environment variables
		- `void setEnv(string name, [string value])`
			- example : `flbuild.setEnv('FLEX_HOME', '/usr/lib/flex-sdk-4.11.0')`
			- example : `flbuild.setEnv('FLEX_HOME')` Read from system environment variable `FLEX_HOME`
	- Creator
		- `Fllib getLibraryCreator()`
		- `Flapp getApplicationCreator()`
		- `Flmodule getModuleCreator()`
- `class Fllib`
	- Path
		- `void addLibraryDirectory(string path)`
		- `void addExternalLibraryDirectory(string path)`
		- `void addSourceDirectory(string path)`
	- Compiler auguments
		- `void addArg(string arg)`
	- Filter
		- `void setFilterFunction(Funciton func)`
			- example : `fllib.setFilterFunction(function(file){return file.class.indexOf('com.adobe') === 0;})`
			- param func : `boolean function(object file)`
				- param file
					- `int atime` => `1390478490000`
					- `int ctime` => `1390391922000`
					- `int mtime` => `1390391755000`
					- `path` => `/Users/you/project/src/mailer/models/Email.as`
					- `string base` => `/Users/you/project/src/mailer/models`
					- `relative_path` => `mailer/models/Email.as`
					- `relative_base` => `mailer/models`
					- `realpath` => `/Users/you/project/src/mailer/models/Email.as`
					- `extension` => `.as`
					- `string name` => `Email`
					- `class` => `mailer.models.Email`
	- Create build command
		- `void createBuildCommand(string output, function complete)`
			- example : `fllib.createBuildCommand('/Users/you/project/bin/lib.swc', function(cmd){console.log(cmd);})`
				- Execute this command then make lib.swc file
- `class Flapp`
	- Path
		- `void addLibraryDirectory(string path)`
		- `void addExternalLibraryDirectory(string path)`
		- `void addSourceDirectory(string path)`
	- Compiler auguments
		- `void addArg(string arg)`
	- Create build command
		- `void createBuildCommand(string source, string output, function complete)`
			- example : `flapp.createBuildCommand('/Users/you/project/src/App.mxml', '/Users/you/project/bin/app.swf', function(cmd){console.log(cmd);})`
				- Execute this resulted command(cmd) then make `app.swf` and `app.xml` file
- `class Flmodule`
	- Path
		- `void addLibraryDirectory(string path)`
		- `void addExternalLibraryDirectory(string path)`
		- `void addSourceDirectory(string path)`
	- Compiler auguments
		- `void addArg(string arg)`
	- Create build command
		- `void createBuildCommand(string report, string source, string output, function complete)`
			- example : `flapp.createBuildCommand('/Users/you/project/bin/app.xml', '/Users/you/project/src/modules/Module.mxml', '/Users/you/project/bin/modules/module.swf', function(cmd){console.log(cmd);})`
				- Execute this resulted command(cmd) then make `module.swf`
			- example : `flapp.createBuildCommand(null, '/Users/you/project/src/modules/Module.mxml', '/Users/you/project/bin/modules/module.swf', function(cmd){console.log(cmd);})`

# Example : Create swc library

### makeLibrary.js

	var Flbuild = require('flbuild');

	var flbuild = new Flbuild();
	flbuild.setEnv('FLEX_HOME');
	flbuild.setEnv('PROJECT_HOME', 'test/project');
	flbuild.setEnv('PLAYER_VERSION', 11.9);
	flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION');
	flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/');
	flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/');
	flbuild.addSourceDirectory('$PROJECT_HOME/src');

	var fllib = flbuild.getLibraryCreator();
	fllib.setFilterFunction(function(file) {
		return file.class.indexOf('mailer.') === 0;
	)};
	fllib.createBuildCommand('$PROJECT_HOME/lib.swc', function(cmd) {
		console.log('fllib ---------------------------------------------------------------');
		console.log(cmd);
	});

### use makeLibrary.js

	$ node makeLibrary
	fllib ---------------------------------------------------------------
	'/usr/lib/flex-sdk-4.11.0/bin/compc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/advancedgrids.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/apache.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/authoringsupport.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/charts.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/core.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/experimental.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/experimental_mobile.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/flash-integration.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/framework.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/osmf.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/rpc.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/spark.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/spark_dmv.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/sparkskins.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/textLayout.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/advancedgrids_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/airframework_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/airspark_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/apache_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/automation_agent_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/automation_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/charts_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/experimental_mobile_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/experimental_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/flash-integration_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/framework_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/mobilecomponents_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/mx_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/playerglobal_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/rpc_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/spark_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/textLayout_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/tool_air_rb.swc' -external-library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/player/11.9/playerglobal.swc' -source-path '/Users/you/project/src' -include-classes mailer.models.Email mailer.views.EmailForm mailer.views.EmailFormEvent mailer.views.EmailRenderer -locale en_US -output '/Users/you/project/lib.swc'

Copy this command and paste, execute then make lib.swc



# Example : Create app.swf, app.xml and module.swf

### makeApp.js

	var Flbuild = require('flbuild');

	var flbuild = new Flbuild();
	flbuild.setEnv('FLEX_HOME');
	flbuild.setEnv('PROJECT_HOME', 'test/project');
	flbuild.setEnv('PLAYER_VERSION', 11.9);
	flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION');
	flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/');
	flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/');
	flbuild.addSourceDirectory('$PROJECT_HOME/src');

	var flapp = flbuild.getApplicationCreator();
	flapp.createBuildCommand('$PROJECT_HOME/src/App.mxml', '$PROJECT_HOME/app.swf', function(cmd) {
		console.log('flapp ---------------------------------------------------------------');
		console.log(cmd);
	});

	var flmodule = flbuild.getModuleCreator();
	flmodule.createBuildCommand('$PROJECT_HOME/app.xml', 
								'$PROJECT_HOME/src/modules/Module.mxml', 
								'$PROJECT_HOME/modules/Module.swf', 
								function(cmd) {
		console.log('flmodule ------------------------------------------------------------');
		console.log(cmd);
	});

### use makeApp.js

	flapp ---------------------------------------------------------------
	'/usr/lib/flex-sdk-4.11.0/bin/mxmlc' '/Users/you/project/src/App.mxml' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/advancedgrids.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/apache.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/authoringsupport.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/charts.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/core.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/experimental.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/experimental_mobile.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/flash-integration.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/framework.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/osmf.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/rpc.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/spark.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/spark_dmv.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/sparkskins.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/textLayout.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/advancedgrids_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/airframework_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/airspark_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/apache_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/automation_agent_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/automation_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/charts_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/experimental_mobile_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/experimental_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/flash-integration_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/framework_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/mobilecomponents_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/mx_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/playerglobal_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/rpc_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/spark_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/textLayout_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/tool_air_rb.swc' -external-library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/player/11.9/playerglobal.swc' -source-path '/Users/you/project/src' -locale en_US -link-report '/Users/you/project/app.xml' -output '/Users/you/project/app.swf'
	flmodule ------------------------------------------------------------
	'/usr/lib/flex-sdk-4.11.0/bin/mxmlc' '/Users/you/project/src/modules/Module.mxml' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/advancedgrids.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/apache.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/authoringsupport.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/charts.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/core.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/experimental.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/experimental_mobile.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/flash-integration.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/framework.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/osmf.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/rpc.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/spark.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/spark_dmv.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/sparkskins.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/textLayout.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/advancedgrids_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/airframework_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/airspark_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/apache_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/automation_agent_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/automation_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/charts_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/experimental_mobile_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/experimental_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/flash-integration_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/framework_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/mobilecomponents_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/mx_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/playerglobal_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/rpc_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/spark_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/textLayout_rb.swc' -library-path '/usr/lib/flex-sdk-4.11.0/frameworks/locale/en_US/tool_air_rb.swc' -external-library-path '/usr/lib/flex-sdk-4.11.0/frameworks/libs/player/11.9/playerglobal.swc' -source-path '/Users/you/project/src' -locale en_US -output '/Users/you/project/modules/Module.swf' -load-externs '/Users/you/project/app.xml'



# Tip : Execute command on your script

	var $exec = require('child_process').exec;

	function exec(cmd, callback) {
		var exe = $exec(cmd);
		exe.stdout.on('data', function(data) {
			console.log(data.toString('utf8'));
		});
		exe.stderr.on('data', function(data) {
			console.log(data.toString('utf8'));
		});
		exe.on('close', function(code) {
			callback(code);
		});
	}

	var Flbuild = require('flbuild');

	var flbuild = new Flbuild();
	flbuild.setEnv('FLEX_HOME');
	flbuild.setEnv('PROJECT_HOME', 'test/project');
	flbuild.setEnv('PLAYER_VERSION', 11.9);
	flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION');
	flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/');
	flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/');
	flbuild.addSourceDirectory('$PROJECT_HOME/src');

	var fllib = flbuild.getLibraryCreator();
	fllib.setFilterFunction(function(file) {
		return file.class.indexOf('mailer.') === 0;
	)};
	fllib.createBuildCommand('$PROJECT_HOME/lib.swc', function(cmd) {
		console.log('fllib ---------------------------------------------------------------');
		exec(cmd);
	});

Execute this code direct create lib.swc