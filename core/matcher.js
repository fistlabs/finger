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
    this._index = this._createIndex();
}

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
    this._rules.push(rule);
    this._index = this._createIndex();

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
    var rule = null;

    if (name in this._index) {
        rule = this._rules.splice(this._index[name], 1)[0];
        this._index = this._createIndex();
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
 * @returns {Object}
 * */
Matcher.prototype._createIndex = function () {
    var i;
    var l;
    var index = Object.create(null);

    for (i = 0, l = this._rules.length; i < l; i += 1) {
        index[this._rules[i].data.name] = i;
    }

    return index;
};

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
