var Flbuild = require('./libs/flbuild')

var flbuild = new Flbuild()
flbuild.setEnv('FLEX_HOME')
flbuild.setEnv('PROJECT_HOME', 'test/project')
flbuild.setEnv('PLAYER_VERSION', '14.0')
flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
flbuild.addSourceDirectory('$PROJECT_HOME/src')

var fldoc = flbuild.getDocCreator()
fldoc.create('test/fldoc.json', function(err) {
    process.exit(0)
})