/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/match', function () {
    var Matcher = require('../core/matcher');
    var Match = require('../core/match');

    it('Should iterate routes match results', function () {
        var matcher = new Matcher();
        matcher.addRule('/', {name: 1});
        matcher.addRule('/foo/', {name: 2});
        matcher.addRule('/bar/', {name: 3});

        var match = new Match(matcher, '/');

        assert.deepEqual(match.next(), {
            done: false,
            value: {
                name: 1,
                args: {}
            }
        });

        assert.deepEqual(match.next(), {
            done: false,
            value: {
                name: 2,
                args: null
            }
        });

        assert.deepEqual(match.next(), {
            done: true,
            value: {
                name: 3,
                args: null
            }
        });

        assert.deepEqual(match.next(), {
            done: true,
            value: null
        });
    });

});
