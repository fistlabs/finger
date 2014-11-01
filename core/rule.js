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
var query = /** @type {Query} */ new Query();
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
 * @returns {Function}
 * */
Rule.prototype.__compileBuilderFunc = function () {
    var body = [];
    //  function _builderFunc(args) {
    var func = this.__astTypeFunctionDeclaration('_builderFunc', body, [
        this.__astTypeIdentifier('args')
    ]);
    var stack = [];

    body.push(
        //  var part = '';'
        this.__astTypeVarDeclaration('part',
            this.__astTypeLiteral('')),
        //  var stack = [];
        this.__astTypeVarDeclaration('stack',
            this.__astTypeArrayExpression([])),
        //  var value;
        this.__astTypeVarDeclaration('value'),
        //  var pathname;
        this.__astTypeVarDeclaration('pathname'));

    this.inspectRule(function (part, stackPop, n) {

        if (part.type === RuleSep.TYPE) {
            //  part += '/';
            body.push(
                this.__astPresetPartSelfPlus(
                    this.__astTypeLiteral('/')));

            return;
        }

        if (part.type === RuleAny.TYPE) {
            body.push(
                //  part += `encodeURIComponent(part.text)`;
                this.__astPresetPartSelfPlus(
                    this.__astTypeLiteral(encodeURIComponent(part.text))));

            return;
        }

        if (part.type === RuleSeq.TYPE) {
            //  optional
            if (stackPop) {
                body = stack.pop();
                body.push(
                    //  part = stack[`n`] + part;
                    this.__astPresetAssignPart(
                        this.__astTypeBinaryExpression('+',
                            this.__astTypeMemberExpression(
                                this.__astTypeIdentifier('stack'),
                                this.__astTypeLiteral(n),
                                true),
                            this.__astTypeIdentifier('part'))));

                return;
            }

            body.push(
                //  stack[`n`] = part;
                this.__astTypeExpressionStatement(
                    this.__astTypeAssignmentExpression('=',
                        this.__astTypeMemberExpression(
                            this.__astTypeIdentifier('stack'),
                            this.__astTypeLiteral(n),
                            true),
                        this.__astTypeIdentifier('part'))),
                //  part = '';
                this.__astPresetResetPart());

            stack.push(body);
            //  RULE_SEQ_`n`: {
            body.push(
                this.__astTypeLabeledStatement('RULE_SEQ_' + n, body = []));

            return;
        }

        body.push(
            this.__astPresetValueGetter(part.getName()),
            this.__astPresetGetNthValueIfArray(part.used));

        if (n > 1) {
            body.push(
                this.__astTypeIfStatement(
                    //  if (value === undefined || value === null || value === ') {
                    this.__astPresetValueCheckExpression('||', '==='),
                    [
                        //  part = '';
                        this.__astPresetResetPart(),
                        //  break RULE_SEQ_`n - 1`;
                        this.__astTypeBreakStatement('RULE_SEQ_' + (n - 1))]),
                //  part += query.stringifyQueryArg(value);
                this.__astPresetPartSelfPlus(
                    this.__astPresetQueryEscapeValue4Pathname()));
        } else {
            body.push(
                this.__astTypeIfStatement(
                    //  if (value !== undefined && value !== null && value !== '') {
                    this.__astPresetValueCheckExpression('&&', '!=='),
                    [
                        //  part += query.stringifyQueryArg(value);
                        this.__astPresetPartSelfPlus(
                            this.__astPresetQueryEscapeValue4Pathname())]));
        }
    });

    //  building query
    body.push(
        //  pathname = part;
        this.__astTypeExpressionStatement(
            this.__astTypeAssignmentExpression('=',
                this.__astTypeIdentifier('pathname'),
                this.__astTypeIdentifier('part'))),
        //  part = [];
        this.__astPresetAssignPart(
            this.__astTypeArrayExpression([])));

    Object.keys(this._queryParams).forEach(function (name) {
        this._queryParams[name].forEach(function (rule) {
            body.push(
                this.__astPresetValueGetter(rule.getName()),
                this.__astPresetGetNthValueIfArray(rule.used));

            if (rule.required) {
                body.push(
                    this.__astTypeIfStatement(
                        //  if (value === undefined || value === null || value === '') {
                        this.__astPresetValueCheckExpression('||', '==='),
                        [
                            //  part[part.length] = `query.escape(part.getRawName())`;
                            this.__astTypeExpressionStatement(
                                this.__astTypeAssignmentExpression('=',
                                    this.__astTypeMemberExpression(
                                        this.__astTypeIdentifier('part'),
                                        this.__astTypeMemberExpression(
                                            this.__astTypeIdentifier('part'),
                                            this.__astTypeIdentifier('length')),
                                        true),
                                    this.__astTypeLiteral(query.escape(rule.getRawName()))))],
                        //  else
                        [
                            //  part[part.length] = `query.escape(part.getRawName()) +
                            //      query.params.eq` + query.stringifyQueryArg(value);
                            this.__astPresetAddQueryArg(rule.getRawName())]));
            } else {
                body.push(
                    this.__astTypeIfStatement(
                        //  if (value !== undefined && value !== null && value !== '') {
                        this.__astPresetValueCheckExpression('&&', '!=='),
                        [
                            //  part += `query.escape(part.getRawName() + query.params.eq` +
                            //      query.stringifyQueryArg(value);
                            this.__astPresetAddQueryArg(rule.getRawName())]));
            }
        }, this);
    }, this);

    body.push(
        this.__astTypeIfStatement(
            //  if (part.length === 0) {
            this.__astTypeBinaryExpression('===',
                this.__astTypeMemberExpression(
                    this.__astTypeIdentifier('part'),
                    this.__astTypeIdentifier('length')),
                this.__astTypeLiteral(0)),
            [
                //  return pathname;
                this.__astTypeReturnStatement(
                    this.__astTypeIdentifier('pathname'))]));

    body.push(
        //  return pathname + '?' + part.join(`query.params.sep`);
        this.__astTypeReturnStatement(
            this.__astTypeBinaryExpression('+',
                this.__astTypeBinaryExpression('+',
                    this.__astTypeIdentifier('pathname'),
                    this.__astTypeLiteral('?')),
                this.__astTypeCallExpression(
                    this.__astTypeMemberExpression(
                        this.__astTypeIdentifier('part'),
                        this.__astTypeIdentifier('join')),
                    [
                        this.__astTypeLiteral(this.params.querySep)]))));

    func = escodegen.generate(func);

    return new Function('hasProperty', 'query', 'undefined',
        'return ' + func)(hasProperty, query, void 0);
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
    var func = this.__astTypeFunctionDeclaration('_matcherFunc', body, [
        this.__astTypeIdentifier('url')
    ]);
    var paramsIndex = this._paramsIndex;

    body.push(
        //  var args;
        this.__astTypeVarDeclaration('args',
            this.__astPresetEmptyArgs()),
        //  var match = this._matchRegExp.exec(url);
        this.__astTypeVarDeclaration('match',
            this.__astTypeCallExpression(
                this.__astTypeMemberExpression(
                    this.__astTypeMemberExpression(
                        this.__astTypeIdentifier('this'),
                        this.__astTypeIdentifier('_matchRegExp')),
                    this.__astTypeIdentifier('exec')),
                [
                    this.__astTypeIdentifier('url')])),
        //  var queryObject;
        this.__astTypeVarDeclaration('queryObject'),
        //  var types;
        this.__astTypeVarDeclaration('type'),
        //  var value;
        this.__astTypeVarDeclaration('value')
    );

    //  if (match === null) {
    body.push(
        this.__astTypeIfStatement(
            this.__astTypeBinaryExpression('===',
                this.__astTypeIdentifier('match'),
                this.__astTypeLiteral(null)),
            [
                //  return null;
                this.__astTypeReturnStatement(
                    this.__astTypeLiteral(null))]));

    this._pathParams.forEach(function (rule, i) {
        var name = rule.getName();

        if (!this.__hasParameterValue(name)) {
            return;
        }

        body.push(
            //  value = match[`i + 1`]
            this.__astTypeExpressionStatement(
                this.__astTypeAssignmentExpression('=',
                    this.__astTypeIdentifier('value'),
                    this.__astTypeMemberExpression(
                        this.__astTypeIdentifier('match'),
                        this.__astTypeLiteral(i + 1),
                        true))),
            this.__astTypeIfStatement(
                //  if (typeof value === 'string') {
                this.__astTypeBinaryExpression('===',
                    this.__astTypeUnaryExpression('typeof',
                        this.__astTypeIdentifier('value'),
                        true),
                    this.__astTypeLiteral('string')),
                [
                    //  value = query.unescape(value);
                    this.__astTypeExpressionStatement(
                        this.__astTypeAssignmentExpression('=',
                            this.__astTypeIdentifier('value'),
                            this.__astTypeCallExpression(
                                this.__astTypeMemberExpression(
                                    this.__astTypeIdentifier('query'),
                                    this.__astTypeIdentifier('unescape')),
                                [
                                    this.__astTypeIdentifier('value')])))]));

        if (paramsIndex[name] === 1) {
            //  args[`path`] = value;
            body.push(
                this.__astTypeExpressionStatement(
                    this.__astTypeAssignmentExpression('=',
                        this.__astPresetDeepAccessor('args', name),
                        this.__astTypeIdentifier('value'))));

        } else {
            //  ??
            //  args[`path`][`i - 1`] = value
            body.push(
                this.__astTypeExpressionStatement(
                    this.__astTypeAssignmentExpression('=',
                        this.__astTypeMemberExpression(
                            this.__astPresetDeepAccessor('args', name),
                            this.__astTypeLiteral(rule.used),
                            true),
                        this.__astTypeIdentifier('value'))));
        }
    }, this);

    if (this._pathRule.args.length) {
        //  queryObject = query.parse(match[`l + 1`]);
        body.push(
            this.__astTypeExpressionStatement(
                this.__astTypeAssignmentExpression('=',
                    this.__astTypeIdentifier('queryObject'),
                    this.__astTypeCallExpression(
                        this.__astTypeMemberExpression(
                            this.__astTypeIdentifier('query'),
                            this.__astTypeIdentifier('parse')),
                        [
                            this.__astTypeMemberExpression(
                                this.__astTypeIdentifier('match'),
                                this.__astTypeLiteral(this._pathParams.length + 1),
                                true),
                            this.__astTypeLiteral(this.params.querySep),
                            this.__astTypeLiteral(this.params.queryEq)]))));

        Object.keys(this._queryParams).forEach(function (name) {
            this._queryParams[name].forEach(function (rule, i) {

                body.push(
                    this.__astPresetResetValue(),
                    this.__astPresetIfQueryHas(rule.getRawName(),
                        [
                            this.__astTypeExpressionStatement(
                                this.__astTypeAssignmentExpression('=',
                                    this.__astTypeIdentifier('value'),
                                    this.__astTypeMemberExpression(
                                        this.__astTypeMemberExpression(
                                            this.__astTypeIdentifier('queryObject'),
                                            this.__astTypeLiteral(rule.getRawName()),
                                            true),
                                        this.__astTypeLiteral(i),
                                        true)))]),
                    this.__astTypeExpressionStatement(
                        this.__astTypeAssignmentExpression('=',
                            this.__astTypeIdentifier('type'),
                            this.__astTypeMemberExpression(
                                this.__astTypeMemberExpression(
                                    this.__astTypeIdentifier('this'),
                                    this.__astTypeIdentifier('_types')),
                                this.__astTypeLiteral(rule.kind),
                                true))));

                if (rule.required) {
                    body.push(
                        this.__astTypeIfStatement(
                            this.__astTypeLogicalExpression('||',
                                this.__astTypeBinaryExpression('===',
                                    this.__astTypeIdentifier('value'),
                                    this.__astTypeIdentifier('undefined')),
                                this.__astTypeBinaryExpression('===',
                                    this.__astTypeCallExpression(
                                        this.__astTypeMemberExpression(
                                            this.__astTypeIdentifier('type'),
                                            this.__astTypeIdentifier('check')),
                                        [
                                            this.__astTypeIdentifier('value')]),
                                    this.__astTypeLiteral(false))),
                            [
                                this.__astTypeReturnStatement(
                                    this.__astTypeLiteral(null))]));
                } else {
                    body.push(
                        this.__astTypeIfStatement(
                            this.__astTypeLogicalExpression('&&',
                                this.__astTypeBinaryExpression('!==',
                                    this.__astTypeIdentifier('value'),
                                    this.__astTypeIdentifier('undefined')),
                                this.__astTypeBinaryExpression('===',
                                    this.__astTypeCallExpression(
                                        this.__astTypeMemberExpression(
                                            this.__astTypeIdentifier('type'),
                                            this.__astTypeIdentifier('check')),
                                        [
                                            this.__astTypeIdentifier('value')]),
                                    this.__astTypeLiteral(false))),
                            [
                                this.__astPresetResetValue()]));
                }

                if (this.__hasParameterValue(name)) {
                    if (paramsIndex[name] === 1) {
                        body.push(
                            this.__astTypeExpressionStatement(
                                this.__astTypeAssignmentExpression('=',
                                    this.__astPresetDeepAccessor('args', name),
                                    this.__astTypeIdentifier('value'))));
                    } else {
                        body.push(
                            this.__astTypeExpressionStatement(
                                this.__astTypeAssignmentExpression('=',
                                    this.__astTypeMemberExpression(
                                        this.__astPresetDeepAccessor('args', name),
                                        this.__astTypeLiteral(rule.used),
                                        true),
                                    this.__astTypeIdentifier('value'))));
                    }
                }

            }, this);
        }, this);
    }

    body.push(
        this.__astTypeReturnStatement(
            this.__astTypeIdentifier('args')));

    func = escodegen.generate(func);

    return new Function('hasProperty', 'query', 'return ' + func)(hasProperty, query);
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

        if (char === query.escape(char)) {
            result += regesc(char);

            continue;
        }

        if (this.params.ignoreCase) {
            result += '(?:' + regesc(char) + '|' +
            query.escape(char.toLowerCase()) + '|' +
            query.escape(char.toUpperCase()) + ')';

            continue;
        }

        result += '(?:' + regesc(char) + '|' + query.escape(char) + ')';
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

    pEmptyArgs = query.deeper(pEmptyArgs);

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

    qEmptyArgs = query.deeper(qEmptyArgs);

    return this.__mergeArgs(pEmptyArgs, qEmptyArgs);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__astPresetEmptyArgs = function () {
    var emptyArgs = this._emptyArgs;
    return this.__astObjectByObject(emptyArgs);
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
Rule.prototype.__astObjectByObject = function (obj) {
    var ast;
    var undef;
    var value;

    if (Object(obj) !== obj || Array.isArray(obj)) {
        undef = this.__astTypeIdentifier('undefined');

        if (Array.isArray(obj)) {
            value = new Array(obj.length).join('|').split('|').map(function () {
                return undef;
            }, this);
            return this.__astTypeArrayExpression(value);
        }

        return undef;
    }

    ast = this.__astTypeObjectExpression([]);

    Object.keys(obj).forEach(function (i) {
        value = {
            type: 'Property',
            key: this.__astTypeLiteral(i),
            value: this.__astObjectByObject(obj[i])
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
Rule.prototype.__astPresetDeepAccessor = function (name, path) {
    var self = this;

    return RuleArg.parse(path).reduce(function (object, part) {

        return self.__astTypeMemberExpression(object,
            self.__astTypeLiteral(part), true);

    }, this.__astTypeIdentifier(name));
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
Rule.prototype.__astPresetValueCheckExpression = function (logicalOp, binaryOp) {
    return this.__astTypeLogicalExpression(logicalOp,
        this.__astTypeLogicalExpression(logicalOp,
            this.__astTypeBinaryExpression(binaryOp,
                this.__astTypeIdentifier('value'),
                this.__astTypeIdentifier('undefined')),
            this.__astTypeBinaryExpression(binaryOp,
                this.__astTypeIdentifier('value'),
                this.__astTypeIdentifier('null'))),
        this.__astTypeBinaryExpression(binaryOp,
            this.__astTypeIdentifier('value'),
            this.__astTypeLiteral('')));
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
Rule.prototype.__astPresetValueGetter = function (path) {
    var parts = RuleArg.parse(path);
    var body = [];
    //  VALUE_GETTER: {
    var getter = this.__astTypeLabeledStatement('VALUE_GETTER', body);
    //  value = args;
    body.push(
        this.__astTypeExpressionStatement(
            this.__astTypeAssignmentExpression('=',
                this.__astTypeIdentifier('value'),
                this.__astTypeIdentifier('args'))));

    var breakCode = [
        //  value = undefined;
        this.__astTypeExpressionStatement(
            this.__astTypeAssignmentExpression('=',
                this.__astTypeIdentifier('value'),
                this.__astTypeIdentifier('undefined'))),
        //  break VALUE_GETTER;
        this.__astTypeBreakStatement('VALUE_GETTER')];

    parts.forEach(function (part) {

        //  if (!value || typeof value !== 'object' || Array.isArray(value)) {
        body.push(
            this.__astTypeIfStatement(
                this.__astTypeLogicalExpression('||',
                    this.__astTypeLogicalExpression('||',
                        this.__astTypeUnaryExpression('!',
                            this.__astTypeIdentifier('value'),
                            true),
                        this.__astTypeBinaryExpression('!==',
                            this.__astTypeUnaryExpression('typeof',
                                this.__astTypeIdentifier('value'),
                                true),
                            this.__astTypeLiteral('object'))),
                    this.__astPresetIsValueArray()),
                breakCode));

        body.push(
            //  if (!hasProperty.call(value, `parts[i]`)) {
            this.__astTypeIfStatement(
                this.__astTypeUnaryExpression('!',
                    this.__astTypeCallExpression(
                        this.__astTypeMemberExpression(
                            this.__astTypeIdentifier('hasProperty'),
                            this.__astTypeIdentifier('call')),
                        [
                            this.__astTypeIdentifier('value'),
                            this.__astTypeLiteral(part)]),
                    true),
                breakCode));

        //  value = value[`parts[i]`];
        body.push(
            this.__astTypeExpressionStatement(
                this.__astTypeAssignmentExpression('=',
                    this.__astTypeIdentifier('value'),
                    this.__astTypeMemberExpression(
                        this.__astTypeIdentifier('value'),
                        this.__astTypeLiteral(part),
                        true))));
    }, this);

    body.push(
        //  if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.__astTypeIfStatement(
            this.__astTypeLogicalExpression('&&',
                this.__astTypeLogicalExpression('&&',
                    this.__astTypeIdentifier('value'),
                    this.__astTypeBinaryExpression('===',
                        this.__astTypeUnaryExpression('typeof',
                            this.__astTypeIdentifier('value'),
                            true),
                        this.__astTypeLiteral('object'))),
            this.__astTypeUnaryExpression('!',
                this.__astPresetIsValueArray(),
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
Rule.prototype.__astPresetQueryEscapeValue4Pathname = function () {
    return this.__astTypeCallExpression(
        this.__astTypeMemberExpression(
            this.__astTypeIdentifier('query'),
            this.__astTypeIdentifier('stringifyPathArg')),
        [
            this.__astTypeIdentifier('value')]);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__astPresetQueryEscapeValue4Query = function () {
    return this.__astTypeCallExpression(
        this.__astTypeMemberExpression(
            this.__astTypeIdentifier('query'),
            this.__astTypeIdentifier('stringifyQueryArg')),
        [
            this.__astTypeIdentifier('value')]);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__astPresetIsValueArray = function () {
    return this.__astTypeCallExpression(
        this.__astTypeMemberExpression(
            this.__astTypeIdentifier('Array'),
            this.__astTypeIdentifier('isArray')),
        [
            this.__astTypeIdentifier('value')]);
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
Rule.prototype.__astPresetGetNthValue = function (nth) {
    return this.__astTypeExpressionStatement(
        this.__astTypeAssignmentExpression('=',
            this.__astTypeIdentifier('value'),
            this.__astTypeMemberExpression(
                this.__astTypeIdentifier('value'),
                this.__astTypeLiteral(nth),
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
Rule.prototype.__astPresetGetNthValueIfArray = function (nth) {
    return this.__astTypeIfStatement(
        this.__astPresetIsValueArray(),
        [
            this.__astPresetGetNthValue(nth)]);
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
Rule.prototype.__astPresetPartSelfPlus = function (plus) {
    return this.__astTypeExpressionStatement(
        this.__astTypeAssignmentExpression('+=',
            this.__astTypeIdentifier('part'),
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
Rule.prototype.__astPresetAssignPart = function (assign) {
    return this.__astTypeExpressionStatement(
        this.__astTypeAssignmentExpression('=',
            this.__astTypeIdentifier('part'),
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
Rule.prototype.__astPresetIfQueryHas = function (name, consequent, alternate) {
    return this.__astTypeIfStatement(
        this.__astTypeCallExpression(
            this.__astTypeMemberExpression(
                this.__astTypeIdentifier('hasProperty'),
                this.__astTypeIdentifier('call')),
            [
                this.__astTypeIdentifier('queryObject'),
                this.__astTypeLiteral(name)]),
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
Rule.prototype.__astPresetResetValue = function () {
    return this.__astTypeExpressionStatement(
        this.__astTypeAssignmentExpression('=',
            this.__astTypeIdentifier('value'),
            this.__astTypeIdentifier('undefined')));
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
Rule.prototype.__astPresetAddQueryArg = function (name) {
    return this.__astTypeExpressionStatement(
        this.__astTypeAssignmentExpression('=',
            this.__astTypeMemberExpression(
                this.__astTypeIdentifier('part'),
                this.__astTypeMemberExpression(
                    this.__astTypeIdentifier('part'),
                    this.__astTypeIdentifier('length')),
                true),
            this.__astTypeBinaryExpression('+',
                this.__astTypeLiteral(query.escape(name) + this.params.queryEq),
                this.__astPresetQueryEscapeValue4Query())));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__astPresetResetPart = function () {
    return this.__astPresetAssignPart(
        this.__astTypeLiteral(''));
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
Rule.prototype.__astTypeBreakStatement = function (name) {
    return {
        type: 'BreakStatement',
        label: this.__astTypeIdentifier(name)
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
Rule.prototype.__astTypeLogicalExpression = function (operator, left, right) {
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
Rule.prototype.__astTypeCallExpression = function (callee, args) {
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
Rule.prototype.__astTypeIfStatement = function (test, consequent, alternate) {
    return {
        type: 'IfStatement',
        test: test,
        consequent: this.__astTypeBlockStatement(consequent),
        alternate: alternate && this.__astTypeBlockStatement(alternate)
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
Rule.prototype.__astTypeLabeledStatement = function (name, body) {
    return {
        type: 'LabeledStatement',
        label: this.__astTypeIdentifier(name),
        body: this.__astTypeBlockStatement(body)
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
Rule.prototype.__astTypeExpressionStatement = function (expression) {
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
Rule.prototype.__astTypeAssignmentExpression = function (operator, left, right) {
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
Rule.prototype.__astTypeFunctionDeclaration = function (name, body, params) {
    return {
        params: params,
        type: 'FunctionDeclaration',
        id: this.__astTypeIdentifier(name),
        body: this.__astTypeBlockStatement(body)
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
Rule.prototype.__astTypeBlockStatement = function (body) {
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
Rule.prototype.__astTypeBinaryExpression = function (operator, left, right) {
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
Rule.prototype.__astTypeReturnStatement = function (argument) {
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
Rule.prototype.__astTypeArrayExpression = function (elements) {
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
Rule.prototype.__astTypeObjectExpression = function (properties) {
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
Rule.prototype.__astTypeUnaryExpression = function (operator, argument, prefix) {
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
Rule.prototype.__astTypeIdentifier = function (name) {
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
Rule.prototype.__astTypeVarDeclaration = function (name, init) {
    return {
        type: 'VariableDeclaration',
        declarations: [
            {
                type: 'VariableDeclarator',
                id: this.__astTypeIdentifier(name),
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
Rule.prototype.__astTypeLiteral = function (value) {
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
Rule.prototype.__astTypeMemberExpression = function (object, property, computed) {
    return {
        type: 'MemberExpression',
        object: object,
        property: property,
        computed: computed
    };
};

module.exports = Rule;
