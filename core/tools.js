'use strict';

var Parser = /** @type Parser */ require('./parser/parser');

var parser = new Parser();

/**
 * @class Tools
 * @extends Parser
 * @param {String} ruleString
 * */
function Tools(ruleString) {

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
Tools.prototype.inspect = function (func) {
    Tools.inspectRule(this._pathRule, func, this);
    return this;
};

/**
 * @public
 * @memberOf {Tools}
 * @method
 *
 * @param {Function} func
 * @param {*} accum
 *
 * @returns {String}
 * */
Tools.prototype.reduce = function (func, accum) {
    this.inspect(function (rule, stackPop, depth) {
        accum = func.call(this, accum, rule, stackPop, depth);
    });

    return accum;
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
    return parser.parse(this._ruleString);
};

/**
 * @public
 * @static
 * @memberOf {Tools}
 * @method
 *
 * @param {Object} rule
 * @param {Function} func
 * @param {*} [thisp]
 * */
Tools.inspectRule = function (rule, func, thisp) {
    var index = 0;
    var parts = [rule];
    var stack = [];
    var depth = stack.length;
    var count = parts.length;
    var state;

    do {
        if (count === index) {
            // do not check if depth === 0, coz 0 depth always have child nodes
            state = stack.pop();
            depth = stack.length;
            parts = state.parts;
            index = state.index;
            count = parts.length;
            func.call(thisp, parts[index], true, depth);
            index += 1;

            continue;
        }

        rule = parts[index];

        func.call(thisp, rule, false, depth);

        if (rule.parts) {
            depth = stack.push(new State(parts, index));
            parts = rule.parts;
            index = 0;
            count = parts.length;

            continue;
        }

        index += 1;
    } while (depth > 0);
};

function State(parts, index) {
    this.parts = parts;
    this.index = index;
}

module.exports = Tools;
