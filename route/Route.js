'use strict';

var R_PATTERN = /^\s*(?:((?:\w+)(?:\s*,\s*(?:\w+))*)\s+)?([\s\S]*)$/;
var Pattern = /** @type Pattern */ require('./Pattern');

var _ = require('lodash-node');
var inherit = require('inherit');
var hasProperty = Object.prototype.hasOwnProperty;
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

        if ( match[1] ) {
            this.__verbs = reduceMethods(match[1], Object.create(null));
        }

        if ( _.has(this.__verbs, 'GET') ) {
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

        var isQueryEmpty = true;
        var name;
        var pathname = this.__base(opts);
        var query = {};
        var using = this._regexpCompileResult.using;

        for ( name in opts ) {

            if ( hasProperty.call(opts, name) ) {

                if ( using.hasOwnProperty(name) ) {

                    continue;
                }

                isQueryEmpty = false;
                query[name] = opts[name];
            }
        }

        if ( isQueryEmpty ) {

            return pathname;
        }

        return pathname + '?' + this.__stringifyQuery(query);
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
     * @private
     * @memberOf {Route}
     * @method
     *
     * @param {Object} query
     *
     * @returns {String}
     * */
    __stringifyQuery: function (query) {

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
                        result[result.length] = this.__stringifyPrimitive(k) +
                            '=' + this.__stringifyPrimitive(v[i]);
                    }

                    continue;
                }

                result[result.length] = this.__stringifyPrimitive(k) +
                    '=' + this.__stringifyPrimitive(v);
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
    __stringifyPrimitive: function (v) {

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

        return [verb in this.__verbs, this.__base(pathname)];
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
