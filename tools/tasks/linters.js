'use strict';

var linterPipe = require('gulp-one-guide');

var filesToLint = [
    'core/**/*.js',
    'test/**/*.js',
    'tools/**/*.js',
    '*.js'
];

var excludeFiles = [
    'core/parser/build/**',
    '**/node_modules/**'
];

module.exports = function () {
    this.task('lint', function () {
        return this.src(filesToLint).pipe(linterPipe({
            root: process.cwd(),
            config: 'yandex-node',
            excludes: excludeFiles
        }));
    });
};
