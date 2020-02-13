import gulp from 'gulp';
import gulp_load_plugins from 'gulp-load-plugins';

const {eslint, if: gulpIf, plumber, util: {colors, log}} = gulp_load_plugins();

gulp.task('lint', () => {
  const {FIX: fix = true} = process.env;
  return gulp.src(['gulpfile.babel.js', 'tasks/**/*.js', 'src/**/*.js'], {base: '.'})
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