# Flash / Flex Build Support

[![Build Status](https://travis-ci.org/iamssen/flbuild.png)](https://travis-ci.org/iamssen/flbuild) [![Dependency Status](https://gemnasium.com/iamssen/flbuild.png)](https://gemnasium.com/iamssen/flbuild)

# Install

```sh
$ npm install flbuild --save-dev
```

# Create swc library

```js
var fl = require('flbuild')
var exec = require('done-exec')

var config = new fl.Config()
config.setEnv('FLEX_HOME')
config.setEnv('PROJECT_HOME', '/project/home')
config.setEnv('PLAYER_VERSION', '11.9')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
config.addLibraryDirectory('$PROJECT_HOME/libs/')
config.addSourceDirectory('$PROJECT_HOME/src')

var lib = new fl.Lib(config)
// If you want filter your classes for import to swc.
// you can do it with using `fl.Lib.filterFunction`
lib.filterFunction = function (asclass) {
    return asclass.classpath.indexOf('mailer.') > -1
}

lib.createBuildCommand('$PROJECT_HOME/bin/lib.swc', function (cmd) {
    console.log('lib =>', cmd)
    exec(cmd).run(function () {
        console.log('<= lib')
    })
})
```

## Write `namespace.yaml`

If you want set custom namespace for your component classes. (like `xmlns:mx` or `xmlns:s`)

You can do it with writing `namespace.yaml`

- src
	- com
		- yourdomain
			- ComponentClass1
			- ComponentClass2
			- ComponentClass3
			- namespace.yaml

Create `namespace.yaml` file in your namespace directory like that.

```yaml
namespace: "http://yourdomain.com/somens"
components:
- ComponentClass1
- ComponentClass2
- ComponentClass3
```

And write namespace and components names.

```xml
<?xml version="1.0"?>
<s:Group xmlns:fx="http://ns.adobe.com/mxml/2009"
         xmlns:s="library://ns.adobe.com/flex/spark"
         xmlns:somens="http://yourdomain.com/somens">
    <somens:Component1 />
    <somens:Component2 />
    <somens:Component3 />
</s:Group>
```

Then you can use your library with custom namespace.


# Create application and module swf files

```js
var fl = require('flbuild')
var exec = require('done-exec')

var config = new fl.Config()
config.setEnv('FLEX_HOME')
config.setEnv('PROJECT_HOME', '/project/home')
config.setEnv('PLAYER_VERSION', '11.9')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
config.addLibraryDirectory('$FLEX_HOME/frameworks/libs/')
config.addLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
config.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
config.addLibraryDirectory('$PROJECT_HOME/libs/')
config.addSourceDirectory('$PROJECT_HOME/src')

var app = new fl.App(config)
app.addArg('-debug=false')
app.addArg('-compress=true')
app.addArg('-optimize=true')
app.createBuildCommand('$PROJECT_HOME/src/App.mxml', '$PROJECT_HOME/bin-debug/App.swf', function (cmd) {
    console.log('app =>', cmd)
    exec(cmd).run(function () {
        console.log('<= app')
    })
})

var module = new fl.Module(config)
module.addArg('-debug=false')
module.addArg('-compress=true')
module.addArg('-optimize=true')
module.createBuildCommand('$PROJECT_HOME/bin-debug/App.xml', '$PROJECT_HOME/src/modules/Module.mxml', '$PORJECT_HOME/bin-deubg/modules/Module.swf', function (cmd) {
    console.log('module =>', cmd)
    exec(cmd).run(function () {
        console.log('<= module')
    })
})
```

`fl.App` build command will be make files `App.swf`, `App.xml` and `App.size.xml`.

`App.xml` is report file for module optimization. It can using when create sub module.


# If you want create library with swf files

```js
var fl = require('flbuild')
var exec = require('done-exec')

var config = new fl.Config()
config.setEnv('FLEX_HOME')
config.setEnv('PROJECT_HOME', '/project/home')
config.setEnv('PLAYER_VERSION', '11.9')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
config.addLibraryDirectory('$PROJECT_HOME/libs/')
config.addSourceDirectory('$PROJECT_HOME/src')

var lib = new fl.Lib(config)
lib.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/')
lib.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
lib.addExternalLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
lib.createBuildCommand('$PROJECT_HOME/bin/lib.swc', function (cmd) {
    exec(cmd).run()
})

var app = new fl.App(config)
app.addLibraryDirectory('$FLEX_HOME/frameworks/libs/')
app.addLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
app.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
app.createBuildCommand('$PROJECT_HOME/src/App.mxml', '$PROJECT_HOME/bin-debug/App.swf', function (cmd) {
    exec(cmd).run()
})

var module = new fl.Module(config)
module.addLibraryDirectory('$FLEX_HOME/frameworks/libs/')
module.addLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
module.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
module.createBuildCommand('$PROJECT_HOME/bin-debug/App.xml', '$PROJECT_HOME/src/modules/Module.mxml', '$PORJECT_HOME/bin-deubg/modules/Module.swf', function (cmd) {
    exec(cmd).run()
})
```

If you need create swc library with swf applications. You can set different libraries and args each modules. (because `mxmlc` need import flex libraries. but, `compc` no need flex libraries.)



# With gulpfile.js

You can make flbuild into one of gulpfile tasks. It is better for your build.

```js
var gulp = require('gulp')
var fl = require('flbuild')
var exec = require('done-exec')
var run = require('gulp-sequence')

var config = new fl.Config()
config.setEnv('FLEX_HOME')
config.setEnv('PROJECT_HOME', '/project/home')
config.setEnv('PLAYER_VERSION', '11.9')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
config.addExternalLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
config.addLibraryDirectory('$PROJECT_HOME/libs/')
config.addSourceDirectory('$PROJECT_HOME/src')

gulp.task('create-library', function (done) {
    var lib = new fl.Lib(config)
    lib.createBuildCommand('$PROJECT_HOME/bin/lib.swc', function (cmd) {
        exec(cmd).run(done)
    })
})

gulp.task('some-task', function () {
    // task code
})

gulp.task('default', run(['some-task', 'create-library']))
```


# API

## class `fl.Config`
- `constructor(parent?:fl.Config)`
- `setEnv(name:string, value?:string)` If value is null. Read value from system environment variables.
- `getEnv(name:string):string`
- `addLibraryDirectory(path:string)`
- `addExternalLibraryDirectory(path:string)`
- `addSourceDirectory(path:string)`
- `addArg(arg:string)` mxmlc, compc options
- `getLibraryDirectories():string[]`
- `getExternalLibraryDirectories():string[]`
- `getSourceDirectories():string[]`
- `getArgs():string[]`

## class `fl.App extends fl.Config`
- `constructor(config:fl.Config)`
- `createBuildCommand(mxmlPath: string, swfPath: string, complete: (command: string) => void)`

## class `fl.Module extends fl.Config`
- `constructor(config:fl.Config)`
- `createBuildCommand(appReportPath: string, mxmlPath: string, swfPath: string, complete: (command: string) => void)`

## class `fl.Lib extends fl.Config`
- `constructor(config:fl.Config)`
- `filterFunction: (asclass: fl.ASClass) => boolean`
- `createBuildCommand(swcPath: string, complete: (command: string) => void)`

## interface `fl.ASClass`
- `path:string` = '/project/path/src/your/namespace/Class.as'
- `relative_path:string` = 'your/namespace/Class.as'
- `base:string` = '/project/path/src/your/namespace'
- `relative_base:string` = 'your/namespace'
- `name:string` = 'Class'
- `extension:string` = '.as'
- `atime:number` = 1430095512987 (from `Date.getTime()`)
- `mtime:number` = 1430095512987
- `ctime:number` = 1430095512987
- `classpath:string` = 'your.namespace.Class'
