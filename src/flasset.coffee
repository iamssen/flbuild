{SourceCollector} = require('./flutils')

class Flasset
	constructor: (build) ->
		@build = build
		@assets = {}

		octetStream = 'application/octet-stream'

		@mime =
			'.json': octetStream
			'.xml': octetStream

	#==========================================================================================
	# setting
	#==========================================================================================
	addAssetDirectory: (type, directory) =>
		@assets[type] = directory

	#==========================================================================================
	# build
	# - swc file
	# - brochure file { image preview, variable, image size }
	#==========================================================================================
	createAsset: (output, complete) =>
		#----------------------------------------------------------------
		# 0 clone asset files and create source codes
		#----------------------------------------------------------------

		#----------------------------------------------------------------
		# 1 build library project
		#----------------------------------------------------------------

module.exports = Flasset