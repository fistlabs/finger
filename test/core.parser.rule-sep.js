/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/parser/rule-sep', function () {
    /*eslint max-nested-callbacks: 0*/
    var RuleSep = require('../core/parser/rule-sep');

    describe('RuleSep.TYPE', function () {

        it('Should have static property "TYPE"', function () {
            assert.ok(RuleSep.hasOwnProperty('TYPE'));
        });

        it('Should be a String', function () {
            assert.strictEqual(typeof RuleSep.TYPE, 'string');
        });
    });

    describe('{RuleSep}.type', function () {

        it('Should have own member "type"', function () {
            var rule = new RuleSep();
            assert.ok(rule.hasOwnProperty('type'));
        });

        it('Should be a String', function () {
            var rule = new RuleSep();
            assert.strictEqual(typeof rule.type, 'string');
        });

        it('Should be equal to RuleSep.TYPE', function () {
            var rule = new RuleSep();
            assert.strictEqual(rule.type, RuleSep.TYPE);
        });
    });
});
