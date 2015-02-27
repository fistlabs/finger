'use strict';

var f = require('util').format;

/**
 * @class Type
 *
 * @param {String} name
 * @param {String} regex
 * */
function Type(name, regex) {

    if (!Type.checkRegExp(regex)) {
        throw new TypeError(f('Invalid %j type regexp %j', name, regex));
    }

    /**
     * @public
     * @memberOf {Type}
     * @property
     * @type {String}
     * */
    this.name = name;

    /**
     * @public
     * @memberOf {Type}
     * @property
     * @type {String}
     * */
    this.regex = regex;

    /**
     * @public
     * @memberOf {Type}
     * @property
     * @type {RegExp}
     * */
    this._compiledRegExp = new RegExp(f('^(?:%s)$', this.regex));
}

/**
 * @public
 * @static
 * @memberOf {Type}
 *
 * @param {String} regexp
 *
 * @returns {Boolean}
 * */
Type.checkRegExp = function (regexp) {
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
 * @memberOf {Type}
 * @method
 *
 * @param {String} v
 *
 * @returns {Boolean}
 * */
Type.prototype.check = function (v) {
    return Boolean(v) && this._compiledRegExp.test(v);
};

module.exports = Type;
