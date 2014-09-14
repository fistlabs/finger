'use strict';

var Obus = /** @type Obus */ require('obus');
var Parser = /** @type Parser */ require('./parser');

var _ = require('lodash-node');
var escape = require('regesc');
var inherit = require('inherit');
var util = require('util');

/**
 * @class Pattern
 * @extends Parser
 * */
var Pattern = inherit(Parser, /** @lends Pattern.prototype */ {

    /**
     * @private
     * @memberOf {Pattern}
     * @method
     *
     * @constructs
     *
     * @param {String} pattern
     * @param {Object} [params]
     * */
    __constructor: function (pattern, params) {
        this.__base(pattern);

        /**
         * @public
         * @memberOf {Pattern}
         * @property
         *
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);
    },

    /**
     * @public
     * @memberOf {Pattern}
     * @property
     *
     * @type {Object}
     * */
    params: {},

    /**
     * @public
     * @memberOf {Pattern}
     * @method
     *
     * @param {Object} [opts]
     *
     * @returns {String}
     * */
    build: function (opts) {
        var using = {};

        return this.__self._compileParts(this.parts, function (part) {

            return this._buildPart(part, opts, using);
        }, 0, this);
    },

    /**
     * @public
     * @memberOf {Pattern}
     * @method
     *
     * @param {String} pathname
     *
     * @returns {Object}
     * */
    match: function (pathname) {
        var match;

        if (!_.isRegExp(this.__regexp)) {
            this.__regexp = this.__compileRegExp();
        }

        match = this.__regexp.exec(pathname);

        if (_.isNull(match)) {

            return null;
        }

        function addValue(obus, name, i) {
            var value = match[i + 1];

            if (_.isString(value) && _.indexOf(value, '%') !== -1) {
                value = decodeURIComponent(value);
            }

            return obus.add(name, value);
        }

        return _.reduce(this.names, addValue, new Obus({})).valueOf();
    },

    /**
     * @private
     * @memberOf Pattern
     * @method
     *
     * @param {Object} part
     * @param {Object} opts
     * @param {Object} using
     *
     * @returns {String}
     * */
    _buildPart: function (part, opts, using) {
        var type = part.type;

        if (Parser.PART_DELIM === type) {

            return '/';
        }

        if (Parser.PART_STATIC === type) {

            return part.encoded;
        }

        if (Parser.PART_PARAM === type) {

            return this._buildParamPart(part.body, opts, using);
        }

        return '';
    },

    /**
     * @private
     * @memberOf Pattern
     * @method
     *
     * @param {String} name
     * @param {Object} opts
     * @param {Object} using
     *
     * @returns {String}
     * */
    _buildParamPart: function (name, opts, using) {
        var i;
        var value;

        if (!Obus.has(opts, name)) {

            return '';
        }

        value = Obus.get(opts, name);

        if (_.has(using, name)) {
            i = using[name] += 1;

        } else {
            i = using[name] = 0;
        }

        if (_.isArray(value)) {
            value = value[i];

        } else if (i) {

            return '';
        }

        if (this.__self._isFalsy(value)) {

            return '';
        }

        return encodeURIComponent(value);
    },

    /**
     * @private
     * @memberOf {Pattern}
     * @method
     *
     * @returns {Object}
     * */
    __compileRegExp: function () {
        var source = this.compile(this.__compileRegExpPart);

        if (!this.params.doNotMatchStart) {
            source = '^' + source;
        }

        if (!this.params.doNotMatchEnd) {
            source += '$';
        }

        return new RegExp(source, this.params.ignoreCase ? 'i' : '');
    },

    /**
     * @private
     * @memberOf {Pattern}
     * @method
     *
     * @param {Object} part
     * @param {Boolean} isBubbling
     *
     * @returns {Object}
     * */
    __compileRegExpPart: function (part, isBubbling) {
        var type = part.type;

        if (Parser.PART_DELIM === type) {

            return escape('/');
        }

        if (Parser.PART_STATIC === type) {

            return this.__compileStaticPart(part);
        }

        if (Parser.PART_PARAM === type) {

            if (_.isEmpty(part.parts)) {

                return '([^/]+?)';
            }

            return util.format('(%s)', _.map(part.parts, this.__compileStaticPart, this).join('|'));
        }

        if (isBubbling) {

            return ')?';
        }

        return '(?:';
    },

    /**
     * @private
     * @memberOf {Pattern}
     * @method
     *
     * @param {Object} part
     *
     * @returns {String}
     * */
    __compileStaticPart: function (part) {
        part = decodeURIComponent(part.body);

        return _.reduce(part, this.__reduceChar, '', this);
    },

    /**
     * @private
     * @memberOf {Pattern}
     * @method
     *
     * @param {String} result
     * @param {String} char
     *
     * @returns {String}
     * */
    __reduceChar: function (result, char) {

        if (char === encodeURIComponent(char)) {

            return result + escape(char);
        }

        if (this.params.ignoreCase) {

            return util.format('%s(?:%s|%s|%s)',
                result, escape(char),
                encodeURIComponent(char.toLowerCase()),
                encodeURIComponent(char.toUpperCase()));
        }

        return util.format('%s(?:%s|%s)', result, escape(char), encodeURIComponent(char));
    }

}, {

    /**
     * @public
     * @static
     * @memberOf {Pattern}
     * @method
     *
     * @param {String} pattern
     * @param {Object} [opts]
     *
     * @returns {String}
     * */
    buildPath: function (pattern, opts) {

        return new this(pattern).build(opts);
    }

});

module.exports = Pattern;
