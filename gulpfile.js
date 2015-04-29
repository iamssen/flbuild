var gulp = require('gulp')
	, exec = require('done-exec')
	, concat = require('gulp-concat')
	, ts = require('gulp-typescript')
	, sourcemaps = require('gulp-sourcemaps')
	, merge = require('merge2')
	, run = require('gulp-sequence')

function tsc(file) {
	return 'tsc --declaration --sourcemap --module commonjs --out lib/' + file + '.js lib/' + file + '.ts'
}

gulp.task('tsc', function (done) {
	exec(tsc('flbuild'))
		//.add(tsc('Config'))
		//.add(tsc('Lib'))
		//.add(tsc('Module'))
		.run(done)
})

//gulp.task('tsc', function () {
//	var t = gulp.src('src/*.ts')
//		.pipe(sourcemaps.init())
//		.pipe(ts({
//			declarationFiles: true,
//			noExternalResolve: true,
//			sortOutput: true,
//			module: 'commonjs'
//		}))
//
//	return merge([
//		t.js.pipe(gulp.dest('lib'))
//	])
//
//	//return t.js
//	//	.pipe(concat('flbuild.js'))
//	//	.pipe(sourcemaps.write())
//	//	.pipe(gulp.dest('lib'))
//})

gulp.task('copy', function () {
	gulp.src('src/**/*').pipe(gulp.dest('lib'))
})


gulp.task('default', run(['copy', 'tsc']))
gulp.task('travis', run(['tsc']))