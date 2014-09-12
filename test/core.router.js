/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('router', function () {
    var Router = require('../core/router');

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
            pathMatch: {},
            pathnameMatch: {},
            queryMatch: {},
            verbMatch: true,
            routeMatch: 'index'
        });

        assert.deepEqual(router.find('HEAD', '/'), {
            pathMatch: {},
            pathnameMatch: {},
            queryMatch: {},
            verbMatch: true,
            routeMatch: 'index'
        });

        assert.deepEqual(router.find('POST', '/').sort(),
            ['GET', 'HEAD'].sort());

        assert.deepEqual(router.find('PUT', '/'), []);

        assert.deepEqual(router.find('GET', '/news/'), {
            pathMatch: {
                postId: void 0
            },
            pathnameMatch: {
                postId: void 0
            },
            queryMatch: {},
            verbMatch: true,
            routeMatch: 'news'
        });

        assert.deepEqual(router.find('GET', '/news/1231/'), {
            pathMatch: {
                postId: '1231'
            },
            pathnameMatch: {
                postId: '1231'
            },
            queryMatch: {},
            verbMatch: true,
            routeMatch: 'news'
        });

        assert.deepEqual(router.find('GET', '/not-existing/'), null);

        rNews = router.addRoute('/news/(<postId>/)', {
            name: 'news'
        });

        assert.deepEqual(router.find('GET', '/news/foo/'), {
            pathMatch: {
                postId: 'foo'
            },
            pathnameMatch: {
                postId: 'foo'
            },
            queryMatch: {},
            verbMatch: true,
            routeMatch: 'news'
        });

        rUpload = router.addRoute('PUT /upload/', {
            name: 'upload'
        });

        assert.deepEqual(router.find('PUT', '/upload/'), {
            pathMatch: {},
            pathnameMatch: {},
            queryMatch: {},
            verbMatch: true,
            routeMatch: 'upload'
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
            routeMatch, 'r1');

        assert.strictEqual(router.find('GET', '/', 'r1').
            routeMatch, 'r2');

        assert.strictEqual(router.find('GET', '/', 'r2').
            routeMatch, 'r3');

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
