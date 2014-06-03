'use strict';

var Parser = require('../../route/Parser');

module.exports = {
    Parser: [
        function (test) {

            var syntaxErrors = [
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

            syntaxErrors.forEach(function (ps) {
                test.throws(function () {
                    ps = new Parser(ps);
                }, SyntaxError);
            });

            test.done();
        },
        function (test) {

            var parser = new Parser('/a/b');

            test.deepEqual(parser.parts, [
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
            ]);

            test.done();
        },
        function (test) {

            var parser = new Parser('/a/<\\/b=c\\/d>');

            test.deepEqual(parser.parts, [
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
            ]);

            test.done();
        },
        function (test) {

            var parser = new Parser('/a/b/');

            test.deepEqual(parser.parts, [
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
            ]);

            test.done();
        },
        function (test) {

            var parser = new Parser('a(<b>)');

            test.deepEqual(parser.parts, [
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
            ]);

            test.done();
        },
        function (test) {

            var parser = new Parser('a(b)c');

            test.deepEqual(parser.parts, [
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
            ]);

            test.done();
        },
        function (test) {

            var parser = new Parser('a<b>c');

            test.deepEqual(parser.parts, [
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
            ]);

            test.done();
        },
        function (test) {

            var parser = new Parser('a<b=x,z>c');

            test.deepEqual(parser.parts, [
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
            ]);

            test.done();
        },
        function (test) {

            var parser = new Parser('a<b=\\,,a,\\,>c');

            test.deepEqual(parser.parts, [
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
            ]);

            test.done();
        }
    ],
    'Parser.prototype.compile': [
        function (test) {
            var parser = new Parser('a<b>(<c>d)');

            var result = parser.compile(function (part, bubble) {

                test.strictEqual(this, parser);

                if ( Parser.PART_OPTION === part.type ) {

                    if ( bubble ) {

                        return ')';
                    }

                    return '(';
                }

                if ( Parser.PART_STATIC === part.type ) {

                    return part.body;
                }

                if ( 'c' === part.body ) {

                    return '';
                }

                return '<' + part.body + '>';
            });

            test.strictEqual(result, 'a<b>');
            test.done();
        },
        function (test) {
            var parser = new Parser('a<b>');

            var result = parser.compile(function (part, bubble) {

                test.strictEqual(this, parser);

                if ( Parser.PART_OPTION === part.type ) {

                    if ( bubble ) {

                        return ')';
                    }

                    return '(';
                }

                if ( Parser.PART_STATIC === part.type ) {

                    return part.body;
                }

                if ( 'b' === part.body ) {

                    return '';
                }

                return '<' + part.body + '>';
            });

            test.strictEqual(result, 'a');
            test.done();
        }
    ],
    'Parser.prototype.toString': [
        function (test) {
            var pattern = '/a/(<b\\==c,d,\\,e>/<pa\\<ge>)';
            var p = new Parser(pattern);
            test.strictEqual(p.toString(), pattern);
            test.done();
        },
        function (test) {
            var pattern = '/a/<a1>/(b/<b1>/(c/<c1>/(d/<d1>/)))';
            var p = new Parser(pattern);
            test.strictEqual(p.toString(), pattern);
            test.done();
        }
    ]
};
