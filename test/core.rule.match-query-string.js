/*eslint max-nested-callbacks: 0*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var f = require('util').format;

describe('core/rule#matchQueryString', function () {
    var Rule = require('../core/rule');
    var samples = [
        [
            '/?foo',
            [
                [
                    'foo=bar',
                    {
                        foo: 'bar'
                    }
                ],
                [
                    'foo',
                    {
                        foo: void 0
                    }
                ],
                [
                    'foo=baz&foo=bar',
                    {
                        foo: 'baz'
                    }
                ],
                [
                    'bar=baz',
                    {
                        foo: void 0
                    }
                ]
            ]
        ],
        [
            '/?foo=def',
            [
                [
                    'bar',
                    {
                        foo: 'def'
                    }
                ],
                [
                    'foo',
                    {
                        foo: 'def'
                    }
                ],
                [
                    'foo=',
                    {
                        foo: 'def'
                    }
                ],
                [
                    'foo=bar',
                    {
                        foo: 'bar'
                    }
                ],
                [
                    'foo=&foo=baz',
                    {
                        foo: 'baz'
                    }
                ],
                [
                    'foo=&foo=&foo=baz',
                    {
                        foo: 'baz'
                    }
                ]
            ]
        ],
        [
            '/?foo?foo',
            [
                [
                    '',
                    {
                        foo: []
                    }
                ],
                [
                    'foo=bar',
                    {
                        foo: ['bar']
                    }
                ],
                [
                    'foo=bar&foo=baz',
                    {
                        foo: ['bar', 'baz']
                    }
                ],
                [
                    'foo=&foo=bar&foo=baz',
                    {
                        foo: ['bar', 'baz']
                    }
                ],
                [
                    'foo=&foo=&foo=bar&foo=baz&foo=zot',
                    {
                        foo: ['bar', 'baz']
                    }
                ],
                [
                    'foo=xyz&foo=&foo=&foo=bar&foo=baz&foo=zot',
                    {
                        foo: ['xyz', 'bar']
                    }
                ]
            ]
        ],
        [
            '/&foo+?{6}:foo&foo',
            [
                [
                    'foo=bar&foo=zot&foo=baz',
                    {
                        foo: ['bar', 'zot', 'baz']
                    }
                ],
                [
                    'foo=bar&foo=6&foo=baz',
                    {
                        foo: ['bar', '6', 'baz']
                    }
                ]
            ]
        ],
        [
            '/?foo+&{6}:foo&foo+',
            [
                [
                    'foo=bar&foo=zot&foo=baz',
                    null
                ],
                [
                    'foo=bar&foo=moo&foo=6&foo=baz',
                    {
                        foo: ['bar', 'moo', '6', 'baz']
                    }
                ]
            ]
        ],
        [
            '/&{1|2|3|4}:foo+&{2|3|4}:foo+&{3|4}:foo+&{4}:foo+',
            [
                [
                    'foo=1&foo=2&foo=3&foo=4',
                    {
                        foo: ['1', '2', '3', '4']
                    }
                ],
                [
                    'foo=1&foo=1&foo=2&foo=1&foo=2&foo=3&foo=1&foo=2&foo=3&foo=4',
                    {
                        foo: ['1', '1', '2', '1', '2', '3', '1', '2', '3', '4']
                    }
                ],
                [
                    'foo=1&foo=5&foo=1&foo=2&foo=5&foo=5&foo=1&foo=5&foo=2&' +
                        'foo=3&foo=1&foo=5&foo=5&foo=2&foo=3&foo=5&foo=5&foo=4&foo=5',
                    {
                        foo: ['1', '1', '2', '1', '2', '3', '1', '2', '3', '4']
                    }
                ]
            ]
        ],
        [
            '/?{\\d+}:foo+',
            [
                [
                    '',
                    {
                        foo: []
                    }
                ],
                [
                    'foo',
                    {
                        foo: []
                    }
                ],
                [
                    'foo=bar',
                    {
                        foo: []
                    }
                ],
                [
                    'foo=11',
                    {
                        foo: ['11']
                    }
                ],
                [
                    'foo=1&foo=2',
                    {
                        foo: ['1', '2']
                    }
                ]
            ]
        ],
        [
            '/?{\\d+}:foo=DEF+',
            [
                [
                    '',
                    {
                        foo: ['DEF']
                    }
                ],
                [
                    'foo',
                    {
                        foo: ['DEF']
                    }
                ],
                [
                    'foo=bar',
                    {
                        foo: ['DEF']
                    }
                ],
                [
                    'foo=11',
                    {
                        foo: ['11']
                    }
                ],
                [
                    'foo=1&foo=2',
                    {
                        foo: ['1', '2']
                    }
                ]
            ]
        ],
        [
            '/?{\\d+}:foo&{\\d+}:foo+?{\\d+}:foo',
            [
                [
                    'foo=5',
                    {
                        foo: ['5']
                    }
                ]
            ]
        ],
        [
            '/?{\\d+}:foo=42&{\\d+}:foo+?{\\d+}:foo',
            [
                [
                    'foo=5',
                    {
                        foo: ['42', '5']
                    }
                ]
            ]
        ]
    ];

    _.forEach(samples, function (sample) {
        var ruleString = sample[0];
        var queryTests = sample[1];
        var rule = new Rule(ruleString);
        _.forEach(queryTests, function (queryTest) {
            var queryString = queryTest[0];
            var expectedMatchResult = queryTest[1];

            it(f('Should match %j on %j with result %j', queryString, ruleString, expectedMatchResult), function () {
                var actualMatchResult = rule.matchQueryString(queryString);
                assert.deepEqual(actualMatchResult, expectedMatchResult);
            });
        });
    });
});
