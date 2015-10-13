var flbuild = require('../lib/flbuild')
var assert = require('assert')

describe('flbuild', function () {
	it('should exists Config, App, Lib, Module in flbuild', function () {
		assert.ok(flbuild.Config)
		assert.ok(flbuild.App)
		assert.ok(flbuild.Lib)
		assert.ok(flbuild.Module)
	})
})
