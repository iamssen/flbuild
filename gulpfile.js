var gulp = require('gulp')
	, coffee = require('gulp-coffee')
	, sourcemaps = require('gulp-sourcemaps')
	, gutil = require('gulp-util')
	, mocha = require('gulp-mocha')

require('coffee-script')

gulp.task('parse-coffee', function () {
	gulp.src('./src/*.coffee')
		.pipe(sourcemaps.init())
		.pipe(coffee())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./libs/'))
})

gulp.task('test-local', function () {
	return gulp.src('./test/*.js', {read: false})
		.pipe(mocha({
				globals: {
					should: require('should')
				}
			}
		))
})

gulp.task('test-without-compile', function () {
	return gulp.src('./test/methods-*.js', {read: false})
		.pipe(mocha({
				globals: {
					should: require('should')
				}
			}
		))
})

gulp.task('local', ['parse-coffee', 'test-local'])
gulp.task('travis', ['parse-coffee', 'test-without-compile'])