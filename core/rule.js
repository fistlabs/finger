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
     * @property params
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
     * @property _types
     * @type {Object}
     * */
    this._types = this.__compileTypes();

    Tools.call(this, ruleString);

    /**
     * @protected
     * @memberOf {Rule}
     * @property _pathArgsOrder
     * @type {Array<String>}
     * */
    this._pathArgsOrder = this.__compilePathArgsOrder();

    /**
     * @protected
     * @memberOf {Rule}
     * @property _pathArgsIndex
     * @type {Object}
     * */
    this._pathArgsIndex = this.__compilePathArgsIndex();

    /**
     * @protected
     * @memberOf {Rule}
     * @property _query
     * @type {Query}
     * */
    this._query =  this.__createQuery();

    /**
     * @protected
     * @memberOf {Rule}
     * @property _queryMatcherFunc
     * @type {Function}
     * */
    this._queryMatcherFunc = this.__compileQueryMatcherFunc();

    /**
     * @protected
     * @memberOf {Rule}
     * @property _matchRegExp
     * @type {RegExp}
     * */
    this._matchRegExp = this.__compileMatchRegExp();

    /**
     * @protected
     * @memberOf {Rule}
     * @property
     * @type {Function}
     * */
    this._matcherFunc = this.__compileMatcherFunc();

    /**
     * @protected
     * @memberOf {Rule}
     * @property _builderFunc
     * @type {Function}
     * */
    this._builderFunc = this.__compileBuilderFunc();
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
    return this._builderFunc(args ? this._query.flatten(args) : {});
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
    var pathArgsOrder = this._pathArgsOrder;
    var i;
    var l = pathArgsOrder.length;

    body.push(
        //  var args = null;
        this.__createAstTypeVarDeclaration('args',
            this.__createAstTypeLiteral(null)),
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
                    this.__createAstTypeIdentifier('args'))]));

    //  Need to match query
    if (this._pathRule.args.length) {
        body.push(
            //  queryObject = this.matchQueryString(match[`l + 1`]);
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeAssignmentExpression('=',
                    this.__createAstTypeIdentifier('queryObject'),
                    this.__createAstTypeCallExpression(
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeIdentifier('this'),
                            this.__createAstTypeIdentifier('matchQueryString')),
                        [
                            this.__createAstTypeMemberExpression(
                                this.__createAstTypeIdentifier('match'),
                                this.__createAstTypeLiteral(l + 1),
                                true)]))),
            //  if (queryObject === null) {
        this.__createAstTypeIfStatement(
            this.__createAstTypeBinaryExpression('===',
                this.__createAstTypeIdentifier('queryObject'),
                this.__createAstTypeLiteral(null)),
            [
                //  return null;
                this.__createAstTypeReturnStatement(
                    this.__createAstTypeIdentifier('args'))]));
    }

    //  args = {};
    body.push(
        this.__createAstTypeExpressionStatement(
            this.__createAstTypeAssignmentExpression('=',
                this.__createAstTypeIdentifier('args'),
                this.__createAstTypeObjectExpression([]))));

    for (i = 0; i < l; i += 1) {
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
                    {
                        type: 'UnaryExpression',
                        operator: 'typeof',
                        argument: this.__createAstTypeIdentifier('value'),
                        prefix: true
                    },
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
                                    this.__createAstTypeIdentifier('value')])))]),
            // this._query.addValue(args, `pathArgsOrder[i]`, val);
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeCallExpression(
                    this.__createAstTypeMemberExpression(
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeIdentifier('this'),
                            this.__createAstTypeIdentifier('_query')),
                        this.__createAstTypeIdentifier('addValue')
                    ),
                    [
                        this.__createAstTypeIdentifier('args'),
                        this.__createAstTypeLiteral(pathArgsOrder[i]),
                        this.__createAstTypeIdentifier('value')])));
    }

    if (l) {
        //  args = this._query.deeper(args);
        body.push(
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeAssignmentExpression('=',
                    this.__createAstTypeIdentifier('args'),
                    this.__createAstTypeCallExpression(
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeMemberExpression(
                                this.__createAstTypeIdentifier('this'),
                                this.__createAstTypeIdentifier('_query')),
                            this.__createAstTypeIdentifier('deeper')
                        ),
                        [
                            this.__createAstTypeIdentifier('args')]))));
    }

    if (this._pathRule.args.length) {
        body.push(
            //  queryObject = this._query.deeper(queryObject);
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeAssignmentExpression('=',
                    this.__createAstTypeIdentifier('queryObject'),
                    this.__createAstTypeCallExpression(
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeMemberExpression(
                                this.__createAstTypeIdentifier('this'),
                                this.__createAstTypeIdentifier('_query')),
                            this.__createAstTypeIdentifier('deeper')
                        ),
                        [
                            this.__createAstTypeIdentifier('queryObject')]))),
            //  args = this.__mergeArgs(args, queryObject);
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeAssignmentExpression('=',
                    this.__createAstTypeIdentifier('args'),
                    this.__createAstTypeCallExpression(
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeIdentifier('this'),
                            this.__createAstTypeIdentifier('__mergeArgs')
                        ),
                        [
                            this.__createAstTypeIdentifier('args'),
                            this.__createAstTypeIdentifier('queryObject')]))));

    }

    body.push(
        this.__createAstTypeReturnStatement(
            this.__createAstTypeIdentifier('args')));

    func = escodegen.generate(func);

    return new Function('return ' + func)();
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
 * @public
 * @memberOf {Rule}
 * @method
 *
 * @param {String} queryString
 *
 * @returns {Object|null}
 * */
