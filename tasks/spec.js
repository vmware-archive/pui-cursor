const gulp = require('gulp');
const {plumber, jasmine, jasmineBrowser} = require('gulp-load-plugins')();
const webpack = require('webpack-stream');

const specs = () => gulp.src('spec/**/*_spec.js', {base: '.'}).pipe(plumber());

function testAssets(options = {}) {
  const webpackConfig = {...require('../config/webpack'), ... options};
  return specs().pipe(webpack(webpackConfig));
}

function specNode() {
  return specs().pipe(jasmine({includeStackTrace: true}));
}

gulp.task('spec-node', specNode);

gulp.task('spec', function() {
  return testAssets({watch: false})
    .pipe(jasmineBrowser.specRunner({console: true}))
    .pipe(jasmineBrowser.phantomjs());
});

gulp.task('jasmine', function() {
  return testAssets()
    .pipe(jasmineBrowser.specRunner())
    .pipe(jasmineBrowser.server());
});

module.exports = {
  specNode
};