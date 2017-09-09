
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
		script  : ['src/**/*.js', 'src/polyop.js', 'demo/res/**/*.js', 'demo/res/demo.*.js'],
		styles  : ['demo/res/style.less']
	},
	destPaths = {
		script  : ['dist/', 'demo/res/'],
		styles  : ['demo/res/']
	};

/*-------------------------------------------------------------------------
 * Gulp HELP
 *
 *-------------------------------------------------------------------------*/

gulp.task('help', function() {
	console.log('\n----------------------------------------------------------------------------------\n');
	console.log('  gulp watch'.white    +'\t\t'.grey);
	console.log('  gulp frontend'.white    +'\t\t'.grey);
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
gulp.task('scripts:delmin', function() {
	return gulp.src('demo/res/demo.*.min.js', {read: false})
        .pipe($.clean())
		.pipe($.size({title: 'scripts:delmin'}));
});

// Processes javascript files
gulp.task('scripts:demo', function() {
	return gulp.src([srcPaths.script[3], '!demo/res/demo.*.min.*'])
		.pipe($.fileInclude(include_options))
	//	.pipe($.uglify())
		.pipe($.rename({suffix: '.min'}))
		.pipe(gulp.dest(destPaths.script[1]))
		.pipe($.size({title: 'scripts:demo'}));
});

// Processes javascript files
gulp.task('scripts', function() {
	return gulp.src(srcPaths.script[1])
		.pipe($.fileInclude(include_options))
		.pipe(gulp.dest(destPaths.script[0]))
		.pipe($.uglify())
		.pipe($.rename({suffix: '.min'}))
		.pipe(gulp.dest(destPaths.script[0]))
		.pipe($.size({title: 'scripts'}));
});

// Watch source files and moves them accordingly
gulp.task('watch', function() {
	gulp.watch(srcPaths.script[0], ['scripts']);
	gulp.watch([srcPaths.script[3], '!demo/res/demo.*.min.*'], ['scripts:delmin', 'scripts:demo']);
	gulp.watch(srcPaths.styles[0], ['styles:demo']);
});

// This task is for frontend development
gulp.task('frontend', function(cb) {
	sequence(['scripts', 'scripts:delmin', 'scripts:demo', 'styles:demo'], 'watch', cb);
});

