const del = require('del');
const gulp = require('gulp');
const mergeStream = require('merge-stream');
const plugins = require('gulp-load-plugins')();
const runSequence = require('run-sequence');

const COPYRIGHT = '//(c) Copyright 2015 Pivotal Software, Inc. All Rights Reserved.\n';

gulp.task('clean', done => del('dist', done));

gulp.task('build', function(callback) {
  runSequence('clean', 'babel', callback);
});

gulp.task('babel', function() {
  return mergeStream(
    gulp.src('src/**/*.js').pipe(plugins.babel()).pipe(plugins.header(COPYRIGHT)),
    gulp.src(['LICENSE', 'README.md', 'package.json'])
  ).pipe(gulp.dest('dist'));
});

gulp.task('build', function(callback) {
  runSequence('clean', 'babel', callback);
});

gulp.task('watch', ['build'], function() {
  gulp.watch('src/**/*.js', ['babel']);
});