/*eslint no-new-func: 0*/
'use strict';

var RuleAny = /** @type RuleAny */ require('./parser/rule-any');
var RuleArg = /** @type RuleArg */ require('./parser/rule-arg');
var RuleSep = /** @type RuleSep */ require('./parser/rule-sep');
var RuleSeq = /** @type RuleSeq */ require('./parser/rule-seq');

var Query = /** @type Query */ require('./query');

var Tools = /** @type Tools */ require('./tools');
var Type = /** @type Type */ require('./type');

var escodegen = require('escodegen');
var hasProperty = Object.prototype.hasOwnProperty;
var regesc = require('regesc');
var util = require('util');

/**
 * @class Rule
 * @extends Tools
 *
 * @param {String} ruleString
 * @param {Object} [params]
 * */
function Rule(ruleString, params) {
    var i;

    /**
     * @public
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this.params = {};

    for (i in Rule.defaultParams) {
        if (hasProperty.call(Rule.defaultParams, i)) {
            this.params[i] = Rule.defaultParams[i];
        }
    }

    for (i in params) {
        if (hasProperty.call(params, i)) {
            this.params[i] = params[i];
        }
    }

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this._types = this.__compileTypes();

    Tools.call(this, ruleString);

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Array<String>}
     * */
    this._pathParams = this.__findPathParams();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this._queryParams = this.__findQueryParams();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this._paramsIndex = this.__createParamsIndex();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Query}
     * */
    this._query =  this.__createQueryHelper();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {RegExp}
     * */
    this._matchRegExp = this.__compileMatchRegExp();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Function}
     * */
    this._builderFunc = this.__compileBuilderFunc();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this._emptyArgs = this.__compileEmptyArgs();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Function}
     * */
    this._matcherFunc = this.__compileMatcherFunc();
}

/**
 * @public
 * @static
 * @memberOf {Rule}
 * @property
 * @type {Object}
 * */
Rule.builtinTypes = {
    Seg: '[^/?&]+?',
    Seq: '[^?&]+?',
    Str: '[\\s\\S]+?'
};

/**
 * @public
 * @static
 * @memberOf {Rule}
 * @property
 * @type {Object}
 * */
Rule.defaultParams = {
    queryEq: '=',
    querySep: '&'
};

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
    return this._builderFunc(args);
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
    return this._matcherFunc(url);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Query}
 * */
Rule.prototype.__createQueryHelper = function () {
    return new Query({
        eq: this.params.queryEq,
        sep: this.params.querySep
    });
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Function}
 * */
