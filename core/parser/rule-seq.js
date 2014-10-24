'use strict';

/**
 * @class RuleSeq
 * */
function RuleSeq() {

    /**
     * @public
     * @memberOf {RuleSeq}
     * @property
     * @type {String}
     * */
    this.type = RuleSeq.TYPE;

    /**
     * @public
     * @memberOf {RuleSeq}
     * @property
     * @type {Array}
     * */
    this.parts = [];

    /**
     * @public
     * @memberOf {RuleSeq}
     * @property
     * @type {Array}
     * */
    this.args = [];
}

/**
 * @public
 * @static
 * @memberOf {RuleSeq}
 * @property
 * @type {String}
 * */
RuleSeq.TYPE = 'RULE_SEQ';

/**
 * @public
 * @memberOf {RuleSeq}
 * @method
 *
 * @param {*} rule
 *
 * @returns {RuleSeq}
 * */
RuleSeq.prototype.addRule = function (rule) {
    this.parts[this.parts.length] = rule;
    return this;
};

/**
 * @public
 * @memberOf {RuleSeq}
 * @method
 *
 * @param {*} rule
 *
 * @returns {RuleSeq}
 * */
RuleSeq.prototype.addArg = function (rule) {
    this.args[this.args.length] = rule;
    return this;
};

module.exports = RuleSeq;
