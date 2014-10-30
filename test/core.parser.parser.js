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
            'x:z'
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
                    ],
                    args: []
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
                    ],
                    args: []
                }
            ],
            [
                '<foo>',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleArg.TYPE,
                            name: ['foo'],
                            kind: '',
                            required: true
                        }
                    ],
                    args: []
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
                                    name: ['postId'],
                                    kind: '',
                                    required: true
                                },
                                {
                                    type: RuleSep.TYPE
                                }
                            ],
                            args: []
                        }
                    ],
                    args: []
                }
            ],
            [
                '/&a',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    args: [
                        {
                            type: RuleArg.TYPE,
                            name: ['a'],
                            kind: '',
                            required: true
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
                            name: ['name'],
                            kind: 'kind',
                            required: true
                        }
                    ],
                    args: []
                }
            ],
            [
                '/<name>&type?value',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        },
                        {
                            type: RuleArg.TYPE,
                            name: ['name'],
                            kind: '',
                            required: true
                        }
                    ],
                    args: [
                        {
                            type: RuleArg.TYPE,
                            name: ['type'],
                            kind: '',
                            required: true
                        },
                        {
                            type: RuleArg.TYPE,
                            name: ['value'],
                            kind: '',
                            required: false
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
    });
});
