/*global describe, it*/
'use strict';

var assert = require('assert');

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

        it('Should throw error if method is not implemented', function () {
            var router = new Router();
            assert.throws(function () {
                router.matchAll('GET', '/');
            });
        });

        it('Should match routes according to passed verb', function () {
            var router = new Router();
            router.addRule('/', {name: 'index0'});
            router.addRule('/foo/', {name: 'foo'});
            router.addRule('/', {name: 'index1'});
            router.addRule('POST /', {name: 'index2'});
            assert.deepEqual(router.matchAll('GET', '/'), [
                {
                    args: {},
                    data: {
                        name: 'index0'
                    }
                },
                {
                    args: {},
                    data: {
                        name: 'index1'
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
});
