'use strict';

var gulpMocha = require('gulp-mocha');
var gulpIstanbul = require('gulp-istanbul');
var istanbulPipe = gulpIstanbul();
var writePipe = gulpIstanbul.writeReports();
var mochaPipe = gulpMocha({
    ui: 'bdd',
    reporter: 'spec',
//    reporter: 'dot',
    checkLeaks: true,
    slow: Infinity
});

function runMocha(done) {

    this.src('test/*.js').pipe(mochaPipe).on('end', done);
}

function runCover(done) {
    var self = this;

    this.src([
        'core/*.js',
        'core/parser/*.js'
    ])
        .pipe(istanbulPipe)
        .on('finish', function () {
            self.src('test/*.js')
                .pipe(mochaPipe)
                .pipe(writePipe)
                .on('end', done);
        });
}

module.exports = function () {
    this.task('unit', ['parser'], runMocha);
    this.task('cover', ['parser'], runCover);
    this.task('test', ['lint', 'parser'], runCover);
};
