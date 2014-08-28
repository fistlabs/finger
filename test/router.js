/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('router', function () {
    var Router = require('../router');

    it('Should correctly find routes', function () {
        var router = new Router();

        var rIndex = router.addRoute('/', {
            name: 'index'
        });

        var rNews = router.addRoute('GET /news/(<postId>/)', {
            name: 'news'
        });

        var rUpload = router.addRoute('POST /upload/', {
            name: 'upload'
        });

        assert.deepEqual(router.find('GET', '/'), {
            match: {},
            route: rIndex
        });

        assert.deepEqual(router.find('HEAD', '/'), {
            match: {},
            route: rIndex
        });

        assert.deepEqual(router.find('POST', '/').sort(),
            ['GET', 'HEAD'].sort());

        assert.deepEqual(router.find('PUT', '/'), []);

        assert.deepEqual(router.find('GET', '/news/'), {
            match: {
                postId: void 0
            },
            route: rNews
        });

        assert.deepEqual(router.find('GET', '/news/1231/'), {
            match: {
                postId: '1231'
            },
            route: rNews
        });

        assert.deepEqual(router.find('GET', '/not-existing/'), null);

        rNews = router.addRoute('/news/(<postId>/)', {
            name: 'news'
        });

        assert.deepEqual(router.find('GET', '/news/foo/'), {
            match: {
                postId: 'foo'
            },
            route: rNews
        });

        rUpload = router.addRoute('PUT /upload/', {
            name: 'upload'
        });

        assert.deepEqual(router.find('PUT', '/upload/'), {
            match: {},
            route: rUpload
        });

        assert.deepEqual(router.find('POST', '/upload/'), []);

        assert.strictEqual(router.getRoute('upload'), rUpload);
        assert.strictEqual(router.getRoute('news'), rNews);
        assert.strictEqual(router.getRoute('index'), rIndex);
        assert.strictEqual(router.getRoute('index2'), null);

        router = new Router();

        router.addRoute('GET /', {
            name: 'r1'
        });

        router.addRoute('GET /', {
            name: 'r2'
        });

        router.addRoute('GET /', {
            name: 'r3'
        });

        assert.strictEqual(router.find('GET', '/', null).
            route.data.name, 'r1');

        assert.strictEqual(router.find('GET', '/', 'r1').
            route.data.name, 'r2');

        assert.strictEqual(router.find('GET', '/', 'r2').
            route.data.name, 'r3');

        assert.strictEqual(router.find('GET', '/', 'r3'), null);
        assert.strictEqual(router.find('GET', '/', 'r4'), null);

        router = new Router({
            ignoreCase: true
        });

        router.addRoute('/news/');
        router.addRoute('/profile/ I');

        assert.ok(router.find('GET', '/NEWS/'));
        assert.strictEqual(router.find('GET', '/PROFILE/'), null);
    });
});
