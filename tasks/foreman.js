const gulp = require('gulp');
const {spawn} = require('child_process');

gulp.task('foreman', function(callback) {
  spawn('nf', ['start', '-j', 'Procfile'], {stdio: 'inherit', env: process.env})
    .on('close', callback);
});