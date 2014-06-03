'use strict';

var Router = require('../Router');

module.exports = {
    'Router.prototype.find': [
        function (test) {
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

            test.deepEqual(router.find('GET', '/'), {
                match: {},
                route: rIndex
            });

            test.deepEqual(router.find('HEAD', '/'), {
                match: {},
                route: rIndex
            });

            test.deepEqual(router.find('POST', '/').sort(),
                ['GET', 'HEAD'].sort());

            test.deepEqual(router.find('PUT', '/'), []);

            test.deepEqual(router.find('GET', '/news/'), {
                match: {
                    postId: void 0
                },
                route: rNews
            });

            test.deepEqual(router.find('GET', '/news/1231/'), {
                match: {
                    postId: '1231'
                },
                route: rNews
            });

            test.deepEqual(router.find('GET', '/not-existing/'), null);

            rNews = router.addRoute('/news/(<postId>/)', {
                name: 'news'
            });

            test.deepEqual(router.find('GET', '/news/foo/'), {
                match: {
                    postId: 'foo'
                },
                route: rNews
            });

            rUpload = router.addRoute('PUT /upload/', {
                name: 'upload'
            });

            test.deepEqual(router.find('PUT', '/upload/'), {
                match: {},
                route: rUpload
            });

            test.deepEqual(router.find('POST', '/upload/'), []);

            test.strictEqual(router.getRoute('upload'), rUpload);
            test.strictEqual(router.getRoute('news'), rNews);
            test.strictEqual(router.getRoute('index'), rIndex);
            test.strictEqual(router.getRoute('index2'), null);

            test.done();
        },
        function (test) {
            var router = new Router();

            router.addRoute('GET /', {
                name: 'r1'
            });

            router.addRoute('GET /', {
                name: 'r2'
            });

            router.addRoute('GET /', {
                name: 'r3'
            });

            test.strictEqual(router.find('GET', '/', null).
                route.data.name, 'r1');

            test.strictEqual(router.find('GET', '/', 'r1').
                route.data.name, 'r2');

            test.strictEqual(router.find('GET', '/', 'r2').
                route.data.name, 'r3');

            test.strictEqual(router.find('GET', '/', 'r3'), null);
            test.strictEqual(router.find('GET', '/', 'r4'), null);

            test.done();
        },
        function (test) {

            var router = new Router({
                ignoreCase: true
            });

            router.addRoute('/news/');
            router.addRoute('/profile/ I');

            test.ok(router.find('GET', '/NEWS/'));
            test.strictEqual(router.find('GET', '/PROFILE/'), null);

            test.done();
        }
    ]
};
