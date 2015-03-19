'use strict';

var Kind = require('../core/kind');

var _ = require('lodash-node');
var assert = require('assert');

describe('core/common-types', function () {
    var types = require('../core/common-types');

    describe('Ident', function () {
        var ident = new Kind('Ident', types.Ident);

        it('Should have Ident type', function () {
            assert.ok(_.has(types, 'Ident'));
        });
        it('Should be a string', function () {
            assert.ok(_.isString(types.Ident));
        });
        it('Should support "$" character', function () {
            assert.ok(ident.check('$'));
        });
        it('Should not support number as first character', function () {
            assert.ok(!ident.check('1'));
        });
        it('Should not support trailing "-"', function () {
            assert.ok(!ident.check('-'));
            assert.ok(!ident.check('a-'));
            assert.ok(!ident.check('a-a-'));
            assert.ok(!ident.check('a-'));
        });
        it('Should not support trailing lodash', function () {
            assert.ok(!ident.check('asd_'));
            assert.ok(!ident.check('as_d_'));
            assert.ok(!ident.check('_as_d_'));
        });
        it('Should support any alphanumeric characters as next characters', function () {
            assert.ok(ident.check('$foo1w3123_asd1111fd$'));
        });
        it('Should support "-" separated idents', function () {
            assert.ok(ident.check('$a-a-a-a'));
            assert.ok(ident.check('$a_a-a1a_a-a$a-a-$$$'));
        });
    });
});
