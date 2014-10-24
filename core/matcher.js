'use strict';

var Rule = /** @type Rule */ require('./rule');

var hasProperty = Object.prototype.hasOwnProperty;
var uniqueId = require('unique-id');

/**
 * @class Matcher
 * @param {Object} params
 * */
function Matcher(params) {

    /**
     * @public
     * @memberOf {Matcher}
     * @property
     * @type {Object}
     * */
    this.params = Object(params);

    /**
     * @public
     * @memberOf {Matcher}
     * @property
     * @type {Array<Rule>}
     * */
    this.rules = [];

    /**
     * @public
     * @memberOf {Matcher}
     * @property
     * @type {Object<Rule>}
     * */
    this.names = Object.create(null);
}

/**
 * @public
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} ruleString
 * @param {Object} [ruleData]
 *
 * @returns {Matcher}
 * */
Matcher.prototype.addRule = function (ruleString, ruleData) {
    var i;
    var rule = this._createRule(ruleString);
    var data = {
        name: uniqueId()
    };

    for (i in ruleData) {
        if (hasProperty.call(ruleData, i)) {
            data[i] = ruleData[i];
        }
    }

    rule.data = data;

    for (i = this.rules.length - 1; i >= 0; i -= 1) {
        if (this.rules[i].data.name === rule.data.name) {
            this.rules.splice(i, 1);
        }
    }

    this.rules.push(rule);
    this.names[rule.data.name] = rule;

    return this;
};

/**
 * @public
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} name
 *
 * @returns {Rule|void}
 * */
Matcher.prototype.getRule = function (name) {
    return this.names[name];
};

/**
 * @protected
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} ruleString
 *
 * @returns {Rule}
 * */
Matcher.prototype._createRule = function (ruleString) {
    return new Rule(ruleString, this.params);
};

/**
 * @public
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} url
 *
 * @returns {Object|null}
 * */
Matcher.prototype.match = function (url) {
    var args;
    var i;
    var l;
    var result = [];

    for (i = 0, l = this.rules.length; i < l; i += 1) {
        args = this.rules[i].match(url);

        if (args === null) {
            continue;
        }

        result[result.length] = {
            args: args,
            name: this.rules[i].data.name
        };
    }

    return result;
};

module.exports = Matcher;
