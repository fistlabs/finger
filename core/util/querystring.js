'use strict';

var Obus = require('obus');

var _ = require('lodash-node');
var inherit = require('inherit');
var querystring = require('querystring');

/**
 * @class QueryString
 * */
var QueryString = inherit(/** @lends QueryString.prototype */ {

    /**
     * @public
     * @memberOf {QueryString}
     * @method
     *
     * @param {String} qs
     *
     * @returns {Object}
     * */
    parse: function (qs) {
        var obus = new Obus({});

        if (qs && _.isString(qs)) {
            obus = _.reduce(qs.split('&'), parsePair, obus);
        }

        return obus.valueOf();
    },

    /**
     * @public
     * @memberOf {QueryString}
     * @method
     *
     * @param {Object} qo
     *
     * @returns {String}
     * */
    stringify: function (qo) {

        return findPairs([], qo).join('&');
    }

});

function parsePair(obus, pair) {
    var eqi;
    var key;
    var val;

    pair = pair.replace(/\+/g, '%20');
    eqi = pair.indexOf('=');

    if (eqi === -1) {
        key = pair;
        val = '';

    } else {
        key = pair.substr(0, eqi);
        val = pair.substr(eqi + 1);
    }

    return obus.add(decodeSafe(key), decodeSafe(val));
}

function decodeSafe(s) {

    try {

        return decodeURIComponent(s);
    } catch (err) {

        return querystring.unescape(s, true);
    }
}

function stringifyVal(v) {
    var t = typeof v;

    if (t === 'string' || t === 'boolean' || t === 'number' && _.isFinite(v)) {

        return String(v);
    }

    return '';
}

function findPairs(parts, o) {
    var pairs = [];

    _.forOwn(o, function (v, part) {
        addToPairs(pairs, parts.concat(Obus.escape(part)), v);
    });

    return pairs;
}

function addToPairs(pairs, parts, v) {
    if (!_.isObject(v)) {
        parts = parts.join('.');
        parts = encodeURIComponent(parts);
        v = stringifyVal(v);

        if (v) {
            parts += '=' + encodeURIComponent(v);
        }

        pairs[pairs.length] = parts;

        return;
    }

    if (!_.isArray(v)) {
        Array.prototype.push.apply(pairs, findPairs(parts, v));

        return;
    }

    _.forEach(v, function (v, i) {
        if (_.isObject(v)) {
            addToPairs(pairs, parts.concat(String(i)), v);
        } else {
            addToPairs(pairs, parts, v);
        }
    });
}

module.exports = new QueryString();
