'use strict';

var util = require('util');

/**
 * @abstract
 * @class Type
 *
 * @param {String} name
 * @param {String} source
 * */
function Type(name, source) {

    if (!Type.checkRegExp(source)) {
        source = util.format('Invalid %j type regexp %j', name, source);

        throw new TypeError(source);
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
    this.regexp = new RegExp(source);

    /**
     * @private
     * @memberOf {Type}
     * @property
     * @type {RegExp}
     * */
    this.__checkRegExp = new RegExp('^(?:' + source + ')$');
}

Type.prototype.name = 'Empty';

/**
 * @public
 * @memberOf {Type}
 * @method
 *
 * @param {String} value
 *
 * @returns {Boolean}
 * */
Type.prototype.check = function (value) {
    return this.__checkRegExp.test(value);
};

/**
 * @public
 * @static
 * @memberOf {Type}
 *
 * @param {String} source
 *
 * @returns {Boolean}
 * */
Type.checkRegExp = function (source) {
    var $;
    var r;

    if (typeof source !== 'string') {
        return false;
    }

    r = /(?:\\[\[\(]|\[(?:\\[\s\S]|[^\]])*]|\(\?:)|(\()/g;

    /*eslint no-cond-assign: 0*/
    while ($ = r.exec(source)) {
        if ($[1]) {
            return false;
        }
    }

    try {
        source = new RegExp(source).source;
    } catch (err) {
        return false;
    }

    return true;
};

module.exports = Type;
