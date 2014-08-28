'use strict';

var R_PATTERN = /^\s*(?:((?:\w+)(?:\s*,\s*(?:\w+))*)\s+)?([\s\S]*)$/;
var Pattern = /** @type Pattern */ require('./pattern');

var _ = require('lodash-node');
var inherit = require('inherit');
var hasProperty = Object.prototype.hasOwnProperty;
var querystring = require('querystring');
var uniqueId = require('unique-id');

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

        var match = R_PATTERN.exec(pattern);

        this.__base(match[2], params);

        /**
         * @private
         * @memberOf {Route}
         * @property
         * @type {Object}
         * */
        this.__verbs = Object.create(null);
        this.__verbs.GET = true;

        if (match[1]) {
            this.__verbs = reduceMethods(match[1], Object.create(null));
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

        return this.allow.join(',') + ' ' + this.__base();
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
        var pathname = Pattern._build(parser, opts);
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

    if (typeof v === 'string') {

        return encodeURIComponent(v);
    }

    if (typeof v === 'boolean' || typeof v === 'number' && isFinite(v)) {

        return String(v);
    }

    return '';
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
