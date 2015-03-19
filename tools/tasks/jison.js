'use strict';

var gulpJison = require('gulp-jison');
var gulpJisonLex = require('gulp-jison-lex');

var parserPipe = gulpJison({
    type: 'slr',
    moduleType: 'commonjs',
    moduleName: 'jisonParser'
});

var lexerPipe = gulpJisonLex({
    moduleType: 'commonjs',
    moduleName: 'jisonLexer'
});

module.exports = function (gulp) {

    gulp.task('lexer', function () {
        return this.src('core/parser/*.jisonlex').
            pipe(lexerPipe).pipe(this.dest('core/parser/build/'));
    });

    gulp.task('parser', ['lexer'], function () {
        this.src('core/parser/*.jison').
            pipe(parserPipe).pipe(this.dest('core/parser/build/'));
    });
};
