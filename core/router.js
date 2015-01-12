'use strict';

var R_ADVANCED_PATTERN = /^\s*(?:([a-z]+(?:\s*,\s*[a-z]+)*|\*)\s+)?([\s\S]+?)(?:\s+([a-z]+))?\s*$/i;

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
    var rules = this._rules;
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
 * @param {String} [verb]
 *
 * @returns {Array}
 * */
Router.prototype.matchAll = function (url, verb) {
    var matches = [];
    var names;
    var rule;
    var i;
    var l;
    var args;
    var rules = this._rules;
    var index = this._index;

    verb = verb ? String(verb).toUpperCase() : 'GET';

    //  Do not check is verb implemented, let throw error.
    //  We should check it manually by router.isImplemented
    // if (!(verb in this._implemented)) {
    //     return matches;
    // }

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

    if (_.indexOf(verbs, 'GET') > -1 && _.indexOf(verbs, 'HEAD') === -1) {
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

module.exports = Router;
