'use strict';

var Parser = /** @type Parser */ require('./Parser');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @private
 * @static
 * @memberOf Pattern
 * @property
 * @type {RegExp}
 * */
var R_PATTERN = /^\s*([\s\S]*?)(?:\s+(\w+))?\s*$/;

/**
 * @private
 * @static
 * @memberOf Pattern
 * @method
 * */
var escape = require('regesc');

/**
 * @private
 * @static
 * @memberOf Pattern
 * @property
 * @type {Object}
 * */
var flag2ParamMap = {
    s: 'doNotMatchStart',
    e: 'doNotMatchEnd',
    i: 'ignoreCase'
};

/**
 * @private
 * @static
 * @memberOf Pattern
 * @property
 * @type {Object}
 * */
var param2FlagMap = _.invert(flag2ParamMap);

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

        var match = R_PATTERN.exec(pattern);

        this.__base(match[1]);

        params = _.extend({}, this.params, params);

        /**
         * @public
         * @memberOf {Pattern}
         * @property
         *
         * @type {Object}
         * */
        this.params = _.reduce(match[2], reduceFlag, params);

        /**
         * @private
         * @memberOf {Pattern}
         * @property
         *
         * @type {RegExp}
         * */
        this.__regexp = this.__compileRegExp();
    },

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

        return Pattern._build(this, opts);
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
        var match = this.__regexp.exec(pathname);
        var result = null;

        if ( null === match ) {

            return result;
        }

        result = {};

        for ( i = 0, l = this.names.length; i < l; i += 1 ) {
            push2Result(result, this.names[i], match[i + 1]);
        }

        return result;
    },

    /**
     * @public
     * @memberOf {Pattern}
     * @method
     *
     * @returns {String}
     * */
    toString: function () {

        var pattern = this.__base();
        var flags = _.reduce(this.params, this.__reduceParam2Flag, '', this);

        if ( '' === flags ) {

            return pattern;
        }

        return pattern + ' ' + flags;
    },

    /**
     * @private
     * @memberOf {Pattern}
     * @method
     *
     * @param {String} flags
     * @param {Boolean} value
     * @param {String} name
     *
     * @returns {String}
     * */
    __reduceParam2Flag: function (flags, value, name) {

        if ( _.has(param2FlagMap, name) ) {

            if ( value ) {
                flags += param2FlagMap[name].toLowerCase();

            } else {
                flags += param2FlagMap[name].toUpperCase();
            }
        }

        return flags;
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

        if ( !this.params.doNotMatchStart ) {
            source = '^' + source;
        }

        if ( !this.params.doNotMatchEnd ) {
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

        if ( Parser.PART_DELIM === type ) {

            return escape('/');
        }

        if ( Parser.PART_STATIC === type ) {

            return this.__compileStaticPart(part);
        }

        if ( Parser.PART_PARAM === type ) {

            if ( _.isEmpty(part.parts) ) {

                return '([^/]+?)';
            }

            return '(' + _.map(part.parts,
                this.__compileStaticPart, this).join('|') + ')';
        }

        if ( isBubbling ) {

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

        if ( char === encodeURIComponent(char) ) {

            return result + escape(char);
        }

        if ( this.params.ignoreCase ) {

            return result + '(?:' + escape(char) + '|' +
                      encodeURIComponent(char.toLowerCase()) + '|' +
                      encodeURIComponent(char.toUpperCase()) + ')';
        }

        return result + '(?:' + escape(char) + '|' +
                  encodeURIComponent(char) + ')';
    }

}, {

    /**
     * @protected
     * @static
     * @memberOf Pattern
     * @method
     *
     * @param {Parser} parser
     * @param {Object} opts
     *
     * @returns {String}
     * */
    _build: function (parser, opts) {

        var using = {};

        return Parser._compileParts(parser.parts, function (part) {

            return buildPart(part, opts, using);
        }, 0);
    },

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

        return this._build(/** @type {Parser} */ Parser.create(pattern), opts);
    }

});

/**
 * @private
 * @static
 * @memberOf Pattern
 * @method
 *
 * @param {Object} part
 * @param {Object} opts
 * @param {Object} using
 *
 * @returns {String}
 * */
function buildPart (part, opts, using) {

    var type = part.type;

    if ( Parser.PART_DELIM === type ) {

        return '/';
    }

    if ( Parser.PART_STATIC === type ) {

        return part.encoded;
    }

    if ( Parser.PART_PARAM === type ) {

        return buildParamPart(part.body, opts, using);
    }

    return '';
}

/**
 * @private
 * @static
 * @memberOf Pattern
 * @method
 *
 * @param {String} name
 * @param {Object} opts
 * @param {Object} using
 *
 * @returns {String}
 * */
function buildParamPart (name, opts, using) {

    var i;
    var value;

    if ( !_.has(opts, name) ) {

        return '';
    }

    value = opts[name];

    if ( using.hasOwnProperty(name) ) {
        i = using[name] += 1;

    } else {
        i = using[name] = 0;
    }

    if ( _.isArray(value) ) {
        value = value[i];

    } else if ( i ) {

        return '';
    }

    if ( Parser._isFalsy(value) ) {

        return '';
    }

    return encodeURIComponent(value);
}

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
function push2Result (result, name, value) {

    if ( 'string' === typeof value && -1 !== value.indexOf('%') ) {
        value = decodeURIComponent(value);
    }

    if ( result.hasOwnProperty(name) ) {

        if ( _.isArray(result[name]) ) {
            result[name].push(value);

            return result;
        }

        result[name] = [result[name], value];

        return result;
    }

    result[name] = value;

    return result;
}

/**
 * @private
 * @static
 * @memberOf Pattern
 * @method
 *
 * @param {Object} params
 * @param {String} name
 *
 * @returns {Object}
 * */
function reduceFlag (params, name) {

    var lowerName = name.toLowerCase();
    var isLowerCased = name === lowerName;

    name = lowerName;

    if ( _.has(flag2ParamMap, name) ) {
        name = flag2ParamMap[name];
    }

    params[name] = isLowerCased;

    return params;
}

module.exports = Pattern;
