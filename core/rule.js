/*eslint no-new-func: 0*/
'use strict';

var RuleAny = /** @type RuleAny */ require('./parser/rule-any');
var RuleArg = /** @type RuleArg */ require('./parser/rule-arg');
var RuleSep = /** @type RuleSep */ require('./parser/rule-sep');
var RuleSeq = /** @type RuleSeq */ require('./parser/rule-seq');

var Query = /** @type Query */ require('./query');

var Tools = /** @type Tools */ require('./tools');
var Type = /** @type Type */ require('./type');

var _ = require('lodash-node');
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

    /**
     * @public
     * @memberOf {Rule}
     * @property
     * @type {Object}
     * */
    this.params = _.extend({
        queryEq: '=',
        querySep: '&'
    }, params);

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
    this._paramsIndex = this.__countPathParams();

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
    /*eslint complexity: 0*/
    var i;
    var l;
    var name;
    var url = this._builderFunc(args || {});
    var queryArgs = [];
    var value;

    for (name in args) {
        if (hasProperty.call(args, name) && !hasProperty.call(this._paramsIndex, name)) {
            value = args[name];

            if (Array.isArray(value)) {
                for (i = 0, l = value.length; i < l; i += 1) {
                    queryArgs[queryArgs.length] = query.escape(name) + this.params.queryEq +
                        query.stringifyQueryArg(value[i]);
                }
            } else {
                queryArgs[queryArgs.length] = query.escape(name) + this.params.queryEq +
                    query.stringifyQueryArg(value);
            }

        }
    }

    if (queryArgs.length) {
        url += '?' + queryArgs.join(this.params.querySep);
    }

    return url;
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
    var args = null;
    var match = this._matchRegExp.exec(url);
    var queryString;
    var queryObject;
    var pathParams;
    var i;
    var l;
    var value;
    var name;

    if (match === null) {
        return args;
    }

    args = {};
    pathParams = this._pathParams;

    for (i = 0, l = pathParams.length; i < l; i += 1) {
        value = match[i + 1];
        name = pathParams[i].name;

        if (typeof value === 'string') {
            value = query.unescape(value);
        } else {
            value = pathParams[i].default;
        }

        if (!hasProperty.call(args, name)) {
            args[name] = value;
        } else if (Array.isArray(args[name])) {
            args[name].push(value);
        } else {
            args[name] = [args[name], value];
        }
    }

    queryString = match[l + 1];

    if (!queryString) {
        return args;
    }

    queryObject = query.parse(queryString, this.params.querySep, this.params.queryEq);

    if (!l) {
        return queryObject;
    }

    for (name in args) {
        if (hasProperty.call(args, name)) {
            queryObject[name] = args[name];
        }
    }

    return queryObject;
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
        this.__astTypeVarDeclaration('value'));

    this.inspectRule(function (part, stackPop, n) {

        if (part.type === RuleSep.TYPE) {
            //  part += '/';
            body.push(
                this.__astPresetPartSelfPlus(
                    this.__astTypeLiteral('/')));

            return;
        }
//
        if (part.type === RuleAny.TYPE) {
            body.push(
                //  part += `encodeURIComponent(part.text)`;
                this.__astPresetPartSelfPlus(
                    this.__astTypeLiteral(encodeURIComponent(part.text))));

            return;
        }

        if (part.type === RuleSeq.TYPE) {
//            //  optional
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
            this.__astPresetResetValue(),
            this.__astTypeIfStatement(
                this.__astPresetHasPropertyCall(
                    [
                        this.__astTypeIdentifier('args'),
                        this.__astTypeLiteral(part.name)]
                ),
                [
                    this.__astTypeExpressionStatement(
                        this.__astTypeAssignmentExpression('=',
                            this.__astTypeIdentifier('value'),
                            this.__astTypeMemberExpression(
                                this.__astTypeIdentifier('args'),
                                this.__astTypeLiteral(part.name),
                                true))),
                    this.__astTypeIfStatement(
                        this.__astTypeUnaryExpression('!',
                            this.__astPresetIsValueArray(),
                            true),
                        [
                            this.__astTypeExpressionStatement(
                                this.__astTypeAssignmentExpression('=',
                                this.__astTypeIdentifier('value'),
                                this.__astTypeArrayExpression([
                                    this.__astTypeIdentifier('value')])))]),
                    this.__astPresetGetNthValue(part.used)]));

        body.push(
            this.__astTypeIfStatement(
                this.__astPresetValueCheckExpression('||', '==='),
                [
                    this.__astTypeExpressionStatement(
                        this.__astTypeAssignmentExpression('=',
                        this.__astTypeIdentifier('value'),
                        this.__astTypeLiteral(part.default === void 0 ? null : part.default)))]));

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

    body.push(this.__astTypeReturnStatement(this.__astTypeIdentifier('part')));

    func = escodegen.generate(func);

    return new Function('hasProperty', 'query', 'undefined',
        'return ' + func)(hasProperty, query, void 0);
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
                this.__astPresetUndef()),
            this.__astTypeBinaryExpression(binaryOp,
                this.__astTypeIdentifier('value'),
                this.__astTypeLiteral(null))),
        this.__astTypeBinaryExpression(binaryOp,
            this.__astTypeIdentifier('value'),
            this.__astTypeLiteral('')));
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

        return '(' + type.regexp + ')';
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
    var types = _.extend({
        Seg: '[^/?&]+?',
        Seq: '[^?&]+?'
    }, this.params.types);

    return _.mapValues(types, function (regexp, kind) {
        return new Type(kind, regexp);
    });
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__countPathParams = function () {
    var count = {};

    _.forEach(this._pathParams, function (rule) {
        var name = rule.name;
        if (hasProperty.call(count, name)) {
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
        var name = rule.name;

        if (!rule.kind) {
            rule.kind = defaultType;
        }

        if (!_.has(types, rule.kind)) {
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

    _.forEach(rule.args, useArg);

    return rule;
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype.__astPresetUndef = function () {
    return this.__astTypeIdentifier('undefined');
};

//  Ast presets

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {Array} args
 *
 * @returns {Object}
 * */
Rule.prototype.__astPresetHasPropertyCall = function (args) {
    return this.__astTypeCallExpression(
        this.__astTypeMemberExpression(
            this.__astTypeIdentifier('hasProperty'),
            this.__astTypeIdentifier('call')),
        args);
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
 * @returns {Object}
 * */
Rule.prototype.__astPresetResetValue = function () {
    return this.__astTypeExpressionStatement(
        this.__astTypeAssignmentExpression('=',
            this.__astTypeIdentifier('value'),
            this.__astPresetUndef()));
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
 *
 * @returns {Object}
 * */
Rule.prototype.__astTypeIfStatement = function (test, consequent) {
    return {
        type: 'IfStatement',
        test: test,
        consequent: this.__astTypeBlockStatement(consequent)
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
