/* eslint-env node */

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import _assign from 'lodash/object/assign';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';

import browserify from 'browserify';
import watchify from 'watchify';

import browserSync from 'browser-sync';

const bs = browserSync.create();
const $ = gulpLoadPlugins();


// ----------------------------- BROWSERIFY ------------------------------------

// Browserify params
const browserifyArgs = _assign({}, watchify.args, {
  entries: 'js/autocomplete.js',
  standalone: 'TeleportAutocomplete',
  debug: true,
});

// Browserify bundle command
const rebundle = (bundler) => {
  return bundler.bundle()
    .on('error', $.util.log)
    .pipe(source('teleport-autocomplete.bundled.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('dist'))
    .pipe(bs.reload({ stream: true }));
};


/**
 * Browserify + Babel with watchify
 */
gulp.task('watchify', () => {
  const bundler = watchify(browserify(browserifyArgs));

  bundler.on('update', rebundle.bind(this, bundler));
  bundler.on('log', $.util.log);

  return rebundle(bundler);
});


/**
 * Plain browserify
 */
gulp.task('browserify', () => rebundle(browserify(browserifyArgs)));

// -----------------------------------------------------------------------------


/**
 * Compile SASS and prefix it
 */
gulp.task('sass', () => {
  return gulp.src('scss/autocomplete.scss')
    .pipe($.sourcemaps.init())

    .pipe($.sass().on('error', $.sass.logError))

    // Prefix CSS
    .pipe($.autoprefixer())

    .pipe($.rename({
      prefix: 'teleport-',
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
    .pipe($.if('*.css', bs.reload({ stream: true })));
});


/**
 * Concat and minify JS
 */
gulp.task('dist:js', ['browserify'], () => {
  return gulp.src('dist/teleport-autocomplete.bundled.js')
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.uglify())
    .pipe($.rename({
      extname: '.min.js',
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});


/**
 * Minify CSS
 */
gulp.task('dist:css', ['sass'], () => {
  return gulp.src('dist/teleport-autocomplete.css')
    .pipe($.sourcemaps.init({ loadMaps: true, debug: true }))
    .pipe($.minifyCss({ sourceMap: false }))
    .pipe($.rename({
      extname: '.min.css',
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});


/**
 * Clean up generated folder
 */
gulp.task('clean', (cb) => del(['dist'], cb));


/**
 * Recompile and Livereload for dev
 */
gulp.task('watch', () => {
  // Recompile CSS
  gulp.watch('scss/**', ['sass']);
});


/**
 * Dev Server
 */
gulp.task('serve', () => {
  bs.init({
    server: {
      baseDir: './examples',
      directory: true,
      routes: { '/dist': 'dist' },
    },
  });
});


/**
 * By default:
 * Compile SASS, ES6, Ractive templates once, run devserver and watch files
 */
gulp.task('default', ['watch', 'watchify', 'sass', 'serve']);
