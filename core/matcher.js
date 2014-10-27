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
     * @type {Array}
     * */
    this.rules = [];

    /**
     * @public
     * @memberOf {Matcher}
     * @property
     * @type {Object}
     * */
    this.index = Object.create(null);
}

/**
 * @protected
 * @memberOf {Matcher}
 * @method
 *
 * @param {*} ruleData
 *
 * @returns {Object}
 * */
Matcher.prototype._createRuleData = function (ruleData) {
    var data = {name: uniqueId()};
    var i;

    for (i in ruleData) {
        if (hasProperty.call(ruleData, i)) {
            data[i] = ruleData[i];
        }
    }

    return data;
};

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
    var rule = this._createRoute(ruleString, ruleData);

    for (i = this.rules.length - 1; i >= 0; i -= 1) {
        if (this.rules[i].data.name === rule.data.name) {
            this.rules.splice(i, 1);
        }
    }

    this.index[rule.data.name] = this.rules.push(rule) - 1;

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
    return this.rules[this.index[name]];
};

/**
 * @protected
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} urlPattern
 * @param {Object} ruleData
 *
 * @returns {Rule}
 * */
Matcher.prototype._createRoute = function (urlPattern, ruleData) {
    var rule = this._createRule(urlPattern, this.params);

    rule.data = this._createRuleData(ruleData);

    return rule;
};

Matcher.prototype._createRule = function (ruleString, params) {
    return new Rule(ruleString, params);
};

/**
 * @public
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} url
 *
 * @returns {Array}
 * */
Matcher.prototype.matchAll = function (url) {
    var matches = [];
    var args;
    var i;
    var l;

    for (i = 0, l = this.rules.length; i < l; i += 1) {
        args = this.rules[i].match(url);

        if (args) {
            matches[matches.length] = {
                args: args,
                name: this.rules[i].data.name
            };
        }
    }

    return matches;
};

module.exports = Matcher;
