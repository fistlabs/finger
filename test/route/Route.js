'use strict';
/*eslint no-extend-native: 0*/
var Route = require('../../route/Route');
Object.prototype.bug = 42;

module.exports = {
    Route: [
        function (test) {
            var r;

            r = new Route('/a/b/c');

            test.deepEqual(r.allow.sort(), ['GET', 'HEAD'].sort());

            r = new Route('POST /a/b/c');

            test.deepEqual(r.allow.sort(), ['POST'].sort());

            r = new Route(' GET, POST /a/b/c');

            test.deepEqual(r.allow.sort(), ['GET', 'HEAD', 'POST'].sort());

            test.done();
        }
    ],
    'Route.prototype.build': [
        function (test) {

            var p = new Route('/disc/<wat>/');

            test.strictEqual(p.build({
                wat: 'c',
                test: [52, true, false],
                x: 'r',
                v: 1,
                z: Infinity
            }), '/disc/c/?test=52&test=true&test=false&x=r&v=1&z=');

            test.strictEqual(p.build({
                wat: 'c'
            }), '/disc/c/');

            test.done();
        }
    ],
    'Route.prototype.match': [
        function (test) {

            var r = new Route('GET, POST /index.php', {
                ignoreCase: true
            });

            test.deepEqual(r.match('GET', '/INDEX.PHP'), [true, {}]);
            test.deepEqual(r.match('HEAD', '/INDEX.PHP'), [true, {}]);
            test.deepEqual(r.match('POST', '/INDEX.PHP'), [true, {}]);
            test.done();
        }
    ],
    'Route.prototype.toString': [
        function (test) {

            var r = new Route(' PUT, POST /index.xml', {
                ignoreCase: true
            });

            test.strictEqual(r.toString(), 'PUT,POST /index.xml i');
            test.done();
        },
        function (test) {

            var r = new Route('/index.xml i');

            test.strictEqual(r.toString(), 'GET,HEAD /index.xml i');
            test.done();
        }
    ],
    'Route.buildUrl': [
        function (test) {

            test.strictEqual(Route.buildUrl('/', {
                a: 42
            }), '/?a=42');

            test.strictEqual(Route.buildUrl('/<section>/<itemId>/', {
                a: 42,
                section: 'post',
                itemId: '100500'
            }), '/post/100500/?a=42');

            test.strictEqual(Route.buildUrl('/<section>/(<itemId>/)', {
                a: 42,
                section: 'post'
            }), '/post/?a=42');

            test.done();
        }
    ]
};
