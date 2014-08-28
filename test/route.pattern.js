/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var util = require('util');

describe('route/parser', function () {
    /*eslint max-nested-callbacks: 0*/
    var Pattern = require('../route/Pattern');

    describe('Pattern', function () {

        it('Should support flags', function () {
            var pattern = new Pattern('/ isez', {
                ignoreCase: false,
                assert: true
            });

            assert.deepEqual(pattern.params, {
                ignoreCase: true,
                doNotMatchStart: true,
                doNotMatchEnd: true,
                z: true,
                assert: true
            });
        });
    });

    describe('{Pattern}.match', function () {
        var samples = [
            [
                [
                    '/a/',
                    {}
                ],
                [
                    [
                        '/a/',
                        {}
                    ],
                    [
                        '/A/',
                        null
                    ]
                ]
            ],
            [
                [
                    '/Ж/(<param>/)',
                    {
                        ignoreCase: true
                    }
                ],
                [
                    [
                        '/ж/',
                        {
                            param: void 0
                        }
                    ],
                    [
                        '/ж/жожо/',
                        {
                            param: 'жожо'
                        }
                    ],
                    [
                        util.format('/%s/%s/',
                            encodeURIComponent('ж'),
                            encodeURIComponent('жожо')
                        ),
                        {
                            param: 'жожо'
                        }
                    ]
                ]
            ],
            [
                [
                    '/a/',
                    {
                        ignoreCase: true
                    }
                ],
                [
                    [
                        '/a/',
                        {}
                    ],
                    [
                        '/A/',
                        {}
                    ]
                ]
            ],
            [
                [
                    '/Ж/(<param=assert,test2>/)',
                    {
                        ignoreCase: true
                    }
                ],
                [
                    [
                        '/ж/test1/',
                        null
                    ],
                    [
                        '/ж/assert/',
                        {
                            param: 'assert'
                        }
                    ],
                    [
                        '/ж/test2/',
                        {
                            param: 'test2'
                        }
                    ]
                ]
            ],
            [
                [
                    '/a/<param>/<param>/<param>/',
                    null
                ],
                [
                    [
                        '/a/b/c/d/',
                        {
                            param: ['b', 'c', 'd']
                        }
                    ]
                ]
            ],
            [
                [
                    '/images/ e',
                    null
                ],
                [
                    [
                        '/images/avatars/my-ava.gif',
                        {}
                    ]
                ]
            ],
            [
                [
                    '/<filename>.<ext=gif,jpg> s',
                    null
                ],
                [
                    [
                        '/images/avatars/my-ava.gif',
                        {
                            filename: 'my-ava',
                            ext: 'gif'
                        }
                    ],
                    [
                        '/images/avatars/my-ava0gif',
                        null
                    ],
                    [
                        '/images/avatars/my-ava.ico',
                        null
                    ],
                    [
                        '/images/avatars/my-ava.doc',
                        null
                    ]
                ]
            ],
            [
                [
                    '/ж/(<param>/)',
                    null
                ],
                [
                    [
                        util.format('/%s/', encodeURIComponent('ж')),
                        {
                            param: void 0
                        }
                    ],
                    [
                        util.format('/%s/%s/',
                            encodeURIComponent('ж'),
                            encodeURIComponent('жожо')
                        ),
                        {
                            param: 'жожо'
                        }
                    ],
                    [
                        '/%%',
                        null
                    ]
                ]
            ],
            [
                [
                    '/a/<param>/c/\t  se ',
                    {
                        ignoreCase: true
                    }
                ],
                [
                    [
                        '/x/A/b/C/d',
                        {
                            param: 'b'
                        }
                    ]
                ]
            ]
        ];

        _.forEach(samples, function (sample) {
            var s = sample[0][0];
            var params = sample[0][1];
            var pattern = new Pattern(s, params);
            var descHeader = util.format('new Pattern("%s", %j)', s, params);

            describe(descHeader, function () {

                _.forEach(sample[1], function (sample) {
                    var header = 'Should match "%s" and return %j';

                    header = util.format(header, sample[0], sample[1]);

                    it(header, function () {
                        assert.deepEqual(pattern.match(sample[0]), sample[1]);
                    });
                });
            });
        });
    });

    describe('{Pattern}.build', function () {
        var samples = [
            [
                [
                    '/a/',
                    null
                ],
                [
                    [
                        '/a/',
                        {}
                    ]
                ]
            ],
            [
                [
                    '/post/<param>/',
                    null
                ],
                [
                    [
                        '/post/2/',
                        {
                            param: '2'
                        }
                    ]
                ]
            ],
            [
                [
                    '/post/<param=1>/(<param=ok>/)',
                    null
                ],
                [
                    [
                        '/post/1/',
                        {
                            param: '1'
                        }
                    ],
                    [
                        '/post/1/',
                        {
                            param: ['1']
                        }
                    ],
                    [
                        '/post/1/ok/',
                        {
                            param: ['1', 'ok']
                        }
                    ],
                    [
                        '/post/1/woops/',
                        {
                            param: ['1', 'woops']
                        }
                    ],
                    [
                        '/post/1/',
                        {
                            param: ['1']
                        }
                    ],
                    [
                        '/post/1/',
                        {
                            param: '1'
                        }
                    ],
                    [
                        '/post/2/',
                        {
                            param: '2'
                        }
                    ],
                    [
                        '/post//',
                        void 0
                    ]
                ]
            ],
            [
                [
                    '/диск/<wat>/',
                    null
                ],
                [

                    [
                        util.format('/%s/%s/',
                            encodeURIComponent('диск'),
                            encodeURIComponent('цэ')
                        ),
                        {
                            wat: 'цэ'
                        }
                    ]
                ]
            ],
            [
                [
                    '/(<ns>/)disc/(<wat>-x/)',
                    null
                ],
                [
                    [
                        '/1/disc/c-x/',
                        {
                            wat: 'c',
                            ns: '1'
                        }
                    ],
                    [
                        '/1/disc/',
                        {
                            ns: '1'
                        }
                    ],
                    [
                        '/disc/c-x/',
                        {
                            wat: 'c'
                        }
                    ],
                    [
                        '/disc/',
                        void 0
                    ]
                ]
            ],
            [
                [
                    '/(<a>/)-/(<b>/)-/(<c>/)',
                    null
                ],
                [
                    [
                        '/-/-/c/',
                        {
                            c: 'c'
                        }
                    ],
                    [
                        '/-/b/-/c/',
                        {
                            b: 'b',
                            c: 'c'
                        }
                    ],
                    [
                        '/a/-/b/-/c/',
                        {
                            a: 'a',
                            b: 'b',
                            c: 'c'
                        }
                    ],
                    [
                        '/-/b/-/',
                        {
                            b: 'b'
                        }
                    ],
                    [
                        '/a/-/b/-/',
                        {
                            a: 'a',
                            b: 'b'
                        }
                    ],
                    [
                        '/a/-/-/',
                        {
                            a: 'a'
                        }
                    ]
                ]
            ],
            [
                [
                    '/hi/(st/(<a>/))b/',
                    null
                ],
                [
                    [
                        '/hi/st/b/',
                        void 0
                    ],
                    [
                        '/hi/st/5/b/',
                        {
                            a: '5'
                        }
                    ]
                ]
            ],
            [
                [
                    '/hi/(<a>foo<a1>bar/)',
                    null
                ],
                [
                    [
                        '/hi/',
                        void 0
                    ],
                    [
                        '/hi/',
                        {
                            a: 0
                        }
                    ],
                    [
                        '/hi/0foo1bar/',
                        {
                            a: 0,
                            a1: 1
                        }
                    ]
                ]
            ],
            [
                [
                    '/<x>/param/',
                    null
                ],
                [
                    [
                        '//param/',
                        void 0
                    ]
                ]
            ],
            [
                [
                    '/param/<x>/',
                    null
                ],
                [
                    [
                        '/param//',
                        void 0
                    ]
                ]
            ]
        ];

        _.forEach(samples, function (sample) {
            var s = sample[0][0];
            var params = sample[0][1];
            var pattern = new Pattern(s, params);
            var descHeader = util.format('new Pattern("%s", %j)', s, params);

            describe(descHeader, function () {

                _.forEach(sample[1], function (sample) {
                    var header = 'Should build "%s" from %j';

                    header = util.format(header, sample[0], sample[1]);

                    it(header, function () {
                        assert.deepEqual(pattern.build(sample[1]), sample[0]);
                    });
                });
            });
        });
    });

    describe('{Pattern}.toString', function () {
        var samples = [
            [
                '/(<ns>/)disc/(<wat>/)',
                '/(<ns>/)disc/(<wat>/)'
            ],
            [
                ' /a/b/c   iEs ',
                '/a/b/c iEs'
            ],
            [
                ' /a/b/c   iEsz ',
                '/a/b/c iEs'
            ],
            [
                ' /a/b/c  baz ',
                '/a/b/c'
            ]
        ];

        _.forEach(samples, function (sample) {
            var header = 'String(new Pattern("%s")) should be equal to\n"%s"';

            header = util.format(header, sample[0], sample[1]);

            it(header, function () {
                var pattern = new Pattern(sample[0]);
                assert.strictEqual(String(pattern), sample[1]);
            });
        });
    });

    describe('Pattern.buildUrl', function () {

        var samples = [
            [
                [
                    '/<page>/',
                    {
                        page: 'assert',
                        x: 42
                    }
                ],
                '/assert/'
            ]
        ];

        _.forEach(samples, function (sample) {
            var header = 'Should build "%s" from "%s" with "%j" as params';

            header = util.format(header, sample[1], sample[0][0], sample[0][1]);

            it(header, function () {
                var actual = Pattern.buildPath(sample[0][0], sample[0][1]);
                assert.strictEqual(actual, sample[1]);
            });
        });
    });

});
