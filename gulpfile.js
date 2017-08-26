
/*-------------------------------------------------------------------------
 * Include Gulp & tools that will be used
 *
 *-------------------------------------------------------------------------*/

var fs          = require('fs'),
	path        = require('path'),
	colors      = require('colors'),
	gulp        = require('gulp'),
	$           = require('gulp-load-plugins')(),
	sequence    = require('run-sequence'),
	cleanCSS    = require('gulp-clean-css'),
	stylish     = require('jshint-stylish');

var include_options = {
		prefix    : '@@',
		basepath  : '@file'
	},
	srcPaths = {
		script  : ['src/**/*.js', 'src/polyop.js'],
		styles  : ['demo/res/style.less']
	},
	destPaths = {
		script  : ['dist/'],
		styles  : ['demo/res/']
	};

/*-------------------------------------------------------------------------
 * Gulp HELP
 *
 *-------------------------------------------------------------------------*/

gulp.task('help', function() {
	console.log('\n----------------------------------------------------------------------------------\n');
	console.log('  gulp scripts'.white    +'\t\t'.grey);
	console.log('  gulp styles:demo'.white    +'\t\t'.grey);
	console.log('\n----------------------------------------------------------------------------------\n\n');
});

// Processes Less files
gulp.task('styles:demo', function() {
	return gulp.src(srcPaths.styles[0])
		.pipe($.less())
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe($.rename({suffix: '.min'}))
		.pipe(gulp.dest(destPaths.styles[0]))
		.pipe($.size({title: 'styles:demo'}));
});

// Processes javascript files
gulp.task('scripts', function() {
	return gulp.src(srcPaths.script[1])
		.pipe($.fileInclude(include_options))
	//	.pipe($.uglify())
		.pipe($.rename({suffix: '.min'}))
		.pipe(gulp.dest(destPaths.script[0]))
		.pipe($.size({title: 'scripts'}));
});

// Watch source files and moves them accordingly
gulp.task('watch', function() {
	gulp.watch(srcPaths.script[0], ['scripts']);
	gulp.watch(srcPaths.styles[0], ['styles:demo']);
});

