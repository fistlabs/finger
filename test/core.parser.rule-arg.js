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

        it('Should be an Array', function () {
            var rule = new RuleArg();
            assert.ok(Array.isArray(rule.name));
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

    describe('{RuleArg}.required', function () {

        it('Should have own member "required"', function () {
            var rule = new RuleArg();
            assert.ok(rule.hasOwnProperty('required'));
        });

        it('Should be a Boolean', function () {
            var rule = new RuleArg();
            assert.strictEqual(typeof rule.required, 'boolean');
        });
    });

    describe('{RuleArg}.setName', function () {

        it('Should have own method "setName"', function () {
            var rule = new RuleArg();
            assert.strictEqual(typeof rule.setName, 'function');
        });

        it('Should add text to {RuleArg}.name', function () {
            var rule = new RuleArg();
            assert.strictEqual(rule.getName(), '');
            rule.setName('a');
            assert.strictEqual(rule.getName(), 'a');
            rule.setName('a.b\\.\\c');
            assert.strictEqual(rule.getName(), 'a.b\\.c');
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

    describe('{RuleArg}.setRequired', function () {

        it('Should have own method "setRequired"', function () {
            var rule = new RuleArg();
            assert.strictEqual(typeof rule.setRequired, 'function');
        });

        it('Should set {RuleArg}.required', function () {
            var rule = new RuleArg();
            assert.strictEqual(rule.required, true);
            rule.setRequired(false);
            assert.strictEqual(rule.required, false);
        });

        it('Should return {RuleArg} (self)', function () {
            var rule = new RuleArg();
            assert.strictEqual(rule.setRequired(true), rule);
        });
    });

    describe('RuleArg.build', function () {
        it('Should have static method "build"', function () {
            assert.strictEqual(typeof RuleArg.build, 'function');
        });

        it('Should correctly build name', function () {
            assert.strictEqual(RuleArg.build(['a', 'b']), 'a.b');
            assert.strictEqual(RuleArg.build(['a.b\\.c', 'd']), 'a\\.b\\\\\\.c.d');
        });
    });

});
