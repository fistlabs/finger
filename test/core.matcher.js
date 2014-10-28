/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/matcher', function () {
    /*eslint max-nested-callbacks: 0*/
    var StdMatcher = require('../core/matcher');
    var Rule = require('../core/rule');

    function Matcher() {
        StdMatcher.apply(this, arguments);
    }

    Matcher.prototype = Object.create(StdMatcher.prototype);

    Matcher.prototype.getRules = function () {
        return this._rules;
    };

    describe('{Matcher}.params', function () {
        it('Should have own property "params"', function () {
            var matcher = new Matcher();
            assert.ok(matcher.hasOwnProperty('params'));
        });

        it('Should be an Object', function () {
            var matcher = new Matcher();
            assert.ok(matcher.params);
            assert.strictEqual(typeof matcher.params, 'object');
        });
    });

    describe('{Matcher}.addRule', function () {
        it('Should have own method "addRule"', function () {
            var matcher = new Matcher();
            assert.strictEqual(typeof matcher.addRule, 'function');
        });

        it('Should push items to {Matcher}.order', function () {
            var matcher = new Matcher();
            assert.strictEqual(matcher.getRules().length, 0);
            matcher.addRule('/');
            assert.strictEqual(matcher.getRules().length, 1);
        });

        it('Should accept ruleData', function () {
            var matcher = new Matcher();
            var ruleData = {x: 42, name: 'foo'};
            matcher.addRule('/', ruleData);
            assert.deepEqual(matcher.getRule('foo').data, ruleData);
        });

        it('Should remove rules with the same name', function () {
            var matcher = new Matcher();
            matcher.addRule('/bar/', {name: 'bar'});
            matcher.addRule('/', {name: 'foo'});
            assert.strictEqual(matcher.getRule('foo').data.name, 'foo');
            assert.strictEqual(matcher.getRules().length, 2);
            matcher.addRule('/asd/', {name: 'foo', x: 42});
            assert.strictEqual(matcher.getRule('foo').data.name, 'foo');
            assert.strictEqual(matcher.getRules().length, 2);
            assert.strictEqual(matcher.getRule('foo').data.x, 42);
        });

        it('Should return an instance of Rule', function () {
            var matcher = new Matcher();
            assert.ok(matcher.addRule('/') instanceof Rule);
        });
    });

    describe('{Matcher}.getRule', function () {
        it('Should have own method "getRule"', function () {
            var matcher = new Matcher();
            assert.strictEqual(typeof matcher.getRule, 'function');
        });

        it('Should return rule by name', function () {
            var matcher = new Matcher();
            matcher.addRule('/', {name: 'index'});
            assert.strictEqual(matcher.getRule('index').data.name, 'index');
            assert.strictEqual(matcher.getRule('foo'), void 0);
            matcher.addRule('/', {name: 'index2'});
            matcher.addRule('/', {name: 'index3'});
            matcher.delRule('index2');
            assert.ok(matcher.getRule('index3'));
        });
    });

    describe('{Matcher}.matchAll', function () {
        it('Should have own method "matchAll"', function () {
            var matcher = new Matcher();
            assert.strictEqual(typeof matcher.matchAll, 'function');
        });

        it('Should return all matched rules', function () {
            var matcher = new Matcher();
            matcher.addRule('/foo/', {name: 'foo'});
            assert.deepEqual(matcher.matchAll('/'), []);
            matcher.addRule('/', {name: 'index0'});
            assert.deepEqual(matcher.matchAll('/'), [
                {
                    args: {},
                    name: 'index0'
                }
            ]);
            matcher.addRule('/', {name: 'index1'});
            assert.deepEqual(matcher.matchAll('/'), [
                {
                    args: {},
                    name: 'index0'
                },
                {
                    args: {},
                    name: 'index1'
                }
            ]);
        });
    });
});
