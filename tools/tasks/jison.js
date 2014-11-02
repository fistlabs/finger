'use strict';

var gulpJison = require('gulp-jison');
var gulpJisonLex = require('gulp-jison-lex');

var parserPipe = gulpJison({
    type: 'slr',
    moduleType: 'commonjs'
});

var lexerPipe = gulpJisonLex({
    moduleType: 'commonjs'
});

module.exports = function () {

    this.task('lexer', function () {
        return this.src('core/parser/*.jisonlex').
            pipe(lexerPipe).pipe(this.dest('core/parser/build/'));
    });

    this.task('parser', ['lexer'], function () {
        this.src('core/parser/*.jison').
            pipe(parserPipe).pipe(this.dest('core/parser/build/'));
    });
};
