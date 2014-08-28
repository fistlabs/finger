/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var util = require('util');

describe('route/parser', function () {
    /*eslint max-nested-callbacks: 0*/
    var Parser = require('../route/parser');

    describe('Parser', function () {

        describe('SyntaxErrors', function () {
            var samples = [
                '<(',
                '<a(',
                ')',
                '()',
                '<<',
                '<a<',
                '>',
                '<>',
                '(',
                '<',
                '\\',
                '',
                ',',
                '<param=>',
                '<param=,>',
                '<param=a,>',
                '=',
                '(=)',
                'x,',
                '<param=a=>',
                '<param=a',
                '(a<b>(<c>d)',
                '<para/m>',
                '<param=c/d>'
            ];

            _.forEach(samples, function (pattern) {
                var header = 'Should throw a SyntaxError while parsing "%s"';

                it(util.format(header, pattern), function () {
                    assert.throws(function () {

                        return new Parser(pattern);
                    }, SyntaxError);
                });
            });
        });

        describe('Expecting AST', function () {
            var samples = [
                [
                    '/a/b',
                    [
                        {
                            type: Parser.PART_DELIM
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'a',
                            encoded: 'a'
                        },
                        {
                            type: Parser.PART_DELIM
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'b',
                            encoded: 'b'
                        }
                    ]
                ],
                [
                    '/a/b/',
                    [
                        {
                            type: Parser.PART_DELIM
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'a',
                            encoded: 'a'
                        },
                        {
                            type: Parser.PART_DELIM
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'b',
                            encoded: 'b'
                        },
                        {
                            type: Parser.PART_DELIM
                        }
                    ]
                ],
                [
                    '/a/<\\/b=c\\/d>',
                    [
                        {
                            type: Parser.PART_DELIM
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'a',
                            encoded: 'a'
                        },
                        {
                            type: Parser.PART_DELIM
                        },
                        {
                            type: Parser.PART_PARAM,
                            body: '/b',
                            parts: [
                                {
                                    type: Parser.PART_STATIC,
                                    body: 'c/d',
                                    encoded: encodeURIComponent('c/d')
                                }
                            ]
                        }
                    ]
                ],
                [
                    'a(<b>)',
                    [
                        {
                            type: Parser.PART_STATIC,
                            body: 'a',
                            encoded: 'a'
                        },
                        {
                            type: Parser.PART_OPTION,
                            parts: [
                                {
                                    type: Parser.PART_PARAM,
                                    body: 'b',
                                    parts: []
                                }
                            ]
                        }
                    ]
                ],
                [
                    'a(b)c',
                    [
                        {
                            type: Parser.PART_STATIC,
                            body: 'a',
                            encoded: 'a'
                        },
                        {
                            type: Parser.PART_OPTION,
                            parts: [
                                {
                                    type: Parser.PART_STATIC,
                                    body: 'b',
                                    encoded: 'b'
                                }
                            ]
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'c',
                            encoded: 'c'
                        }
                    ]
                ],
                [
                    'a<b>c',
                    [
                        {
                            type: Parser.PART_STATIC,
                            body: 'a',
                            encoded: 'a'
                        },
                        {
                            type: Parser.PART_PARAM,
                            body: 'b',
                            parts: []
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'c',
                            encoded: 'c'
                        }
                    ]
                ],
                [
                    'a<b=x,z>c',
                    [
                        {
                            type: Parser.PART_STATIC,
                            body: 'a',
                            encoded: 'a'
                        },
                        {
                            type: Parser.PART_PARAM,
                            body: 'b',
                            parts: [
                                {
                                    type: Parser.PART_STATIC,
                                    body: 'x',
                                    encoded: 'x'
                                },
                                {
                                    type: Parser.PART_STATIC,
                                    body: 'z',
                                    encoded: 'z'
                                }
                            ]
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'c',
                            encoded: 'c'
                        }
                    ]
                ],
                [
                    'a<b=\\,,a,\\,>c',
                    [
                        {
                            type: Parser.PART_STATIC,
                            body: 'a',
                            encoded: 'a'
                        },
                        {
                            type: Parser.PART_PARAM,
                            body: 'b',
                            parts: [
                                {
                                    type: Parser.PART_STATIC,
                                    body: ',',
                                    encoded: encodeURIComponent(',')
                                },
                                {
                                    type: Parser.PART_STATIC,
                                    body: 'a',
                                    encoded: 'a'
                                },
                                {
                                    type: Parser.PART_STATIC,
                                    body: ',',
                                    encoded: encodeURIComponent(',')
                                }
                            ]
                        },
                        {
                            type: Parser.PART_STATIC,
                            body: 'c',
                            encoded: 'c'
                        }
                    ]
                ]
            ];

            _.forEach(samples, function (sample) {
                var header = 'Should parse "%s" to\n%j';

                header = util.format(header, sample[0], sample[1]);

                it(header, function () {
                    var parser = new Parser(sample[0]);

                    assert.deepEqual(parser.parts, sample[1]);
                });
            });
        });
    });

    describe('Parser.create', function () {
        it('Should cache AST instances', function () {
            var parser = Parser.create('/');

            assert.strictEqual(parser, Parser.create('/'));
        });
    });

    describe('{Parser}.toString', function () {

        var samples = [
            '/a/(<b\\==c,d,\\,e>/<pa\\<ge>)',
            '/a/<a1>/(b/<b1>/(c/<c1>/(d/<d1>/)))'
        ];

        _.forEach(samples, function (sample) {
            var header = 'String(new Parser("%s")) \n' +
                         '\t\tshould be equal to "%s"';

            header = util.format(header, sample, sample);

            it(header, function () {
                assert.strictEqual(String(new Parser(sample)), sample);
            });
        });
    });

    describe('{Parser}.compile', function () {
        it('Should skip missing optional parts', function () {
            var parser = new Parser('a(<b>)c');

            var result = parser.compile(function (part, isBubbling) {

                if (Parser.PART_OPTION === part.type) {

                    if (isBubbling) {

                        return '';
                    }

                    return '';
                }

                if (part.body === 'b') {

                    return '';
                }

                return part.body;
            });

            assert.strictEqual(result, 'ac');
        });

        it('Should call callback in right order', function () {
            var parser = new Parser('/(<ns>/)disc/(<wat>/)');
            var spy = [];

            parser.compile(function (part, isBubbling) {
                spy.push([part.type, isBubbling]);

                return true;
            });

            assert.deepEqual(spy, [
                [Parser.PART_DELIM, false],
                [Parser.PART_PARAM, false],
                [Parser.PART_DELIM, false],
                [Parser.PART_OPTION, false],
                [Parser.PART_OPTION, true],
                [Parser.PART_STATIC, false],
                [Parser.PART_DELIM, false],
                [Parser.PART_PARAM, false],
                [Parser.PART_DELIM, false],
                [Parser.PART_OPTION, false],
                [Parser.PART_OPTION, true]
            ]);
        });
    });
});
