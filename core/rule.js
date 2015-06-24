/*eslint no-new-func: 0*/
'use strict';

var RuleAny = /** @type RuleAny */ require('./parser/rule-any');
var RuleArg = /** @type RuleArg */ require('./parser/rule-arg');
var RuleSep = /** @type RuleSep */ require('./parser/rule-sep');

var Tools = /** @type Tools */ require('./tools');
var Kind = /** @type Kind */ require('./kind');

var _ = require('lodash-node');
var hasProperty = Object.prototype.hasOwnProperty;
var matchValues = require('./match-values');
var regesc = require('regesc');
var uniqueId = require('unique-id');
var f = require('util').format;
var commonTypes = require('./common-types');

/**
 * @class Rule
 * @extends Tools
 *
 * @param {String} ruleString
 * @param {Object} [params]
 * @param {Object} [data]
 * */
function Rule(ruleString, params, data) {
    Tools.call(this, ruleString);

    /**
     * @public
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this.params = _.extend({
        basePath: '',
        queryEq: '=',
        querySep: '&'
    }, params);

    /**
     * @public
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this.data = _.extend({
        name: uniqueId()
    }, data);

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Array<String>}
     * */
    this._pathParams = this._findPathParams();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this._queryParams = this._compileQueryParams();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Array}
     * */
    this._queryParamsNames = _.keys(this._queryParams);

    this.params.types = _.extend({}, commonTypes, this.params.types);

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this._kinds = _.mapValues(this.params.types, function (regex, kind) {
        return new Kind(kind, regex);
    });

    _.forEach([{
        rules: this._pathParams,
        defaultKind: 'Segment'
    }, {
        rules: this._pathRule.query,
        defaultKind: 'String'
    }], function (setup) {
        _.forEach(setup.rules, function (rule) {
            if (!rule.kind) {
                if (rule.regex) {
                    rule.setUniqueKindName();
                    this._kinds[rule.kind] = new Kind(rule.kind, rule.regex);
                } else {
                    rule.kind = setup.defaultKind;
                }
            }

            if (!_.has(this._kinds, rule.kind)) {
                throw new TypeError(f('Unknown %j parameter type %j', rule.name, rule.kind));
            }
        }, this);
    }, this);

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this._paramsCount = this._compileParamsCount();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {RegExp}
     * */
    this._matchRegExp = this._compileMatchRegExp();
}

Rule.prototype = Object.create(Tools.prototype);

/**
 * @public
 * @memberOf {Rule}
 * @method
 * @constructs
 * */
Rule.prototype.constructor = Rule;

/**
* @public
* @memberOf {Rule}
* @method
*
* @param {Object} [args]
*
* @returns {String}
* */
Rule.prototype.build = function (args) {
    var argName;
    var i;
    var keys;
    var l;
    var queryArgs = [];
    var url;

    args = Object(args);

    // build pathname
    url = this._buildPathname(this.params.basePath, args);

    // prepare args to build query string
    keys = this._queryParamsNames;

    for (i = 0, l = keys.length; i < l; i += 1) {
        argName = keys[i];
        args[argName] = this._matchQueryArg(args, argName);
    }

    keys = Object.keys(args);

    for (i = 0, l = keys.length; i < l; i += 1) {
        argName = keys[i];

        if (hasProperty.call(this._paramsCount, argName)) {
            // the parameter with such name is used in pathname rule, skip
            continue;
        }

        queryArgs = this._reduceQueryArgs(queryArgs, args[argName], argName);
    }

    if (queryArgs.length) {
        url += '?' + queryArgs.join(this.params.querySep);
    }

    return url;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Array} queryArgs
 * @param {*} value
 * @param {String} argName
 *
 * @returns {Array}
 * */
