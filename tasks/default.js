var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('default', cb => runSequence('lint', 'spec', cb));