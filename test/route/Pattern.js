'use strict';

var Pattern = require('../../route/Pattern');

module.exports = {
    Pattern: [
        function (test) {

            var p = new Pattern('/ isez', {
                ignoreCase: false,
                test: true
            });

            test.deepEqual(p.params, {
                ignoreCase: false,
                doNotMatchStart: true,
                doNotMatchEnd: true,
                z: true,
                i: true,
                test: true
            });

            test.done();
        }
    ],
    'Pattern.prototype.match': [
        function (test) {

            var p;

            p = new Pattern('/a/');

            test.deepEqual(p.match('/a/'), {});
            test.strictEqual(p.match('/A/'), null);

            p = new Pattern('/Ж/(<param>/)', {
                ignoreCase: true
            });

            test.deepEqual(p.match('/ж/'), {param: void 0});
            test.deepEqual(p.match('/ж/жожо/'), {param: 'жожо'});
            test.deepEqual(p.match('/' + encodeURIComponent('ж') + '/' +
                encodeURIComponent('жожо') + '/'), {param: 'жожо'});

            p = new Pattern('/a/', {
                ignoreCase: true
            });

            test.deepEqual(p.match('/a/'), {});
            test.deepEqual(p.match('/A/'), {});

            p = new Pattern('/Ж/(<param=test,test2>/)', {
                ignoreCase: true
            });
            test.strictEqual(p.match('/ж/test1/'), null);
            test.deepEqual(p.match('/ж/test/'), {param: 'test'});
            test.deepEqual(p.match('/ж/test2/'), {param: 'test2'});

            p = new Pattern('/a/<param>/<param>/<param>/');
            test.deepEqual(p.match('/a/b/c/d/'), {
                param: ['b', 'c', 'd']
            });

            p = new Pattern('/images/ e');
            test.deepEqual(p.match('/images/avatars/my-ava.gif'), {});

            p = new Pattern('/<filename>.<ext=gif,jpg> s');
            test.deepEqual(p.match('/images/avatars/my-ava.gif'), {
                filename: 'my-ava',
                ext: 'gif'
            });
            test.strictEqual(p.match('/images/avatars/my-ava0gif'), null);

            test.done();
        },
        function (test) {
            var p;

            p = new Pattern('/ж/(<param>/)');

            test.deepEqual(p.match('/' + encodeURIComponent('ж') + '/'),
                {param: void 0});

            test.deepEqual(p.match('/' + encodeURIComponent('ж') +
                '/' + encodeURIComponent('жожо') + '/'), {param: 'жожо'});
            test.deepEqual(p.match('/' + encodeURIComponent('ж') + '/' +
                encodeURIComponent('жожо') + '/'), {param: 'жожо'});

            test.deepEqual(p.match('/%%'), null);

            p = new Pattern('/' + encodeURIComponent('ж') + '/', {
                doNotUseConversion: true
            });

            test.deepEqual(p.match('/' + encodeURIComponent('ж') + '/'), {});

            test.done();
        }
    ],
    'Pattern.prototype.build': [
        function (test) {

            var p;

            p = new Pattern('/a/');
            test.strictEqual(p.build({}), '/a/');

            p = new Pattern('/post/<param>/');
            test.strictEqual(p.build({
                param: 2
            }), '/post/2/');

            p = new Pattern('/post/<param=1>/(<param=ok>/)');

            test.strictEqual(p.build({
                param: '1'
            }), '/post/1/');

            test.strictEqual(p.build({
                param: ['1']
            }), '/post/1/');

            test.strictEqual(p.build({
                param: ['1', 'ok']
            }), '/post/1/ok/');

            test.strictEqual(p.build({
                param: ['1', 'woops']
            }), '/post/1/woops/');

            test.strictEqual(p.build({
                param: ['1']
            }), '/post/1/');

            test.strictEqual(p.build({
                param: '1'
            }), '/post/1/');

            test.strictEqual(p.build({
                param: '2'
            }), '/post/2/');

            test.strictEqual(p.build(), '/post//');

            p = new Pattern('/a/<param>/c/\t  se ', {
                ignoreCase: true
            });
            test.deepEqual(p.match('/x/A/b/C/d'), {
                param: 'b'
            });

            test.done();
        },
        function (test) {

            var p;

            p = new Pattern('/диск/<wat>/');

            test.strictEqual(p.build({
                wat: 'цэ'
            }), '/' + encodeURIComponent('диск') + '/' +
                encodeURIComponent('цэ') + '/');

            test.done();
        }
    ]
};
