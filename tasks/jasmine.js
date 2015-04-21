var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

gulp.task('spec', function() {
  return gulp.src('spec/**/*_spec.js')
    .pipe(plugins.jasmine({includeStackTrace: true}));
});