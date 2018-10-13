var gulp = require('gulp'),
    stylus = require('gulp-stylus'),
    jade = require('gulp-jade'),
    uglify = require('gulp-uglify');



gulp.task('stylus',function (){
   gulp.src('app/css/**/*.styl')
       .pipe(stylus({
           pretty:true
       }))
       .pipe(gulp.dest('dist/css'))
});

gulp.task('jade',function (){
    gulp.src('app/**/*.jade')
        .pipe(jade({
            pretty:true
        }))
        .pipe(gulp.dest('dist'))
});

gulp.task('minify', function () {
    gulp.src('app/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('watch',function(){
    gulp.watch('app/css/**/*.styl',['stylus']);
    gulp.watch('app/**/*.jade',['jade']);
    gulp.watch('app/**/*.js',['minify']);

});

gulp.task('default',['jade','stylus','minify']);
