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

    describe('{Query}.stringifyQueryArg', function () {
        it('Should have own method "stringifyQueryArg"', function () {
            var query = new Query();
            assert.strictEqual(typeof query.stringifyQueryArg, 'function');
        });
        it('Should correctly stringify values', function () {
            var query = new Query();
            assert.strictEqual(query.stringifyQueryArg(true), 'true');
            assert.strictEqual(query.stringifyQueryArg(false), 'false');
            assert.strictEqual(query.stringifyQueryArg('foo'), 'foo');
            assert.strictEqual(query.stringifyQueryArg(' '), '%20');
            assert.strictEqual(query.stringifyQueryArg(), '');
            assert.strictEqual(query.stringifyQueryArg({}), '');
            assert.strictEqual(query.stringifyQueryArg([]), '');
            assert.strictEqual(query.stringifyQueryArg(5), '5');
            assert.strictEqual(query.stringifyQueryArg(NaN), '');
            assert.strictEqual(query.stringifyQueryArg(Infinity), '');
        });
    });

    describe('{Query}.stringifyPathArg', function () {
        it('Should have own method "stringifyPathArg"', function () {
            var query = new Query();
            assert.strictEqual(typeof query.stringifyPathArg, 'function');
        });
        it('Should correctly stringify values', function () {
            var query = new Query();
            assert.strictEqual(query.stringifyPathArg(true), 'true');
            assert.strictEqual(query.stringifyPathArg(false), 'false');
            assert.strictEqual(query.stringifyPathArg('foo'), 'foo');
            assert.strictEqual(query.stringifyPathArg(' '), '%20');
            assert.strictEqual(query.stringifyPathArg(), '');
            assert.strictEqual(query.stringifyPathArg({}), '');
            assert.strictEqual(query.stringifyPathArg([]), '');
            assert.strictEqual(query.stringifyPathArg(5), '5');
            assert.strictEqual(query.stringifyPathArg(NaN), '');
            assert.strictEqual(query.stringifyPathArg(Infinity), '');
            assert.strictEqual(query.stringifyPathArg('/foo/'), '/foo/');
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
            ],
            [
                {
                    'a.b': 42,
                    a: 11
                },
                {
                    a: {
                        b: 42
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

    describe('{Query}.addValue', function () {
        it('Should have own method "addValue"', function () {
            var query = new Query();
            assert.strictEqual(typeof query.addValue, 'function');
        });

        it('Should add value to object', function () {
            var query = new Query();
            var o = {};
            query.addValue(o, 'test', 1);
            assert.deepEqual(o, {
                test: 1
            });
            query.addValue(o, 'test', 2);
            assert.deepEqual(o, {
                test: [1, 2]
            });
            query.addValue(o, 'test', 3);
            assert.deepEqual(o, {
                test: [1, 2, 3]
            });
        });
    });

});