Rule.prototype.__compileBuilderFunc = function () {
    var body = [];
    //  function _builderFunc(args) {
    var func = this.__createAstTypeFunctionDeclaration('_builderFunc', body, [
        this.__createAstTypeIdentifier('args')
    ]);
    var stack = [];

    body.push(
        //  var part = '';'
        this.__createAstTypeVarDeclaration('part',
            this.__createAstTypeLiteral('')),
        //  var stack = [];
        this.__createAstTypeVarDeclaration('stack',
            this.__createAstTypeArrayExpression([])),
        //  var value;
        this.__createAstTypeVarDeclaration('value'),
        //  var pathname;
        this.__createAstTypeVarDeclaration('pathname'));

    this.inspectRule(function (part, stackPop, n) {

        if (part.type === RuleSep.TYPE) {
            //  part += '/';
            body.push(
                this.__createAstPresetPartSelfPlus(
                    this.__createAstTypeLiteral('/')));

            return;
        }

        if (part.type === RuleAny.TYPE) {
            body.push(
                //  part += `encodeURIComponent(part.text)`;
                this.__createAstPresetPartSelfPlus(
                    this.__createAstTypeLiteral(encodeURIComponent(part.text))));

            return;
        }

        if (part.type === RuleSeq.TYPE) {
            //  optional
            if (stackPop) {
                body = stack.pop();
                body.push(
                    //  part = stack[`n`] + part;
                    this.__createAstPresetAssignPart(
                        this.__createAstTypeBinaryExpression('+',
                            this.__createAstTypeMemberExpression(
                                this.__createAstTypeIdentifier('stack'),
                                this.__createAstTypeLiteral(n),
                                true),
                            this.__createAstTypeIdentifier('part'))));

                return;
            }

            body.push(
                //  stack[`n`] = part;
                this.__createAstTypeExpressionStatement(
                    this.__createAstTypeAssignmentExpression('=',
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeIdentifier('stack'),
                            this.__createAstTypeLiteral(n),
                            true),
                        this.__createAstTypeIdentifier('part'))),
                //  part = '';
                this.__createAstPresetResetPart());

            stack.push(body);
            //  RULE_SEQ_`n`: {
            body.push(
                this.__createAstTypeLabeledStatement('RULE_SEQ_' + n, body = []));

            return;
        }

        body.push(
            this.__createAstPresetValueGetter(part.getName()),
            this.__createAstPresetGetNthValueIfArray(part.used));

        if (n > 1) {
            body.push(
                this.__createAstTypeIfStatement(
                    //  if (value === undefined || value === null || value === ') {
                    this.__createAstPresetValueCheckExpression('||', '==='),
                    [
                        //  part = '';
                        this.__createAstPresetResetPart(),
                        //  break RULE_SEQ_`n - 1`;
                        this.__createAstTypeBreakStatement('RULE_SEQ_' + (n - 1))]),
                //  part += this._query.stringifyQueryArg(value);
                this.__createAstPresetPartSelfPlus(
                    this.__createAstPresetQueryEscapeValue4Pathname()));
        } else {
            body.push(
                this.__createAstTypeIfStatement(
                    //  if (value !== undefined && value !== null && value !== '') {
                    this.__createAstPresetValueCheckExpression('&&', '!=='),
                    [
                        //  part += this._query.stringifyQueryArg(value);
                        this.__createAstPresetPartSelfPlus(
                            this.__createAstPresetQueryEscapeValue4Pathname())]));
        }
    });

    //  building query
    body.push(
        //  pathname = part;
        this.__createAstTypeExpressionStatement(
            this.__createAstTypeAssignmentExpression('=',
                this.__createAstTypeIdentifier('pathname'),
                this.__createAstTypeIdentifier('part'))),
        //  part = [];
        this.__createAstPresetAssignPart(
            this.__createAstTypeArrayExpression([])));

    this._pathRule.args.forEach(function (rule) {

        body.push(
            this.__createAstPresetValueGetter(rule.getName()),
            this.__createAstPresetGetNthValueIfArray(rule.used));

        if (rule.required) {
            body.push(
                this.__createAstTypeIfStatement(
                    //  if (value === undefined || value === null || value === '') {
                    this.__createAstPresetValueCheckExpression('||', '==='),
                    [
                        //  part[part.length] = `this._query.escape(part.getRawName())`;
                        this.__createAstTypeExpressionStatement(
                            this.__createAstTypeAssignmentExpression('=',
                                this.__createAstTypeMemberExpression(
                                    this.__createAstTypeIdentifier('part'),
                                    this.__createAstTypeMemberExpression(
                                        this.__createAstTypeIdentifier('part'),
                                        this.__createAstTypeIdentifier('length')
                                    ),
                                    true
                                ),
                                this.__createAstTypeLiteral(this._query.escape(rule.getRawName()))
                            )
                        )],
                    //  else
                    [
                        //  part[part.length] = `this._query.escape(part.getRawName()) +
                        //      this._query.params.eq` + this._query.stringifyQueryArg(value);
                        this.__createAstPresetAddQueryArg(rule.getRawName())]));
        } else {
            body.push(
                this.__createAstTypeIfStatement(
                    //  if (value !== undefined && value !== null && value !== '') {
                    this.__createAstPresetValueCheckExpression('&&', '!=='),
                    [
                        //  part += `this._query.escape(part.getRawName() + query.params.eq` +
                        //      this._query.stringifyQueryArg(value);
                        this.__createAstPresetAddQueryArg(rule.getRawName())]));

        }
    }, this);

    body.push(
        this.__createAstTypeIfStatement(
            //  if (part.length === 0) {
            this.__createAstTypeBinaryExpression('===',
                this.__createAstTypeMemberExpression(
                    this.__createAstTypeIdentifier('part'),
                    this.__createAstTypeIdentifier('length')),
                this.__createAstTypeLiteral(0)),
            [
                //  return pathname;
                this.__createAstTypeReturnStatement(
                    this.__createAstTypeIdentifier('pathname'))]));

    body.push(
        //  return pathname + '?' + part.join(`query.params.sep`);
        this.__createAstTypeReturnStatement(
            this.__createAstTypeBinaryExpression('+',
                this.__createAstTypeBinaryExpression('+',
                    this.__createAstTypeIdentifier('pathname'),
                    this.__createAstTypeLiteral('?')),
                this.__createAstTypeCallExpression(
                    this.__createAstTypeMemberExpression(
                        this.__createAstTypeIdentifier('part'),
                        this.__createAstTypeIdentifier('join')),
                    [
                        this.__createAstTypeLiteral(this._query.params.sep)]))));

    func = escodegen.generate(func);

    return new Function('hasProperty', 'undefined',
        'return ' + func)(hasProperty, void 0);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Function}
 * */
