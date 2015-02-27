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

    describe('{Router}.matchRules', function () {
        it('Should have "matchRules" own method', function () {
            var router = new Router();
            assert.strictEqual(typeof router.matchRules, 'function');
        });

        it('Should match routes according to passed verb', function () {
            var router = new Router();
            router.addRule('/', {name: 'index0'});
            router.addRule('/foo/', {name: 'foo'});
            router.addRule('/', {name: 'index1'});
            router.addRule('POST /', {name: 'index2'});
            router.addRule('* /', {name: 'index3'});
            assert.deepEqual(router.matchRules('/', router.getNamesByVerb('GET')), [
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

            assert.deepEqual(router.matchRules('/', router.getNamesByVerb('POST')), [
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

    describe('router.delRule()', function () {
        it('Should be a function', function () {
            var router = new Router();
            assert.strictEqual(typeof router.delRule, 'function');
        });

        it('Should remove rule', function () {
            var router = new Router();
            router.addRule('/', {
                name: 'foo'
            });
            router.addRule('/', {
                name: 'bar'
            });
            assert.strictEqual(router.rules.length, 2);
            router.delRule('foo');
            assert.strictEqual(router.rules.length, 1);
            router.delRule('bar');
            assert.strictEqual(router.rules.length, 0);
        });
    });

    describe('Router.Matcher', function () {
        it('Should have Matcher link', function () {
            assert.strictEqual(Router.Matcher, require('../core/matcher'));
        });
    });

    describe('Router.Rule', function () {
        it('Should have Rule link', function () {
            assert.strictEqual(Router.Rule, require('../core/rule'));
        });
    })
});
