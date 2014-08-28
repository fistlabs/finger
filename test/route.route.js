/*global describe, it*/
'use strict';

var assert = require('chai').assert;
/*eslint no-extend-native: 0*/
Object.prototype.bug = 42;

describe('route/route', function () {
    /*eslint max-nested-callbacks: 0*/
    var Route = require('../route/route');

    describe('Route', function () {
        it('Should parse specified methods in pattern', function () {
            var r;

            r = new Route('/a/b/c');

            assert.deepEqual(r.allow.sort(), ['GET', 'HEAD'].sort());

            r = new Route('POST /a/b/c');

            assert.deepEqual(r.allow.sort(), ['POST'].sort());

            r = new Route(' GET, POST /a/b/c');

            assert.deepEqual(r.allow.sort(), ['GET', 'HEAD', 'POST'].sort());
        });
    });

    describe('{Route}.build', function () {
        it('Should add extra parameters as query-string', function () {
            var p = new Route('/disc/<wat>/');

            assert.strictEqual(p.build({
                wat: 'c',
                assert: [52, true, false],
                x: 'r',
                v: 1,
                z: Infinity
            }), '/disc/c/?assert=52&assert=true&assert=false&x=r&v=1&z=');

            assert.strictEqual(p.build({
                wat: 'c'
            }), '/disc/c/');
        });
    });

    describe('{Route}.match', function () {
        it('Should add query-string to match result', function () {
            var r;

            r = new Route('GET, POST /index.php', {
                ignoreCase: true
            });

            assert.deepEqual(r.match('GET', '/INDEX.PHP'), [true, {}]);
            assert.deepEqual(r.match('HEAD', '/INDEX.PHP'), [true, {}]);
            assert.deepEqual(r.match('POST', '/INDEX.PHP'), [true, {}]);

            r = new Route('/<page>/');

            assert.deepEqual(r.match('GET', '/assert/?a=5&page=100500'),
                [true, {
                    page: 'assert',
                    a: '5'
                }]);
        });
    });

    describe('{Route}.toString', function () {
        it('Should correctly stringify the route', function () {
            var r;

            r = new Route(' PUT, POST /index.xml', {
                ignoreCase: true
            });

            assert.strictEqual(r.toString(), 'PUT,POST /index.xml i');

            r = new Route('/index.xml i');

            assert.strictEqual(r.toString(), 'GET,HEAD /index.xml i');
        });
    });

    describe('Route.buildPath', function () {
        it('Should correctly build path from given patten', function () {
            assert.strictEqual(Route.buildPath('/', {
                a: 42
            }), '/?a=42');

            assert.strictEqual(Route.buildPath('/<section>/<itemId>/', {
                a: 42,
                section: 'post',
                itemId: '100500'
            }), '/post/100500/?a=42');

            assert.strictEqual(Route.buildPath('/<section>/(<itemId>/)', {
                a: 42,
                section: 'post'
            }), '/post/?a=42');

            assert.strictEqual(Route.buildPath('/?b=5'), '/?b=5');

            assert.strictEqual(Route.buildPath('/?b=5', {
                a: 42
            }), '/?b=5&a=42');
        });
    });

    describe('Route.splitPath', function () {
        it('Should correctly split paths onto pathname and query', function () {
            assert.deepEqual(Route.splitPath('/'), ['/', '']);
            assert.deepEqual(Route.splitPath('/?a=5'), ['/', 'a=5']);
            assert.deepEqual(Route.splitPath('/?a=5?b=6'), ['/', 'a=5?b=6']);
        });
    });
});
