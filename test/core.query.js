/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var util = require('util');

describe('core/query', function () {
    /*eslint max-nested-callbacks: 0*/
    var Query = require('../core/query');

    describe('{Query}.params', function () {

        it('Should have own property "params"', function () {
            var query = new Query();
            assert.ok(query.hasOwnProperty('params'));
        });

        it('Should be an Object', function () {
            var query = new Query();
            assert.strictEqual(Object(query.params), query.params);
        });

        it('Should support custom params', function () {
            var params = {foo: 'bar'};
            var query = new Query(params);
            assert.strictEqual(query.params, params);
        });
    });

    describe('{Query}.escape', function () {
        it('Should have own method "escape"', function () {
            var query = new Query();
            assert.strictEqual(typeof query.escape, 'function');
        });

        it('Should escape " " to "%20"', function () {
            var query = new Query();
            assert.strictEqual(query.escape(' '), '%20');
        });
    });

    describe('{Query}.unescape', function () {
        it('Should have own method "unescape"', function () {
            var query = new Query();
            assert.strictEqual(typeof query.unescape, 'function');
        });

        it('Should correctly unescape strings', function () {
            var query = new Query();
            assert.strictEqual(query.unescape('%20'), ' ');
            assert.strictEqual(query.unescape('foo'), 'foo');
            assert.strictEqual(query.unescape('%%'), '%%');
        });
    });

    describe('{Query}.stringifyVal', function () {
        it('Should have own method "stringifyVal"', function () {
            var query = new Query();
            assert.strictEqual(typeof query.stringifyVal, 'function');
        });
        it('Should correctly stringify values', function () {
            var query = new Query();
            assert.strictEqual(query.stringifyVal(true), 'true');
            assert.strictEqual(query.stringifyVal(false), 'false');
            assert.strictEqual(query.stringifyVal('foo'), 'foo');
            assert.strictEqual(query.stringifyVal(' '), '%20');
            assert.strictEqual(query.stringifyVal(), '');
            assert.strictEqual(query.stringifyVal({}), '');
            assert.strictEqual(query.stringifyVal([]), '');
            assert.strictEqual(query.stringifyVal(5), '5');
            assert.strictEqual(query.stringifyVal(NaN), '');
            assert.strictEqual(query.stringifyVal(Infinity), '');
        });
    });

    describe('{Query}.parse', function () {
        var query = new Query({
            eq: '=',
            sep: '&'
        });
        var samples = [
            [
                'a=5',
                {
                    a: ['5']
                }
            ],
            [
                '\\a.b=42',
                {
                    'a.b': ['42']
                }
            ],
            [
                'a\\.b=42',
                {
                    'a\\.b': ['42']
                }
            ],
            [
                'a=1&a=2',
                {
                    a: ['1', '2']
                }
            ],
            [
                'a&b',
                {
                    a: [''],
                    b: ['']
                }
            ],
            [
                '',
                {}
            ]
        ];
        _.forEach(samples, function (s) {
            var shouldText = 'Should parse %j to %j';
            shouldText = util.format(shouldText, s[0], s[1]);
            it(shouldText, function () {
                assert.deepEqual(query.parse(s[0]), s[1]);
            });
        });
    });

    describe('{Query}.deeper', function () {
        var samples = [
            [
                {
                    a: 42
                },
                {
                    a: 42
                }
            ],
            [
                {
                    'a.b': 42
                },
                {
                    a: {
                        b: 42
                    }
                }
            ],
            [
                {
                    'a\\.b': 42
                },
                {
                    'a.b': 42
                }
            ],
            [
                {
                    '\\a.b': 42
                },
                {
                    a: {
                        b: 42
                    }
                }
            ],
            [
                {
                    a: 42,
                    'a.b': 42
                },
                {
                    a: {
                        b: 42
                    }
                }
            ],
            [
                {
                    a: [11],
                    'a.b': [42]
                },
                {
                    a: {
                        b: [42]
                    }
                }
            ],
            [
                {
                    a: 11,
                    'a.b': 12,
                    'a.b.c': 42
                },
                {
                    a: {
                        b: {
                            c: 42
                        }
                    }
                }
            ]
        ];
        var query = new Query();

        it('Should have own method "deeper"', function () {
            assert.strictEqual(typeof query.deeper, 'function');
        });

        _.forEach(samples, function (s) {
            var shouldText = 'Should transform %j to %j';
            shouldText = util.format(shouldText, s[0], s[1]);
            it(shouldText, function () {
                assert.deepEqual(query.deeper(s[0]), s[1]);
            });
        });
    });

    describe('{Query}.flatten', function () {
        var samples = [
            [
                {
                    a: 42
                },
                {
                    a: 42
                }
            ],
            [
                {
                    a: {
                        b: 42
                    }
                },
                {
                    'a.b': 42
                }
            ],
            [
                {
                    'a.b': {
                        c: 42
                    }
                },
                {
                    'a\\.b.c': 42
                }
            ],
            [
                {
                    'a\\.b': {
                        c: 42
                    }
                },
                {
                    'a\\\\\\.b.c': 42
                }
            ],
            [
                {
                    a: {
                        b: {
                            c: 42
                        }
                    }
                },
                {
                    'a.b.c': 42
                }
            ]
        ];
        var query = new Query();

        it('Should have own method "flatten"', function () {
            assert.strictEqual(typeof query.flatten, 'function');
        });

        _.forEach(samples, function (s) {
            var shouldText = 'Should transform %j to %j';
            shouldText = util.format(shouldText, s[0], s[1]);
            it(shouldText, function () {
                assert.deepEqual(query.flatten(s[0]), s[1]);
            });
        });
    });

    describe('Query.addValue', function () {
        it('Should have static method "addValue"', function () {
            assert.strictEqual(typeof Query.addValue, 'function');
        });

        it('Should add value to object', function () {
            var o = {};
            Query.addValue(o, 'test', 1);
            assert.deepEqual(o, {
                test: 1
            });
            Query.addValue(o, 'test', 2);
            assert.deepEqual(o, {
                test: [1, 2]
            });
            Query.addValue(o, 'test', 3);
            assert.deepEqual(o, {
                test: [1, 2, 3]
            });
        });
    });

});
