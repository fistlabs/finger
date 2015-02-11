/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var util = require('util');

describe('core/parser/parser', function () {
    /*eslint max-nested-callbacks: 0*/
    var RuleAny = require('../core/parser/rule-any');
    var RuleArg = require('../core/parser/rule-arg');
    var RuleSep = require('../core/parser/rule-sep');
    var RuleSeq = require('../core/parser/rule-seq');

    var parser = require('../core/parser/parser');

    describe('Expecting Errors', function () {
        var samples = [
            '&',
            '/&',
            '()',
            '',
            '<>',
            '(foo',
            '<foo=bar,',
            '<foo',
            '<foo=,',
            '/&a&',
            '<:z>',
            'x:z',
            '{}',
            '<{}:foo>',
            '<{:foo>',
            '<}:foo>',
            '<}Type:foo>',
            '<{Type:foo>',
            '<Type}:foo>',
            '<{{}:foo>',
            '<{}}:foo>',
            '<{{}}:foo>'
        ];
        var title = 'Should throw error while parsing %j';

        _.forEach(samples, function (s) {
            var shouldText = util.format(title, s);

            it(shouldText, function () {
                assert.throws(function () {
                    parser.parse(s);
                });
            });
        });
    });

    describe('Expecting AST', function () {
        var samples = [
            [
                '/',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ]
                }
            ],
            [
                'foo',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleAny.TYPE,
                            text: 'foo'
                        }
                    ]
                }
            ],
            [
                '<foo>',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            kind: '',
                            value: void 0,
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/post/(<postId>/)',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        },
                        {
                            type: RuleAny.TYPE,
                            text: 'post'
                        },
                        {
                            type: RuleSep.TYPE
                        },
                        {
                            type: RuleSeq.TYPE,
                            parts: [
                                {
                                    type: RuleArg.TYPE,
                                    name: 'postId',
                                    kind: '',
                                    value: void 0,
                                    regex: null
                                },
                                {
                                    type: RuleSep.TYPE
                                }
                            ]
                        }
                    ]
                }
            ],
            [
                '<kind:name>',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleArg.TYPE,
                            name: 'name',
                            kind: 'kind',
                            value: void 0,
                            regex: null
                        }
                    ]
                }
            ],
            [
                '<postId=42>',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleArg.TYPE,
                            name: 'postId',
                            kind: '',
                            value: '42',
                            regex: null
                        }
                    ]
                }
            ]
        ];

        var anonKindSamples = [
            [
                '<{\\d+}:foo>',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            value: void 0,
                            regex: '\\d+'
                        }
                    ]
                }
            ],
            [
                '<{\\{\\}}:foo>',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            value: void 0,
                            regex: '\\{\\}'
                        }
                    ]
                }
            ]
        ];

        var title = 'Should parse %j to \n%j';

        _.forEach(samples, function (s) {
            var shouldText = util.format(title, s[0], s[1]);
            it(shouldText, function () {
                var ast = parser.parse(s[0]);
                assert.deepEqual(ast, s[1]);
            });
        });

        _.forEach(anonKindSamples, function (s) {
            var shouldText = util.format(title, s[0], s[1]);
            it(shouldText, function () {
                var ast = parser.parse(s[0]);

                // cannot test equality of unique ids
                delete ast.parts[0].kind;
                delete s[1].parts[0].kind;

                assert.deepEqual(ast, s[1]);
            });
        });
    });
});
