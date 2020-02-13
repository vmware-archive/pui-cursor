import gulp from 'gulp';
import gulp_load_plugins from 'gulp-load-plugins';
import jasmine from 'gulp-jasmine';

const {plumber} = gulp_load_plugins();
const specs = () => gulp.src('spec/**/*_spec.js', {base: '.'}).pipe(plumber());

function specNode() {
  return specs().pipe(jasmine({includeStackTrace: true, console: true}));
}

gulp.task('spec', specNode);

module.exports = { specNode };