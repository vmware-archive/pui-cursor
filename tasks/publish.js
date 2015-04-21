var gulp = require('gulp');
var npm = require('npm');

gulp.task('publish', ['build'], function(){
  npm.load({}, function(error) {
    if (error) {
      console.error(error);
      return;
    }

    npm.commands.publish([packageDir], function(error) {
      if (error) {
        console.error(error);
      }
    });
  });
});