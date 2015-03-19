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
            '<{{}}:foo>',
            ':',
            '<Foo::bar>'
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
                    query: []
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
                    query: []
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
                            regex: null,
                            required: true,
                            multiple: false
                        }
                    ],
                    query: []
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
                                    regex: null,
                                    required: true,
                                    multiple: false
                                },
                                {
                                    type: RuleSep.TYPE
                                }
                            ]
                        }
                    ],
                    query: []
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
                            regex: null,
                            required: true,
                            multiple: false
                        }
                    ],
                    query: []
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
                            regex: null,
                            required: true,
                            multiple: false
                        }
                    ],
                    query: []
                }
            ],
            [
                '<{\\d+}:foo>',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            value: void 0,
                            regex: '\\d+',
                            kind: '',
                            required: true,
                            multiple: false
                        }
                    ],
                    query: []
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
                            regex: '\\{\\}',
                            kind: '',
                            required: true,
                            multiple: false
                        }
                    ],
                    query: []
                }
            ],
            [
                '/?foo',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            required: false,
                            multiple: false,
                            kind: '',
                            value: void 0,
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/?foo+',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            required: false,
                            multiple: true,
                            kind: '',
                            value: void 0,
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/?Number:foo+',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            required: false,
                            multiple: true,
                            kind: 'Number',
                            value: void 0,
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/&bar',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'bar',
                            required: true,
                            multiple: false,
                            kind: '',
                            value: void 0,
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/&bar+',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'bar',
                            required: true,
                            multiple: true,
                            kind: '',
                            value: void 0,
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/&bar=OMG+',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'bar',
                            required: true,
                            multiple: true,
                            kind: '',
                            value: 'OMG',
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/?foo&bar',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            required: false,
                            multiple: false,
                            kind: '',
                            value: void 0,
                            regex: null
                        },
                        {
                            type: RuleArg.TYPE,
                            name: 'bar',
                            required: true,
                            multiple: false,
                            kind: '',
                            value: void 0,
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/?foo=\\=',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            required: false,
                            multiple: false,
                            kind: '',
                            value: '=',
                            regex: null
                        }
                    ]
                }
            ],
            [
                '/?{\\d+}:foo=100500+&Number:bar',
                {
                    type: RuleSeq.TYPE,
                    parts: [
                        {
                            type: RuleSep.TYPE
                        }
                    ],
                    query: [
                        {
                            type: RuleArg.TYPE,
                            name: 'foo',
                            required: false,
                            multiple: true,
                            kind: '',
                            value: '100500',
                            regex: '\\d+'
                        },
                        {
                            type: RuleArg.TYPE,
                            name: 'bar',
                            required: true,
                            multiple: false,
                            kind: 'Number',
                            value: void 0,
                            regex: null
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
