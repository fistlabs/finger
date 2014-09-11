/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var util = require('util');

describe('core/util/querystring', function () {
    /*eslint max-nested-callbacks: 0*/
    var qs = require('../core/util/querystring');

    describe('qs.parse', function () {
        var header = 'Should parse %j to %j';
        var samples = [
            [
                '',
                {}
            ],
            [
                null,
                {}
            ],
            [
                'a=5',
                {
                    a: '5'
                }
            ],
            [
                'a=5&b=6',
                {
                    a: '5',
                    b: '6'
                }
            ],
            [
                'a=&b',
                {
                    a: '',
                    b: ''
                }
            ],
            [
                '%%=%%',
                {
                    '%%': '%%'
                }
            ],
            [
                'a=100500&a.b=42',
                {
                    a: {
                        b: '42'
                    }
                }
            ],
            [
                'a.b=42&a=100500&a.b=43',
                {
                    a: {
                        b: ['42', '43']
                    }
                }
            ]
        ];

        _.forEach(samples, function (s) {
            var should = util.format(header, s[0], s[1]);

            it(should, function () {
                assert.deepEqual(qs.parse(s[0]), s[1]);
            });
        });
    });

    describe('qs.stringify', function () {
        var header = 'Should stringify %j to %j';
        var samples = [
            [
                {
                    a: 42
                },
                'a=42'
            ],
            [
                {
                    a: void 0
                },
                'a'
            ],
            [
                {
                    a: '42',
                    b: '43'
                },
                'a=42&b=43'
            ],
            [
                {
                    a: [42, 43]
                },
                'a=42&a=43'
            ],
            [
                {
                    a: {
                        b: [1, 2],
                        c: '43'
                    }
                },
                'a.b=1&a.b=2&a.c=43'
            ],
            [
                {
                    'a.b': 42
                },
                'a%5C.b=42'
            ],
            [
                {
                    a: [{b: 1}, {b: 2}]
                },
                'a.0.b=1&a.1.b=2'
            ]
        ];

        _.forEach(samples, function (s) {
            var should = util.format(header, s[0], s[1]);

            it(should, function () {
                assert.deepEqual(qs.stringify(s[0]), s[1]);
            });
        });

    });
});
