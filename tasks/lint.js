const gulp = require('gulp');
const {eslint, if: gulpIf, plumber, util: {colors, log}} = require('gulp-load-plugins')();

gulp.task('lint', function() {
  const {FIX: fix = true} = process.env;
  return gulp.src(['gulpfile.js', 'tasks/**/*.js', 'src/**/*.js'], {base: '.'})
    .pipe(plumber())
    .pipe(eslint({fix}))
    .pipe(eslint.format('stylish'))
    .pipe(gulpIf(file => {
        const fixed = file.eslint && typeof file.eslint.output === 'string';
        if (fixed) {
          log(colors.yellow(`fixed an error in ${file.eslint.filePath}`));
          return true;
        }
      },
      gulp.dest('.'))
    ).pipe(eslint.failAfterError());
});