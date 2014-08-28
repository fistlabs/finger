'use strict';

var R_ADVANCED_PATTERN = /^\s*(?:((?:[a-z]+)(?:\s*,\s*(?:[a-z]+))*)\s+)?([\s\S]+?)(?:\s+([a-z]+))?\s*$/i;

var Pattern = /** @type Pattern */ require('./pattern');

var _ = require('lodash-node');
var inherit = require('inherit');
var hasProperty = Object.prototype.hasOwnProperty;
var querystring = require('querystring');
var uniqueId = require('unique-id');

var flag2ParamMap = {
    s: 'doNotMatchStart',
    e: 'doNotMatchEnd',
    i: 'ignoreCase'
};

var param2FlagMap = _.invert(flag2ParamMap);

/**
 * @class Route
 * @extends Pattern
 * */
var Route = inherit(Pattern, /** @lends Route.prototype */ {

    /**
     * @private
     * @memberOf {Route}
     * @method
     *
     * @constructs
     *
     * @param {String} pattern
     * @param {Object} [params]
     * @param {Object} [data]
     * */
    __constructor: function (pattern, params, data) {
        var match = Route.splitPattern(pattern);

        if (!_.isObject(params)) {
            params = {};
        }

        params = _.reduce(match.options, reduceFlag, params);

        this.__base(match.pattern, params);

        /**
         * @private
         * @memberOf {Route}
         * @property
         * @type {Object}
         * */
        this.__verbs = Object.create(null);
        this.__verbs.GET = true;

        if (match.methods) {
            this.__verbs = reduceMethods(match.methods, {});
        }

        if (_.has(this.__verbs, 'GET')) {
            this.__verbs.HEAD = true;
        }

        /**
         * @public
         * @memberOf {Route}
         * @property
         * @type {Array<String>}
         * */
        this.allow = _.keys(this.__verbs);

        /**
         * @public
         * @memberOf {Route}
         * @property
         * @type {Object}
         * */
        this.data = _.extend({name: uniqueId()}, data);
    },

    /**
     * @public
     * @memberOf {Route}
     * @method
     *
     * @param {*} [opts]
     *
     * @returns {String}
     * */
    build: function (opts) {

        return Route._build(this, opts);
    },

    /**
     * @public
     * @memberOf {Route}
     * @method
     *
     * @returns {String}
     * */
    toString: function () {
        var pattern = this.__base();
        var flags = _.reduce(this.params, this.__reduceParam2Flag, '', this);

        if (flags) {
            pattern += ' ' + flags;
        }

        return this.allow.join(',') + ' ' + pattern;
    },

    /**
     * @public
     * @memberOf {Route}
     * @method
     *
     * @param {String} verb
     * @param {String} path
     *
     * @returns {Array}
     * */
    match: function (verb, path) {
        var pq = Route.splitPath(path);
        var result = this.__base(pq[0]);

        if (result && pq[1]) {
            result = _.extend(parseQuery(pq[1]), result);
        }

        return [verb in this.__verbs, result];
    },

    /**
     * @private
     * @memberOf {Route}
     * @method
     *
     * @param {String} flags
     * @param {Boolean} value
     * @param {String} name
     *
     * @returns {String}
     * */
    __reduceParam2Flag: function (flags, value, name) {

        if (_.has(param2FlagMap, name)) {

            if (value) {
                flags += param2FlagMap[name].toLowerCase();

            } else {
                flags += param2FlagMap[name].toUpperCase();
            }
        }

        return flags;
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Route
     * @method
     *
     * @param {String} pattern
     * @param {Object} [opts]
     *
     * @returns {String}
     * */
    buildPath: function (pattern, opts) {

        var pq = Route.splitPath(pattern);

        if (pq[1]) {
            pq[1] = parseQuery(pq[1]);

            if (_.isObject(opts)) {
                opts = _.extend(pq[1], opts);

            } else {
                opts = pq[1];
            }
        }

        return this.__base(pq[0], opts);
    },

    /**
     * @public
     * @static
     * @memberOf Route
     * @method
     *
     * @param {String} path
     *
     * @returns {Array}
     * */
    splitPath: function (path) {

        var i = path.indexOf('?');

        if (-1 === i) {

            return [path, ''];
        }

        return [path.slice(0, i), path.slice(i + 1)];
    },

    /**
     * @public
     * @static
     * @memberOf Route
     * @method
     *
     * @param {String} pattern
     *
     * @returns {Array}
     * */
    splitPattern: function (pattern) {
        var match = R_ADVANCED_PATTERN.exec(pattern);

        if (_.isNull(match)) {

            throw new SyntaxError(pattern);
        }

        return {
            methods: match[1],
            pattern: match[2],
            options: match[3]
        };
    },

    /**
     * @protected
     * @static
     * @memberOf Route
     * @method
     *
     * @param {Parser} parser
     * @param {Object} opts
     *
     * @returns {String}
     * */
    _build: function (parser, opts) {

        var isQueryEmpty = true;
        var name;
        var pathname = this.__base(parser, opts);
        var query = {};
        var using = parser.using;

        for (name in opts) {

            if (hasProperty.call(opts, name)) {

                if (using.hasOwnProperty(name)) {

                    continue;
                }

                isQueryEmpty = false;
                query[name] = opts[name];
            }
        }

        if (isQueryEmpty) {

            return pathname;
        }

        return pathname + '?' + stringifyQuery(query);
    }

});

/**
 * @private
 * @static
 * @memberOf Route
 * @method
 *
 * @param {Object} query
 *
 * @returns {String}
 * */
function stringifyQuery(query) {

    var i;
    var k;
    var l;
    var q = [];
    var v;

    for (k in query) {

        if (query.hasOwnProperty(k)) {
            v = query[k];

            if (_.isArray(v)) {

                for (i = 0, l = v.length; i < l; i += 1) {
                    q[q.length] = stringifyPrimitive(k) +
                    '=' + stringifyPrimitive(v[i]);
                }

                continue;
            }

            q[q.length] = stringifyPrimitive(k) +
            '=' + stringifyPrimitive(v);
        }
    }

    return q.join('&');
}

function parseQuery(q) {

    return querystring.parse(q);
}

/**
 * @private
 * @static
 * @memberOf Route
 * @method
 *
 * @param {*} v
 *
 * @returns {String}
 * */
function stringifyPrimitive(v) {

    if (_.isString(v)) {

        return encodeURIComponent(v);
    }

    if (_.isBoolean(v) || _.isNumber(v) && _.isFinite(v)) {

        return String(v);
    }

    return '';
}

/**
 * @private
 * @static
 * @memberOf Route
 * @method
 *
 * @param {Object} params
 * @param {String} name
 *
 * @returns {Object}
 * */
function reduceFlag(params, name) {

    var lowerName = name.toLowerCase();
    var isLowerCased = name === lowerName;

    name = lowerName;

    if (_.has(flag2ParamMap, name)) {
        name = flag2ParamMap[name];
    }

    params[name] = isLowerCased;

    return params;
}

/**
 * @private
 * @memberOf Route
 * @method
 *
 * @param {Object} methods
 * @param {String} m
 *
 * @returns {Object}
 * */
function reduceMethod(methods, m) {
    methods[m.trim().toUpperCase()] = true;

    return methods;
}

/**
 * @private
 * @memberOf Route
 * @method
 *
 * @param {String} methods
 * @param {Object} init
 *
 * @returns {Object}
 * */
function reduceMethods(methods, init) {

    return _.reduce(methods.split(','), reduceMethod, init);
}

module.exports = Route;
