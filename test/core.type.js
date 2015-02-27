/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var util = require('util');

describe('core/type', function () {
    /*eslint max-nested-callbacks: 0*/
    var Type = require('../core/type');

    describe('Type.checkRegExp', function () {
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
            assert.strictEqual(typeof Type.checkRegExp, 'function');
        });

        _.forEach(samples, function (s) {
            var shouldText = 'Should check %j and return %j';
            shouldText = util.format(shouldText, s[0], s[1]);

            it(shouldText, function () {
                assert.strictEqual(Type.checkRegExp(s[0]), s[1]);
            });
        });
    });

    describe('Type', function () {
        it('Should throw TypeError on invalid regexps', function () {
            assert.throws(function () {
                return new Type('kind', '(');
            }, TypeError);
        });
    });

    describe('type.check', function () {
        it('Should be a function', function () {
            var type = new Type('kind', '\\w+');
            assert.strictEqual(typeof type.check, 'function');
        });

        it('Should check value by regexp', function () {
            var type;
            type = new Type('foo', '\\w+');
            assert.ok(type.check('a'));
            assert.ok(!type.check('|'));
            type = new Type('foo', '\\d+|[a-z]+');
            assert.ok(type.check('5'));
            assert.ok(type.check('555'));
            assert.ok(type.check('a'));
            assert.ok(type.check('aaa'));
            assert.ok(!type.check('|'));
            assert.ok(!type.check('5a'));
        });
    });

});
