/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/parser/rule-path', function () {
    /*eslint max-nested-callbacks: 0*/
    var RuleSeq = require('../core/parser/rule-seq');
    var RulePath = require('../core/parser/rule-path');

    describe('RulePath.TYPE', function () {

        it('Should have static property "TYPE"', function () {
            assert.ok(RulePath.hasOwnProperty('TYPE'));
        });

        it('Should be equal to RuleSeq.TYPE', function () {
            assert.strictEqual(RulePath.TYPE, RuleSeq.TYPE);
        });
    });

    describe('{RulePath}', function () {
        it('Should be an instance of RuleSeq', function () {
            assert.ok(new RulePath() instanceof RuleSeq);
        });
    });

    describe('{RulePath}.type', function () {

        it('Should have own member "type"', function () {
            var rule = new RulePath();
            assert.ok(rule.hasOwnProperty('type'));
        });

        it('Should be a String', function () {
            var rule = new RulePath();
            assert.strictEqual(typeof rule.type, 'string');
        });

        it('Should be equal to RuleSeq.TYPE', function () {
            var rule = new RulePath();
            assert.strictEqual(rule.type, RuleSeq.TYPE);
        });
    });

    describe('{RulePath}.addQueryArgRule', function () {

        it('Should have own method "addQueryArgRule"', function () {
            var rule = new RulePath();
            assert.strictEqual(typeof rule.addQueryArgRule, 'function');
        });

        it('Should add item to {RulePath}.query', function () {
            var rule = new RulePath();
            assert.strictEqual(rule.query.length, 0);
            rule.addQueryArgRule(42);
            assert.strictEqual(rule.query.length, 1);
        });

        it('Should return {RulePath} (self)', function () {
            var rule = new RulePath();
            assert.strictEqual(rule.addQueryArgRule(42), rule);
        });
    });
});
