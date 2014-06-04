'use strict';

var R_PATTERN = /^\s*(?:((?:[^,\s]+)(?:\s*,\s*(?:[^,\s]+))*)\s+)?([\s\S]*)$/;
var Pattern = /** @type Pattern */ require('./Pattern');

var _ = require('lodash-node');
var hasProperty = Object.prototype.hasOwnProperty;
var uniqueId = require('unique-id');

/**
 * @class Route
 * @extends Pattern
 * */
var Route = Pattern.extend(/** @lends Route.prototype */ {

    /**
     * @protected
     * @memberOf {Route}
     * @method
     *
     * @constructs
     *
     * @param {String} pattern
     * @param {Object} [params]
     * @param {Object} [data]
     * */
    constructor: function (pattern, params, data) {

        var match = R_PATTERN.exec(pattern);

        Route.Parent.call(this, match[2], params);

        /**
         * @private
         * @memberOf {Route}
         * @property
         * @type {Object}
         * */
        this._verbs = Object.create(null);
        this._verbs.GET = true;

        if ( match[1] ) {
            this._verbs = reduceMethods(match[1], Object.create(null));
        }

        if ( _.has(this._verbs, 'GET') ) {
            this._verbs.HEAD = true;
        }

        /**
         * @public
         * @memberOf {Route}
         * @property
         * @type {Array<String>}
         * */
        this.allow = _.keys(this._verbs);

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

        var isQueryEmpty = true;
        var name;
        var pathname = Route.parent.build.call(this, opts);
        var query = {};

        for ( name in opts ) {

            if ( hasProperty.call(opts, name) ) {

                if ( this._usesOpt.hasOwnProperty(name) ) {

                    continue;
                }

                isQueryEmpty = false;
                query[name] = opts[name];
            }
        }

        if ( isQueryEmpty ) {

            return pathname;
        }

        return pathname + '?' + this._stringifyQuery(query);
    },

    /**
     * @private
     * @memberOf {Route}
     * @method
     *
     * @param {Object} query
     *
     * @returns {String}
     * */
    _stringifyQuery: function (query) {

        var result = [];
        var i;
        var k;
        var l;
        var v;

        for ( k in query ) {

            if ( query.hasOwnProperty(k) ) {
                v = query[k];

                if ( _.isArray(v) ) {

                    for ( i = 0, l = v.length; i < l; i += 1 ) {
                        result[result.length] = this._stringifyPrimitive(k) +
                            '=' + this._stringifyPrimitive(v[i]);
                    }

                    continue;
                }

                result[result.length] = this._stringifyPrimitive(k) +
                    '=' + this._stringifyPrimitive(v);
            }
        }

        return result.join('&');
    },

    /**
     * @private
     * @memberOf {Route}
     * @method
     *
     * @param {*} v
     *
     * @returns {String}
     * */
    _stringifyPrimitive: function (v) {

        if ( 'string' === typeof v ) {

            return encodeURIComponent(v);
        }

        if ( 'boolean' === typeof v || 'number' === typeof v && isFinite(v) ) {

            return String(v);
        }

        return '';
    },

    /**
     * @public
     * @memberOf {Route}
     * @method
     *
     * @param {String} verb
     * @param {String} pathname
     *
     * @returns {Array}
     * */
    match: function (verb, pathname) {

        return [verb in this._verbs, Route.parent.match.call(this, pathname)];
    }

});

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
function reduceMethod (methods, m) {
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
function reduceMethods (methods, init) {

    return _.reduce(methods.split(','), reduceMethod, init);
}

module.exports = Route;
