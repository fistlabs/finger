'use strict';

var Matcher = /** @type Matcher */ require('./matcher');
var Route = /** @type Route */ require('./route');

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
    return verb in this._implemented;
};

/**
 * @public
 * @memberOf {Router}
 * @method
 *
 * @param {String} ruleString
 * @param {*} [ruleData]
 *
 * @returns {Route}
 * */
Router.prototype.addRule = function (ruleString, ruleData) {
    var i;
    var l;
    var rule = Matcher.prototype.addRule.call(this, ruleString, ruleData);
    var verbs = rule.verbs;
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
 * @returns {Route|null}
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

    verbs = rule.verbs;

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

        for (j = 0, k = rule.verbs.length; j < k; j += 1) {
            if (verbs.indexOf(rule.verbs[j]) === -1) {
                verbs[verbs.length] = rule.verbs[j];
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
    var rules;
    var rule;
    var i;
    var name;
    var l;
    var args;

    verb = verb.toUpperCase();

    //  DO NOT CHECK IS IMPLEMENTED, LET THROW ERROR
    //  if (!(verb in this._implemented)) {
    //      return matches;
    //  }

    rules = this._implemented[verb];

    for (i = 0, l = rules.length; i < l; i += 1) {
        name = rules[i];
        rule = this._rules[this._index[name]];
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

/**
 * @protected
 * @memberOf {Router}
 * @method
 *
 * @param {String} requestRule
 * @param {Object} [params]
 *
 * @returns {Route}
 * */
Router.prototype._createRule = function (requestRule, params) {
    return new Route(requestRule, params);
};

module.exports = Router;