Rule.prototype.__compileMatcherFunc = function () {
    var body = [];
    //  function __matcherFunc(url) {
    var func = this.__createAstTypeFunctionDeclaration('_matcherFunc', body, [
        this.__createAstTypeIdentifier('url')
    ]);
    var paramsIndex = this._paramsIndex;

    body.push(
        //  var args;
        this.__createAstTypeVarDeclaration('args',
            this.__createAstPresetEmptyArgs()),
        //  var match = this._matchRegExp.exec(url);
        this.__createAstTypeVarDeclaration('match',
            this.__createAstTypeCallExpression(
                this.__createAstTypeMemberExpression(
                    this.__createAstTypeMemberExpression(
                        this.__createAstTypeIdentifier('this'),
                        this.__createAstTypeIdentifier('_matchRegExp')),
                    this.__createAstTypeIdentifier('exec')),
                [
                    this.__createAstTypeIdentifier('url')])),
        //  var queryObject;
        this.__createAstTypeVarDeclaration('queryObject'),
        //  var types;
        this.__createAstTypeVarDeclaration('type'),
        //  var value;
        this.__createAstTypeVarDeclaration('value')
    );

    //  if (match === null) {
    body.push(
        this.__createAstTypeIfStatement(
            this.__createAstTypeBinaryExpression('===',
                this.__createAstTypeIdentifier('match'),
                this.__createAstTypeLiteral(null)),
            [
                //  return null;
                this.__createAstTypeReturnStatement(
                    this.__createAstTypeLiteral(null))]));

    this._pathParams.forEach(function (rule, i) {
        var name = rule.getName();

        if (!this.__hasParameterValue(name)) {
            return;
        }

        body.push(
            //  value = match[`i + 1`]
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeAssignmentExpression('=',
                    this.__createAstTypeIdentifier('value'),
                    this.__createAstTypeMemberExpression(
                        this.__createAstTypeIdentifier('match'),
                        this.__createAstTypeLiteral(i + 1),
                        true))),
            this.__createAstTypeIfStatement(
                //  if (typeof value === 'string') {
                this.__createAstTypeBinaryExpression('===',
                    this.__createAstTypeUnaryExpression('typeof',
                        this.__createAstTypeIdentifier('value'),
                        true),
                    this.__createAstTypeLiteral('string')),
                [
                    //  value = this._query.unescape(value);
                    this.__createAstTypeExpressionStatement(
                        this.__createAstTypeAssignmentExpression('=',
                            this.__createAstTypeIdentifier('value'),
                            this.__createAstTypeCallExpression(
                                this.__createAstTypeMemberExpression(
                                    this.__createAstTypeMemberExpression(
                                        this.__createAstTypeIdentifier('this'),
                                        this.__createAstTypeIdentifier('_query')),
                                    this.__createAstTypeIdentifier('unescape')),
                                [
                                    this.__createAstTypeIdentifier('value')])))]));

        if (paramsIndex[name] === 1) {
            //  args[`path`] = value;
            body.push(
                this.__createAstTypeExpressionStatement(
                    this.__createAstTypeAssignmentExpression('=',
                        this.__createAstPresetDeepAccessor('args', name),
                        this.__createAstTypeIdentifier('value'))));

        } else {
            //  ??
            //  args[`path`][`i - 1`] = value
            body.push(
                this.__createAstTypeExpressionStatement(
                    this.__createAstTypeAssignmentExpression('=',
                        this.__createAstTypeMemberExpression(
                            this.__createAstPresetDeepAccessor('args', name),
                            this.__createAstTypeLiteral(rule.used),
                            true),
                        this.__createAstTypeIdentifier('value'))));
        }
    }, this);

    if (this._pathRule.args.length) {
        //  queryObject = this._query.parse(match[`l + 1`]);
        body.push(
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeAssignmentExpression('=',
                    this.__createAstTypeIdentifier('queryObject'),
                    this.__createAstTypeCallExpression(
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeMemberExpression(
                                this.__createAstTypeIdentifier('this'),
                                this.__createAstTypeIdentifier('_query')),
                            this.__createAstTypeIdentifier('parse')),
                        [
                            this.__createAstTypeMemberExpression(
                                this.__createAstTypeIdentifier('match'),
                                this.__createAstTypeLiteral(this._pathParams.length + 1),
                                true)]))));

        Object.keys(this._queryParams).forEach(function (name) {
            this._queryParams[name].forEach(function (rule, i) {

                body.push(
                    this.__createAstPresetResetValue(),
                    this.__createAstPresetIfQueryHas(rule.getRawName(),
                        [
                            this.__createAstPresetGetQueryValue(rule.getRawName()),
                            this.__createAstPresetGetNthValueIfArray(i)]),
                    this.__createAstTypeExpressionStatement(
                        this.__createAstTypeAssignmentExpression('=',
                            this.__createAstTypeIdentifier('type'),
                            this.__createAstTypeMemberExpression(
                                this.__createAstTypeMemberExpression(
                                    this.__createAstTypeIdentifier('this'),
                                    this.__createAstTypeIdentifier('_types')),
                                this.__createAstTypeLiteral(rule.kind),
                                true))));

                if (rule.required) {
                    body.push(
                        this.__createAstTypeIfStatement(
                            this.__createAstTypeLogicalExpression('||',
                                this.__createAstTypeBinaryExpression('===',
                                    this.__createAstTypeIdentifier('value'),
                                    this.__createAstTypeIdentifier('undefined')),
                                this.__createAstTypeBinaryExpression('===',
                                    this.__createAstTypeCallExpression(
                                        this.__createAstTypeMemberExpression(
                                            this.__createAstTypeIdentifier('type'),
                                            this.__createAstTypeIdentifier('check')),
                                        [
                                            this.__createAstTypeIdentifier('value')]),
                                    this.__createAstTypeLiteral(false))),
                            [
                                this.__createAstTypeReturnStatement(
                                    this.__createAstTypeLiteral(null))]));
                } else {
                    body.push(
                        this.__createAstTypeIfStatement(
                            this.__createAstTypeLogicalExpression('&&',
                                this.__createAstTypeBinaryExpression('!==',
                                    this.__createAstTypeIdentifier('value'),
                                    this.__createAstTypeIdentifier('undefined')),
                                this.__createAstTypeBinaryExpression('===',
                                    this.__createAstTypeCallExpression(
                                        this.__createAstTypeMemberExpression(
                                            this.__createAstTypeIdentifier('type'),
                                            this.__createAstTypeIdentifier('check')),
                                        [
                                            this.__createAstTypeIdentifier('value')]),
                                    this.__createAstTypeLiteral(false))),
                            [
                                this.__createAstPresetResetValue()]));
                }

                if (this.__hasParameterValue(name)) {
                    if (paramsIndex[name] === 1) {
                        body.push(
                            this.__createAstTypeExpressionStatement(
                                this.__createAstTypeAssignmentExpression('=',
                                    this.__createAstPresetDeepAccessor('args', name),
                                    this.__createAstTypeIdentifier('value'))));
                    } else {
                        body.push(
                            this.__createAstTypeExpressionStatement(
                                this.__createAstTypeAssignmentExpression('=',
                                    this.__createAstTypeMemberExpression(
                                        this.__createAstPresetDeepAccessor('args', name),
                                        this.__createAstTypeLiteral(rule.used),
                                        true),
                                    this.__createAstTypeIdentifier('value'))));
                    }
                }

            }, this);
        }, this);
    }

    body.push(
        this.__createAstTypeReturnStatement(
            this.__createAstTypeIdentifier('args')));

    func = escodegen.generate(func);

    return new Function('hasProperty', 'return ' + func)(hasProperty);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {RegExp}
 * */
