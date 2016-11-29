var gulp = require('gulp'),
    args = require('yargs').argv,
    buffer = require('vinyl-buffer'),
    merge = require('merge-stream'),
    browserSync = require('browser-sync').create(),
    runSequence = require('run-sequence'),
    del = require('del'),
    cleanCSS = require('gulp-clean-css'),
    globSass = require('gulp-sass-glob'),
    bless = require('gulp-bless'),
    csslint = require('gulp-csslint'),
    open = require('gulp-open'),
    jsonFormat = require('gulp-json-format'),
    mozjpeg = require('imagemin-mozjpeg'),
    pngquant = require('imagemin-pngquant'),
    $ = require('gulp-load-plugins')({lazy: true});

// Configs gulp
var config = require('./gulp.config.js');

/**
 * Help task list all tasks
*/
gulp.task('help', function (done) {
  gulp.src('gulpfile.js')
  .pipe($.helpTasksTree({
      tasks: gulp.tasks,
      description: {
        'default' : 'Task for production environment'
      },
      options: [
        {
          name: 'dev',
          description: 'Execute Development Tasks',
          tasks: ['default']
        }
      ]
  }))

  done();
});

//////////////////////////////////////////////////////////////// Clean files and Folders
/**
 * Task to cleanup every files
 */
gulp.task('clean', function(done) {
  log('Cleaning all files ...' + $.util.colors.green(config.dist));
   return del([
    config.paths.fonts.destination + '*',
    config.paths.styles.destination + '*',
    config.paths.scripts.destination + '*',
    config.paths.images.destination + '*',
    config.paths.sprite.destination + '*'
  ]);
  done();
});

/**
 * Task to cleanup and recreate Reports files
 */
gulp.task('clean-reports', function(done) {
  clean(config.paths.reportFolder + '*');
  done();
});

/**
 * Task to cleanup and recreate CSS files
 */
gulp.task('clean-styles', function(done) {
  clean(config.paths.styles.destination + '*');
  done();
});

/**
 * Task to cleanup and recreate JS files
 */
gulp.task('clean-scripts', function(done) {
  clean(config.paths.scripts.destination + '*');
  done();
});

/**
 * Task to cleanup and recreate Fonts files
 */
gulp.task('clean-fonts', function(done) {
  clean(config.paths.fonts.destination + '*');
  done();
});

/**
 * Task to cleanup and recreate Images files
 */
gulp.task('clean-images', function(done) {
  clean(config.paths.images.destination + '*');
  done();
});

//////////////////////////////////////////////////////////////// Validations JS/SCSS/CSS
/**
 * Task to validate Javascript
 */
gulp.task('js-validate', () => {
  log('Analizing All Javascript Code of project with JSCS and JSHINT');

  return gulp
    .src(config.paths.scripts.scriptsValidate)
    .pipe($.jscs())
    .pipe($.jscs.reporter())
    .pipe($.jshint())
    .pipe($.jshint.reporter('gulp-jshint-html-reporter', {
      filename: config.paths.reportFolder + 'jshintReport.html'
    }))
    .pipe($.jshint.reporter('default'));
});

/**
 * Task to validate SCSS files
 */
gulp.task('scss-validate', () => {
  log('Analizing All SCSS Code of project with SCSS-lint');

  scssReporter.openReporter(config.projectName, config.paths.styles.src);

  return gulp
    .src(config.paths.styles.stylesValidate)
    .pipe($.scssLint({
      'maxBuffer': 1048576,
      'config': '.scss-lint.yml',
      customReport: scssReporter.reporter.bind(scssReporter)
    }))
    .on('end', scssReporter.closeReporter.bind(scssReporter));
});

/*
* Task to Validate CSS
*/
gulp.task('css-validate', () => {
  log('Analizing All CSS Code of project with CSS-lint');

  return gulp
    .src(config.paths.styles.destination + '*.css')
    .pipe(csslint('.csslintrc'))
    .pipe($.csslintReport({
      'filename': 'csslintReport.html',
      'directory': config.paths.reportFolder
    }));
});

//////////////////////////////////////////////////////////////// Compilation SCSS/JS
/**
 * Task to compile and convert SCSS to CSS
 */
