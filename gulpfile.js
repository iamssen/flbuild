var gulp = require('gulp')
var exec = require('done-exec')
var run = require('gulp-sequence')

function tsc(source, output) {
	return 'tsc --declaration --sourcemap --module commonjs --out ' + output + ' ' + source
}

gulp.task('build', function (done) {
	exec(tsc('lib/_.ts', 'lib/_.js')).run(done)
})

gulp.task('copy', function () {
	return gulp.src('src/**/*').pipe(gulp.dest('lib'))
})

gulp.task('default', run('copy', 'build'))
gulp.task('travis', run('build'))