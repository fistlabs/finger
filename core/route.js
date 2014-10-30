'use strict';

var R_ADVANCED_PATTERN = /^\s*(?:([a-z]+(?:\s*,\s*[a-z]+)*)\s+)?([\s\S]+?)(?:\s+([a-z]+))?\s*$/i;

var Rule = /** @type Rule */ require('./rule');
var hasProperty = Object.prototype.hasOwnProperty;

/**
 * @class Route
 * @extends Rule
 *
 * @param {String} requestRule
 * @param {Object} [params]
 * */
function Route(requestRule, params) {
    var pattern = Route._parseRequestRule(requestRule);

    params = Route._createRuleParams(params, pattern[2]);

    Rule.call(this, pattern[1], params);

    /**
     * @protected
     * @memberOf {Route}
     * @property
     * @type {String}
     * */
    this._routeFlags = pattern[2];

    /**
     * @public
     * @memberOf {Route}
     * @property
     * @type {Array<String>}
     * */
    this.verbs = Route._parseVerbs(pattern[0]);
}

Route.prototype = Object.create(Rule.prototype);

Route.prototype.constructor = Route;

/**
 * @public
 * @memberOf {Route}
 * @method
 *
 * @returns {String}
 * */
Route.prototype.toString = function () {
    var requestRule = this.verbs.join(', ') + ' ' + Rule.prototype.toString.call(this);
    var flags = this._routeFlags;

    if (flags) {
        return requestRule + ' ' + flags;
    }

    return requestRule;
};

/**
 * @protected
 * @static
 * @memberOf {Route}
 * @property
 * @type {Object}
 * */
Route._flagsMapping = {
    i: 'ignoreCase'
};

/**
 * @protected
 * @static
 * @memberOf {Route}
 * @property
 * @type {Object}
 * */
Route._paramsMapping = Object.keys(Route._flagsMapping).reduce(function (paramsMapping, flag) {
    paramsMapping[Route._flagsMapping[flag]] = flag;
    return paramsMapping;
}, {});

/**
 * @protected
 * @static
 * @memberOf {Route}
 * @method
 *
 * @param {Object} defaultParams
 * @param {String} routeFlags
 *
 * @returns {Object}
 * */
Route._createRuleParams = function (defaultParams, routeFlags) {
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
        name = Route._flagsMapping[flag.toLowerCase()] || flag;
        params[name] = flag.toLowerCase() === flag;
    }

    return params;
};

/**
 * @protected
 * @static
 * @memberOf {Route}
 * @method
 *
 * @param {String} verbsString
 *
 * @returns {Array<String>}
 * */
Route._parseVerbs = function (verbsString) {
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
 * @memberOf {Route}
 * @method
 *
 * @param {String} requestRule
 *
 * @returns {[String, String, String]}
 * */
Route._parseRequestRule = function (requestRule) {
    var result = R_ADVANCED_PATTERN.exec(requestRule);

    return [result[1] || '', result[2], result[3] || ''];
};

module.exports = Route;