gulp.task('styles', () => {
  log('Compiling SCSS to CSS...');
  log(config.paths.styles.source + config.projectName + '.scss');

  return gulp
    .src(config.paths.styles.source + config.projectName + '.scss')
    .pipe($.if(args.dev, $.sourcemaps.init()))
    .pipe(globSass())
    .pipe($.sass())
    .on('error', errorLogger)
    .pipe($.autoprefixer({browsers: ['last 2 versions', '> 5%']}))
    .pipe($.if(!args.dev, cleanCSS()))
    .pipe($.concat(config.paths.styles.filename))
    .pipe($.if(args.dev, $.sourcemaps.write()))
    .pipe(gulp.dest(config.paths.styles.destination));
});


/**
 * Task to move javascripts
 */
gulp.task('scripts', gulp.series('clean-scripts', function compiling() {
  return gulp
    .src(config.paths.scripts.source)
    .pipe($.if(args.dev, $.sourcemaps.init()))
    .pipe($.concat(config.paths.scripts.filename))
    .pipe($.if(!args.dev, $.uglify({mangle: false})))
    .pipe($.if(args.dev, $.sourcemaps.write()))
    .pipe(gulp.dest(config.paths.scripts.destination));
}));

//////////////////////////////////////////////////////////////// Move files from SRC Folder FONTS/IMAGES
/**
 * Task to copy every fonts file on source folder
 */
gulp.task('fonts', gulp.series('clean-fonts', function compiling() {
  log('Copying font(s) ...');

  return gulp
    .src(config.paths.fonts.source + '**/*.{eot,svg,ttf,woff,woff2}')
    .pipe(gulp.dest(config.paths.fonts.destination));
}));

/**
 * Task to compress every images file on source folder
 */
gulp.task('images', () => {
  log('Copying and compressing image(s) ...');

  return gulp
   .src([
      config.paths.images.source + '**/*.{png,jpg,jpeg,gif,svg,ico}',
      '!' + config.paths.sprite.source + '**/*.*'
    ])
    .pipe($.cache($.imagemin({
      optimizationLevel: 5,
      progressive: true,
      interlaced: true,
      use: [
        pngquant({quality: '65-80'}),
        mozjpeg({quality: 70})
      ]
    })))
    .pipe(gulp.dest(config.paths.images.destination));
});

////////////////////////////////////////////////////////////////// Sprite
/**
 * Sprite generation task
 */
gulp.task('sprites', () => {
  log('Generating Sprites ...');
  // Generate our spritesheet
  var spriteData = gulp
  .src(config.paths.sprite.source + '*.png')
  .pipe($.spritesmith({
    imgName: config.spriteConfig.imgName,
    imgPath : "../images/generated/" + config.spriteConfig.imgName,
    retinaSrcFilter: config.paths.sprite.source + '**/*@2x.png',
    retinaImgName: config.spriteConfig.retinaImgName,
    padding: 5,
    cssName: config.spriteConfig.cssName
  }));

  // Pipe image stream through image optimizer and onto disk
  var imgStream = spriteData.img
    // DEV: We must buffer our stream into a Buffer for `imagemin`
    .pipe(buffer())
    .pipe($.cache($.imagemin({
      optimizationLevel: 5,
      progressive: true,
      interlaced: true,
      use: [
        pngquant({quality: '75'})
      ]
    })))
    .pipe(gulp.dest(config.paths.sprite.destination));

  // Pipe CSS stream through CSS optimizer and onto disk
  var cssStream = spriteData.css
    .pipe(gulp.dest(config.paths.styles.abstractions));

  // Return a merged stream to handle both `end` events
  return merge(imgStream, cssStream);
});


/**
 * Sprite with non-retina / retina folder
 * It's recommended used when your project doesn't have all images in retina version too
 * It's necessary has two folders, on to insert the normal images and other to insert retina images
 */

