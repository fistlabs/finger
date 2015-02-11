/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/parser/rule-arg', function () {
    /*eslint max-nested-callbacks: 0*/
    var RuleArg = require('../core/parser/rule-arg');

    describe('RuleArg.TYPE', function () {

        it('Should have static property "TYPE"', function () {
            assert.ok(RuleArg.hasOwnProperty('TYPE'));
        });

        it('Should be a String', function () {
            assert.strictEqual(typeof RuleArg.TYPE, 'string');
        });
    });

    describe('{RuleArg}.type', function () {

        it('Should have own member "type"', function () {
            var rule = new RuleArg();
            assert.ok(rule.hasOwnProperty('type'));
        });

        it('Should be a String', function () {
            var rule = new RuleArg();
            assert.strictEqual(typeof rule.type, 'string');
        });

        it('Should be equal to RuleArg.TYPE', function () {
            var rule = new RuleArg();
            assert.strictEqual(rule.type, RuleArg.TYPE);
        });
    });

    describe('{RuleArg}.name', function () {

        it('Should have own member "name"', function () {
            var rule = new RuleArg();
            assert.ok(rule.hasOwnProperty('name'));
        });

        it('Should be a String', function () {
            var rule = new RuleArg();
            assert.strictEqual(typeof rule.name, 'string');
        });
    });

    describe('{RuleArg}.kind', function () {

        it('Should have own member "kind"', function () {
            var rule = new RuleArg();
            assert.ok(rule.hasOwnProperty('kind'));
        });

        it('Should be a String', function () {
            var rule = new RuleArg();
            assert.strictEqual(typeof rule.kind, 'string');
        });
    });

    describe('{RuleArg}.setName', function () {

        it('Should have own method "setName"', function () {
            var rule = new RuleArg();
            assert.strictEqual(typeof rule.setName, 'function');
        });

        it('Should add text to {RuleArg}.name', function () {
            var rule = new RuleArg();
            assert.strictEqual(rule.name, '');
            rule.setName('a');
            assert.strictEqual(rule.name, 'a');
            rule.setName('\\a\\b');
            assert.strictEqual(rule.name, 'ab');
        });

        it('Should return {RuleArg} (self)', function () {
            var rule = new RuleArg();
            assert.strictEqual(rule.setName('x'), rule);
        });
    });

    describe('{RuleArg}.setKind', function () {

        it('Should have own method "setKind"', function () {
            var rule = new RuleArg();
            assert.strictEqual(typeof rule.setKind, 'function');
        });

        it('Should set {RuleArg}.kind', function () {
            var rule = new RuleArg();
            assert.strictEqual(rule.kind, '');
            rule.setKind('k\\ind');
            assert.strictEqual(rule.kind, 'kind');
        });

        it('Should return {RuleArg} (self)', function () {
            var rule = new RuleArg();
            assert.strictEqual(rule.setKind('kind'), rule);
        });
    });

    describe('RuleArg.generateRandomKind()', function () {
        it('Should generate random id', function () {
            assert.notStrictEqual(RuleArg.generateRandomKind(), RuleArg.generateRandomKind());
            assert.notStrictEqual(RuleArg.generateRandomKind(), RuleArg.generateRandomKind());
            assert.notStrictEqual(RuleArg.generateRandomKind(), RuleArg.generateRandomKind());
            assert.notStrictEqual(RuleArg.generateRandomKind(), RuleArg.generateRandomKind());
            assert.notStrictEqual(RuleArg.generateRandomKind(), RuleArg.generateRandomKind());
        });
    });

    describe('{RuleArg}.setRandomKind()', function () {
        it('Should set random generated kind', function () {
            var generateRandomKind = RuleArg.generateRandomKind;
            var rule = new RuleArg();
            RuleArg.generateRandomKind = function () {
                return 'foo';
            };
            rule.setRandomKind();
            assert.strictEqual(rule.kind, 'foo');
            RuleArg.generateRandomKind = generateRandomKind;
        });
    });
});
