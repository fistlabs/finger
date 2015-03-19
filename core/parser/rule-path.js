'use strict';

var RuleSeq = /** @type RuleSeq */ require('./rule-seq');

/**
 * @class RulePath
 * @extends RuleSeq
 * */
function RulePath() {
    RuleSeq.call(this);

    /**
     * @public
     * @memberOf {RulePath}
     * @property
     * @type {Array}
     * */
    this.query = [];
}

/**
 * @public
 * @static
 * @memberOf {RulePath}
 * @property
 * @type {String}
 * */
RulePath.TYPE = RuleSeq.TYPE;

RulePath.prototype = Object.create(RuleSeq.prototype);

RulePath.prototype.constructor = RulePath;

/**
 * @public
 * @memberOf {RulePath}
 * @method
 *
 * @param {*} rule
 *
 * @returns {RulePath}
 * */
RulePath.prototype.addQueryArgRule = function (rule) {
    this.query.push(rule);
    return this;
};

module.exports = RulePath;