Rule.prototype._reduceQueryArgs = function (queryArgs, value, argName) {
    var i;
    var l;

    if (_.isArray(value)) {
        for (i = 0, l = value.length; i < l; i += 1) {
            queryArgs[queryArgs.length] = this._createQueryArg(argName, value[i]);
        }
    } else {
        queryArgs[queryArgs.length] = this._createQueryArg(argName, value);
    }

    return queryArgs;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 * @param {*} value
 *
 * @returns {String}
 * */
Rule.prototype._createQueryArg = function (name, value) {
    return this._valEscape(name) + this.params.queryEq + this._qStringify(value);
};

/**
 * @public
 * @memberOf {Rule}
 * @method
 *
 * @param {String} url
 *
 * @returns {Object|Null}
 * */
Rule.prototype.match = function (url) {
    /*eslint complexity: 0*/
    var args = {};
    var i;
    var l;
    var match;
    var name;
    var pathParams;
    var queryObject;
    var value;
    var keys;

    if (url.indexOf(this.params.basePath) !== 0) {
        return null;
    }

    url = url.substr(this.params.basePath.length) || '/';

    if (this.params.appendSlash) {
        url = url.replace(/^(\/[^.?\/]+[^\/?])(\?[^?]*)?$/, '$1/$2');
    }

    match = url.match(this._matchRegExp);

    if (match === null) {
        return null;
    }

    pathParams = this._pathParams;

    for (i = 0, l = pathParams.length; i < l; i += 1) {
        value = match[i + 1];
        name = pathParams[i].name;

        if (typeof value === 'string') {
            value = this._valUnescape(value);
        } else {
            value = pathParams[i].value;
        }

        if (!hasProperty.call(args, name)) {
            args[name] = value;
        } else if (_.isArray(args[name])) {
            args[name].push(value);
        } else {
            args[name] = [args[name], value];
        }
    }

    queryObject = this.matchQueryString(match[l + 1]);

    if (!queryObject) {
        return null;
    }

    keys = Object.keys(args);
    l = keys.length;

    while (l) {
        l -= 1;
        name = keys[l];
        queryObject[name] = args[name];
    }

    return queryObject;
};

/**
 * @public
 * @memberOf {Rule}
 * @method
 *
 * @param {String} queryString
 *
 * @returns {Object|null}
 * */
Rule.prototype.matchQueryString = function (queryString) {
    var queryObject = queryString ? this._parseQs(queryString) : {};
    var queryParamsNames = this._queryParamsNames;
    var queryParams = this._queryParams;
    var l = queryParamsNames.length;
    var rules;
    var paramName;
    var values;

    while (l) {
        l -= 1;
        paramName = queryParamsNames[l];
        values = this._matchQueryArg(queryObject, paramName);

        if (!values) {
            return null;
        }

        rules = queryParams[paramName];

        if (rules.length === 1 && !rules[0].multiple) {
            values = values[0];
        }

        queryObject[paramName] = values;
    }

    return queryObject;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Object} queryObject
 * @param {String} paramName
 *
 * @returns {Array|null}
 * */
Rule.prototype._matchQueryArg = function (queryObject, paramName) {
    var rules = this._queryParams[paramName];
    var values;

    if (!hasProperty.call(queryObject, paramName)) {
        values = [];
    } else if (_.isArray(queryObject[paramName])){
        values = queryObject[paramName];
    } else {
        values = [queryObject[paramName]];
    }

    return matchValues(rules, this._kinds, values);
};

/**
 * @protected
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._compileQueryParams = function () {
    var queryParams = {};
    _.forEach(this._pathRule.query, function (rule) {
        if (_.has(queryParams, rule.name)) {
            queryParams[rule.name].push(rule);
        } else {
            queryParams[rule.name] = [rule];
        }
    });
    return queryParams;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} accum
 * @param {Object} args
 *
 * @returns {String}
 * */
Rule.prototype._buildPathname = function (accum, args) {
    var count = 1; // parts.length
    var depth = 0; // stack.length
    var index = 0; // current rule index
    var parts = [this._pathRule];
    var stack = [];

    var $rule = void 0;
    var state = void 0;
    var value = void 0;

    do {
        if (count === index) {
            depth -= 1;
            state = stack[depth];
            accum = state.accum + accum;
            parts = state.parts;
            index = state.index + 1;
            count = parts.length;

            continue;
        }

        $rule = parts[index];
        index += 1;

        if ($rule.type === RuleSep.TYPE) {
            accum += '/';

            continue;
        }

        if ($rule.type === RuleAny.TYPE) {
            accum += this._valEscape($rule.text);

            continue;
        }

        if ($rule.parts) {
            // RuleSeq
            stack[depth] = new State(accum, parts, index - 1);
            depth += 1;
            accum = '';
            parts = $rule.parts;
            index = 0;
            count = parts.length;

            continue;
        }

        // RuleArg
        value = null;

        if (hasProperty.call(args, $rule.name)) {
            value = args[$rule.name];
            if (!_.isArray(value)) {
                value = [value];
            }

            value = value[$rule.used];
        }

        if (value === null || value === void 0 || value === '') {
            value = $rule.value;
        }

        if (value === null || value === void 0 || value === '') {
            if (depth < 2) {

                continue;
            }

            depth -= 1;
            state = stack[depth];
            accum = state.accum;
            parts = state.parts;
            count = index = parts.length;

            continue;
        }

        // value ok
        accum += this._pStringify(value);

    } while (depth);

    return accum;
};

function State(accum, parts, index) {
    this.accum = accum;
    this.parts = parts;
    this.index = index;
}

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {RegExp}
 * */
Rule.prototype._compileMatchRegExp = function () {
    var source = this.reduce(this._compileMatchRegExpPart, '');

    source = '^' + source + '(?:\\?([\\s\\S]*))?$';

    return new RegExp(source, this.params.ignoreCase ? 'i' : '');
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} accum
 * @param {Object} rule
 * @param {Boolean} stackPop
 * @param {Number} depth
 *
 * @returns {Object}
 * */
Rule.prototype._compileMatchRegExpPart = function (accum, rule, stackPop, depth) {
    var type = rule.type;

    if (type === RuleSep.TYPE) {
        return accum + regesc('/');
    }

    if (type === RuleAny.TYPE) {
        return accum + this._compileMatchRegExpPartStatic(rule);
    }

    if (type === RuleArg.TYPE) {
        type = this._kinds[rule.kind];

        return accum + '(' + type.regex + ')';
    }

    if (depth === 0) {
        return accum;
    }

    if (stackPop) {
        return accum + ')?';
    }

    return accum + '(?:';
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Object} rule
 *
 * @returns {String}
 * */
Rule.prototype._compileMatchRegExpPartStatic = function (rule) {
    var char;
    var i;
    var l;
    var result = '';
    var text = rule.text;

    for (i = 0, l = text.length; i < l; i += 1) {
        char = text.charAt(i);

        if (char === this._valEscape(char)) {
            result += regesc(char);

            continue;
        }

        if (this.params.ignoreCase) {
            result += '(?:' + regesc(char) + '|' +
                this._valEscape(char.toLowerCase()) + '|' + this._valEscape(char.toUpperCase()) + ')';

            continue;
        }

        result += '(?:' + regesc(char) + '|' + this._valEscape(char) + ')';
    }

    return result;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._compileParamsCount = function () {
    var count = {};

    _.forEach(this._pathParams, function (rule) {
        var name = rule.name;
        if (_.has(count, name)) {
            count[name] += 1;
        } else {
            count[name] = 1;
        }
    }, this);

    return count;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Array<String>}
 * */
Rule.prototype._findPathParams = function () {
    var order = [];

    this.inspect(function (rule) {
        if (rule.type === RuleArg.TYPE) {
            order[order.length] = rule;
        }
    });

    return order;
};

/**
 * @protected
 * @memberOf {Rule}
 * @method
 *
 * @returns {RulePath}
 * */
Rule.prototype._compilePathRule = function () {
    var pathRule = Tools.prototype._compilePathRule.call(this);
    var used = Object.create(null);

    Tools.inspectRule(pathRule, function (rule) {
        var name = rule.name;

        if (rule.type !== RuleArg.TYPE) {
            return;
        }

        if (used[name] === void 0) {
            used[name] = 0;
        } else {
            used[name] += 1;
        }

        rule.used = used[name];
    });

    return pathRule;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} queryString
 *
 * @returns {Object}
 * */
Rule.prototype._parseQs = function (queryString) {
    var eqIndex;
    var i;
    var key;
    var l;
    var pair;
    var pairs = queryString.split(this.params.querySep);
    var val;
    var queryObject = {};

    for (i = 0, l = pairs.length; i < l; i += 1) {
        pair = pairs[i].replace(/\+/g, '%20');
        eqIndex = pair.indexOf(this.params.queryEq);

        if (eqIndex === -1) {
            key = this._valUnescape(pair);
            val = '';
        } else {
            key = this._valUnescape(pair.substr(0, eqIndex));
            val = this._valUnescape(pair.substr(eqIndex + 1));
        }

        if (!hasProperty.call(queryObject, key)) {
            queryObject[key] = val;
        } else if (_.isArray(queryObject[key])) {
            queryObject[key].push(val);
        } else {
            queryObject[key] = [queryObject[key], val];
        }
    }

    return queryObject;
};

/**
 * @public
 * @memberOf {Rule}
 * @method
 *
 * @param {*} [v]
 *
 * @returns {Object}
 * */
Rule.prototype._pStringify = function (v) {
    return this._qStringify(v).replace(/%2F/g, '/');
};

/**
 * @public
 * @memberOf {Rule}
 * @method
 *
 * @param {*} [v]
 *
 * @returns {Object}
 * */
Rule.prototype._qStringify = function (v) {
    var t = typeof v;

    if (t === 'string') {
        return this._valEscape(v);
    }

    if (t === 'boolean' || t === 'number' && isFinite(v)) {
        return String(v);
    }

    return '';
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {String}
 * */
Rule.prototype._valEscape = encodeURIComponent;

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} subj
 *
 * @returns {String}
 * */
Rule.prototype._valUnescape = function (subj) {
    if (subj.indexOf('%') === -1) {
        return subj;
    }

    return decode(subj);
};

function decode(subj) {
    try {
        return decodeURIComponent(subj);
    } catch (err) {
        return subj;
    }
}

module.exports = Rule;
