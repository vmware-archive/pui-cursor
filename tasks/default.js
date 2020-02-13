import gulp from 'gulp';
import runSequence from 'gulp4-run-sequence';

gulp.task('default', done => runSequence('lint', 'spec', done));