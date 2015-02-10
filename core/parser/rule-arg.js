'use strict';

var RuleAny = /** @type RuleAny */ require('./rule-any');

/**
 * @class RuleArg
 * */
function RuleArg() {

    /**
     * @public
     * @memberOf {RuleArg}
     * @property
     * @type {String}
     * */
    this.type = RuleArg.TYPE;

    /**
     * @public
     * @memberOf {RuleArg}
     * @property
     * @type {Array}
     * */
    this.name = '';

    /**
     * @public
     * @memberOf {RuleArg}
     * @property
     * @type {String}
     * */
    this.kind = '';

    /**
     * @public
     * @memberOf {RuleArg}
     * @property
     * @type {String}
     * */
    this.value = void 0;

    /**
     * @public
     * @memberOf {RuleArg}
     * @property
     * @type {RegExp}
     * */
    this.regex = null;
}

/**
 * @public
 * @static
 * @memberOf {RuleArg}
 * @property
 * @type {String}
 * */
RuleArg.TYPE = 'RULE_ARG';

/**
 * @public
 * @memberOf {RuleArg}
 * @method
 *
 * @param {String} name
 *
 * @returns {RuleArg}
 * */
RuleArg.prototype.setName = function (name) {
    this.name = RuleAny.unBackSlash(name);

    return this;
};

/**
 * @public
 * @memberOf {RuleArg}
 * @method
 *
 * @param {String} type
 *
 * @returns {RuleArg}
 * */
RuleArg.prototype.setKind = function (type) {
    type = RuleAny.unBackSlash(type);

    this.kind = type;

    return this;
};

/**
 * @public
 * @memberOf {RuleArg}
 * @method
 *
 * @param {String} text
 *
 * @returns {RuleArg}
 * */
RuleArg.prototype.setDefault = function (text) {
    this.value = RuleAny.unBackSlash(text);

    return this;
};

module.exports = RuleArg;
