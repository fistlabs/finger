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

        if (!qs || !_.isString(qs)) {

            return obus.valueOf();
        }

        return _.reduce(qs.split('&'), this.__addPair, obus, this).valueOf();
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
        var paths = findPaths([], qo);
        var pairs = [];

        _.forEach(paths, function (pair) {
            var key = pair[0];
            var val = pair[1];

            if (val) {
                pair =  key + '=' + val;
            } else {
                pair = key;
            }

            pairs.push(pair);
        }, this);

        return pairs.join('&');
    },

    /**
     * @private
     * @memberOf {QueryString}
     * @method
     *
     * @param {Obus} obus
     * @param {String} pair
     *
     * @returns {Obus}
     * */
    __addPair: function (obus, pair) {
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

        return obus.add(unescape(key), unescape(val));
    }

});

function unescape(s) {

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

function findPaths(branch, o) {
    var paths = [];

    _.forOwn(o, function (v, part) {
        var parts = branch.concat(Obus.escape(part));
        addToPaths(paths, parts, v);
    });

    return paths;
}

function addToPaths(paths, parts, v) {
    if (!_.isObject(v)) {
        parts = parts.join('.');
        parts = encodeURIComponent(parts);
        v = stringifyVal(v);
        v = encodeURIComponent(v);

        paths[paths.length] = [parts, v];

        return;
    }

    if (!_.isArray(v)) {
        Array.prototype.push.apply(paths, findPaths(parts, v));

        return;
    }

    _.forEach(v, function (v, i) {
        if (_.isObject(v)) {
            addToPaths(paths, parts.concat(String(i)), v);
        } else {
            addToPaths(paths, parts, v);
        }
    });
}

module.exports = new QueryString();
