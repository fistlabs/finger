'use strict';

var RuleSeq = /** @type RuleSeq */ require('./parser/rule-seq');
var Parser = /** @type Parser */ require('./parser/parser');

/**
 * @class Tools
 * @extends Parser
 * @param {String} ruleString
 * */
function Tools(ruleString) {
    Parser.call(this);

    /**
     * @protected
     * @memberOf {Tools}
     * @property
     * @type {String}
     * */
    this._ruleString = ruleString;

    /**
     * @protected
     * @memberOf {Tools}
     * @property
     * @type {RulePath}
     * */
    this._pathRule = this._compilePathRule();
}

Tools.prototype = Object.create(Parser.prototype);

Tools.prototype.constructor = Tools;

/**
 * @public
 * @memberOf {Tools}
 * @method
 *
 * @param {Function} func
 *
 * @returns {Tools}
 * */
Tools.prototype.inspectRule = function (func) {
    Tools._inspectRule(this._pathRule, func, this);
    return this;
};

/**
 * @public
 * @memberOf {Tools}
 * @method
 *
 * @param {Function} func
 *
 * @returns {String}
 * */
Tools.prototype.reduceRule = function (func) {
    var result = '';

    this.inspectRule(function () {
        result += func.apply(this, arguments);
    });

    return result;
};

/**
 * @public
 * @memberOf {Tools}
 * @method
 *
 * @returns {String}
 * */
Tools.prototype.toString = function () {
    return this._ruleString;
};

/**
 * @protected
 * @memberOf {Tools}
 * @method
 *
 * @returns {RulePath}
 * */
Tools.prototype._compilePathRule = function () {
    return this.parse(this._ruleString);
};

/**
 * @protected
 * @static
 * @memberOf {Tools}
 * @method
 *
 * @param {Object} rule
 * @param {Function} func
 * @param {*} [ctx]
 * */
Tools._inspectRule = function (rule, func, ctx) {
    Tools.__forEachRule(rule, func, ctx, 0);
};

/**
 * @private
 * @static
 * @memberOf {Tools}
 * @method
 *
 * @param {Object} rule
 * @param {Function} func
 * @param {*} ctx
 * @param {Number} n
 * */
Tools.__forEachRule = function (rule, func, ctx, n) {
    var i;
    var l;
    var parts;

    func.call(ctx, rule, false, n);

    if (rule.type === RuleSeq.TYPE) {
        parts = rule.parts;

        for (i = 0, l = parts.length; i < l; i += 1) {
            Tools.__forEachRule(parts[i], func, ctx, n + 1);
        }

        func.call(ctx, rule, true, n);
    }
};

module.exports = Tools;
