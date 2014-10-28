/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/route', function () {
    var Route = require('../core/route');

    describe('{Route}.params', function () {
        it('Should clone should support flags', function () {
            var route = new Route('/ IzX', {
                ignoreCase: true
            });

            assert.ok(!route.params.ignoreCase);
            assert.ok(route.params.z);
            assert.ok(!route.params.X);
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
