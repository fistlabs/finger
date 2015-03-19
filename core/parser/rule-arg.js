'use strict';

var RuleAny = /** @type RuleAny */ require('./rule-any');

var uniqueId = require('unique-id');

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
     * @type {String}
     * */
    this.regex = null;

    /**
     * @public
     * @memberOf {RuleArg}
     * @property
     * @type {Boolean}
     * */
    this.required = true;

    /**
     * @public
     * @memberOf {RuleArg}
     * @property
     * @type {Boolean}
     * */
    this.multiple = false;
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
 * @param {String} kind
 *
 * @returns {RuleArg}
 * */
RuleArg.prototype.setKind = function (kind) {
    this.kind = RuleAny.unBackSlash(kind);

    return this;
};

/**
 * @public
 * @memberOf {RuleArg}
 * @method
 *
 * @returns {RuleArg}
 * */
RuleArg.prototype.setUniqueKindName = function () {
    return this.setKind(RuleArg.generateUniqueKindName());
};

/**
 * @public
 * @memberOf {RuleArg}
 * @method
 *
 * @param {String} regex
 *
 * @returns {RuleArg}
 * */
RuleArg.prototype.setRegex = function (regex) {
    this.regex = regex;

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

/**
 * @public
 * @static
 * @memberOf {RuleArg}
 * @method
 *
 * @returns {String}
 * */
RuleArg.generateUniqueKindName = function () {
    return uniqueId();
};

module.exports = RuleArg;
