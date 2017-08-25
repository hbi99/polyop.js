
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
		script  : ['src/js/main.js'],
		styles  : ['demo/res/style.less']
	},
	destPaths = {
		styles  : ['demo/res/']
	};

/*-------------------------------------------------------------------------
 * Gulp HELP
 *
 *-------------------------------------------------------------------------*/

gulp.task('help', function() {
	console.log('\n----------------------------------------------------------------------------------\n');
	console.log('  gulp frontend'.white    +'\t\tWatch and auto-compiles files and restart node-server'.grey);
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

// Watch source files and moves them accordingly
gulp.task('watch', function() {
	gulp.watch(srcPaths.styles[0], ['styles:demo']);
});

