'use strict';

var assert = require('assert');
var Rule = require('../core/rule');

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
});
