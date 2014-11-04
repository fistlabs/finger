'use strict';

var hasProperty = Object.prototype.hasOwnProperty;

/**
 * @class Query
 * */
function Query() {}

/**
 * @public
 * @memberOf {Query}
 * @method
 *
 * @see encodeURIComponent
 *
 * @returns {String}
 * */
Query.prototype.escape = encodeURIComponent;

/**
 * @public
 * @memberOf {Query}
 * @method
 *
 * @param {String} subj
 *
 * @returns {String}
 * */
Query.prototype.unescape = function (subj) {

    if (subj.indexOf('%') === -1) {
        return subj;
    }

    try {
        return decodeURIComponent(subj);
    } catch (err) {
        return subj;
    }
};

/**
 * @public
 * @memberOf {Query}
 * @method
 *
 * @param {String} queryString
 * @param {String} sep
 * @param {String} eq
 *
 * @returns {Object}
 * */
Query.prototype.parse = function (queryString, sep, eq) {
    var eqIndex;
    var i;
    var key;
    var l;
    var pair;
    var pairs = queryString.split(sep);
    var val;
    var queryObject = {};

    for (i = 0, l = pairs.length; i < l; i += 1) {
        pair = pairs[i];
        pair = pair.replace(/\+/g, '%20');
        eqIndex = pair.indexOf(eq);

        if (eqIndex === -1) {
            key = this.unescape(pair);
            val = '';
        } else {
            key = this.unescape(pair.substr(0, eqIndex));
            val = this.unescape(pair.substr(eqIndex + 1));
        }

        if (!hasProperty.call(queryObject, key)) {
            queryObject[key] = val;
        } else if (Array.isArray(queryObject[key])) {
            queryObject[key].push(val);
        } else {
            queryObject[key] = [queryObject[key], val];
        }
    }

    return queryObject;
};

/**
 * @public
 * @memberOf {Query}
 * @method
 *
 * @param {*} [v]
 *
 * @returns {Object}
 * */
Query.prototype.stringifyQueryArg = function (v) {
    var t = typeof v;

    if (t === 'string') {
        return this.escape(v);
    }

    if (t === 'boolean' || t === 'number' && isFinite(v)) {

        return String(v);
    }

    return '';
};

/**
 * @public
 * @memberOf {Query}
 * @method
 *
 * @param {*} [v]
 *
 * @returns {Object}
 * */
Query.prototype.stringifyPathArg = function (v) {
    return this.stringifyQueryArg(v).replace(/%2F/g, '/');
};

module.exports = Query;