Rule.prototype.__compileMatchRegExp = function () {
    var source = this.reduceRule(this.__compileMatchRegExpPart);

    source = '^' + source + '(?:\\?([\\s\\S]*))?$';

    return new RegExp(source, this.params.ignoreCase ? 'i' : '');
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Object} part
 * @param {Boolean} stackPop
 * @param {Number} n
 *
 * @returns {Object}
 * */
Rule.prototype.__compileMatchRegExpPart = function (part, stackPop, n) {
    var type = part.type;

    if (type === RuleSep.TYPE) {

        return regesc('/');
    }

    if (type === RuleAny.TYPE) {

        return this.__compileMatchRegExpPartStatic(part);
    }

    if (type === RuleArg.TYPE) {
        type = this._types[part.kind];

        return '(' + type.regexp.source + ')';
    }

    if (n === 0) {
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
 * @param {Object} part
 *
 * @returns {String}
 * */
Rule.prototype.__compileMatchRegExpPartStatic = function (part) {
    var char;
    var i;
    var l;
    var result = '';
    var text = part.text;

    for (i = 0, l = text.length; i < l; i += 1) {
        char = text.charAt(i);

        if (char === this._query.escape(char)) {
            result += regesc(char);

            continue;
        }

        if (this.params.ignoreCase) {
            result += '(?:' + regesc(char) + '|' +
            this._query.escape(char.toLowerCase()) + '|' +
            this._query.escape(char.toUpperCase()) + ')';

            continue;
        }

        result += '(?:' + regesc(char) + '|' + this._query.escape(char) + ')';
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
Rule.prototype.__compileTypes = function () {
    var kind;
    var types = {};

    for (kind in Rule.builtinTypes) {
        if (hasProperty.call(Rule.builtinTypes, kind)) {
            types[kind] = new Type(kind, Rule.builtinTypes[kind]);
        }
    }

    for (kind in this.params.types) {
        if (hasProperty.call(this.params.types, kind)) {
            types[kind] = new Type(kind, this.params.types[kind]);
        }
    }

    return types;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__createParamsIndex = function () {
    var index = Object.create(null);

    this._pathParams.forEach(function (rule) {
        var name = rule.getName();
        if (index[name]) {
            index[name] += 1;
        } else {
            index[name] = 1;
        }
    });

    Object.keys(this._queryParams).forEach(function (name) {
        var length = this._queryParams[name].length;
        if (index[name]) {
            index[name] += length;
        } else {
            index[name] = length;
        }
    }, this);

    return index;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Array<String>}
 * */
Rule.prototype.__findPathParams = function () {
    var order = [];

    this.inspectRule(function (rule) {
        if (rule.type === RuleArg.TYPE) {
            order[order.length] = rule;
        }
    });

    return order;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__findQueryParams = function () {
    var params = Object.create(null);
    this._pathRule.args.forEach(function (rule) {
        var name = rule.getName();
        if (params[name]) {
            params[name].push(rule);
        } else {
            params[name] = [rule];
        }
    });
    return params;
};

/**
 * @protected
 * @memberOf {Rule}
 * @method
 *
 * @returns {RuleSeq}
 * */
Rule.prototype._compilePathRule = function () {
    var rule = Tools.prototype._compilePathRule.call(this);
    var used = Object.create(null);
    var types = this._types;
    var defaultType = 'Seg';

    function useArg(rule) {
        var name = rule.getName();

        if (!rule.kind) {
            rule.kind = defaultType;
        }

        if (!hasProperty.call(types, rule.kind)) {
            throw new TypeError(util.format('Unknown %j parameter type %j', name, rule.kind));
        }

        if (used[name] === void 0) {
            used[name] = 0;
        } else {
            used[name] += 1;
        }

        rule.used = used[name];
    }

    Tools._inspectRule(rule, function (rule) {

        if (rule.type === RuleArg.TYPE) {
            useArg(rule);
        }

    });

    defaultType = 'Str';

    rule.args.forEach(useArg);

    return rule;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} path
 *
 * @returns {Boolean}
 * */
Rule.prototype.__hasParameterValue = function (path) {
    var args = this._emptyArgs;
    var parts = RuleArg.parse(path);
    var i;
    var l;
    var part;

    for (i = 0, l = parts.length; i < l; i += 1) {
        part = parts[i];

        if (Object(args) === args && !Array.isArray(args) && hasProperty.call(args, part)) {
            args = args[part];
            continue;
        }

        return false;
    }

    return Object(args) !== args || Array.isArray(args);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__compileEmptyArgs = function () {
    var pEmptyArgs = {};
    var qEmptyArgs = {};

    this._pathParams.forEach(function (rule) {
        var name = rule.getName();
        if (!hasProperty.call(pEmptyArgs, name)) {
            pEmptyArgs[name] = void 0;
        } else if (Array.isArray(pEmptyArgs[name])) {
            pEmptyArgs[name].push(void 0);
        } else {
            pEmptyArgs[name] = [pEmptyArgs[name], void 0];
        }
    });

    pEmptyArgs = this._query.deeper(pEmptyArgs);

    this._pathRule.args.forEach(function (rule) {
        var name = rule.getName();
        if (!hasProperty.call(qEmptyArgs, name)) {
            qEmptyArgs[name] = void 0;
        } else if (Array.isArray(qEmptyArgs[name])) {
            qEmptyArgs[name].push(name);
        } else {
            qEmptyArgs[name] = [qEmptyArgs[name], void 0];
        }
    });

    qEmptyArgs = this._query.deeper(qEmptyArgs);

    return this.__mergeArgs(pEmptyArgs, qEmptyArgs);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetEmptyArgs = function () {
    var emptyArgs = this._emptyArgs;
    return this.__createAstObjectByObject(emptyArgs);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Object} obj
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstObjectByObject = function (obj) {
    var ast;
    var undef;
    var value;

    if (Object(obj) !== obj || Array.isArray(obj)) {
        undef = this.__createAstTypeIdentifier('undefined');

        if (Array.isArray(obj)) {
            value = new Array(obj.length).join('|').split('|').map(function () {
                return undef;
            }, this);
            return this.__createAstTypeArrayExpression(value);
        }

        return undef;
    }

    ast = this.__createAstTypeObjectExpression([]);

    Object.keys(obj).forEach(function (i) {
        value = {
            type: 'Property',
            key: this.__createAstTypeLiteral(i),
            value: this.__createAstObjectByObject(obj[i])
        };
        ast.properties.push(value);
    }, this);

    return ast;
};

//  Ast presets

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 * @param {String} path
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetDeepAccessor = function (name, path) {
    var self = this;

    return RuleArg.parse(path).reduce(function (object, part) {

        return self.__createAstTypeMemberExpression(object,
            self.__createAstTypeLiteral(part), true);

    }, this.__createAstTypeIdentifier(name));
};

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
Rule.prototype.__createAstPresetValueCheckExpression = function (logicalOp, binaryOp) {
    return this.__createAstTypeLogicalExpression(logicalOp,
        this.__createAstTypeLogicalExpression(logicalOp,
            this.__createAstTypeBinaryExpression(binaryOp,
                this.__createAstTypeIdentifier('value'),
                this.__createAstTypeIdentifier('undefined')),
            this.__createAstTypeBinaryExpression(binaryOp,
                this.__createAstTypeIdentifier('value'),
                this.__createAstTypeIdentifier('null'))),
        this.__createAstTypeBinaryExpression(binaryOp,
            this.__createAstTypeIdentifier('value'),
            this.__createAstTypeLiteral('')));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} path
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetValueGetter = function (path) {
    var parts = RuleArg.parse(path);
    var body = [];
    //  VALUE_GETTER: {
    var getter = this.__createAstTypeLabeledStatement('VALUE_GETTER', body);
    //  value = args;
    body.push(
        this.__createAstTypeExpressionStatement(
            this.__createAstTypeAssignmentExpression('=',
                this.__createAstTypeIdentifier('value'),
                this.__createAstTypeIdentifier('args'))));

    var breakCode = [
        //  value = undefined;
        this.__createAstTypeExpressionStatement(
            this.__createAstTypeAssignmentExpression('=',
                this.__createAstTypeIdentifier('value'),
                this.__createAstTypeIdentifier('undefined'))),
        //  break VALUE_GETTER;
        this.__createAstTypeBreakStatement('VALUE_GETTER')];

    parts.forEach(function (part) {

        //  if (!value || typeof value !== 'object' || Array.isArray(value)) {
        body.push(
            this.__createAstTypeIfStatement(
                this.__createAstTypeLogicalExpression('||',
                    this.__createAstTypeLogicalExpression('||',
                        this.__createAstTypeUnaryExpression('!',
                            this.__createAstTypeIdentifier('value'),
                            true),
                        this.__createAstTypeBinaryExpression('!==',
                            this.__createAstTypeUnaryExpression('typeof',
                                this.__createAstTypeIdentifier('value'),
                                true),
                            this.__createAstTypeLiteral('object'))),
                    this.__createAstPresetIsValueArray()),
                breakCode));

        body.push(
            //  if (!hasProperty.call(value, `parts[i]`)) {
            this.__createAstTypeIfStatement(
                this.__createAstTypeUnaryExpression('!',
                    this.__createAstTypeCallExpression(
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeIdentifier('hasProperty'),
                            this.__createAstTypeIdentifier('call')),
                        [
                            this.__createAstTypeIdentifier('value'),
                            this.__createAstTypeLiteral(part)]),
                    true),
                breakCode));

        //  value = value[`parts[i]`];
        body.push(
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeAssignmentExpression('=',
                    this.__createAstTypeIdentifier('value'),
                    this.__createAstTypeMemberExpression(
                        this.__createAstTypeIdentifier('value'),
                        this.__createAstTypeLiteral(part),
                        true))));
    }, this);

    body.push(
        //  if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.__createAstTypeIfStatement(
            this.__createAstTypeLogicalExpression('&&',
                this.__createAstTypeLogicalExpression('&&',
                    this.__createAstTypeIdentifier('value'),
                    this.__createAstTypeBinaryExpression('===',
                        this.__createAstTypeUnaryExpression('typeof',
                            this.__createAstTypeIdentifier('value'),
                            true),
                        this.__createAstTypeLiteral('object'))),
            this.__createAstTypeUnaryExpression('!',
                this.__createAstPresetIsValueArray(),
                true)),
            breakCode));

    return getter;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetQueryEscapeValue4Pathname = function () {
    return this.__createAstTypeCallExpression(
        this.__createAstTypeMemberExpression(
            this.__createAstTypeMemberExpression(
                this.__createAstTypeIdentifier('this'),
                this.__createAstTypeIdentifier('_query')
            ),
            this.__createAstTypeIdentifier('stringifyPathArg')),
        [
            this.__createAstTypeIdentifier('value')]);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetQueryEscapeValue4Query = function () {
    return this.__createAstTypeCallExpression(
        this.__createAstTypeMemberExpression(
            this.__createAstTypeMemberExpression(
                this.__createAstTypeIdentifier('this'),
                this.__createAstTypeIdentifier('_query')
            ),
            this.__createAstTypeIdentifier('stringifyQueryArg')),
        [
            this.__createAstTypeIdentifier('value')]);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetIsValueArray = function () {
    return this.__createAstTypeCallExpression(
        this.__createAstTypeMemberExpression(
            this.__createAstTypeIdentifier('Array'),
            this.__createAstTypeIdentifier('isArray')),
        [
            this.__createAstTypeIdentifier('value')]);
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
Rule.prototype.__createAstPresetGetNthValue = function (nth) {
    return this.__createAstTypeExpressionStatement(
        this.__createAstTypeAssignmentExpression('=',
            this.__createAstTypeIdentifier('value'),
            this.__createAstTypeMemberExpression(
                this.__createAstTypeIdentifier('value'),
                this.__createAstTypeLiteral(nth),
                true)));
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
Rule.prototype.__createAstPresetGetNthValueIfArray = function (nth) {
    return this.__createAstTypeIfStatement(
        this.__createAstPresetIsValueArray(),
        [
            this.__createAstPresetGetNthValue(nth)]);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetGetQueryValue = function (name) {
    return this.__createAstTypeExpressionStatement(
        this.__createAstTypeAssignmentExpression('=',
            this.__createAstTypeIdentifier('value'),
            this.__createAstTypeMemberExpression(
                this.__createAstTypeIdentifier('queryObject'),
                this.__createAstTypeLiteral(name),
                true)));
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
Rule.prototype.__createAstPresetPartSelfPlus = function (plus) {
    return this.__createAstTypeExpressionStatement(
        this.__createAstTypeAssignmentExpression('+=',
            this.__createAstTypeIdentifier('part'),
            plus));
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
Rule.prototype.__createAstPresetAssignPart = function (assign) {
    return this.__createAstTypeExpressionStatement(
        this.__createAstTypeAssignmentExpression('=',
            this.__createAstTypeIdentifier('part'),
            assign));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 * @param {*} consequent
 * @param {*} [alternate]
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetIfQueryHas = function (name, consequent, alternate) {
    return this.__createAstTypeIfStatement(
        this.__createAstTypeCallExpression(
            this.__createAstTypeMemberExpression(
                this.__createAstTypeIdentifier('hasProperty'),
                this.__createAstTypeIdentifier('call')),
            [
                this.__createAstTypeIdentifier('queryObject'),
                this.__createAstTypeLiteral(name)]),
        consequent,
        alternate);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetResetValue = function () {
    return this.__createAstTypeExpressionStatement(
        this.__createAstTypeAssignmentExpression('=',
            this.__createAstTypeIdentifier('value'),
            this.__createAstTypeIdentifier('undefined')));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetAddQueryArg = function (name) {
    return this.__createAstTypeExpressionStatement(
        this.__createAstTypeAssignmentExpression('=',
            this.__createAstTypeMemberExpression(
                this.__createAstTypeIdentifier('part'),
                this.__createAstTypeMemberExpression(
                    this.__createAstTypeIdentifier('part'),
                    this.__createAstTypeIdentifier('length')
                ),
                true),
            this.__createAstTypeBinaryExpression('+',
                this.__createAstTypeLiteral(this._query.escape(name) + this._query.params.eq),
                this.__createAstPresetQueryEscapeValue4Query())
        ));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstPresetResetPart = function () {
    return this.__createAstPresetAssignPart(
        this.__createAstTypeLiteral(''));
};

//  Scalar ast helpers

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeBreakStatement = function (name) {
    return {
        type: 'BreakStatement',
        label: this.__createAstTypeIdentifier(name)
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} operator
 * @param {*} left
 * @param {*} right
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeLogicalExpression = function (operator, left, right) {
    return {
        type: 'LogicalExpression',
        operator: operator,
        left: left,
        right: right
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {*} callee
 * @param {Array} args
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeCallExpression = function (callee, args) {
    return {
        type: 'CallExpression',
        callee: callee,
        arguments: args
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {*} test
 * @param {*} consequent
 * @param {*} [alternate]
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeIfStatement = function (test, consequent, alternate) {
    return {
        type: 'IfStatement',
        test: test,
        consequent: this.__createAstTypeBlockStatement(consequent),
        alternate: alternate && this.__createAstTypeBlockStatement(alternate)
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 * @param {Array} body
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeLabeledStatement = function (name, body) {
    return {
        type: 'LabeledStatement',
        label: this.__createAstTypeIdentifier(name),
        body: this.__createAstTypeBlockStatement(body)
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {*} expression
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeExpressionStatement = function (expression) {
    return {
        type: 'ExpressionStatement',
        expression: expression
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} operator
 * @param {*} left
 * @param {*} right
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeAssignmentExpression = function (operator, left, right) {
    return {
        type: 'AssignmentExpression',
        operator: operator,
        left: left,
        right: right
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 * @param {Array} body
 * @param {Array} params
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeFunctionDeclaration = function (name, body, params) {
    return {
        params: params,
        type: 'FunctionDeclaration',
        id: this.__createAstTypeIdentifier(name),
        body: this.__createAstTypeBlockStatement(body)
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Array} body
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeBlockStatement = function (body) {
    return {
        type: 'BlockStatement',
        body: body
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} operator
 * @param {*} left
 * @param {*} right
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeBinaryExpression = function (operator, left, right) {
    return {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {*} argument
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeReturnStatement = function (argument) {
    return {
        type: 'ReturnStatement',
        argument: argument
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Array} elements
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeArrayExpression = function (elements) {
    return {
        type: 'ArrayExpression',
        elements: elements
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Array} properties
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeObjectExpression = function (properties) {
    return {
        type: 'ObjectExpression',
        properties: properties
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} operator
 * @param {*} argument
 * @param {Boolean} [prefix]
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeUnaryExpression = function (operator, argument, prefix) {
    return {
        type: 'UnaryExpression',
        operator: operator,
        argument: argument,
        prefix: Boolean(prefix)
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Object} pathArgs
 * @param {Object} queryArgs
 *
 * @returns {Object}
 * */
Rule.prototype.__mergeArgs = function (pathArgs, queryArgs) {
    /*eslint max-depth: 0, complexity: 0*/
    var name;
    var pVal;
    var qVal;

    for (name in queryArgs) {
        if (!hasProperty.call(queryArgs, name)) {
            continue;
        }

        qVal = queryArgs[name];

        if (!hasProperty.call(pathArgs, name)) {
            pathArgs[name] = qVal;

            continue;
        }

        pVal = pathArgs[name];

        if (pVal && typeof pVal === 'object') {
            if (Array.isArray(pVal)) {
                if (qVal && typeof qVal === 'object') {
                    if (Array.isArray(qVal)) {
                        [].push.apply(pVal, qVal);
                    }

                    continue;
                }

                pVal[pVal.length] = qVal;

                continue;
            }

            if (qVal && typeof qVal === 'object' && !Array.isArray(qVal)) {
                this.__mergeArgs(pVal, qVal);
            }

            continue;
        }

        if (qVal && typeof qVal === 'object') {
            if (Array.isArray(qVal)) {
                pVal = [pVal];
                [].push.apply(pVal, qVal);
                pathArgs[name] = pVal;
            }

            continue;
        }

        pathArgs[name] = [pVal, qVal];
    }

    return pathArgs;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeIdentifier = function (name) {
    return {
        type: 'Identifier',
        name: name
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} name
 * @param {*} [init]
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeVarDeclaration = function (name, init) {
    return {
        type: 'VariableDeclaration',
        declarations: [
            {
                type: 'VariableDeclarator',
                id: this.__createAstTypeIdentifier(name),
                init: init
            }
        ],
        kind: 'var'
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {*} value
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeLiteral = function (value) {
    return {
        type: 'Literal',
        value: value
    };
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {*} object
 * @param {*} property
 * @param {Boolean} [computed=false]
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstTypeMemberExpression = function (object, property, computed) {
    return {
        type: 'MemberExpression',
        object: object,
        property: property,
        computed: computed
    };
};

module.exports = Rule;
