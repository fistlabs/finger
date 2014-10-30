'use strict';

var Obus = require('obus');
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
    this.name = [];

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
     * @type {Boolean}
     * */
    this.required = true;
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
    this.name = RuleArg.parse(name);

    return this;
};

/**
 * @public
 * @memberOf {RuleArg}
 * @method
 *
 * @returns {String}
 * */
RuleArg.prototype.getName = function () {
    return RuleArg.build(this.name);
};

/**
 * @public
 * @memberOf {RuleArg}
 * @method
 *
 * @returns {String}
 * */
RuleArg.prototype.getRawName = function () {
    return RuleAny.unBackSlash(this.getName());
};

/**
 * @public
 * @memberOf {RuleArg}
 * @method
 *
 * @param {Boolean} required
 *
 * @returns {RuleArg}
 * */
RuleArg.prototype.setRequired = function (required) {
    this.required = Boolean(required);

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

RuleArg.escape = Obus.escape;

RuleArg.parse = Obus.parse;

RuleArg.build = function (parts) {

    return parts.map(RuleArg.escape).join('.');
};

module.exports = RuleArg;
