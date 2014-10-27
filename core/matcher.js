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
    this._rules = [];

    /**
     * @public
     * @memberOf {Matcher}
     * @property
     * @type {Object}
     * */
    this._index = Object.create(null);
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
 * @returns {Rule}
 * */
Matcher.prototype.addRule = function (ruleString, ruleData) {
    var rule = this._createRoute(ruleString, ruleData);

    this.delRule(rule.data.name);
    this._index[rule.data.name] = this._rules.push(rule) - 1;

    return rule;
};

/**
 * @public
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} name
 *
 * @returns {Rule|null}
 * */
Matcher.prototype.delRule = function (name) {
    var i;
    var rule = null;

    for (i = this._rules.length - 1; i >= 0; i -= 1) {
        if (this._rules[i].data.name === name) {
            rule = this._rules.splice(i, 1)[0];
            delete this._index[rule.data.name];

            break;
        }
    }

    return rule;
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
    return this._rules[this._index[name]];
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

/**
 * @protected
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} ruleString
 * @param {Object} params
 *
 * @returns {Rule}
 * */
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
    var rule;

    for (i = 0, l = this._rules.length; i < l; i += 1) {
        rule = this._rules[i];
        args = rule.match(url);

        if (args) {
            matches[matches.length] = {
                args: args,
                name: rule.data.name
            };
        }
    }

    return matches;
};

module.exports = Matcher;
