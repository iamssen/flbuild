require('source-map-support').install()

$path = require('path')
Flbuild = new require('../libs/flbuild')

flbuild = new Flbuild
flbuild.setEnv('FLEX_HOME', '/usr/lib/flex-4.11.0')
flbuild.setEnv('USER', 'ssen')
flbuild.setEnv('PROJECT_HOME', '/workspace/flbuild')

describe 'test-flbuild-methods', ->
	# ================================================================================
	# environment variables control test
	# ================================================================================
	it 'should return env replaced string', ->
		flbuild.applyEnv('$FLEX_HOME/bin/mxmlc -o $PROJECT_HOME/bin/$USER.swc').should.equal('/usr/lib/flex-4.11.0/bin/mxmlc -o /workspace/flbuild/bin/ssen.swc')
		flbuild.applyEnv('$FLEX_HOME $USER $PROJECT_HOME $USER $FLEX_HOME').should.equal('/usr/lib/flex-4.11.0 ssen /workspace/flbuild ssen /usr/lib/flex-4.11.0')

	# ================================================================================
	# resolve path control test
	# ================================================================================
	it 'should return env replaced and resolved path string', ->
		currentPath = $path.dirname(__dirname)
		flbuild.resolvePath('bin/$USER/sample.swc').should.equal("#{currentPath}/bin/ssen/sample.swc")

	it 'should return env replaced and resolved path strings', ->
		currentPath = $path.dirname(__dirname)
		arr = [
			'lib/$USER/sample.swc'
			'$FLEX_HOME/bin/mxmlc'
			'$PROJECT_HOME/source/src'
		]
		arr = flbuild.resolvePaths(arr)
		arr[0].should.equal("#{currentPath}/lib/ssen/sample.swc")
		arr[1].should.equal('/usr/lib/flex-4.11.0/bin/mxmlc')
		arr[2].should.equal('/workspace/flbuild/source/src')

	# ================================================================================
	# utils test
	# ================================================================================
	it 'should return class name', ->
		flbuild.classfy({relative_base: 'ssen/common', name: 'StringUtils'}).should.equal('ssen.common.StringUtils')
		flbuild.classfy({relative_base: 'ssen/mvc', name: 'IContext'}).should.equal('ssen.mvc.IContext')
		