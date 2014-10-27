/*eslint no-constant-condition: 0*/
'use strict';

var Match = /** @type Match */ require('./match');
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
    var data = {name: uniqueId()};
    var name;
    var rule = this._createRule(ruleString, this.params);

    for (i in ruleData) {
        if (hasProperty.call(ruleData, i)) {
            data[i] = ruleData[i];
        }
    }

    name = data.name;
    rule.data = data;

    for (i = this.rules.length - 1; i >= 0; i -= 1) {
        if (this.rules[i].data.name === name) {
            this.rules.splice(i, 1);
        }
    }

    rule.warmUp();

    this.index[name] = this.rules.push(rule) - 1;

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
 * @param {String} url
 *
 * @returns {Match}
 * */
Matcher.prototype._createMatch = function (url) {
    return new Match(this, url);
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
Matcher.prototype.match = function (url) {
    var match = this._createMatch(url);
    var matches = [];
    var result;

    while (true) {
        result = match.next();

        if (result.value && result.value.args) {
            matches[matches.length] = result.value;
        }

        if (result.done) {
            break;
        }
    }

    return matches;
};

module.exports = Matcher;
