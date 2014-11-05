'use strict';

var util = require('util');

/**
 * @class Type
 *
 * @param {String} name
 * @param {String} regexp
 * */
function Type(name, regexp) {

    if (!Type.checkRegExp(regexp)) {
        regexp = util.format('Invalid %j type regexp %j', name, regexp);

        throw new TypeError(regexp);
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
     * @type {RegExp}
     * */
    this.regexp = regexp;
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

module.exports = Type;
