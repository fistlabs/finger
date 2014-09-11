'use strict';

var Obus = /** @type Obus */ require('obus');
var Parser = /** @type Parser */ require('./parser');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @private
 * @static
 * @memberOf Pattern
 * @method
 * */
var escape = require('regesc');

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

        return Parser._compileParts(this.parts, function (part) {

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

        var i;
        var l;
        var match;
        var result = null;

        if (!_.isRegExp(this.__regexp)) {
            this.__regexp = this.__compileRegExp();
        }

        match = this.__regexp.exec(pathname);

        if (_.isNull(match)) {

            return result;
        }

        result = {};

        for (i = 0, l = this.names.length; i < l; i += 1) {
            push2Result(result, this.names[i], match[i + 1]);
        }

        return result;
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

        if (using.hasOwnProperty(name)) {
            i = using[name] += 1;

        } else {
            i = using[name] = 0;
        }

        if (_.isArray(value)) {
            value = value[i];

        } else if (i) {

            return '';
        }

        if (Parser._isFalsy(value)) {

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

            return '(' + _.map(part.parts,
                this.__compileStaticPart, this).join('|') + ')';
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

            return result + '(?:' + escape(char) + '|' +
            encodeURIComponent(char.toLowerCase()) + '|' +
            encodeURIComponent(char.toUpperCase()) + ')';
        }

        return result + '(?:' + escape(char) + '|' +
        encodeURIComponent(char) + ')';
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Pattern
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

/**
 * @private
 * @static
 * @memberOf Pattern
 *
 * @param {Object} result
 * @param {String} name
 * @param {*} value
 *
 * @returns {Object}
 * */
function push2Result(result, name, value) {

    if (_.isString(value) && _.indexOf(value, '%') !== -1) {
        value = decodeURIComponent(value);
    }

    return Obus.add(result, name, value);
}

module.exports = Pattern;
