'use strict';

var _ = require('lodash-node');
var gulpMocha = require('gulp-mocha');
var gulpIstanbul = require('gulp-istanbul');
var istanbulPipe = gulpIstanbul();
var writePipe = gulpIstanbul.writeReports();
var mochaPipe = gulpMocha({
    ui: 'bdd',
    reporter: 'spec',
    checkLeaks: true,
    slow: Infinity
});
var testsFiles = [
    'test/*.js'
];

var filesToCover = [
    'core/*.js',
    'core/parser/*.js'
];

function runUnitTests() {
    return this.src(testsFiles).pipe(mochaPipe);
}

function runUnitTestsWithCover(done) {
    var getRunTestsPipe = _.bind(runUnitTests, this);
    this.src(filesToCover)
        .pipe(istanbulPipe)
        .pipe(gulpIstanbul.hookRequire())
        .on('finish', function () {
            getRunTestsPipe()
                .pipe(writePipe)
                .on('end', done);
        });
}

module.exports = function (gulp) {
    gulp.task('unit', ['parser'], runUnitTests);
    gulp.task('cover', ['parser'], runUnitTestsWithCover);
    gulp.task('test', ['lint', 'parser'], runUnitTestsWithCover);
};
