/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var util = require('util');
var methods = require('methods').map(function (verb) {
     return verb.toUpperCase();
}).sort();

describe('core/router', function () {
    /*eslint max-nested-callbacks: 0*/
    var Router = require('../core/router');

    describe('{Router}.isImplemented', function () {
        it('Should have "isImplemented" own method', function () {
            var router = new Router();
            assert.strictEqual(typeof router.isImplemented, 'function');
        });

        it('Should check if method is implemented', function () {
            var router = new Router();
            assert.ok(!router.isImplemented('POST'));
            router.addRule('POST /upload/', {name: 'upload'});
            router.addRule('POST /upload2/', {name: 'upload2'});
            assert.ok(router.isImplemented('POST'));
            assert.ok(router.isImplemented('post'));
            router.delRule('upload');
            assert.ok(router.isImplemented('POST'));
            router.delRule('upload2');
            assert.ok(!router.isImplemented('POST'));
        });
    });

    describe('{Router}.matchAll', function () {
        it('Should have "matchAll" own method', function () {
            var router = new Router();
            assert.strictEqual(typeof router.matchAll, 'function');
        });

        it('Should match routes according to passed verb', function () {
            var router = new Router();
            router.addRule('/', {name: 'index0'});
            router.addRule('/foo/', {name: 'foo'});
            router.addRule('/', {name: 'index1'});
            router.addRule('POST /', {name: 'index2'});
            router.addRule('* /', {name: 'index3'});
            assert.deepEqual(router.matchAll('/', 'GET'), [
                {
                    args: {},
                    data: {
                        name: 'index0',
                        verbs: ['GET', 'HEAD']
                    }
                },
                {
                    args: {},
                    data: {
                        name: 'index1',
                        verbs: ['GET', 'HEAD']
                    }
                },
                {
                    args: {},
                    data: {
                        name: 'index3',
                        verbs: methods
                    }
                }
            ]);

            assert.deepEqual(router.matchAll('/', 'POST'), [
                {
                    args: {},
                    data: {
                        name: 'index2',
                        verbs: ['POST']
                    }
                },
                {
                    args: {},
                    data: {
                        name: 'index3',
                        verbs: methods
                    }
                }
            ]);
        });

        it('Should accept "GET" as default verb if omitted', function () {
            var router = new Router();
            router.addRule('/', {
                name: 'foo'
            });
            assert.deepEqual(router.matchAll('/'), [
                {
                    args: {},
                    data: {
                        name: 'foo',
                        verbs: ['GET', 'HEAD']
                    }
                }
            ]);
        });
    });

    describe('{Router}.matchVerbs', function () {
        it('Should return unique verbs list', function () {
            var router = new Router();
            router.addRule('/', {name: 'index0'});
            router.addRule('/', {name: 'index1'});
            router.addRule('/foo/', {name: 'foo'});
            router.addRule('POST /', {name: 'upload'});
            assert.deepEqual(router.matchVerbs('/').sort(), ['HEAD', 'GET', 'POST'].sort());
        });
    });

    describe('{Router}.addRule()', function () {

        describe('{Route}.params', function () {
            it('Should support flags', function () {
                var router = new Router();
                var route = router.addRule('/ IzXs', {
                    ignoreCase: true,
                    appendSlash: false
                });

                assert.ok(!route.params.ignoreCase);
                assert.ok(route.params.appendSlash);
                assert.ok(route.params.z);
                assert.ok(!route.params.X);
            });

            it('Should merge router params with route.params', function () {
                var router = new Router({
                    ignoreCase: true
                });

                var route = router.addRule('/ s');
                assert.ok(route.params.ignoreCase);
                assert.ok(route.params.appendSlash);
            });
        });

        describe('{Route}.data.verbs', function () {
            it('Should parse verbs', function () {
                var router = new Router();
                var route = router.addRule('POST /');
                assert.deepEqual(route.data.verbs.sort(), ['POST'].sort());
            });

            it('Should automatically add HEAD to GET routes', function () {
                var router = new Router();
                var route = router.addRule('GET /');
                assert.deepEqual(route.data.verbs.sort(), ['GET', 'HEAD'].sort());
            });

            it('Should add GET automatically if no verbs specified', function () {
                var router = new Router();
                var route = router.addRule('/');
                assert.deepEqual(route.data.verbs.sort(), ['GET', 'HEAD'].sort());
            });

            it('Should ignore dupes in verbs list', function () {
                var router = new Router();
                var route = router.addRule('POST,POST, PUT, POST /');
                assert.deepEqual(route.data.verbs.sort(), ['POST', 'PUT'].sort());
            });

            it('Should allow all methods if "*" passed', function () {
                var router = new Router();
                var route = router.addRule('* /');
                assert.deepEqual(route.data.verbs.sort(), methods);
            });
        });
    });

    Router.parseRequestRule = Router._parseRequestRule;

    describe('Router._parseRequestRule', function () {
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
                assert.deepEqual(Router.parseRequestRule(s[0]), s[1]);
            });
        });
    });

});
