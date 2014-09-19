var Flbuild = require('./libs/flbuild')
    , SourceCollector = require('./libs/flutils')['SourceCollector']
    , exec = require('done-exec')

var flbuild = new Flbuild()
flbuild.setEnv('FLEX_HOME')
flbuild.setEnv('GEIS_HOME')
flbuild.setEnv('PROJECT_HOME', 'test/project')
flbuild.setEnv('PLAYER_VERSION', '14.0')
flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/player/$PLAYER_VERSION')
flbuild.addExternalLibraryDirectory('$FLEX_HOME/frameworks/libs/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/libs/mx/')
flbuild.addLibraryDirectory('$FLEX_HOME/frameworks/locale/en_US/')
flbuild.addSourceDirectory('$PROJECT_HOME/src')

var fldoc = flbuild.getDocCreator()
fldoc.create('test/asdoc', function(err) {
    console.log('Fldoc build complete', err)
    process.exit(0)
})