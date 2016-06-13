'use strict';

// Require your modules
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var rimraf = require('rimraf');
var exec = require('child_process').exec;
var prompt = require('gulp-prompt');

// 编译less文件
gulp.task('styles', ['copy_style'], function() {
    return gulp.src('app/less/app.less')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.less())
        .pipe($.autoprefixer({ browsers: ['> 70%', 'last 2 versions', 'Firefox ESR'] }))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('app/css'))
        .pipe(gulp.dest('.tmp/css'));
});

// 拷贝外引用的css文件
gulp.task('copy_style', function() {
    return gulp.src(['app/css/*.css', '!app/css/app.css'])
        .pipe(gulp.dest('.tmp/css'));
});

// 演示项目是复制文件
gulp.task('scripts', function() {
    return gulp.src('app/js/**/*.js')
        .pipe($.plumber())
        .pipe(gulp.dest('www/js'));
});


gulp.task('html',['styles'],function(){
    return gulp.src('app/*.html')
        .pipe($.useref.assets({searchPath: '{.tmp,app}'}))
        .pipe($.rev())
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.csso()))
        .pipe($.useref.restore())
        .pipe($.useref())
        // .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))  //压缩html代码
        .pipe(gulp.dest('www'))
        .pipe($.rev.manifest())
        .pipe(gulp.dest('./'))
});

gulp.task('changename',['html'],function(){
    return gulp.src(['./rev-manifest.json', 'www/*.html'])   //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe($.revCollector())                                   //- 执行文件内css名的替换
        .pipe(gulp.dest('www'));  
});

gulp.task('fonts', function() {
    return gulp.src('app/font/*.{eot,svg,ttf,woff,woff2}')
        .pipe(gulp.dest('www/font'))
});

gulp.task('extras', function() {
    return gulp.src([
        'app/*.*',
        '!app/*.html'
    ], {
        dot: true
    }).pipe(gulp.dest('www'));
});

// 清除生成的文件
gulp.task('clean', function(cb) {
    rimraf('.tmp', function() {
        rimraf('www', function(cb){
            $.cache.clearAll(cb);
        });
    });
});

// 压缩图片
gulp.task('images', function() {
    return gulp.src('app/images/**/*')
        .pipe($.plumber())
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [{ cleanupIDs: false }]
        })))
        .pipe(gulp.dest('www/images'));
});

// 监听文件修改
gulp.task('watch', ['connect', 'serve'], function() {
    $.livereload.listen();

    // watch for change

    gulp.watch([
        'app/*.html',
        'www/css/**/.css',
        'app/js/**/.js',
        'app/images/**/*'
    ]).on('change', $.livereload.changed);

    gulp.watch('app/less/**/*.less', ['styles']);
    gulp.watch('app/js/**/*.js', ['scripts']);
    gulp.watch('app/font/**/*', ['fonts']);
    //gulp.watch('bower.json', ['wiredep', 'fonts']);

});

// inject bower components
gulp.task('wiredep', function() {
    var wiredep = require('wiredep').stream;

    gulp.src('app/less/app.less')
        .pipe(wiredep({ directory: 'bower_components' }))
        .pipe(gulp.dest('app/css'));

    gulp.src('app/*.html')
        .pipe(wiredep({
            directory: 'bower_components'
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('connect', function() {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(connect.static('app'))
        .use(connect.static('.tmp'))
        // paths to bower_components should be relative to the current file
        // e.g. in app/index.html you should use ../bower_components
        .use(connect.directory('app'));

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function() {
            console.log('Started connect web server on http://localhost:9000');
        });
});

gulp.task('dev', function() {

  // 打开测试页
  var connect = require('connect');
  var app = connect()
    .use(connect.static('www'))

  require('http').createServer(app)
    .listen(8000)
    .on('listening', function () {
      console.log('Started connect testing server on http://localhost:8000');
    });

  require('opn')('http://localhost:8000');
});

gulp.task('serve', ['connect'], function() {
    require('opn')('http://localhost:9000');
});

// 生成全部文件
gulp.task('build', ['changename', 'images', 'fonts', 'extras','watch'], function() {
    return gulp.src('www/**/*').pipe($.size({ title: 'build', gzip: true }));
});

// gulp 默认任务
gulp.task('default', ['clean'] , function() {
    gulp.start('build');
});
