/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var util = require('util');

describe('core/kind', function () {
    /*eslint max-nested-callbacks: 0*/
    var Kind = require('../core/kind');

    describe('Kind.checkRegExp', function () {
        var samples = [
            ['', true],
            ['()', false],
            ['\\(', true],
            ['[()]', true],
            ['\\[()\\]', false],
            ['(?:', false],
            ['+', false],
            ['[^/]', true],
            [/asd/g, false]
        ];

        it('Should have static method "checkRegExp"', function () {
            assert.strictEqual(typeof Kind.checkRegExp, 'function');
        });

        _.forEach(samples, function (s) {
            var shouldText = 'Should check %j and return %j';
            shouldText = util.format(shouldText, s[0], s[1]);

            it(shouldText, function () {
                assert.strictEqual(Kind.checkRegExp(s[0]), s[1]);
            });
        });
    });

    describe('Kind', function () {
        it('Should throw TypeError on invalid regexps', function () {
            assert.throws(function () {
                return new Kind('kind', '(');
            }, TypeError);
        });
    });

    describe('kind.check', function () {
        it('Should be a function', function () {
            var kind = new Kind('kind', '\\w+');
            assert.strictEqual(typeof kind.check, 'function');
        });

        it('Should always return false for empty strings', function () {
            var kind = new Kind('kind', '[\\s\\S]*');
            assert.ok(!kind.check(''));
        });

        it('Should always return false for null', function () {
            var kind = new Kind('kind', '[\\s\\S]*');
            assert.ok(!kind.check(null));
        });

        it('Should always return false for undefined', function () {
            var kind = new Kind('kind', '[\\s\\S]*');
            assert.ok(!kind.check(void 0));
        });

        it('Should check value by regexp', function () {
            var kind;
            kind = new Kind('foo', '\\w+');
            assert.ok(kind.check('a'));
            assert.ok(!kind.check('|'));
            kind = new Kind('foo', '\\d+|[a-z]+');
            assert.ok(kind.check('5'));
            assert.ok(kind.check('555'));
            assert.ok(kind.check('a'));
            assert.ok(kind.check('aaa'));
            assert.ok(!kind.check('|'));
            assert.ok(!kind.check('5a'));
        });
    });

});
