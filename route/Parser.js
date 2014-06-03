'use strict';

var R_SYNTAX_CHARS = /[\\\(\)<>,=*\/]/g;
var Class = /** @type Class */ require('fist.lang.class/Class');

var _ = require('lodash-node');

/**
 * @class Parser
 * @extends Class
 * */
var Parser = Class.extend(/** @lends Parser.prototype */ {

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @constructs
     *
     * @param {String} pattern
     * @param {Object} [params]
     * */
    constructor: function (pattern, params) {

        var matchers = [
            this._guessReverseSolidus,
            this._guessEscaped,
            this._guessSolidus,
            this._guessLeftParenthesis,
            this._guessRightParenthesis,
            this._guessLessThan,
            this._guessGreaterThan,
            this._guessEquals,
            this._guessComma
        ];

        Parser.Parent.call(this, params);

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Array}
         * */
        this._buf = [];

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {String}
         * */
        this._chunk = '';

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {String}
         * */
        this._src = pattern;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this._isEscape = false;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this._isParam = false;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this._isValue = false;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this._nesting = 0;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this._next = 0;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Array}
         * */
        this._stack = [];

        /*eslint no-cond-assign: 0*/
        while ( this._cur = this._charAt(this._next) ) {
            this._next += 1;

            if ( _.some(matchers, this._applyMatcher, this) ) {

                continue;
            }

            this._chunk += this._cur;
        }

        if ( this._nesting + this._isEscape + this._isParam + this._isValue ) {

            throw this._getError();
        }

        if ( this._chunk ) {
            this._addPartStatic();

        } else if ( _.isEmpty(this._buf) ) {

            throw this._getError();
        }

        /**
         * @public
         * @memberOf {Parser}
         * @property
         * @type {Array}
         * */
        this.parts = this._buf;
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {Function} func
     *
     * @returns {String}
     * */
    compile: function (func) {

        var amend = 0;
        var chunk = '';
        var index = 0;
        var parts = this.parts;
        var isBubbling = false;
        var stack = [];
        var value;
        var part;
        var nesting = -1;

        while ( true ) {

            if ( index === parts.length ) {

                if ( -1 === nesting  ) {

                    break;
                }

                parts = stack[nesting];
                nesting -= 1;
                index = parts.index + amend;
                amend = 0;
                chunk = parts.chunk + chunk;
                parts = parts.parts;
                isBubbling = true;

                continue;
            }

            part = parts[index];

            if ( Parser.PART_OPTION === part.type ) {

                if ( isBubbling ) {
                    chunk += func.call(this, part, true);
                    index += 1;
                    isBubbling = false;

                    continue;
                }

                nesting += 1;
                stack[nesting] = {chunk: chunk, parts: parts, index: index};
                chunk = func.call(this, part, false);
                index = 0;
                parts = part.parts;
                part = parts[index];

                continue;
            }

            value = func.call(this, part, isBubbling);

            if ( Parser.PART_PARAM === part.type &&
                stack.length && Parser.isFalsy(value) ) {
                amend = 1;
                chunk = '';
                index = parts.length;

                continue;
            }

            chunk += value;
            index += 1;
        }

        return chunk;
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @returns {String}
     * */
    toString: function () {

        return this.compile(part2Pattern);
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     * */
    _addPartStatic: function () {

        var chunk = decodeURIComponent(this._chunk);

        this._buf.push({
            type: Parser.PART_STATIC,
            body: chunk,
            encoded: encodeURIComponent(chunk)
        });
        this._chunk = '';
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @param {Function} matcher
     *
     * @returns {Boolean}
     * */
    _applyMatcher: function (matcher) {

        return matcher.call(this);
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @param {Number} index
     *
     * @returns {String}
     * */
    _charAt: function (index) {

        return this._src.charAt(index);
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {SyntaxError}
     * */
    _getError: function () {

        return new SyntaxError(this._src);
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessComma: function () {

        if ( ',' === this._cur ) {

            if ( !this._chunk || !this._isValue ) {

                throw this._getError();
            }

            this._addPartStatic();

            return true;
        }

        return false;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessEquals: function () {

        if ( '=' === this._cur ) {

            //  пустой параметр или не параметр вообще или уже значение
            if ( !this._chunk || !this._isParam || this._isValue ) {

                throw this._getError();
            }

            this._isValue = true;
            this._stack.push(this._buf);
            this._buf.push({
                type: Parser.PART_PARAM,
                body: this._chunk,
                parts: this._buf = []
            });
            this._chunk = '';

            return true;
        }

        return false;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessEscaped: function () {

        if ( this._isEscape ) {
            this._chunk += this._cur;
            this._isEscape = false;

            return true;
        }

        return false;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessGreaterThan: function () {

        if ( '>' === this._cur ) {

            if ( !this._isParam || !this._chunk ) {

                throw this._getError();
            }

            if ( this._isValue ) {
                this._addPartStatic();
                this._buf = this._stack.pop();
                this._isValue = false;

            } else {
                this._buf.push({
                    type: Parser.PART_PARAM,
                    body: this._chunk,
                    parts: []
                });
                this._chunk = '';
            }

            this._isParam = false;

            return true;
        }

        return false;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessLeftParenthesis: function () {

        if ( '(' === this._cur ) {

            if ( this._isParam ) {

                throw this._getError();
            }

            if ( this._chunk ) {
                this._addPartStatic();
            }

            this._stack.push(this._buf);
            this._buf.push({
                type: Parser.PART_OPTION,
                parts: this._buf = []
            });
            this._nesting += 1;

            return true;
        }

        return false;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessLessThan: function () {

        if ( '<' === this._cur ) {

            if ( this._isParam ) {

                throw this._getError();
            }

            if ( this._chunk ) {
                this._addPartStatic();
            }

            this._isParam = true;

            return true;
        }

        return false;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessReverseSolidus: function () {

        if ( '\\' === this._cur && !this._isEscape ) {
            this._isEscape = true;

            return true;
        }

        return false;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessRightParenthesis: function () {

        if ( ')' === this._cur ) {

            if ( 0 === this._nesting ) {

                throw this._getError();
            }

            if ( this._chunk ) {
                this._addPartStatic();

            } else if ( _.isEmpty(this._buf) ) {

                throw this._getError();
            }

            this._buf = this._stack.pop();
            this._nesting -= 1;

            return true;
        }

        return false;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    _guessSolidus: function () {

        if ( '/' === this._cur ) {

            if ( this._isParam ) {

                throw this._getError();
            }

            if ( this._chunk ) {
                this._addPartStatic();
            }

            this._buf.push({
                type: Parser.PART_DELIM
            });

            return true;
        }

        return false;
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Parser
     * @property {*}
     * */
    PART_STATIC: 0,

    /**
     * @public
     * @static
     * @memberOf Parser
     * @property {*}
     * */
    PART_OPTION: 1,

    /**
     * @public
     * @static
     * @memberOf Parser
     * @property {*}
     * */
    PART_PARAM: 2,

    /**
     * @public
     * @static
     * @memberOf Parser
     * @property {*}
     * */
    PART_DELIM: 3,

    /**
     * @public
     * @static
     * @memberOf Parser
     *
     * @param {String} value
     *
     * @returns {Boolean}
     * */
    isFalsy: function (value) {

        return null === value || void 0 === value || '' === value;
    }

});

/**
 * @private
 * @static
 * @memberOf Parser
 * @method
 *
 * @param {Object} part
 *
 * @returns {String}
 * */
function escapePart (part) {

    return escape(part.body);
}

/**
 * @private
 * @static
 * @memberOf Parser
 * @method
 *
 * @param {String} s
 *
 * @returns {String}
 * */
function escape (s) {

    return s.replace(R_SYNTAX_CHARS, '\\$&');
}

/**
 * @private
 * @static
 * @memberOf Parser
 * @method
 *
 * @param {Object} part
 * @param {Boolean} isBubbling
 *
 * @returns {String}
 * */
function part2Pattern (part, isBubbling) {

    if ( Parser.PART_OPTION === part.type ) {

        if ( isBubbling ) {

            return ')';
        }

        return '(';
    }

    if ( Parser.PART_PARAM === part.type ) {

        if ( _.isEmpty(part.parts) ) {

            return '<' + escape(part.body) + '>';
        }

        return '<' + escapePart(part) + '=' +
            _.map(part.parts, escapePart).join(',') + '>';
    }

    if ( Parser.PART_DELIM === part.type ) {

        return '/';
    }

    return escape(part.body);
}

module.exports = Parser;
