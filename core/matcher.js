'use strict';

var Rule = /** @type Rule */ require('./rule');

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
    var rule = this._createRule(ruleString, this.params, ruleData);

    this.delRule(rule.data.name);
    this.rules.push(rule);
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
        rule = this.rules.splice(this._index[name], 1)[0];
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
    return this.rules[this._index[name]];
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

    for (i = 0, l = this.rules.length; i < l; i += 1) {
        index[this.rules[i].data.name] = i;
    }

    return index;
};

/**
 * @protected
 * @memberOf {Matcher}
 * @method
 *
 * @param {String} ruleString
 * @param {Object} [params]
 * @param {Object} [ruleData]
 *
 * @returns {Rule}
 * */
Matcher.prototype._createRule = function (ruleString, params, ruleData) {
    return new Rule(ruleString, params, ruleData);
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
    var args;
    var i;
    var l;
    var matches = [];
    var rule;
    var rules = this.rules;

    for (i = 0, l = rules.length; i < l; i += 1) {
        rule = rules[i];
        args = rule.match(url);

        if (args) {
            matches[matches.length] = new Match(args, rule.data);
        }
    }

    return matches;
};

function Match(args, data) {
    this.args = args;
    this.data = data;
}

Matcher.Match = Match;

module.exports = Matcher;
