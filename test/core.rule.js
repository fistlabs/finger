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
    var RuleArg = require('../core/parser/rule-arg');
    var RuleSeq = require('../core/parser/rule-seq');

    function Rule() {
        StdRule.apply(this, arguments);
    }

    Rule.prototype = Object.create(StdRule.prototype);

    Rule.prototype.getPathRule = function () {
        return this._pathRule;
    };

    Rule.prototype.getPathArgsOrder = function () {
        return this._pathParams;
    };

    Rule.prototype.getPathArgsIndex = function () {
        return this._paramsIndex;
    };

    Rule.prototype.getMatchRegExp = function () {
        return this._matchRegExp;
    };

    Rule.prototype.getTypes = function () {
        return this._types;
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

    describe('{Rule}._pathRule', function () {
        it('Should extend default AST with args occurrence indexes', function () {
            var rule = new Rule('<a>(<a>)<b><a>&a&b&c');
            var pathRule = rule.getPathRule();
            assert.strictEqual(pathRule.parts[0].used, 0);
            assert.strictEqual(pathRule.parts[1].parts[0].used, 1);
            assert.strictEqual(pathRule.parts[2].used, 0);
            assert.strictEqual(pathRule.parts[3].used, 2);

            assert.strictEqual(pathRule.args[0].used, 3);
            assert.strictEqual(pathRule.args[1].used, 1);
            assert.strictEqual(pathRule.args[2].used, 0);
        });

        it('Should set default types to arguments rules', function () {
            var rule = new Rule('<foo>?bar');
            assert.deepEqual(rule.getPathRule(), {
                type: RuleSeq.TYPE,
                parts: [
                    {
                        type: RuleArg.TYPE,
                        kind: 'Segment',
                        used: 0,
                        name: ['foo'],
                        required: true
                    }
                ],
                args: [
                    {
                        type: RuleArg.TYPE,
                        kind: 'Free',
                        used: 0,
                        name: ['bar'],
                        required: false
                    }
                ]
            });
        });
    });

    describe('Static path args indexing', function () {
        var rule = new Rule('<a>(<a>)<b><a><foo.bar><\\foo.bar><foo\\.bar>');

        describe('Expecting path args order', function () {
            it('Should create path args order', function () {
                var pathArgsOrder = rule.getPathArgsOrder();
                assert.deepEqual(pathArgsOrder.map(function (rule) {
                    return rule.getName();
                }), [
                    'a',
                    'a',
                    'b',
                    'a',
                    'foo.bar',
                    'foo.bar',
                    'foo\\.bar'
                ]);
            });
        });

        describe('Expecting path args index', function () {
            it('Should create path args index', function () {
                var pathArgsIndex = rule.getPathArgsIndex();
                assert.deepEqual(pathArgsIndex, {
                    a: 3,
                    b: 1,
                    'foo.bar': 2,
                    'foo\\.bar': 1
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
                /^\/([^/]+?)\/(?:\?([\s\S]*))?$/
            ],
            [
                '/<page>/',
                /^\/([^/]+?)\/(?:\?([\s\S]*))?$/
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
                    '/i<Free:path>?sk'
                ],
                [
                    [
                        '/i/path/to/image.png?sk=12345',
                        {
                            path: '/path/to/image.png',
                            sk: '12345'
                        }
                    ],
                    [
                        '/i/path/to/image.png',
                        {
                            path: '/path/to/image.png',
                            sk: void 0
                        }
                    ]
                ]
            ],
            /*
             * + QUERY_ARGS
             * */
            [
                [
                    '/?a'
                ],
                [
                    [
                        '/?a=42',
                        {
                            a: '42'
                        }
                    ],
                    [
                        '/?a=42&a=43',
                        {
                            a: '42'
                        }
                    ],
                    [
                        '/?a',
                        null
                    ],
                    [
                        '/',
                        {
                            a: void 0
                        }
                    ]
                ]
            ],
            [
                [
                    '/&a?a'
                ],
                [
                    [
                        '/?a=42&a=43',
                        {
                            a: ['42', '43']
                        }
                    ],
                    [
                        '/?a=42',
                        {
                            a: ['42', void 0]
                        }
                    ],
                    [
                        '/?a',
                        null
                    ],
                    [
                        '/?a=42&b=43&a=44',
                        {
                            a: ['42', '44']
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo>/?foo?foo'
                ],
                [
                    [
                        '/news/?foo=42',
                        {
                            foo: ['news', '42', void 0]
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
                        //  should ignore type
                        '/foo/?type=bar',
                        {
                            page: 'foo'
                        }
                    ]
                ]
            ],
            //  MERGING ARGS
            [
                [
                    '/<page.type>/&page.name'
                ],
                [
                    [
                        '/foo/',
                        null
                    ],
                    [
                        '/foo/?page.name=bar',
                        {
                            page: {
                                type: 'foo',
                                name: 'bar'
                            }
                        }
                    ],
                    [
                        '/foo/?\\page.n\\ame=bar',
                        null
                    ]
                ]
            ],
            [
                [
                    '/<foo>/?foo'
                ],
                [
                    [
                        '/bar/?foo=baz',
                        {
                            foo: ['bar', 'baz']
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo>/?foo.bar'
                ],
                [
                    [
                        '/bar/?foo.bar=baz',
                        {
                            foo: 'bar'
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo.bar>/?foo'
                ],
                [
                    [
                        '/bar/?foo=baz',
                        {
                            foo: {
                                bar: 'bar'
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo>/<foo>/?foo?foo'
                ],
                [
                    [
                        '/bar/baz/?foo=zot&foo=zom',
                        {
                            foo: ['bar', 'baz', 'zot', 'zom']
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo>/<foo>/?foo.bar'
                ],
                [
                    [
                        '/bar/baz/?foo.bar=zot',
                        {
                            foo: ['bar', 'baz']
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo.bar>/?foo&foo'
                ],
                [
                    [
                        '/baz/?foo=baz&foo=zom',
                        {
                            foo: {
                                bar: 'baz'
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo>/<foo>/?foo'
                ],
                [
                    [
                        '/bar/baz/?foo=zot',
                        {
                            foo: ['bar', 'baz', 'zot']
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo>/?foo?foo'
                ],
                [
                    [
                        '/bar/?foo=baz&foo=zot',
                        {
                            foo: ['bar', 'baz', 'zot']
                        }
                    ]
                ]
            ],
            [
                [
                    '/news/<post.id>/?post.tag?post.tag?post'
                ],
                [
                    [
                        '/news/42/',
                        {
                            post: {
                                id: '42',
                                tag: [void 0, void 0]
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/<post>/<post.id>/?post?post.id'
                ],
                [
                    [
                        '/foo/42/?post=bar&post.id=43',
                        {
                            post: {
                                id: ['42', '43']
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo>/?foo?foo?foo'
                ],
                [
                    [
                        '/bar/?foo=baz&foo=zot&foo=poo',
                        {
                            foo: ['bar', 'baz', 'zot', 'poo']
                        }
                    ]
                ]
            ],
            //  SO SPECIAL
            [
                [
                    '/?\\post.t\\ype'
                ],
                [
                    [
                        '/?post.type=42',
                        {
                            post: {
                                type: '42'
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/?post\\.type'
                ],
                [
                    [
                        '/?post.type=42',
                        {
                            'post.type': '42'
                        }
                    ]
                ]
            ],
            [
                [
                    '/?a\\.b.c'
                ],
                [
                    [
                        '/?a.b.c=42',
                        {
                            'a.b': {
                                c: '42'
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/<\\foo\\.bar>/?f\\oo\\.bar'
                ],
                [
                    [
                        '/bar/?foo.bar=baz',
                        {
                            'foo.bar': ['bar', 'baz']
                        }
                    ]
                ]
            ],
            [
                [
                    '/<foo.bar>/?foo\\.bar'
                ],
                [
                    [
                        '/bar/?foo.bar=baz',
                        {
                            foo: {
                                bar: 'bar'
                            },
                            'foo.bar': 'baz'
                        }
                    ]
                ]
            ],
            [
                [
                    '/?f\\\\oo\\.bar'
                ],
                [
                    [
                        '/?f\\oo.bar=42',
                        {
                            'f\\oo.bar': '42'
                        }
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
                var samples = example[1];
                var rule = new Rule(pattern[0], pattern[1]);

                _.forEach(samples, function (s) {
                    var shouldText = 'Should match %j and return %j';

                    shouldText = util.format(shouldText, s[0], s[1]);

                    it(shouldText, function () {
                        assert.deepEqual(rule.match(s[0]), s[1]);
                        //  try {
                        //
                        //      assert.deepEqual(rule.match(s[0]), s[1]);
                        //  } catch (err) {
                        //      console.log(rule._matcherFunc + '');
                        //      throw err;
                        //  }
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
                        '/news/42/',
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
                '/news/(<postId>/)?postId',
                [
                    [
                        '/news/42/?postId=43',
                        {
                            postId: ['42', '43']
                        }
                    ],
                    [
                        '/news/42/',
                        {
                            postId: ['42']
                        }
                    ],
                    [
                        '/news/?postId=43',
                        {
                            postId: ['', '43']
                        }
                    ]
                ]
            ],
            [
                '/news/(<post.id>/)?post.type',
                [
                    [
                        '/news/42/?post.type=foo',
                        {
                            post: {
                                id: '42',
                                type: 'foo'
                            }
                        }
                    ]
                ]
            ],
            [
                '/news/(<post.id>/)&post',
                [
                    [
                        '/news/42/?post',
                        {
                            post: {
                                id: 42
                            }
                        }
                    ]
                ]
            ],
            [
                '/news/(<post.id>/)?post',
                [
                    [
                        '/news/42/',
                        {
                            post: {
                                id: 42
                            }
                        }
                    ]
                ]
            ],
            [
                '<Free:pathname>?renderer',
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
            //  SPECIAL CASES

            [
                '/<foo.bar>/?foo\\.bar',
                [
                    [
                        '/foo/?foo.bar=42',
                        {
                            foo: {
                                bar: 'foo'
                            },
                            'foo.bar': '42'
                        }
                    ]
                ]
            ],
            [
                '/<\\foo\\.ba\\r>/&f\\oo\\.bar',
                [
                    [
                        '/foo/?foo.bar=42',
                        {
                            'foo.bar': ['foo', '42']
                        }
                    ]
                ]
            ],
            [
                '/?f\\\\oo\\.bar',
                [
                    [
                        '/?f%5Coo.bar=42',
                        {
                            'f\\oo.bar': '42'
                        }
                    ]
                ]
            ]
        ];

        it('Should have own method "build"', function () {
            var rule = new Rule('/');
            assert.strictEqual(typeof rule.build, 'function');
        });

        _.forEach(samples, function (s) {
            var pattern = s[0];
            var rule = new Rule(pattern);
            describe(pattern, function () {
                var title = 'Should build %j from %j';

                _.forEach(s[1], function (s) {
                    var shouldText = util.format(title, s[0], s[1]);
                    it(shouldText, function () {
                        assert.strictEqual(rule.build(s[1]), s[0]);
                    });
                });
            });
        });
    });

    describe('Expecting type errors', function () {
        it('Should throw unknown type errors', function () {
            assert.throws(function () {
                return new Rule('<Unded:foo>', {
                    types: {
                        Xyz: '\\w+'
                    }
                }).getPathRule();
            });
        });
    });

    describe('Custom types', function () {
        var rule = new Rule('/post/<Number:postId>/', {
            types: {
                Number: '\\d+'
            }
        });

        it('Should match "/post/{Number}/"', function () {
            assert.deepEqual(rule.match('/post/42/'), {
                postId: '42'
            });
        });

        it('Should not match "/post/foo/"', function () {
            assert.strictEqual(rule.match('/post/foo/'), null);
        });
    });
});
