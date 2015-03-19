'use strict';

var f = require('util').format;

/**
 * @class Kind
 *
 * @param {String} name
 * @param {String} regex
 * */
function Kind(name, regex) {

    if (!Kind.checkRegExp(regex)) {
        throw new TypeError(f('Invalid %j type regexp %j', name, regex));
    }

    /**
     * @public
     * @memberOf {Kind}
     * @property
     * @type {String}
     * */
    this.name = name;

    /**
     * @public
     * @memberOf {Kind}
     * @property
     * @type {String}
     * */
    this.regex = regex;

    /**
     * @public
     * @memberOf {Kind}
     * @property
     * @type {RegExp}
     * */
    this._compiledRegExp = new RegExp(f('^(?:%s)$', this.regex));
}

/**
 * @public
 * @static
 * @memberOf {Kind}
 *
 * @param {String} regexp
 *
 * @returns {Boolean}
 * */
Kind.checkRegExp = function (regexp) {
    var $;
    var r;

    if (typeof regexp !== 'string') {
        return false;
    }

    r = /(?:\\[\[\(]|\[(?:\\[\s\S]|[^\]])*]|\(\?:)|(\()/g;

    /*eslint no-cond-assign: 0*/
    while ($ = r.exec(regexp)) {
        if ($[1]) {
            return false;
        }
    }

    try {
        regexp = new RegExp(regexp).source;
    } catch (err) {
        return false;
    }

    return true;
};

/**
 * @public
 * @memberOf {Kind}
 * @method
 *
 * @param {String} v
 *
 * @returns {Boolean}
 * */
Kind.prototype.check = function (v) {
    return Boolean(v) && this._compiledRegExp.test(v);
};

module.exports = Kind;