Rule.prototype.matchQueryString = function (queryString) {
    return this._queryMatcherFunc(this._query.parse(queryString));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Query}
 * */
Rule.prototype.__createQuery = function () {
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
 * @returns {Object}
 * */
Rule.prototype.__compileTypes = function () {
    var name;
    var types = {};

    for (name in Rule.builtinTypes) {
        if (hasProperty.call(Rule.builtinTypes, name)) {
            types[name] = new Type(name, Rule.builtinTypes[name]);
        }
    }

    for (name in this.params.types) {
        if (hasProperty.call(this.params.types, name)) {
            types[name] = new Type(name, this.params.types[name]);
        }
    }

    return types;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Array<String>}
 * */
Rule.prototype.__compilePathArgsOrder = function () {
    var order = [];

    this.inspectRule(function (rule) {
        if (rule.type === RuleArg.TYPE) {
            order[order.length] = rule.name;
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
Rule.prototype.__compilePathArgsIndex = function () {
    var i;
    var l;
    var order = this._pathArgsOrder;
    var index = Object.create(null);

    for (i = 0, l = order.length; i < l; i += 1) {
        if (index[order[i]]) {
            index[order[i]] += 1;

            continue;
        }

        index[order[i]] = 1;
    }

    return index;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__compileQueryMatcherFunc = function () {
    var args = this._pathRule.args;
    var index = this._pathArgsIndex;
    var body = [];
    var func = this.__createAstTypeFunctionDeclaration('_queryMatcherFunc', body, [
        this.__createAstTypeIdentifier('args')
    ]);
    var i;
    var l;
    var rule;

    body.push(
        this.__createAstTypeVarDeclaration('result',
            this.__createAstTypeObjectExpression([])),
        this.__createAstTypeVarDeclaration('type'),
        this.__createAstTypeVarDeclaration('value'));

    for (i = 0, l = args.length; i < l; i += 1) {
        rule = args[i];

        body.push(
            this.__createAstResetValue(),
            this.__createAstIfArgsHas(rule.name,
                [
                    this.__createAstGetArgsValue(rule.name),
                    this.__createAstGetNthValueIfArray(
                        hasProperty.call(index, rule.name) ?
                            rule.used - index[rule.name] : rule.used)]),
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
                        this.__createAstTypeReturnStatement(
                            this.__createAstTypeLiteral(null))]));
        }

        body.push(
            this.__createAstTypeExpressionStatement(
                this.__createAstTypeCallExpression(
                    this.__createAstTypeMemberExpression(
                        this.__createAstTypeMemberExpression(
                            this.__createAstTypeIdentifier('this'),
                            this.__createAstTypeIdentifier('_query')),
                        this.__createAstTypeIdentifier('addValue')),
                    [
                        this.__createAstTypeIdentifier('result'),
                        this.__createAstTypeLiteral(rule.name),
                        this.__createAstTypeIdentifier('value')])));
    }

    body.push(
        this.__createAstTypeReturnStatement(
            this.__createAstTypeIdentifier('result')));

    func = escodegen.generate(func);

    return new Function('hasProperty', 'return ' + func)(hasProperty);
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
    var defaultType = 'Segment';

    function useArg(rule) {
        var name = rule.name;

        if (!rule.kind) {
            rule.kind = defaultType;
        }

        if (!hasProperty.call(types, rule.kind)) {
            name = 'Unknown argument rule type %j';
            name = util.format(name, rule.kind);

            throw new TypeError(name);
        }

        if (used[name] === void 0) {
            used[name] = 0;
        } else {
            used[name] += 1;
        }

        rule.used = used[name];
    }

    Tools._inspectRule(rule, function (rule) {

        if (rule.type !== RuleArg.TYPE) {
            return;
        }

        useArg(rule);
    });

    defaultType = 'Free';

    rule.args.forEach(useArg);

    return rule;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {RegExp}
 * */
Rule.prototype.__compileMatchRegExp = function () {
    var source = this.reduceRule(this.__compileRegExpPart);

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
 *
 * @returns {Object}
 * */
Rule.prototype.__compileRegExpPart = function (part, stackPop, n) {
    var type = part.type;

    if (type === RuleSep.TYPE) {

        return regesc('/');
    }

    if (type === RuleAny.TYPE) {

        return this.__compileRegExpPartStatic(part);
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
Rule.prototype.__compileRegExpPartStatic = function (part) {
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
 * @returns {Function}
 * */
Rule.prototype.__compileBuilderFunc = function () {
    var args = this._pathRule.args;
    var i;
    var l;
    var body = [];
    //  function _builderFunc(args) {
    var func = this.__createAstTypeFunctionDeclaration('_builderFunc', body, [
        this.__createAstTypeIdentifier('args')
    ]);
    var part;
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
                this.__createAstPartSelfPlus(
                    this.__createAstTypeLiteral('/')));

            return;
        }

        if (part.type === RuleAny.TYPE) {
            body.push(
                //  part += `encodeURIComponent(part.text)`;
                this.__createAstPartSelfPlus(
                    this.__createAstTypeLiteral(encodeURIComponent(part.text))));

            return;
        }

        if (part.type === RuleSeq.TYPE) {
            //  optional
            if (stackPop) {
                body = stack.pop();
                body.push(
                    //  part = stack[`n`] + part;
                    this.__createAstAssignPart(
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
                this.__createAstResetPart());

            stack.push(body);
            //  RULE_SEQ_`n`: {
            body.push(
                this.__createAstTypeLabeledStatement('RULE_SEQ_' + n, body = []));

            return;
        }

        body.push(
            //  value = undefined;
            this.__createAstResetValue(),
            //  if (hasProperty.call(args, `part.name`)) {
            this.__createAstIfArgsHas(part.name,
                [
                    //  value = args[`part.name`];
                    this.__createAstGetArgsValue(part.name),
                    //  if (Array.isArray(value)) {
                    //      value = value[`part.used`];
                    // }
                    this.__createAstGetNthValueIfArray(part.used)]));

        if (n > 1) {
            body.push(
                this.__createAstTypeIfStatement(
                    //  if (value === undefined || value === null || value === ') {
                    this.__createAstValueCheckExpression('||', '==='),
                    [
                        //  part = '';
                        this.__createAstResetPart(),
                        //  break RULE_SEQ_`n - 1`;
                        this.__createAstTypeBreakStatement('RULE_SEQ_' + (n - 1))]),
                //  part += query.stringifyQueryArg(value);
                this.__createAstPartSelfPlus(
                    this.__createAstQueryEscapeValue4Pathname()));
        } else {
            body.push(
                this.__createAstTypeIfStatement(
                    //  if (value !== undefined && value !== null && value !== '') {
                    this.__createAstValueCheckExpression('&&', '!=='),
                    [
                        //  part += query.stringifyQueryArg(value);
                        this.__createAstPartSelfPlus(
                            this.__createAstQueryEscapeValue4Pathname())]));
        }
    });

    body.push(
        //  pathname = part;
        this.__createAstTypeExpressionStatement(
            this.__createAstTypeAssignmentExpression('=',
                this.__createAstTypeIdentifier('pathname'),
                this.__createAstTypeIdentifier('part'))),
        //  part = [];
        this.__createAstAssignPart(
            this.__createAstTypeArrayExpression([])));

    for (i = 0, l = args.length; i < l; i += 1) {
        part = args[i];

        body.push(
            //  value = undefined;
            this.__createAstResetValue(),
            //  if (hasProperty.call(args, `part.name`)) {
            this.__createAstIfArgsHas(part.name,
                [
                    //  value = args[`part.name`];
                    //  if (Array.isArray(value)) {
                    //      value = value[`part.used`];
                    //  }
                    this.__createAstGetArgsValue(part.name),
                    this.__createAstGetNthValueIfArray(part.used)
                ]));

        if (part.required) {
            body.push(
                this.__createAstTypeIfStatement(
                    //  if (value === undefined || value === null || value === '') {
                    this.__createAstValueCheckExpression('||', '==='),
                    [
                        //  part[part.length] = `query.escape(part.name)`;
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
                                this.__createAstTypeLiteral(this._query.escape(part.name))
                            )
                        )],
                    //  else
                    [
                        //  part[part.length] = `query.escape(part.name) + query.params.eq` +
                        //      query.stringifyQueryArg(value);
                        this.__createAstAddQueryArg(part.name)]));
        } else {
            body.push(
                this.__createAstTypeIfStatement(
                    //  if (value !== undefined && value !== null && value !== '') {
                    this.__createAstValueCheckExpression('&&', '!=='),
                    [
                        //  part += `query.escape(part.name) + query.params.eq` +
                        //      query.stringifyQueryArg(value);
                        this.__createAstAddQueryArg(part.name)]));

        }
    }

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
 * @param {String} logicalOp
 * @param {String} binaryOp
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstValueCheckExpression = function (logicalOp, binaryOp) {
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
 * @returns {Object}
 * */
Rule.prototype.__createAstQueryEscapeValue4Pathname = function () {
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
Rule.prototype.__createAstQueryEscapeValue4Query = function () {
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
Rule.prototype.__createAstIsValueArray = function () {
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
Rule.prototype.__createAstGetNthValue = function (nth) {
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
Rule.prototype.__createAstGetNthValueIfArray = function (nth) {
    return this.__createAstTypeIfStatement(
        this.__createAstIsValueArray(),
        [
            this.__createAstGetNthValue(nth)]);
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
Rule.prototype.__createAstGetArgsValue = function (name) {
    return this.__createAstTypeExpressionStatement(
        this.__createAstTypeAssignmentExpression('=',
            this.__createAstTypeIdentifier('value'),
            this.__createAstTypeMemberExpression(
                this.__createAstTypeIdentifier('args'),
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
Rule.prototype.__createAstPartSelfPlus = function (plus) {
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
Rule.prototype.__createAstAssignPart = function (assign) {
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
Rule.prototype.__createAstIfArgsHas = function (name, consequent, alternate) {
    return this.__createAstTypeIfStatement(
        this.__createAstTypeCallExpression(
            this.__createAstTypeMemberExpression(
                this.__createAstTypeIdentifier('hasProperty'),
                this.__createAstTypeIdentifier('call')),
            [
                this.__createAstTypeIdentifier('args'),
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
Rule.prototype.__createAstResetValue = function () {
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
Rule.prototype.__createAstAddQueryArg = function (name) {
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
                this.__createAstQueryEscapeValue4Query())
        ));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__createAstResetPart = function () {
    return this.__createAstAssignPart(
        this.__createAstTypeLiteral(''));
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

                pVal.push(qVal);

                continue;
            }

            if (qVal && typeof qVal === 'object' && !Array.isArray(qVal)) {
                this.__mergeArgs(pVal, qVal);
            }

            continue;
        }

        if (qVal && typeof qVal === 'object') {
            if (Array.isArray(qVal)) {
                pathArgs[name] = [pVal].concat(qVal);
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

/**
 * @public
 * @static
 * @memberOf {Rule}
 * @property
 * @type {Object}
 * */
Rule.builtinTypes = {
    Segment: '[^/]+?',
    Free: '[\\s\\S]+?'
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

module.exports = Rule;
