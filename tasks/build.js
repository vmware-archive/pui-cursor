import del from 'del';
import gulp from 'gulp';
import gulp_load_plugins from 'gulp-load-plugins';
import mergeStream from 'merge-stream';
import runSequence from 'gulp4-run-sequence';

const plugins = gulp_load_plugins();
const COPYRIGHT = '//(c) Copyright 2015 Pivotal Software, Inc. All Rights Reserved.\n';

gulp.task('clean', () => { return del('dist');});

gulp.task('build', (done) => { return runSequence('clean', 'babel', done);});

gulp.task('babel', function() {
  return mergeStream(
    gulp.src(['src/**/*.js'], {base: 'src'})
        .pipe(plugins.babel())
        .pipe(plugins.header(COPYRIGHT)),
    gulp.src(['LICENSE', 'README.md', 'package.json'])
  ).pipe(gulp.dest('dist'));
});

gulp.task('build', (callback) => {
  runSequence('clean', 'babel', callback);
});

gulp.task('watch', gulp.series('build', (done) => {
  gulp.watch('src/**/*.js', gulp.series('babel'));
  done();
}));