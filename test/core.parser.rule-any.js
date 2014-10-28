/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/parser/rule-any', function () {
    /*eslint max-nested-callbacks: 0*/
    var RuleAny = require('../core/parser/rule-any');

    describe('RuleAny.TYPE', function () {

        it('Should have static property "TYPE"', function () {
            assert.ok(RuleAny.hasOwnProperty('TYPE'));
        });

        it('Should be a String', function () {
            assert.strictEqual(typeof RuleAny.TYPE, 'string');
        });
    });

    describe('{RuleAny}.type', function () {

        it('Should have own member "type"', function () {
            var rule = new RuleAny();
            assert.ok(rule.hasOwnProperty('type'));
        });

        it('Should be a String', function () {
            var rule = new RuleAny();
            assert.strictEqual(typeof rule.type, 'string');
        });

        it('Should be equal to RuleAny.TYPE', function () {
            var rule = new RuleAny();
            assert.strictEqual(rule.type, RuleAny.TYPE);
        });
    });

    describe('{RuleAny}.text', function () {

        it('Should have own member "text"', function () {
            var rule = new RuleAny();
            assert.ok(rule.hasOwnProperty('text'));
        });

        it('Should be a string', function () {
            var rule = new RuleAny();
            assert.strictEqual(typeof rule.text, 'string');
        });
    });

    describe('RuleAny.unBackSlash', function () {

        it('Should have static method "unBackSlash"', function () {
            assert.ok(RuleAny.hasOwnProperty('unBackSlash'));
            assert.strictEqual(typeof RuleAny.unBackSlash, 'function');
        });

        it('Should remove back slashes', function () {
            assert.strictEqual(RuleAny.unBackSlash('\\a\\b'), 'ab');
            assert.strictEqual(RuleAny.unBackSlash('\\\\'), '\\');
        });
    });

    describe('{RuleAny}.addText', function () {

        it('Should have own method "addText"', function () {
            var rule = new RuleAny();
            assert.strictEqual(typeof rule.addText, 'function');
        });

        it('Should add text to rule', function () {
            var rule = new RuleAny();
            var text = 'asd\\a\\ж';
            rule.addText(text);
            text = RuleAny.unBackSlash(text);
            assert.strictEqual(rule.text, text);
        });

        it('Should return {RuleAny} (self)', function () {
            var rule = new RuleAny();
            assert.strictEqual(rule.addText(''), rule);
        });
    });
});
