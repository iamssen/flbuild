# debug

```js
var Flbuild = require('flbuild')
	, exec = require('done-exec')
	, fs = require('fs')
	, async = require('async')
	, yaml = require('js-yaml')
	, path = require('path')

var flbuild = new Flbuild()
flbuild.setEnv('FLEX_HOME')
flbuild.setEnv('PROJECT_HOME', '.')
flbuild.setEnv('PLAYER_VERSION', '11.1')
flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
flbuild.addLibraryDirectory('$PROJECT_HOME/libs/')
flbuild.addSourceDirectory('$PROJECT_HOME/src')

var build = flbuild.getApplicationCreator()
build.addArg('-keep-as3-metadata=Inject,PostConstruct')
build.addArg('-default-size 1600 900')
build.addArg('-warnings=false')
build.addArg('-compress=false')
build.addArg('-debug=true')
build.addArg('-optimize=false')
build.addArg('-static-link-runtime-shared-libraries=true')
build.addArg('-accessible=true')
build.addArg('-incremental=true')
build.addArg('-theme+=src/ChartsNoMergeBugFix.css')
build.build('$PROJECT_HOME/src/App.mxml', '$PROJECT_HOME/bin-debug/App.swf', function(err) {
	console.log('build complete')
})
```

# release

```js
var Flbuild = require('flbuild')
	, exec = require('done-exec')
	, fs = require('fs')
	, async = require('async')
	, yaml = require('js-yaml')
	, path = require('path')

var flbuild = new Flbuild()
flbuild.setEnv('FLEX_HOME')
flbuild.setEnv('PROJECT_HOME', '.')
flbuild.setEnv('PLAYER_VERSION', '11.1')
flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
flbuild.addLibraryDirectory('$PROJECT_HOME/libs/')
flbuild.addSourceDirectory('$PROJECT_HOME/src')

var build = flbuild.getApplicationCreator()
build.addArg('-keep-as3-metadata=Inject,PostConstruct')
build.addArg('-default-size 1600 900')
build.addArg('-warnings=false')
build.addArg('-compress=true')
build.addArg('-debug=false')
build.addArg('-optimize=true')
build.addArg('-static-link-runtime-shared-libraries=true')
build.addArg('-accessible=true')
// build.addArg('-incremental=true') 에러 난다
build.addArg('-theme+=src/ChartsNoMergeBugFix.css')
build.build('$PROJECT_HOME/src/App.mxml', '$PROJECT_HOME/bin-debug/App.swf', function(err) {
	console.log('build complete')
})
```