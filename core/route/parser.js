'use strict';

var R_SYNTAX_CHARS = /[\\\(\)<>,=\/]/g;

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class Parser
 * */
var Parser = inherit(/** @lends Parser.prototype */ {

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @constructs
     *
     * @param {String} pattern
     * */
    __constructor: function (pattern) {
        var matchers = [
            this.__guessReverseSolidus,
            this.__guessEscaped,
            this.__guessSolidus,
            this.__guessLeftParenthesis,
            this.__guessRightParenthesis,
            this.__guessLessThan,
            this.__guessGreaterThan,
            this.__guessEquals,
            this.__guessComma
        ];

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Array}
         * */
        this.__buf = [];

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {String}
         * */
        this.__chunk = '';

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {String}
         * */
        this.__src = pattern;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this.__isEscape = false;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this.__isParam = false;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this.__isValue = false;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this.__nesting = 0;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Number}
         * */
        this.__next = 0;

        /**
         * @private
         * @memberOf {Parser}
         * @property
         * @type {Array}
         * */
        this.__stack = [];

        /**
         * @public
         * @memberOf {Parser}
         * @property
         * @type {Array}
         * */
        this.names = [];

        /*eslint no-cond-assign: 0*/
        while (this._cur = this.__charAt(this.__next)) {
            this.__next += 1;

            if (_.some(matchers, this.__applyMatcher, this)) {

                continue;
            }

            this.__chunk += this._cur;
        }

        if (this.__nesting + this.__isEscape +
            this.__isParam + this.__isValue) {

            throw this.__getError();
        }

        if (this.__chunk) {
            this.__addPartStatic();

        } else if (_.isEmpty(this.__buf)) {

            throw this.__getError();
        }

        /**
         * @public
         * @memberOf {Parser}
         * @property
         * @type {Array}
         * */
        this.parts = this.__buf;
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

        return this.__self._compileParts(this.parts, func, 0, this);
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
    __addPartStatic: function () {
        var chunk = decodeURIComponent(this.__chunk);

        this.__buf.push({
            type: Parser.PART_STATIC,
            body: chunk,
            encoded: encodeURIComponent(chunk)
        });
        this.__chunk = '';
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
    __applyMatcher: function (matcher) {

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
    __charAt: function (index) {

        return this.__src.charAt(index);
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {SyntaxError}
     * */
    __getError: function () {

        return new SyntaxError(this.__src);
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    __guessComma: function () {

        if (this._cur !== ',') {

            return false;
        }

        if (!this.__chunk || !this.__isValue) {

            throw this.__getError();
        }

        this.__addPartStatic();

        return true;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    __guessEquals: function () {

        if (this._cur !== '=') {

            return false;
        }

        //  пустой параметр или не параметр вообще или уже значение
        if (!this.__chunk || !this.__isParam || this.__isValue) {

            throw this.__getError();
        }

        this.__isValue = true;
        this.__stack.push(this.__buf);
        this.__buf.push({
            type: Parser.PART_PARAM,
            body: this.names[this.names.length] = this.__chunk,
            parts: this.__buf = []
        });
        this.__chunk = '';

        return true;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    __guessEscaped: function () {

        if (this.__isEscape) {
            this.__chunk += this._cur;
            this.__isEscape = false;

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
    __guessGreaterThan: function () {

        if (this._cur !== '>') {

            return false;
        }

        if (!this.__isParam || !this.__chunk) {

            throw this.__getError();
        }

        if (this.__isValue) {
            this.__addPartStatic();
            this.__buf = this.__stack.pop();
            this.__isValue = false;

        } else {
            this.__buf.push({
                type: Parser.PART_PARAM,
                body: this.names[this.names.length] = this.__chunk,
                parts: []
            });
            this.__chunk = '';
        }

        this.__isParam = false;

        return true;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    __guessLeftParenthesis: function () {

        if (this._cur !== '(') {

            return false;
        }

        if (this.__isParam) {

            throw this.__getError();
        }

        if (this.__chunk) {
            this.__addPartStatic();
        }

        this.__stack.push(this.__buf);
        this.__buf.push({
            type: Parser.PART_OPTION,
            parts: this.__buf = []
        });
        this.__nesting += 1;

        return true;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    __guessLessThan: function () {

        if (this._cur !== '<') {

            return false;
        }

        if (this.__isParam) {

            throw this.__getError();
        }

        if (this.__chunk) {
            this.__addPartStatic();
        }

        this.__isParam = true;

        return true;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    __guessReverseSolidus: function () {

        if (this._cur === '\\' && !this.__isEscape) {
            this.__isEscape = true;

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
    __guessRightParenthesis: function () {

        if (this._cur !== ')') {

            return false;
        }

        if (this.__nesting === 0 || this.__isParam) {

            throw this.__getError();
        }

        if (this.__chunk) {
            this.__addPartStatic();

        } else if (_.isEmpty(this.__buf)) {

            throw this.__getError();
        }

        this.__buf = this.__stack.pop();
        this.__nesting -= 1;

        return true;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {Boolean}
     * */
    __guessSolidus: function () {

        if (this._cur !== '/') {

            return false;
        }

        if (this.__isParam) {

            throw this.__getError();
        }

        if (this.__chunk) {
            this.__addPartStatic();
        }

        this.__buf.push({
            type: Parser.PART_DELIM
        });

        return true;
    }

}, {

    /**
     * @public
     * @static
     * @memberOf {Parser}
     * @property {*}
     * */
    PART_STATIC: 0,

    /**
     * @public
     * @static
     * @memberOf {Parser}
     * @property {*}
     * */
    PART_OPTION: 1,

    /**
     * @public
     * @static
     * @memberOf {Parser}
     * @property {*}
     * */
    PART_PARAM: 2,

    /**
     * @public
     * @static
     * @memberOf {Parser}
     * @property {*}
     * */
    PART_DELIM: 3,

    /**
     * @protected
     * @static
     * @memberOf {Parser}
     * @method
     *
     * @param {String} value
     *
     * @returns {Boolean}
     * */
    _isFalsy: function (value) {

        return _.isNull(value) || _.isUndefined(value) || value === '';
    },

    /**
     * @protected
     * @static
     * @memberOf {Parser}
     * @method
     *
     * @param {Array} parts
     * @param {Function} func
     * @param {Number} n
     * @param {*} [ctx]
     * */
    _compileParts: function (parts, func, n, ctx) {
        var chunk;
        var i;
        var l;
        var part;
        var result = '';

        for (i = 0, l = parts.length; i < l; i += 1) {
            part = parts[i];

            if (Parser.PART_OPTION === part.type) {
                chunk = Parser._compileParts(part.parts, func, n + 1, ctx);

                if (Parser._isFalsy(chunk)) {

                    continue;
                }

                result += func.call(ctx, part, false) +
                chunk + func.call(ctx, part, true);

                continue;
            }

            chunk = func.call(ctx, part, false);

            if (Parser.PART_PARAM === part.type &&
                Parser._isFalsy(chunk) && n) {

                return '';
            }

            result += chunk;
        }

        return result;
    }

});

function escape(s) {

    return s.replace(R_SYNTAX_CHARS, '\\$&');
}

function escapePart(part) {

    return escape(part.body);
}

function part2Pattern(part, isBubbling) {

    if (Parser.PART_OPTION === part.type) {

        if (isBubbling) {

            return ')';
        }

        return '(';
    }

    if (Parser.PART_PARAM === part.type) {

        if (_.isEmpty(part.parts)) {

            return '<' + escape(part.body) + '>';
        }

        return '<' + escapePart(part) + '=' +
        _.map(part.parts, escapePart).join(',') + '>';
    }

    if (Parser.PART_DELIM === part.type) {

        return '/';
    }

    return escape(part.body);
}

module.exports = Parser;
