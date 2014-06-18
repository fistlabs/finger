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
                ignoreCase: true,
                doNotMatchStart: true,
                doNotMatchEnd: true,
                z: true,
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
        },
        function (test) {

            var p = new Pattern('/(<ns>/)disc/(<wat>-x/)');

            test.strictEqual(p.build({
                wat: 'c',
                ns: '1'
            }), '/1/disc/c-x/');

            test.strictEqual(p.build({
                ns: '1'
            }), '/1/disc/');

            test.strictEqual(p.build({
                wat: 'c'
            }), '/disc/c-x/');

            test.strictEqual(p.build(), '/disc/');

            test.done();
        },
        function (test) {
            var p = new Pattern('/(<a>/)-/(<b>/)-/(<c>/)');

            test.strictEqual(p.build({
                c: 'c'
            }), '/-/-/c/');

            test.strictEqual(p.build({
                b: 'b',
                c: 'c'
            }), '/-/b/-/c/');

            test.strictEqual(p.build({
                a: 'a',
                b: 'b',
                c: 'c'
            }), '/a/-/b/-/c/');

            test.strictEqual(p.build({
                b: 'b'
            }), '/-/b/-/');

            test.strictEqual(p.build({
                a: 'a',
                b: 'b'
            }), '/a/-/b/-/');

            test.strictEqual(p.build({
                a: 'a'
            }), '/a/-/-/');

            test.done();
        },
        function (test) {
            var p = new Pattern('/hi/(st/(<a>/))b/');
            test.strictEqual(p.build(), '/hi/st/b/');
            test.strictEqual(p.build({
                a: '5'
            }), '/hi/st/5/b/');
            test.done();
        },
        function (test) {
            var p = new Pattern('/hi/(<a>foo<a1>bar/)');
            test.strictEqual(p.build(), '/hi/');
            test.strictEqual(p.build({
                a: 0
            }), '/hi/');
            test.strictEqual(p.build({
                a: 0,
                a1: 1
            }), '/hi/0foo1bar/');
            test.done();
        },
        function (test) {
            var p = new Pattern('/<x>/param/');
            test.strictEqual(p.build(), '//param/');
            test.done();
        },
        function (test) {
            var p = new Pattern('/param/<x>/');
            test.strictEqual(p.build(), '/param//');
            test.done();
        }
    ],
    'Pattern.prototype.toString': [
        function (test) {
            var src = '/(<ns>/)disc/(<wat>/)';
            var p = new Pattern('/(<ns>/)disc/(<wat>/)');
            test.strictEqual(p.toString(), src);
            test.done();
        },
        function (test) {
            var pattern = new Pattern(' /a/b/c   iEs ');

            test.strictEqual(pattern.toString(), '/a/b/c iEs');

            test.done();
        },
        function (test) {
            var pattern = new Pattern(' /a/b/c   iEsz ');

            test.strictEqual(pattern.toString(), '/a/b/c iEs');

            test.done();
        },
        function (test) {
            var pattern = new Pattern(' /a/b/c  baz ');

            test.strictEqual(pattern.toString(), '/a/b/c');

            test.done();
        }
    ]
};
