'use strict';

var R_ADVANCED_PATTERN = /^\s*(?:([a-z]+(?:\s*,\s*[a-z]+)*|\*)\s+)?([\s\S]+?)(?:\s+([a-z]+))?\s*$/i;

var Match = /** @type Match */ require('./match');
var Matcher = /** @type Matcher */ require('./matcher');
var Rule = /** @type Rule */ require('./rule');

var _ = require('lodash-node');
var methods = require('methods');

/**
 * @class Router
 * @extends Matcher
 *
 * @param {Object} params
 * */
function Router(params) {
    Matcher.call(this, params);

    /**
     * @protected
     * @memberOf {Router}
     * @property
     * @type {Object}
     * */
    this._implemented = Object.create(null);
}

Router.prototype = Object.create(Matcher.prototype);

Router.prototype.constructor = Router;

/**
 * @public
 * @memberOf {Router}
 * @method
 *
 * @param {String} verb
 *
 * @returns {Array<String>|undefined}
 * */
Router.prototype.getNamesByVerb = function (verb) {
    return this._implemented[verb.toUpperCase()];
};

/**
 * @public
 * @memberOf {Router}
 * @method
 *
 * @param {String} ruleString
 * @param {*} [ruleData]
 *
 * @returns {Rule}
 * */
Router.prototype.addRule = function (ruleString, ruleData) {
    var rule = Matcher.prototype.addRule.call(this, ruleString, ruleData);

    _.forEach(rule.data.verbs, function (verb) {
        var rules = this._implemented[verb];

        if (!rules) {
            rules = this._implemented[verb] = [];
        }

        rules[rules.length] = rule.data.name;
    }, this);

    return rule;
};

/**
 * @public
 * @memberOf {Router}
 * @method
 *
 * @param {String} name
 *
 * @returns {Rule|null}
 * */
Router.prototype.delRule = function (name) {
    var rule = Matcher.prototype.delRule.call(this, name);

    if (!rule) {
        return rule;
    }

    _.forEach(rule.data.verbs, function (verb) {
        var rules = this._implemented[verb];

        _.pull(rules, name);

        if (!rules.length) {
            delete this._implemented[verb];
        }
    }, this);

    return rule;
};

/**
 * @public
 * @memberOf {Router}
 * @method
 *
 * @param {String} url
 *
 * @returns {Array}
 * */
Router.prototype.matchVerbs = function (url) {
    var args;
    var data;
    var i;
    var j;
    var k;
    var l;
    var rule;
    var rules = this.rules;
    var verbs = [];

    for (i = 0, l = rules.length; i < l; i += 1) {
        rule = rules[i];
        args = rule.match(url);

        if (!args) {
            continue;
        }

        data = rule.data;

        for (j = 0, k = data.verbs.length; j < k; j += 1) {
            if (verbs.indexOf(data.verbs[j]) === -1) {
                verbs[verbs.length] = data.verbs[j];
            }
        }
    }

    verbs.sort();

    return verbs;
};

/**
 * @public
 * @memberOf {Router}
 * @method
 *
 * @param {String} url
 * @param {Array<String>} names
 *
 * @returns {Array}
 * */
Router.prototype.matchRules = function (url, names) {
    var args;
    var i;
    var l;
    var rule;
    var rules = this.rules;
    var index = this._index;
    var matches = [];

    for (i = 0, l = names.length; i < l; i += 1) {
        rule = rules[index[names[i]]];
        args = rule.match(url);

        if (args) {
            matches[matches.length] = new Match(args, rule.data);
        }
    }

    return matches;
};

/**
 * @protected
 * @memberOf {Router}
 * @method
 *
 * @param {String} requestRule
 * @param {Object} [params]
 * @param {Object} [ruleData]
 *
 * @returns {Rule}
 * */
Router.prototype._createRule = function (requestRule, params, ruleData) {
    var pattern = Router._parseRequestRule(requestRule);

    params = Router._createRuleParams(params, pattern[2]);

    ruleData = _.extend({
        verbs: Router._parseVerbs(pattern[0])
    }, ruleData);

    return new Rule(pattern[1], params, ruleData);
};

/**
 * @protected
 * @static
 * @memberOf {Router}
 * @method
 *
 * @param {String} verbsString
 *
 * @returns {Array<String>}
 * */
Router._parseVerbs = function (verbsString) {
    var verbs = [];

    if (verbsString) {
        verbs = verbsString.split(',');
    }

    if (verbs[0] === '*') {
        verbs = methods;
    }

    verbs = _.map(verbs, function (verb) {
        return verb.trim().toUpperCase();
    });

    verbs = _.uniq(verbs);

    if (!verbs.length) {
        verbs = ['GET'];
    }

    if (_.contains(verbs, 'GET') && !_.contains(verbs, 'HEAD')) {
        verbs[verbs.length] = 'HEAD';
    }

    verbs.sort();

    return verbs;
};

/**
 * @protected
 * @static
 * @memberOf {Router}
 * @method
 *
 * @param {String} requestRule
 *
 * @returns {[String, String, String]}
 * */
Router._parseRequestRule = function (requestRule) {
    var result = R_ADVANCED_PATTERN.exec(requestRule);

    return [result[1] || '', result[2], result[3] || ''];
};

/**
 * @protected
 * @static
 * @memberOf {Router}
 * @property
 * @type {Object}
 * */
Router._flagsMapping = {
    i: 'ignoreCase',
    s: 'appendSlash'
};

/**
 * @protected
 * @static
 * @memberOf {Router}
 * @method
 *
 * @param {Object} defaultParams
 * @param {String} routeFlags
 *
 * @returns {Object}
 * */
Router._createRuleParams = function (defaultParams, routeFlags) {
    var params = _.extend({}, defaultParams);

    _.forEach(routeFlags, function (flag) {
        var name = Router._flagsMapping[flag.toLowerCase()] || flag;
        params[name] = flag.toLowerCase() === flag;
    });

    return params;
};

/**
 * @public
 * @static
 * @memberOf {Router}
 * @property
 * @type Matcher
 * */
Router.Matcher = Matcher;

/**
 * @public
 * @static
 * @memberOf {Router}
 * @property
 * @type Rule
 * */
Router.Rule = Rule;

module.exports = Router;
