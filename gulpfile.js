const gulp = require('gulp');
const sass = require('gulp-sass');

gulp.task('sass', function () {
    return gulp.src('./src/assets/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./src/assets/css'));
});


gulp.task('watch', function () {
    gulp.watch('./src/assets/**/*', ['default']);
});

gulp.task('default', ['sass']);