'use strict';

var R_ADVANCED_PATTERN = /^\s*(?:([a-z]+(?:\s*,\s*[a-z]+)*)\s+)?([\s\S]+?)(?:\s+([a-z]+))?\s*$/i;

var Matcher = /** @type Matcher */ require('./matcher');
var Rule = /** @type Rule */ require('./rule');

var _ = require('lodash-node');
var hasProperty = Object.prototype.hasOwnProperty;

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
 * @returns {Boolean}
 * */
Router.prototype.isImplemented = function (verb) {
    return verb.toUpperCase() in this._implemented;
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
    var i;
    var l;
    var rule = Matcher.prototype.addRule.call(this, ruleString, ruleData);
    var verbs = rule.data.verbs;
    var verb;
    var rules;

    for (i = 0, l = verbs.length; i < l; i += 1) {
        verb = verbs[i];
        rules = this._implemented[verb];

        if (!rules) {
            rules = this._implemented[verb] = [];
        }

        rules[rules.length] = rule.data.name;
    }

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
    var i;
    var j;
    var l;
    var rule = Matcher.prototype.delRule.call(this, name);
    var verbs;
    var verb;
    var rules;

    if (!rule) {
        return rule;
    }

    verbs = rule.data.verbs;

    for (i = 0, l = verbs.length; i < l; i += 1) {
        verb = verbs[i];
        rules = this._implemented[verb];

        for (j = rules.length - 1; j >= 0; j -= 1) {
            if (rules[j] === name) {
                rules.splice(j, 1);
            }
        }

        if (!rules.length) {
            delete this._implemented[verb];
        }
    }

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
    var verbs = [];
    var i;
    var j;
    var k;
    var l;
    var rule;
    var args;

    for (i = 0, l = this._rules.length; i < l; i += 1) {
        rule = this._rules[i];
        args = rule.match(url);

        if (!args) {
            continue;
        }

        for (j = 0, k = rule.data.verbs.length; j < k; j += 1) {
            if (verbs.indexOf(rule.data.verbs[j]) === -1) {
                verbs[verbs.length] = rule.data.verbs[j];
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
 * @param {String} verb
 * @param {String} url
 *
 * @returns {Array}
 * */
Router.prototype.matchAll = function (verb, url) {
    var matches = [];
    var names;
    var rule;
    var i;
    var l;
    var args;
    var rules = this._rules;
    var index = this._index;

    verb = verb.toUpperCase();

    //  DO NOT CHECK IS IMPLEMENTED, LET THROW ERROR
    //  if (!(verb in this._implemented)) {
    //      return matches;
    //  }

    names = this._implemented[verb];

    for (i = 0, l = names.length; i < l; i += 1) {
        rule = rules[index[names[i]]];
        args = rule.match(url);

        if (args) {
            matches[matches.length] = {
                args: args,
                data: rule.data
            };
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
    var allowedVerbs = [];
    var verbs = [];
    var i;
    var l;

    if (verbsString) {
        allowedVerbs = verbsString.split(',').map(function (verb) {
            return verb.trim().toUpperCase();
        });
    }

    for (i = 0, l = allowedVerbs.length; i < l; i += 1) {
        if (verbs.indexOf(allowedVerbs[i]) === -1) {
            verbs[verbs.length] = allowedVerbs[i];
        }
    }

    if (!verbs.length) {
        verbs = ['GET'];
    }

    if (verbs.indexOf('GET') > -1 && verbs.indexOf('HEAD') === -1) {
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
    var i;
    var l;
    var flag;
    var name;
    var params = {};

    for (i in defaultParams) {
        if (hasProperty.call(defaultParams, i)) {
            params[i] = defaultParams[i];
        }
    }

    for (i = 0, l = routeFlags.length; i < l; i += 1) {
        flag = routeFlags.charAt(i);
        name = Router._flagsMapping[flag.toLowerCase()] || flag;
        params[name] = flag.toLowerCase() === flag;
    }

    return params;
};

module.exports = Router;
