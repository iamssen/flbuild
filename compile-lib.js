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

var fllib = flbuild.getLibraryCreator()
fllib.createBuildCommand('test/ttt.swc', function(command) {
    console.log(command)
    
    exec(command).run(function() {
        var collector = new SourceCollector(flbuild)
        collector.getManifest(function(namespaces) {
            for (var namespace in namespaces) {
                var components = namespaces[namespace]
                var f = -1
                var fmax = components.length
                
                console.log('----------------------------------')
                console.log(namespace)
                
                while (++f < fmax) {
                    console.log(components[f])
                }
            }
        })
    })
    
})

