/*global describe, it*/
/*eslint no-extend-native: 0*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var util = require('util');

Object.prototype.bug = 42;

describe('core/rule', function () {
    /*eslint max-nested-callbacks: 0*/
    var StdRule = require('../core/rule');

    function Rule() {
        StdRule.apply(this, arguments);
    }

    Rule.prototype = Object.create(StdRule.prototype);

    Rule.prototype.getPathParams = function () {
        return this._pathParams;
    };

    Rule.prototype.getParamsIndex = function () {
        return this._paramsCount;
    };

    Rule.prototype.getMatchRegExp = function () {
        return this._matchRegExp;
    };

    describe('{Rule}.params', function () {
        it('Should have own member "params"', function () {
            var rule = new Rule('/');
            assert.ok(rule.hasOwnProperty('params'));
        });

        it('Should be an Object', function () {
            var rule = new Rule('/');
            var params = {x: 42};
            assert.ok(rule.params);
            assert.strictEqual(typeof rule.params, 'object');
            rule = new Rule('/', params);
            assert.strictEqual(rule.params.x, params.x);
        });
    });

    describe('{Rule}.data', function () {
        it('Should have own member "data"', function () {
            var rule = new Rule('/');
            assert.ok(rule.hasOwnProperty('data'));
        });

        it('Should be an Object', function () {
            var rule = new Rule('/');
            assert.ok(rule.data);
            assert.strictEqual(typeof rule.data, 'object');
            assert.strictEqual(typeof rule.data.name, 'string');
        });
    });

    describe('Static path args indexing', function () {
        var rule = new Rule('<a>(<a>)<b><a><foo.bar><\\foo.bar><foo\\.bar>');

        describe('Expecting path args order', function () {
            it('Should create path args order', function () {
                var pathArgsOrder = rule.getPathParams();
                assert.deepEqual(pathArgsOrder.map(function (param) {
                    return param.name;
                }), [
                    'a',
                    'a',
                    'b',
                    'a',
                    'foo.bar',
                    'foo.bar',
                    'foo.bar'
                ]);
            });
        });

        describe('Expecting path args index', function () {
            it('Should create path args index', function () {
                var pathArgsIndex = rule.getParamsIndex();
                assert.deepEqual(pathArgsIndex, {
                    a: 3,
                    b: 1,
                    'foo.bar': 3
                });
            });
        });
    });

    describe('{Rule}._matchRegExp', function () {
        var samples = [
            [
                '/',
                /^\/(?:\?([\s\S]*))?$/
            ],
            [
                '/<page>/',
                /^\/([^/?&]+?)\/(?:\?([\s\S]*))?$/
            ],
            [
                '/<page>/',
                /^\/([^/?&]+?)\/(?:\?([\s\S]*))?$/
            ],
            [
                '/foo/',
                /^\/foo\/(?:\?([\s\S]*))?$/i,
                {
                    ignoreCase: true
                }
            ],
            [
                '/(foo/)',
                /^\/(?:foo\/)?(?:\?([\s\S]*))?$/
            ],
            [
                '/(да/)',
                /^\/(?:(?:д|%D0%B4)(?:а|%D0%B0)\/)?(?:\?([\s\S]*))?$/
            ],
            [
                '/(да/)',
                /^\/(?:(?:д|%D0%B4|%D0%94)(?:а|%D0%B0|%D0%90)\/)?(?:\?([\s\S]*))?$/i,
                {
                    ignoreCase: true
                }
            ]
        ];

        var title = 'Should compile %j (%j) to %j';

        _.forEach(samples, function (s) {
            var shouldText = util.format(title, s[0], s[2] || {}, String(s[1]));
            it(shouldText, function () {
                var rule = new Rule(s[0], s[2]);
                assert.deepEqual(rule.getMatchRegExp(), s[1]);
            });
        });
    });

    describe('{Rule}.match', function () {
        var samples = [
            //  sample example
            [
                //  pattern
                [
                    //  rule
                    '/',
                    //  params
                    {}
                ],
                //  samples
                [
                    //  match sample
                    [
                        //  url
                        '/',
                        //  expected result
                        {}
                    ],
                    [
                        '/?foo=bar',
                        {
                            foo: 'bar'
                        }
                    ],
                    [
                        '/?foo=bar&foo=bar2',
                        {
                            foo: ['bar', 'bar2']
                        }
                    ],
                    [
                        '/?foo=bar&foo=bar2&foo=bar3&bar=42&baz&baz=%%',
                        {
                            foo: ['bar', 'bar2', 'bar3'],
                            bar: '42',
                            baz: ['', '%%']
                        }
                    ]
                ]
            ],
            [
                [
                    '/post/<postId>/'
                ],
                [
                    [
                        '/post/42/',
                        {
                            postId: '42'
                        }
                    ],
                    [
                        '/post/foo/bar/',
                        null
                    ]
                ]
            ],
            [
                [
                    '/post/(<postId>/)'
                ],
                [
                    [
                        '/post/42/',
                        {
                            postId: '42'
                        }
                    ],
                    [
                        '/post/',
                        {
                            postId: void 0
                        }
                    ]
                ]
            ],
            [
                [
                    '/post/(id-<postId>-(<postType>-)ok/)'
                ],
                [
                    [
                        '/post/',
                        {
                            postId: void 0,
                            postType: void 0
                        }
                    ],
                    [
                        '/post/id-42-ok/',
                        {
                            postId: '42',
                            postType: void 0
                        }
                    ],
                    [
                        '/post/id-42-foo-ok/',
                        {
                            postId: '42',
                            postType: 'foo'
                        }
                    ]
                ]
            ],
            [
                [
                    '/<page>/(<page>/(<page>/))'
                ],
                [
                    [
                        '/foo/',
                        {
                            page: ['foo', void 0, void 0]
                        }
                    ],
                    [
                        '/foo/bar/',
                        {
                            page: ['foo', 'bar', void 0]
                        }
                    ],
                    [
                        '/foo/bar/baz/',
                        {
                            page: ['foo', 'bar', 'baz']
                        }
                    ],
                    [
                        '/%D0%B0/%D0%B1/%D0%B2/',
                        {
                            page: ['а', 'б', 'в']
                        }
                    ]
                ]
            ],
            [
                [
                    '/'
                ],
                [
                    [
                        '/?',
                        {}
                    ]
                ]
            ],
            [
                [
                    '/(<page>/)'
                ],
                [
                    [
                        '/foo/?page=42',
                        {
                            page: 'foo'
                        }
                    ],
                    [
                        '/?page=42',
                        {
                            page: void 0
                        }
                    ],
                    [
                        '/foo/?type=bar',
                        {
                            page: 'foo',
                            type: 'bar'
                        }
                    ]
                ]
            ],
            [
                [
                    '/(<page=news>/)'
                ],
                [
                    [
                        '/',
                        {
                            page: 'news'
                        }
                    ]
                ]
            ],
            [
                [
                    '(/news)/index.html',
                    {
                        appendSlash: true
                    }
                ],
                [
                    [
                        '/index.html',
                        {}
                    ],
                    [
                        '/index.html?foo=bar',
                        {
                            foo: 'bar'
                        }
                    ],
                    [
                        '/news/index.html',
                        {}
                    ],
                    [
                        '/news/index.html?foo=bar',
                        {
                            foo: 'bar'
                        }
                    ],
                    [
                        '/index.html/',
                        null
                    ]
                ]
            ],
            [
                [
                    '/foo/',
                    {
                        appendSlash: true
                    }
                ],
                [
                    [
                        '/foo',
                        {}
                    ],
                    [
                        '/foo/',
                        {}
                    ],
                    [
                        '/foo?x=z',
                        {
                            x: 'z'
                        }
                    ],
                    [
                        '/foo/?x=z',
                        {
                            x: 'z'
                        }
                    ],
                    [
                        '/foo/?',
                        {}
                    ],
                    [
                        '/foo?',
                        {}
                    ],
                    [
                        '/fo',
                        null
                    ]
                ]
            ],
            [
                [
                    '/&foo'
                ],
                [
                    [
                        '/?foo=bar',
                        {
                            foo: 'bar'
                        }
                    ],
                    [
                        '/?foo=',
                        null
                    ]
                ]
            ],
            [
                [
                    '/&foo+'
                ],
                [
                    [
                        '/?foo=bar',
                        {
                            foo: ['bar']
                        }
                    ],
                    [
                        '/?foo=&foo=bar&foo=baz',
                        {
                            foo: ['bar', 'baz']
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo>/&foo+'
                ],
                [
                    [
                        '/xyz/?foo=bar&foo=baz',
                        {
                            foo: 'xyz'
                        }
                    ]
                ]
            ],
            [
                [
                    '/<page>/&foo'
                ],
                [
                    [
                        '/news/?foo=bar',
                        {
                            page: 'news',
                            foo: 'bar'
                        }
                    ],
                    [
                        '/news/',
                        null
                    ]
                ]
            ]
        ];

        it('Should have own method "match"', function () {
            var rule = new Rule('/');
            assert.strictEqual(typeof rule.match, 'function');
        });

        _.forEach(samples, function (example) {
            var describeTitle = 'Expecting match results for %j (%j)';
            var pattern = example[0];

            describeTitle = util.format(describeTitle, pattern[0], pattern[1] || {});

            describe(describeTitle, function () {
                var sample = example[1];
                var rule = new Rule(pattern[0], pattern[1]);

                _.forEach(sample, function (s) {
                    var shouldText = 'Should match %j and return %j';

                    shouldText = util.format(shouldText, s[0], s[1]);

                    it(shouldText, function () {
                        assert.deepEqual(rule.match(s[0]), s[1]);
                    });
                });
            });
        });
    });

    describe('{Rule}.build', function () {
        var samples = [
            [
                '/',
                [
                    [
                        '/',
                        {}
                    ],
                    [
                        '/',
                        void 0
                    ],
                    [
                        '/',
                        null
                    ],
                    [
                        '/',
                        0
                    ],
                    [
                        '/',
                        ''
                    ],
                    [
                        '/',
                        false
                    ],
                    [
                        '/?n=1&b=true&i=&z=',
                        {
                            n: 1,
                            b: true,
                            i: Infinity,
                            z: {}
                        }
                    ]
                ]
            ],
            [
                '/news/<postId>/',
                [
                    [
                        '/news/42/',
                        {
                            postId: '42'
                        }
                    ],
                    [
                        '/news/42/',
                        {
                            postId: ['42']
                        }
                    ],
                    [
                        '/news/42/',
                        {
                            postId: ['42', '43']
                        }
                    ],
                    [
                        '/news/42/?foo=xxx',
                        {
                            postId: ['42'],
                            foo: 'xxx'
                        }
                    ]
                ]
            ],
            [
                '/news/(<postId>/)',
                [
                    [
                        '/news/42/',
                        {
                            postId: '42'
                        }
                    ],
                    [
                        '/news/',
                        {}
                    ],
                    [
                        '/news/',
                        {
                            postId: void 0
                        }
                    ],
                    [
                        '/news/',
                        {
                            postId: null
                        }
                    ],
                    [
                        '/news/',
                        {
                            postId: ''
                        }
                    ],
                    [
                        '/news/',
                        {
                            postId: []
                        }
                    ]

                ]
            ],
            [
                '<{[^?&]+?}:pathname>',
                [
                    [
                        '/foo/bar/?renderer=%2Ffoo%2F',
                        {
                            pathname: '/foo/bar/',
                            renderer: '/foo/'
                        }
                    ]
                ]
            ],
            [
                '/',
                [
                    [
                        '/?foo=42&foo=43',
                        {
                            foo: ['42', '43']
                        }
                    ]
                ]
            ],
            [
                '/news/(<postId=42>/)',
                [
                    [
                        '/news/42/'
                    ],
                    [
                        '/news/42/',
                        {}
                    ],
                    [
                        '/news/42/',
                        {
                            postId: void 0
                        }
                    ],
                    [
                        '/news/42/',
                        {
                            postId: null
                        }
                    ],
                    [
                        '/news/42/',
                        {
                            postId: []
                        }
                    ]
                ]
            ],
            [
                '/?foo',
                [
                    [
                        '/',
                        {}
                    ],
                    [
                        '/',
                        {
                            foo: void 0
                        }
                    ],
                    [
                        '/?foo=bar',
                        {
                            foo: 'bar'
                        }
                    ],
                    [
                        '/?foo=bar',
                        {
                            foo: ['bar', 'baz']
                        }
                    ]
                ]
            ],
            [
                '/?foo=bar',
                [
                    [
                        '/?foo=bar',
                        {}
                    ],
                    [
                        '/?foo=bar',
                        {
                            foo: void 0
                        }
                    ],
                    [
                        '/?foo=baz',
                        {
                            foo: 'baz'
                        }
                    ],
                    [
                        '/?foo=baz',
                        {
                            foo: ['baz', 'zot']
                        }
                    ]
                ]
            ]
        ];

        it('Should have own method "build"', function () {
            var rule = new Rule('/');
            assert.strictEqual(typeof rule.build, 'function');
        });

        _.forEach(samples, function (sample) {
            var pattern = sample[0];
            var rule = new Rule(pattern);
            describe(pattern, function () {
                var title = 'Should build %j from %j';

                _.forEach(sample[1], function (test) {
                    var shouldText = util.format(title, test[0], test[1]);
                    it(shouldText, function () {
                        assert.strictEqual(rule.build(test[1]), test[0]);
                    });
                });
            });
        });
    });

    describe('Expecting type errors', function () {
        it('Should throw unknown type errors', function () {
            assert.throws(function () {
                return new Rule('<Undef:foo>', {
                    types: {
                        Xyz: '\\w+'
                    }
                });
            });
            assert.throws(function () {
                return new Rule('/?TestSample:foo');
            });
        });
    });

    describe('Custom types', function () {
        var params = {
            types: {
                Number: '\\d+'
            }
        };
        var rule = new Rule('/post/<Number:postId>/', params);

        it('Should match "/post/{Number}/"', function () {
            assert.deepEqual(rule.match('/post/42/'), {
                postId: '42'
            });
        });

        it('Should not match "/post/foo/"', function () {
            assert.strictEqual(rule.match('/post/foo/'), null);
        });
    });

    describe('Anonymous types', function () {
        var okShouldText = 'Should match %j to %j as %j';
        var badShouldText = 'Should NOT match %j to %j';
        var okSamples = [
            [
                '/news/<{\\d+}:postId>/',
                '/news/42/',
                {
                    postId: '42'
                }
            ],
            [
                '/news/<{\\d+x}:postId>/',
                '/news/42x/',
                {
                    postId: '42x'
                }
            ],
            [
                '/news/<{\\{\\}}:postId>/',
                '/news/{}/',
                {
                    postId: '{}'
                }
            ],
            [
                '/<{foo|bar|baz}:page>/',
                '/foo/',
                {
                    page: 'foo'
                }
            ],
            [
                '/<{foo|bar|baz}:page>/',
                '/bar/',
                {
                    page: 'bar'
                }
            ],
            [
                '/<{foo|bar|baz}:page>/',
                '/baz/',
                {
                    page: 'baz'
                }
            ]
        ];

        var badSamples = [
            [
                '/news/<{\\d+}:postId>/',
                '/news/42b/'
            ],
            [
                '/news/<{\\d+x}:postId>/',
                '/news/42/'
            ],
            [
                '/<{foo|bar|baz}:page>/',
                '/moo/'
            ]
        ];

        _.forEach(okSamples, function (okSample) {
            var shouldText = util.format(okShouldText, okSample[1], okSample[0], okSample[2]);
            it(shouldText, function () {
                var rule = new Rule(okSample[0]);
                assert.deepEqual(rule.match(okSample[1]), okSample[2]);
            });
        });

        _.forEach(badSamples, function (badSample) {
            var shouldText = util.format(badShouldText, badSample[1], badSample[0]);
            it(shouldText, function () {
                var rule = new Rule(badSample[0]);
                assert.strictEqual(rule.match(badSample[1]), null);
            });
        });
    });

    describe('behaviour: Common types', function () {
        it('Should auto add common types', function () {
            var rule = new Rule('/');
            assert.ok(rule.params.types.hasOwnProperty('Number'));
            assert.ok(rule.params.types.hasOwnProperty('String'));
            assert.ok(rule.params.types.hasOwnProperty('Path'));
            assert.ok(rule.params.types.hasOwnProperty('Ident'));
            assert.ok(rule.params.types.hasOwnProperty('Alnum'));
        });

        it('Should not throw error if common type used', function () {
            assert.doesNotThrow(function () {
                return new Rule('<Number:foo>');
            });
            assert.doesNotThrow(function () {
                return new Rule('<String:foo>');
            });
            assert.doesNotThrow(function () {
                return new Rule('<Path:foo>');
            });
            assert.doesNotThrow(function () {
                return new Rule('<Ident:foo>');
            });
            assert.doesNotThrow(function () {
                return new Rule('<Alnum:foo>');
            });
            assert.doesNotThrow(function () {
                return new Rule('<Segment:foo>');
            });
        });

        it('Possible to be redefined', function () {
            var rule;

            rule = new Rule('<Number:foo>', {
                types: {
                    Number: 'asd'
                }
            });
            assert.ok(rule.match('asd'));
            assert.ok(!rule.match('asda'));

            rule = new Rule('<String:foo>', {
                types: {
                    String: 'asd'
                }
            });
            assert.ok(rule.match('asd'));
            assert.ok(!rule.match('asda'));

            rule = new Rule('<Path:foo>', {
                types: {
                    Path: 'asd'
                }
            });
            assert.ok(rule.match('asd'));
            assert.ok(!rule.match('asda'));

            rule = new Rule('<Ident:foo>', {
                types: {
                    Ident: 'asd'
                }
            });
            assert.ok(rule.match('asd'));
            assert.ok(!rule.match('asda'));

            rule = new Rule('<Alnum:foo>', {
                types: {
                    Alnum: 'asd'
                }
            });
            assert.ok(rule.match('asd'));
            assert.ok(!rule.match('asda'));

            rule = new Rule('<Segment:foo>', {
                types: {
                    Segment: 'asd'
                }
            });
            assert.ok(rule.match('asd'));
            assert.ok(!rule.match('asda'));
        });
    });
});
