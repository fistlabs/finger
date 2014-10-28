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
     * @type {String}
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
 * @param {String} text
 *
 * @returns {RuleArg}
 * */
RuleArg.prototype.addText = function (text) {
    text = RuleArg.normalizeName(text);

    this.name += text;

    return this;
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

/**
 * @public
 * @static
 * @memberOf {RuleArg}
 * @method
 *
 * @param {String} name
 *
 * @returns {String}
 * */
RuleArg.normalizeName = function (name) {

    return name.replace(/\\([^.])/g, '$1');
};

module.exports = RuleArg;
