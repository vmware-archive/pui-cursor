import gulp from 'gulp';
import {spawn} from 'child_process';

gulp.task('foreman', (callback) => {
  spawn('nf', ['start', '-j', 'Procfile'], {stdio: 'inherit', env: process.env})
    .on('close', callback);
});