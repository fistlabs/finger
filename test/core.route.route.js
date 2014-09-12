/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var util = require('util');

describe('route/route', function () {
    /*eslint max-nested-callbacks: 0*/
    var Route = require('../core/route/route');

    describe('Route', function () {
        it('Should parse specified methods in pattern', function () {
            var r;

            r = new Route('/a/b/c');

            assert.deepEqual(r.allow.sort(), ['GET', 'HEAD'].sort());

            r = new Route('POST /a/b/c');

            assert.deepEqual(r.allow.sort(), ['POST'].sort());

            r = new Route(' GET, POST /a/b/c');

            assert.deepEqual(r.allow.sort(), ['GET', 'HEAD', 'POST'].sort());
        });

        it('Should support flags', function () {
            var route = new Route('/ isz');

            assert.deepEqual(route.params, {
                ignoreCase: true,
                doNotMatchStart: true,
                z: true
            });
        });
    });

    describe('{Route}.build', function () {
        var samples = [
            [
                [
                    '/disc/<wat>/',
                    null
                ],
                [
                    [
                        '/disc/c/?x=r',
                        {
                            wat: 'c',
                            x: 'r'
                        }
                    ],
                    [
                        '/disc/c/',
                        {
                            wat: 'c'
                        }
                    ]
                ]
            ],
            [
                [
                    '/?a=42',
                    null
                ],
                [
                    [
                        '/?a=42',
                        {}
                    ],
                    [
                        '/?a=54',
                        {
                            a: '54'
                        }
                    ]
                ]
            ],
            [
                [
                    '/<page.name>/',
                    null
                ],
                [
                    [
                        '/about/?page.value=xxx',
                        {
                            page: {
                                name: 'about',
                                value: 'xxx'
                            }
                        }
                    ]
                ]
            ]
        ];

        _.forEach(samples, function (sample) {
            var header = 'new Route("%s", %j) should build "%s" from %j';
            var params = sample[0];
            var route = new Route(params[0], params[1]);

            _.forEach(sample[1], function (sample) {
                var title = util.format(header, params[0],
                    params[1], sample[0], sample[1]);

                it(title, function () {
                    assert.strictEqual(route.build(sample[1]), sample[0]);
                });
            });
        });
    });

    describe('{Route}.match', function () {
        var samples = [
            [
                [
                    'GET, POST /index.php',
                    {
                        ignoreCase: true
                    }
                ],
                [
                    [
                        ['GET', '/INDEX.PHP'],
                        {
                            verb: true,
                            path: {},
                            query: {},
                            pathname: {}
                        }
                    ],
                    [
                        ['HEAD', '/INDEX.PHP'],
                        {
                            verb: true,
                            path: {},
                            query: {},
                            pathname: {}
                        }
                    ],
                    [
                        ['POST', '/INDEX.PHP'],
                        {
                            verb: true,
                            path: {},
                            query: {},
                            pathname: {}
                        }
                    ]
                ]
            ],
            [
                [
                    '/<page>/',
                    null
                ],
                [
                    [
                        ['GET', '/assert/?a=5&page=100500'],
                        {
                            verb: true,
                            path: {
                                page: 'assert',
                                a: '5'
                            },
                            query: {
                                page: '100500',
                                a: '5'
                            },
                            pathname: {
                                page: 'assert'
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/<page.name>/',
                    null
                ],
                [
                    [
                        ['GET', '/about/?page.value=xxx'],
                        {
                            verb: true,
                            path: {
                                page: {
                                    name: 'about',
                                    value: 'xxx'
                                }
                            },
                            query: {
                                page: {
                                    value: 'xxx'
                                }
                            },
                            pathname: {
                                page: {
                                    name: 'about'
                                }
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/?a=42',
                    null
                ],
                [
                    [
                        ['GET', '/'],
                        {
                            verb: true,
                            path: null,
                            query: null,
                            pathname: {}

                        }
                    ]
                ]
            ],
            [
                [
                    '/?a=42',
                    null
                ],
                [
                    [
                        ['GET', '/?a=42'],
                        {
                            verb: true,
                            path: {
                                a: '42'
                            },
                            query: {
                                a: '42'
                            },
                            pathname: {}
                        }
                    ]
                ]
            ],
            [
                [
                    '/<a>/?a=42',
                    null
                ],
                [
                    [
                        ['GET', '/page/?a=42'],
                        {
                            verb: true,
                            path: {
                                a: 'page'
                            },
                            query: {
                                a: '42'
                            },
                            pathname: {
                                a: 'page'
                            }
                        }
                    ]
                ]
            ],
            [
                [
                    '/<a>/?a=42',
                    null
                ],
                [
                    [
                        ['GET', '/page/name/?a=42'],
                        {
                            verb: true,
                            path: null,
                            query: {
                                a: '42'
                            },
                            pathname: null
                        }
                    ]
                ]
            ],
            [
                [
                    '/?a=6&a=5',
                    null
                ],
                [
                    [
                        ['GET', '/?a=5&a=6'],
                        {
                            verb: true,
                            path: {
                                a: ['5', '6']
                            },
                            query: {
                                a: ['5', '6']
                            },
                            pathname: {}
                        }
                    ],
                    [
                        ['GET', '/?a=7&a=5'],
                        {
                            verb: true,
                            path: null,
                            query: null,
                            pathname: {}
                        }
                    ]
                ]
            ]
        ];

        _.forEach(samples, function (sample) {
            var header = 'new Route("%s", %j) Should match "%s %s" to %j';
            var params = sample[0];
            var route = new Route(params[0], params[1]);

            _.forEach(sample[1], function (sample) {
                var title = util.format(header, params[0], params[1],
                    sample[0][0], sample[0][1], sample[1]);

                it(title, function () {
                    var actual = route.match(sample[0][0], sample[0][1]);

                    assert.deepEqual(actual, sample[1]);
                });
            });
        });
    });

    describe('{Route}.toString', function () {
        var samples = [
            [
                [
                    ' PUT, POST /index.xml',
                    {
                        ignoreCase: true
                    }
                ],
                'PUT,POST /index.xml i'
            ],
            [
                [
                    '/index.xml i',
                    void 0
                ],
                'GET,HEAD /index.xml i'
            ],
            [
                [
                    '/',
                    {
                        doNotDoAnyThing: false
                    }
                ],
                'GET,HEAD /'
            ],
            [
                [
                    '/index.xml I',
                    void 0
                ],
                'GET,HEAD /index.xml I'
            ]
        ];

        _.forEach(samples, function (sample) {
            var header = 'String(new Route("%s", %j)) should be equal to "%s"';

            header = util.format(header, sample[0][0], sample[0][1], sample[1]);

            it(header, function () {
                var route = new Route(sample[0][0], sample[0][1]);

                assert.strictEqual(String(route), sample[1]);
            });
        });
    });

    describe('Route.buildPath', function () {
        var header = 'Should build %j from %j and %j';

        var samples = [
            [
                '/',
                {
                    a: 42
                },
                '/?a=42'
            ],
            [
                '/<section>/<itemId>/',
                {
                    a: 42,
                    section: 'post',
                    itemId: '100500'
                },
                '/post/100500/?a=42'
            ],
            [
                '/<section>/(<itemId>/)',
                {
                    a: 42,
                    section: 'post'
                },
                '/post/?a=42'
            ],
            [
                '/?b=5',
                null,
                '/?b=5'
            ],
            [
                '/?b=5',
                {
                    a: 42
                },
                '/?b=5&a=42'
            ]
        ];

        _.forEach(samples, function (s) {
            var should = util.format(header, s[2], s[0], s[1]);

            it(should, function () {
                assert.strictEqual(Route.buildPath(s[0], s[1]), s[2]);
            });
        });
    });

    describe('Route.splitPath', function () {
        it('Should correctly split paths onto pathname and query', function () {
            assert.deepEqual(Route.splitPath('/'), ['/', '']);
            assert.deepEqual(Route.splitPath('/?a=5'), ['/', 'a=5']);
            assert.deepEqual(Route.splitPath('/?a=5?b=6'), ['/', 'a=5?b=6']);
        });
    });

    describe('Route.splitPattern', function () {
        var samples = [
            [
                'GET /a/ i',
                ['GET', '/a/', '', 'i']
            ],
            [
                'GET,POST /a/ i',
                ['GET,POST', '/a/', '', 'i']
            ],
            [
                'GET  /a/ ',
                ['GET', '/a/', '', void 0]
            ],
            [
                '  /a/ /b/ i',
                [void 0, '/a/ /b/', '', 'i']
            ],
            [
                'a',
                [void 0, 'a', '', void 0]
            ],
            [
                'GET /<page>/?a=42 ise',
                ['GET', '/<page>/', 'a=42', 'ise']
            ]
        ];

        _.forEach(samples, function (sample) {
            var header = 'Should split "%s" to %j';

            header = util.format(header, sample[0], sample[1]);

            it(header, function () {
                assert.deepEqual(Route.splitPattern(sample[0]), sample[1]);
            });
        });

        it('Should throw the SyntaxError', function () {
            assert.throws(function () {
                return Route.splitPattern('');
            }, SyntaxError);
        });
    });
});
