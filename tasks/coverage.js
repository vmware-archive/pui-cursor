const {babelIstanbul: istanbul} = require('gulp-load-plugins')();
const del = require('del');
const gulp = require('gulp');
const {specNode} = require('./spec');

gulp.task('clean-coverage', done => del(['coverage'], done));

gulp.task('coverage-hook-require', () => {
  return gulp.src('src/**/*.js', {base: '.'})
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

function checkCoverage() {
  return specNode().pipe(istanbul.enforceThresholds({thresholds: {global: 80}}));
}

gulp.task('check-coverage', ['coverage-hook-require'], checkCoverage);

gulp.task('coverage', ['clean-coverage', 'coverage-hook-require'], () => {
  return checkCoverage().pipe(istanbul.writeReports({dir: 'coverage'}));
});