/*global describe, it*/
/*eslint max-nested-callbacks: 0*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var util = require('util');

describe('core/route', function () {
    var Route = require('../core/route');

    Route.parseRequestRule = Route._parseRequestRule;

    describe('{Route}.params', function () {
        it('Should support flags', function () {
            var route = new Route('/ IzXs', {
                ignoreCase: true,
                appendSlash: false
            });

            assert.ok(!route.params.ignoreCase);
            assert.ok(route.params.appendSlash);
            assert.ok(route.params.z);
            assert.ok(!route.params.X);
        });
    });

    describe('Route._parseRequestRule', function () {
        var title = 'Should parse %j to %j';
        var samples = [
            [
                '/<page>/?page',
                ['', '/<page>/?page', '']
            ]
        ];
        _.forEach(samples, function (s) {
            var shouldText = util.format(title, s[0], s[1]);
            it(shouldText, function () {
                assert.deepEqual(Route.parseRequestRule(s[0]), s[1]);
            });
        });
    });

    describe('{Route}.verbs', function () {
        it('Should parse verbs', function () {
            var route = new Route('POST /');
            assert.deepEqual(route.verbs.sort(), ['POST'].sort());
        });

        it('Should automatically add HEAD to GET routes', function () {
            var route = new Route('GET /');
            assert.deepEqual(route.verbs.sort(), ['GET', 'HEAD'].sort());
        });

        it('Should add GET automatically if no verbs specified', function () {
            var route = new Route('/');
            assert.deepEqual(route.verbs.sort(), ['GET', 'HEAD'].sort());
        });

        it('Should ignore dupes in verbs list', function () {
            var route = new Route('POST,POST, PUT, POST /');
            assert.deepEqual(route.verbs.sort(), ['POST', 'PUT'].sort());
        });
    });

    describe('{Route}.toString', function () {
        it('Should be correctly coerced to String', function () {
            var route = new Route('/');
            assert.strictEqual(String(route), 'GET, HEAD /');
            route = new Route('POST,PUT,POST / i');
            assert.strictEqual(String(route), 'POST, PUT / i');
        });
    });
});
