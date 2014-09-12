'use strict';

var R_ADVANCED_PATTERN = /^\s*(?:((?:[a-z]+)(?:\s*,\s*(?:[a-z]+))*)\s+)?([\s\S]+?)(?:\s+([a-z]+))?\s*$/i;

var Obus = /** @type Obus */ require('obus');
var Pattern = /** @type Pattern */ require('./pattern');

var _ = require('lodash-node');
var inherit = require('inherit');
var querystring = require('../util/querystring');
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
        var parts = Route.splitPath(match[1]);

        if (!_.isObject(params)) {
            params = {};
        }

        params = _.reduce(match[2], reduceFlag, params);

        this.__base(parts[0], params);

        /**
         * @public
         * @memberOf {Route}
         * @property
         * @type {Object}
         * */
        this.query = querystring.parse(parts[1]);

        /**
         * @private
         * @memberOf {Route}
         * @property
         * @type {Object}
         * */
        this.__verbs = {
            GET: true
        };

        if (match[0]) {
            this.__verbs = reduceMethods(match[0], {});
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
     * @param {Object} [opts]
     *
     * @returns {String}
     * */
    build: function (opts) {
        var pathname = this.__base(opts);

        opts = _.merge({}, this.query, opts);

        _.forEach(this.names, function (name) {
            Obus.del(opts, name);
        });

        if (_.isEmpty(opts)) {

            return pathname;
        }

        return pathname + '?' + querystring.stringify(opts);
    },

    /**
     * @public
     * @memberOf {Route}
     * @method
     *
     * @param {String} verb
     * @param {String} path
     *
     * @returns {Object}
     * */
    match: function (verb, path) {
        var parts = Route.splitPath(path);
        var query = querystring.parse(parts[1]);
        var verbMatch = _.has(this.__verbs, verb);
        var pathnameMatch = this.__base(parts[0]);
        var queryMatch = null;
        var pathMatch = null;

        if (contains(query, this.query)) {
            queryMatch = query;

            if (pathnameMatch) {
                pathMatch = _.merge({}, queryMatch, pathnameMatch);
            }
        }

        return {
            methodMatch: verbMatch,
            resultMatch: pathMatch,
            pathnameMatch: pathnameMatch,
            queryMatch: queryMatch
        };
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
     * @memberOf {Route}
     * @method
     *
     * @param {String} path
     *
     * @returns {Array}
     * */
    splitPath: function (path) {
        var i = path.indexOf('?');

        if (i === -1) {

            return [path, ''];
        }

        return [path.slice(0, i), path.slice(i + 1)];
    },

    /**
     * @public
     * @static
     * @memberOf {Route}
     * @method
     *
     * @param {String} pattern
     *
     * @returns {Object}
     * */
    splitPattern: function (pattern) {
        var match = R_ADVANCED_PATTERN.exec(pattern);

        if (_.isNull(match)) {

            throw new SyntaxError(pattern);
        }

        return _.rest(match, 1)
    }

});

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

function reduceMethod(methods, m) {
    methods[m.trim().toUpperCase()] = true;

    return methods;
}

function reduceMethods(methods, init) {

    return _.reduce(methods.split(','), reduceMethod, init);
}

function contains(a, b) {

    if (_.isArray(a) && _.isArray(b)) {
        a = _.clone(a);

        return _.every(b, function (b) {
            var aInB = _.findIndex(a, function (a) {
                return contains(a, b);
            });

            if (aInB === -1) {
                return false;
            }

            a.splice(aInB, 1);

            return true;
        });
    }

    if (_.isObject(a) && _.isObject(b)) {
        return _.every(b, function (b, k) {
            return contains(a[k], b);
        });
    }

    return a === b;
}

module.exports = Route;
