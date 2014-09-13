$fs = require('fs-extra')
$path = require('path')
async = require('async')
exec = require('done-exec')
{SourceCollector} = require('./flutils')


class Flasset
	constructor: (build) ->
		@collector = new SourceCollector(build)
		@build = build
		@assets = []

	embed: (extname, file, className) ->
		switch extname.toLowerCase()
			when '.jpg', '.jpeg', '.gif', '.png', '.svg', '.mp3', '.swf' then "[Embed(source='#{file}')] public static const #{className} : Class;"
			else "[Embed(source='#{file}', mimeType='application/octet-stream')] public static const #{className} : Class;"

	#==========================================================================================
	# setting
	#==========================================================================================
	addAssetDirectory: (assetClassPath, directory) =>
		@assets.push
			assetClassPath: assetClassPath
			directory: directory

	#==========================================================================================
	# build
	# - swc file
	# - brochure file { image preview, variable, image size }
	#==========================================================================================
	createAsset: (output, complete) =>
		cacheDirectory = $path.normalize('.assets_cache')
		classNameReg = /^[A-Za-z][A-Za-z0-9_]+/;
		embed = @embed

		@collector.addSourceDirectory($path.join(cacheDirectory, 'src'))

		# remove cache directory if exists
		$fs.removeSync(cacheDirectory) if $fs.existsSync(cacheDirectory)

		task = (obj, next) ->
			assetClassPath = obj['assetClassPath']
			directory = obj['directory']

			paths = assetClassPath.split('.')
			className = paths.pop()
			namespace = paths.join('.')
			paths.unshift(cacheDirectory, 'src')

			sourceDirectory = paths.join('/')

			#----------------------------------------------------------------
			# 1 mkdir src
			#----------------------------------------------------------------
			$fs.mkdirs sourceDirectory, (err) ->
				if err?
					next(err)
					return

				#----------------------------------------------------------------
				# 2 clone files
				#----------------------------------------------------------------
				$fs.copy directory, sourceDirectory, (err) ->
					if err?
						next(err)
						return

					#----------------------------------------------------------------
					# 3 create source code
					#----------------------------------------------------------------
					files = $fs.readdirSync(sourceDirectory)
					embeds = []

					for file in files
						stat = $fs.statSync($path.join(sourceDirectory, file))
						extname = $path.extname(file)
						fileClassName = file.replace(extname, '')

						if stat.isFile() and classNameReg.test(fileClassName)
							embeds.push(embed(extname, file, fileClassName))


					source = """
							package #{namespace} {
							public class #{className} {
							#{embeds.join('\n')}
							}
							}
							"""

					#----------------------------------------------------------------
					# 4 create source file
					#----------------------------------------------------------------
					$fs.writeFile $path.join(sourceDirectory, "#{className}.as"), source, {encoding:'utf8'}, (err) ->
						if err?
							next(err)
							return

						next()

		#----------------------------------------------------------------
		# 0 each assets
		#----------------------------------------------------------------
		async.eachSeries @assets, task, (err) =>
			if err?
				complete(err)
				return

			#----------------------------------------------------------------
			# 5 create build command
			#----------------------------------------------------------------
			bin = 'compc'

			@build.getSDKVersion (version) =>
				if process.platform.indexOf('win') is 0
					if version > '4.6.0'
						bin = 'compc.bat'
					else
						bin = 'compc.exe'

				args = []

				args.push(@build.wrap(@build.getEnv('FLEX_HOME') + '/bin/' + bin))

				for library in @collector.getLibraries()
					args.push('-library-path ' + @build.wrap(library))

				for library in @collector.getExternalLibraries()
					args.push('-external-library-path ' + @build.wrap(library))

				for directory in @collector.getSourceDirectories()
					args.push('-source-path ' + @build.wrap(directory))
					args.push('-include-sources ' + @build.wrap(directory))

				args.push('-output ' + @build.wrap(@build.resolvePath(output)))

				#----------------------------------------------------------------
				# 6 exec compc
				#----------------------------------------------------------------
				exec(args.join(' ')).run () ->
					$fs.removeSync(cacheDirectory) if $fs.existsSync(cacheDirectory)

					console.log(cacheDirectory)

					complete()

module.exports = Flasset