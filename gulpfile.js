var gulp    = require('gulp'),
    $       = require('gulp-load-plugins')()
    webpack = require('webpack'),
    del     = require('del');

const configure = {
  GITHUB: {
    name: "GitHub Issue Badges",
    permissions: [ "https://github.com/*", "https://api.github.com/*" ],
    scripts: [ "js/init.js" ],
    options_page: "html/option_page.html"
  },
  GHE: {
    name: "GitHub Issue Badges (for Enterprise)",
    permissions: [ "https://*/*" ],
    scripts: [],
    options_page: "html/option_page_GHE.html"
  }
};

["GITHUB", "GHE"].forEach(mode => {

  gulp.task(`manifest:${mode}`, ['compile'], function () {
    return gulp.src('src/manifest.json')
      .pipe($.jsonEditor(function (manifest) {
        manifest.name =
          configure[mode].name;
        manifest.permissions =
          configure[mode].permissions.concat(manifest.permissions);
        manifest.background.scripts =
          configure[mode].scripts.concat(manifest.background.scripts);
        manifest.options_page =
          configure[mode].options_page;
        return manifest;
      }))
      .pipe(gulp.dest(`build/${mode}/`));
  });

  gulp.task(`html:${mode}`, function() {
    return gulp.src('src/html/*.html')
      .pipe(gulp.dest(`build/${mode}/html/`))
  })

  gulp.task(`bundle:${mode}`, ['compile'], function (done) {
    webpack({
      entry: {
        background: './.tmp/js/background.js',
        inject: './.tmp/js/inject.js',
        options: './.tmp/js/options.js',
        init: './.tmp/js/init.js'
      },
      output: {
        path: `./build/${mode}/js`,
        filename: '[name].js'
      },
      plugins: [
        new webpack.optimize.UglifyJsPlugin({
          output: {
            beautify: true
          },
          compress: false
        })
      ]
    }, done);
  });

});

gulp.task('compile', function () {
  return gulp.src('src/ts/**/*.ts')
    .pipe($.changed('.tmp/js', { extension: '.js' }))
    .pipe($.plumber())
    .pipe($.tsc({ noImplicitAny: true, target: 'ES6' }))
    .pipe(gulp.dest('.tmp/js'));
});

gulp.task('watch', function () {
  gulp.watch(['src/ts/**/*.ts'], ['bundle:GITHUB', 'bundle:GHE']);
});

gulp.task('build', [
  'bundle:GITHUB', 'manifest:GITHUB', 'html:GITHUB',
  'bundle:GHE', 'manifest:GHE', 'html:GHE'
]);

gulp.task('clean', del.bind(null, ['build/', '.tmp/']));

gulp.task('default', ['build']);
