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
    this.parts.push(rule);
    return this;
};

module.exports = RuleSeq;