/*gulp.task('sprites', function (done) {
  log('Generating Sprites ...');
  // Generate our spritesheet
  var core = gulp
    .src(config.src + 'images/core/*.png')
    .pipe($.spritesmith({
    imgName: '../images/generated/sprite.png',
    cssName: '_sprite.scss'
  }));
  var core_2x = gulp
    .src(config.src + 'images/core2x/*@2x.png')
    .pipe($.spritesmith({
    imgName: '../images/generated/sprite@2x.png',
    cssName: '_sprite2x.scss'
  }));

  imgStream(core);
  imgStream(core_2x);

  function imgStream(folder) {
    var imgStream = folder.img
    .pipe(buffer())
    .pipe($.cache($.imagemin({
      optimizationLevel: 4
    })))
    .pipe(gulp.dest(config.dist + 'images/generated/'));

    var cssStream = folder.css
    .pipe(gulp.dest(config.src + './scss/abstractions/'));

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
  }

  done();
});*/

////////////////////////////////////////////////////////////////// Watch
// Gulp Watch Styles
gulp.task('watch:styles', function () {
  gulp.watch(config.paths.styles.source, gulp.series('styles'));
});

// Gulp Watch Javascript
gulp.task('watch:js', function () {
  gulp.watch(config.paths.scripts.source, gulp.series('scripts'));
});

// Gulp Watch Images
gulp.task('watch:images', function () {
  gulp.watch(config.paths.images.source, gulp.series('images'));
});

// Gulp Watch Sprites
gulp.task('watch:sprites', function () {
  gulp.watch(config.paths.sprite.source, gulp.series('sprites'));
});

// Gulp Watch Everything
gulp.task('watch',
  gulp.parallel('watch:styles', 'watch:js', 'watch:images')
);


//////////////////////////////////////////////////////////////// BrowserSync
/**
 * BrowserSync task
 */
gulp.task('sync', () => {
  log('Starting browser-sync on port ' + config.defaultPort);

  browserSync.init({
    proxy: config.sync.httpAddress,
    port: config.sync.defaultPort,
    files: [config.dist + '**/*.*'],
    ghostMode: {
      clicks: true,
      location: false,
      forms: true,
      scroll: true
    },
    injectChanges: true,
    logFileChanges: true,
    logLevel: 'debug',
    logPrefix: 'gulp-patterns',
    notify: true,
    reloadDelay: config.sync.browserReloadDelay
  });

  gulp.watch([
    config.paths.styles.source,
    config.paths.scripts.source,
    config.paths.images.source,
  ], gulp.series('watch:styles', 'watch:js', 'watch:images'))
    .on('change', browserSync.reload);
});


//////////////////////////////////////////////////////////////// Default Tasks
// This task to be use only production environment
gulp.task('default',
  gulp.series(
    gulp.parallel('clean', 'clean-reports'),
    gulp.parallel('images', 'styles', 'sprites', 'fonts', 'scripts'),
    gulp.parallel('js-validate', 'scss-validate')
  )
);

//////////////////////////////////////////////////////////////// Bless CSS
gulp.task('css-bless', () => {
    log('Bless CSS for IE9...');
    return gulp
      .src(config.paths.styles.destination + '*.css')
      .pipe(bless())
      .pipe(gulp.dest(config.paths.styles.destination))
});

//////////////////////////////////////////////////////////////// Functions

/**
 * During browserSync this function get paths/files and list them on watch
 * @param   {string} event used
 * @return {string}  Log of files watched
 */
function changeEvent(event) {
  var srcPattern = new RegExp('/.*(?=/' + config.src + ')/');
  log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

/**
 * Function to catch errors
 */
function errorLogger(error) {
  log('*** Start of Error(s) ***');
  log(error);
  log('*** End of Error(s) ***');
  this.emit('end');
}

/**
 * Clean files inside a path
 * @param  {String} path Path to determined file(s)
 */
function clean(path) {
  log('Cleaning: ' + $.util.colors.green(path));
  del(path);
}

/**
 * Funtion to help view in console
 * @param  {string} msg 'Text to identify rules'
 */
function log(msg) {
  if (typeof(msg) === 'object') {
    for (var item in msg) {
      if (msg.hasOwnProperty(item)) {
        $.util.log($.util.colors.green(msg[item]));
      }
    }
  } else {
    $.util.log($.util.colors.green(msg));
  }
}

/**
* task to open file using gulp-open plugin
*/
gulp.task('openFileCssLint', function() {
  log("Opening files");
  var options = {
    app: 'chrome'
  };

  return gulp
  .src(config.reportFolder + '/csslintReport.html')
  .pipe(open(options));
});
