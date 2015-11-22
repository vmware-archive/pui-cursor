const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const runSequence = require('run-sequence');
const webpack = require('webpack-stream');

gulp.task('spec', callback => runSequence('lint', 'jasmine-ci', callback));

function testAssets(options = {}) {
  const webpackConfig = {...require('../config/webpack'), ... options};
  return gulp.src('spec/**/*_spec.js')
    .pipe(plugins.plumber())
    .pipe(webpack(webpackConfig));
}

gulp.task('jasmine-ci', function() {
  return testAssets({watch: false})
    .pipe(plugins.jasmineBrowser.specRunner({console: true}))
    .pipe(plugins.jasmineBrowser.phantomjs());
});

gulp.task('jasmine', function() {
  return testAssets()
    .pipe(plugins.jasmineBrowser.specRunner())
    .pipe(plugins.jasmineBrowser.server());
});
