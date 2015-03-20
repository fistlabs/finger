/*eslint no-new-func: 0*/
'use strict';

var RuleAny = /** @type RuleAny */ require('./parser/rule-any');
var RuleArg = /** @type RuleArg */ require('./parser/rule-arg');
var RuleSep = /** @type RuleSep */ require('./parser/rule-sep');
var RuleSeq = /** @type RuleSeq */ require('./parser/rule-seq');

var Tools = /** @type Tools */ require('./tools');
var Kind = /** @type Kind */ require('./kind');

var _ = require('lodash-node');
var au = require('./ast-utils');
var escodegen = require('escodegen');
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

    /**
    * @protected
    * @memberOf {Rule}
    * @property
    * @type {Function}
    * */
    this._builderFunc = this._compileBuilderFunc();
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
    var keys;
    var i;
    var l;
    var queryArgs = [];
    var url;
    var argName;

    args = Object(args);
    url = this.params.basePath + this._builderFunc(args);

    for (i = 0, l = this._queryParamsNames.length; i < l; i += 1) {
        argName = this._queryParamsNames[i];
        args[argName] = this._matchQueryArg(args, argName);
    }

    keys = Object.keys(args);

    for (i = 0, l = keys.length; i < l; i += 1) {
        argName = keys[i];
        queryArgs = this._reduceQArg(queryArgs, args[argName], argName);
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
 * @param {Array} allQArgs
 * @param {*} value
 * @param {String} name
 *
 * @returns {Array}
 * */
Rule.prototype._reduceQArg = function (allQArgs, value, name) {
    var i;
    var l;

    if (hasProperty.call(this._paramsCount, name)) {
        // the parameter are used in pathname. skip.
        return allQArgs;
    }

    if (!_.isArray(value)) {
        value = [value];
    }

    for (i = 0, l = value.length; i < l; i += 1) {
        allQArgs[allQArgs.length] = this._createQueryArg(name, value[i]);
    }

    return allQArgs;
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

    url = url.substr(this.params.basePath.length);

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
        } else if (Array.isArray(args[name])) {
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
    var paramNames = this._queryParamsNames;
    var queryParams = this._queryParams;
    var l = paramNames.length;
    var rules;
    var paramName;
    var values;

    while (l) {
        l -= 1;
        paramName = paramNames[l];
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
 * @returns {Function}
 * */
Rule.prototype._compileBuilderFunc = function () {
    var body = [];
    //  function _builderFunc(args) {
    var func = au.functionDeclaration('_builderFunc', body, [
        au.identifier('args')
    ]);
    var stack = [];

    body.push(
        //  var part = '';'
        au.varDeclaration('part',
            au.literal('')),
        //  var stack = [];
        au.varDeclaration('stack',
            au.arrayExpression([])),
        //  var value;
        au.varDeclaration('value'));

    this.inspect(function (rule, stackPop, depth) {

        if (rule.type === RuleSep.TYPE) {
            //  part += '/';
            body.push(
                this._astCasePartSelfPlus(
                    au.literal('/')));

            return;
        }
//
        if (rule.type === RuleAny.TYPE) {
            body.push(
                //  part += `this._valEscape(part.text)`;
                this._astCasePartSelfPlus(
                    au.literal(this._valEscape(rule.text))));

            return;
        }

        if (rule.type === RuleSeq.TYPE) {
//            //  optional
            if (stackPop) {
                body = stack.pop();
                body.push(
                    //  part = stack[`depth`] + part;
                    this._astCaseAssignPart(
                        au.binaryExpression('+',
                            au.memberExpression(
                                au.identifier('stack'),
                                au.literal(depth),
                                true),
                            au.identifier('part'))));

                return;
            }

            body.push(
                //  stack[`depth`] = part;
                au.assignmentStatement('=',
                    au.memberExpression(
                        au.identifier('stack'),
                        au.literal(depth),
                        true),
                    au.identifier('part')),
                //  part = '';
                this._astCaseResetPart());

            stack.push(body);
            //  RULE_SEQ_`depth`: {
            body.push(
                au.labeledStatement('RULE_SEQ_' + depth, body = []));

            return;
        }

        body.push(
            this._astCaseResetValue(),
            au.ifStatement(
                this._astCaseHasPropertyCall(
                    [
                        au.identifier('args'),
                        au.literal(rule.name)]),
                [
                    au.assignmentStatement('=',
                        au.identifier('value'),
                        au.memberExpression(
                            au.identifier('args'),
                            au.literal(rule.name),
                            true)),
                    au.ifStatement(
                        au.unaryExpression('!',
                            this._astCaseIsValueArray(),
                            true),
                        [
                            au.assignmentStatement('=',
                                au.identifier('value'),
                                au.arrayExpression([
                                    au.identifier('value')]))]),
                    this._astCaseGetNthValue(rule.used)]));

        body.push(
            au.ifStatement(
                this._astCaseValueCheckExpression('||', '==='),
                [
                    au.assignmentStatement('=',
                        au.identifier('value'),
                        au.literal(rule.value === void 0 ? null : rule.value))]));

        if (depth > 1) {
            body.push(
                au.ifStatement(
                    //  if (value === undefined || value === null || value === ') {
                    this._astCaseValueCheckExpression('||', '==='),
                    [
                        //  part = '';
                        this._astCaseResetPart(),
                        //  break RULE_SEQ_`depth - 1`;
                        au.breakStatement('RULE_SEQ_' + (depth - 1))]),
                //  part += this._qStringify(value);
                this._astCasePartSelfPlus(
                    this._astCaseQueryEscapeValue4Pathname()));
        } else {
            body.push(
                au.ifStatement(
                    //  if (value !== undefined && value !== null && value !== '') {
                    this._astCaseValueCheckExpression('&&', '!=='),
                    [
                        //  part += this._qStringify(value);
                        this._astCasePartSelfPlus(
                            this._astCaseQueryEscapeValue4Pathname())]));
        }
    });

    body.push(au.returnStatement(au.identifier('part')));

    func = escodegen.generate(func);

    return new Function('hasProperty', 'undefined',
        'return ' + func)(hasProperty, void 0);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {RegExp}
 * */
Rule.prototype._compileMatchRegExp = function () {
    var source = this.reduce(this._compileMatchRegExpPart);

    source = '^' + source + '(?:\\?([\\s\\S]*))?$';

    return new RegExp(source, this.params.ignoreCase ? 'i' : '');
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Object} rule
 * @param {Boolean} stackPop
 * @param {Number} depth
 *
 * @returns {Object}
 * */
Rule.prototype._compileMatchRegExpPart = function (rule, stackPop, depth) {
    var type = rule.type;

    if (type === RuleSep.TYPE) {

        return regesc('/');
    }

    if (type === RuleAny.TYPE) {

        return this._compileMatchRegExpPartStatic(rule);
    }

    if (type === RuleArg.TYPE) {
        type = this._kinds[rule.kind];

        return '(' + type.regex + ')';
    }

    if (depth === 0) {
        return '';
    }

    if (stackPop) {

        return ')?';
    }

    return '(?:';
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
            this._valEscape(char.toLowerCase()) + '|' +
            this._valEscape(char.toUpperCase()) + ')';

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
    var rule = Tools.prototype._compilePathRule.call(this);
    var used = Object.create(null);

    Tools.inspectRule(rule, function (rule) {
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

    return rule;
};

//  Ast cases

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} logicalOp
 * @param {String} binaryOp
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseValueCheckExpression = function (logicalOp, binaryOp) {
    return au.logicalExpression(logicalOp,
        au.logicalExpression(logicalOp,
            au.binaryExpression(binaryOp,
                au.identifier('value'),
                this._astCaseUndef()),
            au.binaryExpression(binaryOp,
                au.identifier('value'),
                au.literal(null))),
        au.binaryExpression(binaryOp,
            au.identifier('value'),
            au.literal('')));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseUndef = function () {
    return au.identifier('undefined');
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Array} args
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseHasPropertyCall = function (args) {
    return au.callExpression(
        au.memberExpression(
            au.identifier('hasProperty'),
            au.identifier('call')),
        args);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseQueryEscapeValue4Pathname = function () {
    return au.callExpression(
        au.memberExpression(
            au.identifier('this'),
            au.identifier('_pStringify')),
        [
            au.identifier('value')]);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseIsValueArray = function () {
    return au.callExpression(
        au.memberExpression(
            au.identifier('Array'),
            au.identifier('isArray')),
        [
            au.identifier('value')]);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Number} nth
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseGetNthValue = function (nth) {
    return au.assignmentStatement('=',
        au.identifier('value'),
        au.memberExpression(
            au.identifier('value'),
            au.literal(nth),
            true));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {*} plus
 *
 * @returns {Object}
 * */
Rule.prototype._astCasePartSelfPlus = function (plus) {
    return au.assignmentStatement('+=',
        au.identifier('part'),
        plus);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {*} assign
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseAssignPart = function (assign) {
    return au.assignmentStatement('=',
        au.identifier('part'),
        assign);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseResetValue = function () {
    return au.assignmentStatement('=',
        au.identifier('value'),
        this._astCaseUndef());
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseResetPart = function () {
    return this._astCaseAssignPart(
        au.literal(''));
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
        } else if (Array.isArray(queryObject[key])) {
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

    try {
        return decodeURIComponent(subj);
    } catch (err) {
        return subj;
    }
};

module.exports = Rule;
