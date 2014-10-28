/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/parser/rule-seq', function () {
    /*eslint max-nested-callbacks: 0*/
    var RuleSeq = require('../core/parser/rule-seq');

    describe('RuleSeq.TYPE', function () {

        it('Should have static property "TYPE"', function () {
            assert.ok(RuleSeq.hasOwnProperty('TYPE'));
        });

        it('Should be a String', function () {
            assert.strictEqual(typeof RuleSeq.TYPE, 'string');
        });
    });

    describe('{RuleSeq}.type', function () {

        it('Should have own member "type"', function () {
            var rule = new RuleSeq();
            assert.ok(rule.hasOwnProperty('type'));
        });

        it('Should be a String', function () {
            var rule = new RuleSeq();
            assert.strictEqual(typeof rule.type, 'string');
        });

        it('Should be equal to RuleSeq.TYPE', function () {
            var rule = new RuleSeq();
            assert.strictEqual(rule.type, RuleSeq.TYPE);
        });
    });

    describe('{RuleSeq}.parts', function () {

        it('Should have own member "parts"', function () {
            var rule = new RuleSeq();
            assert.ok(rule.hasOwnProperty('parts'));
        });

        it('Should be an Array', function () {
            var rule = new RuleSeq();
            assert.ok(Array.isArray(rule.parts));
        });
    });

    describe('{RuleSeq}.args', function () {

        it('Should have own member "args"', function () {
            var rule = new RuleSeq();
            assert.ok(rule.hasOwnProperty('args'));
        });

        it('Should be an Array', function () {
            var rule = new RuleSeq();
            assert.ok(Array.isArray(rule.args));
        });
    });

    describe('{RuleSeq}.addRule', function () {

        it('Should have own method "addRule"', function () {
            var rule = new RuleSeq();
            assert.strictEqual(typeof rule.addRule, 'function');
        });

        it('Should add item to {RuleSeq}.parts', function () {
            var rule = new RuleSeq();
            assert.strictEqual(rule.parts.length, 0);
            rule.addRule(42);
            assert.strictEqual(rule.parts.length, 1);
        });

        it('Should return {RuleSeq} (self)', function () {
            var rule = new RuleSeq();
            assert.strictEqual(rule.addRule(42), rule);
        });
    });

    describe('{RuleSeq}.addArg', function () {

        it('Should have own method "addArg"', function () {
            var rule = new RuleSeq();
            assert.strictEqual(typeof rule.addArg, 'function');
        });

        it('Should add item to {RuleSeq}.args', function () {
            var rule = new RuleSeq();
            assert.strictEqual(rule.args.length, 0);
            rule.addArg(42);
            assert.strictEqual(rule.args.length, 1);
        });

        it('Should return {RuleSeq} (self)', function () {
            var rule = new RuleSeq();
            assert.strictEqual(rule.addArg(42), rule);
        });
    });
});
