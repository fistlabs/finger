'use strict';

var Obus = /** @type Obus */ require('obus');

var hasProperty = Object.prototype.hasOwnProperty;

/**
 * @class Query
 * @param {Object} params
 * @param {String} params.eq
 * @param {String} params.sep
 * */
function Query(params) {

    /**
     * @public
     * @memberOf {Query}
     * @property
     * @type {Object}
     * */
    this.params = Object(params);
}

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
 * @param {Object} queryString
 *
 * @returns {Object}
 * */
Query.prototype.parse = function (queryString) {
    var eqIndex;
    var i;
    var key;
    var l;
    var pair;
    var pairs;
    var val;
    var queryObject = {};

    if (!queryString) {
        return queryObject;
    }

    queryString = queryString.replace(/\+/g, '%20');
    pairs = queryString.split(this.params.sep);

    for (i = 0, l = pairs.length; i < l; i += 1) {
        pair = pairs[i];
        eqIndex = pair.indexOf(this.params.eq);

        if (eqIndex === -1) {
            key = this.unescape(pair);
            val = '';
        } else {
            key = this.unescape(pair.substr(0, eqIndex));
            val = this.unescape(pair.substr(eqIndex + 1));
        }

        if (hasProperty.call(queryObject, key)) {
            queryObject[key].push(val);
        } else {
            queryObject[key] = [val];
        }
    }

    return queryObject;
};

/**
 * @public
 * @memberOf {Query}
 * @method
 *
 * @param {Object} flatArgs
 *
 * @returns {Object}
 * */
Query.prototype.deeper = function (flatArgs) {
    var deepArgs = {};
    var valuePath;

    for (valuePath in flatArgs) {
        if (hasProperty.call(flatArgs, valuePath)) {
            deepPush(deepArgs, valuePath, flatArgs[valuePath]);
        }
    }

    return deepArgs;
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

function deepPush(deepArgs, valuePath, value) {
    var i;
    var l;
    var part;
    var parts = Obus.parse(valuePath);

    for (i = 0, l = parts.length - 1; i < l; i += 1) {
        part = parts[i];

        if (hasProperty.call(deepArgs, part) && deepArgs[part] &&
            typeof deepArgs[part] === 'object' && !Array.isArray(deepArgs[part])) {

            deepArgs = deepArgs[part];

            continue;
        }

        deepArgs = deepArgs[part] = {};
    }

    part = parts[l];

    if (!hasProperty.call(deepArgs, part)) {
        deepArgs[part] = value;
    }

    return deepArgs[part];
}

module.exports = Query;
