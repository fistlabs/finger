/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/tools', function () {
    /*eslint max-nested-callbacks: 0*/
    var RuleAny = require('../core/parser/rule-any');
    var RuleArg = require('../core/parser/rule-arg');
    var RuleSep = require('../core/parser/rule-sep');
    var RuleSeq = require('../core/parser/rule-seq');

    var StdTools = require('../core/tools');

    function Tools() {
        StdTools.apply(this, arguments);
    }

    Tools.prototype = Object.create(StdTools.prototype);

    describe('{Tools}.toString', function () {

        it('Should have own method "toString"', function () {
            var tools = new Tools('/');
            assert.strictEqual(typeof tools.toString, 'function');
        });

        it('Should return rule string', function () {
            var tools = new Tools('/');
            assert.strictEqual(String(tools), '/');
        });
    });

    describe('{Tools}.inspectRule', function () {

        it('Should have own method "inspectRule"', function () {
            var tools = new Tools('/');
            assert.strictEqual(typeof tools.inspectRule, 'function');
        });

        it('Should inspect the rule 1', function () {
            var tools = new Tools('/foo/(<bar>/)');
            var actual = [];
            var expected = [
                [RuleSeq.TYPE, false, 0],
                [RuleSep.TYPE, false, 1],
                [RuleAny.TYPE, false, 1],
                [RuleSep.TYPE, false, 1],
                [RuleSeq.TYPE, false, 1],
                [RuleArg.TYPE, false, 2],
                [RuleSep.TYPE, false, 2],
                [RuleSeq.TYPE, true, 1],
                [RuleSeq.TYPE, true, 0]
            ];

            tools.inspectRule(function (rule, stackPop, n) {
                assert.strictEqual(tools, this);
                actual.push([rule.type, stackPop, n]);
            });

            // console.log(actual);
            // console.log();
            // console.log(expected);

            assert.deepEqual(actual, expected);
        });

        it('Should return {Tools} (self)', function () {
            var tools = new Tools('/');
            assert.strictEqual(tools.inspectRule(function () {}), tools);
        });
    });

    describe('{Tools}.reduceRule', function () {

        it('Should have own method "reduceRule"', function () {
            var tools = new Tools('/');
            assert.ok(typeof tools.reduceRule, 'function');
        });

        it('Should reduce the rule', function () {
            var tools = new Tools('/foo/(<bar>/)');
            var actual = tools.reduceRule(function (rule, stackPop, n) {
                return rule.type + '|' + String(Number(stackPop)) + '|' + String(n) + ',';
            });

            var expected = [
                [RuleSeq.TYPE, false, 0],
                [RuleSep.TYPE, false, 1],
                [RuleAny.TYPE, false, 1],
                [RuleSep.TYPE, false, 1],
                [RuleSeq.TYPE, false, 1],
                [RuleArg.TYPE, false, 2],
                [RuleSep.TYPE, false, 2],
                [RuleSeq.TYPE, true, 1],
                [RuleSeq.TYPE, true, 0]
            ];

            expected = expected.reduce(function (result, elem) {
                return result + elem[0] + '|' + String(Number(elem[1])) + '|' + String(elem[2]) + ',';
            }, '');

            assert.strictEqual(actual, expected);
        });
    });
});
