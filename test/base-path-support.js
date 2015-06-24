'use strict';

var assert = require('assert');
var Rule = require('../core/rule');
var Matcher = require('../core/matcher');

describe('base-path-support', function () {
    it('Should have basePath="" param by default', function () {
        var rule = new Rule('/');
        assert.strictEqual(rule.params.basePath, '');
    });
    it('Should be possible to pass basePath in params', function () {
        var rule = new Rule('/', {
            basePath: '/foo'
        });
        assert.strictEqual(rule.params.basePath, '/foo');
    });
    it('Should not match the urls not starting with basePath', function () {
        var rule = new Rule('/<param>', {
            basePath: '/foo'
        });
        assert.ok(!rule.match('/bar'));
    });
    it('Should match on basePath', function () {
        var rule = new Rule('/', {
            basePath: '/foo',
            appendSlash: true
        });
        assert.ok(rule.match('/foo'));
    });
    it('Should match the urls starting with base path, but base path is not directly described in rule', function () {
        var rule = new Rule('/bar', {
            basePath: '/foo'
        });
        assert.ok(rule.match('/foo/bar'));
    });
    it('Should add base path to built urls', function () {
        var rule = new Rule('/bar', {
            basePath: '/foo'
        });
        assert.strictEqual(rule.build(), '/foo/bar');
    });

    describe('Matcher base path', function () {
        it('Should have basePath="" by default', function () {
            var matcher = new Matcher();
            assert.strictEqual(matcher.params.basePath, '');
        });
        it('Should pass basePath to all rules', function () {
            var matcher = new Matcher({
                basePath: '/foo'
            });
            var rule;

            assert.strictEqual(matcher.params.basePath, '/foo');

            rule = matcher.addRule('/bar');
            assert.strictEqual(rule.params.basePath, '/foo');

            rule = matcher.addRule('/bar');
            assert.strictEqual(rule.params.basePath, '/foo');

            rule = matcher.addRule('/bar');
            assert.strictEqual(rule.params.basePath, '/foo');
        });
        it('Should have method setBasePath', function () {
            var matcher = new Matcher();
            assert.strictEqual(typeof matcher.setBasePath, 'function');
        });

        it('Should set base path to matcher and all existing rules', function () {
            var matcher = new Matcher();
            matcher.addRule('/bar');
            matcher.addRule('/baz');
            matcher.addRule('/zot');
            assert.ok(!matcher.findMatches('/foo/bar').length);
            assert.ok(!matcher.findMatches('/foo/baz').length);
            assert.ok(!matcher.findMatches('/foo/zot').length);
            matcher.setBasePath('/foo');
            assert.strictEqual(matcher.params.basePath, '/foo');
            assert.ok(matcher.findMatches('/foo/bar').length);
            assert.ok(matcher.findMatches('/foo/baz').length);
            assert.ok(matcher.findMatches('/foo/zot').length);
        });
    });
});
