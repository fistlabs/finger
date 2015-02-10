/*eslint no-new-func: 0*/
'use strict';

var RuleAny = /** @type RuleAny */ require('./parser/rule-any');
var RuleArg = /** @type RuleArg */ require('./parser/rule-arg');
var RuleSep = /** @type RuleSep */ require('./parser/rule-sep');
var RuleSeq = /** @type RuleSeq */ require('./parser/rule-seq');

var Tools = /** @type Tools */ require('./tools');
var Type = /** @type Type */ require('./type');

var _ = require('lodash-node');
var escodegen = require('escodegen');
var hasProperty = Object.prototype.hasOwnProperty;
var regesc = require('regesc');
var uniqueId = require('unique-id');
var util = require('util');

/**
 * @class Rule
 * @extends Tools
 *
 * @param {String} ruleString
 * @param {Object} [params]
 * @param {Object} [data]
 * */
function Rule(ruleString, params, data) {

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
     * @type {Object}
     * */
    this._types = _.extend({
        Seg: '[^/?&]+?',
        Seq: '[^?&]+?'
    }, this.params.types);

    this._types = _.mapValues(this._types, function (regex, kind) {
        return new Type(kind, regex);
    });

    Tools.call(this, ruleString);

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
    this._paramsCount = this._countPathParams();

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

    args = Object(args);
    keys = Object.keys(args);
    url = this._builderFunc(args);

    for (i = 0, l = keys.length; i < l; i += 1) {
        queryArgs = this._reduceQArg(queryArgs, args[keys[i]], keys[i]);
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
        return allQArgs;
    }

    if (_.isArray(value)) {
        for (i = 0, l = value.length; i < l; i += 1) {
            allQArgs[allQArgs.length] = this._createQueryArg(name, value[i]);
        }
    } else {
        allQArgs[allQArgs.length] = this._createQueryArg(name, value);
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
 * TODO: need to check url parameter type or replace exec to match to implicitly generate type error?
 *
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
    var i;
    var l;
    var match;
    var name;
    var pathParams;
    var queryObject;
    var queryString;
    var value;
    var keys;

    if (this.params.appendSlash) {
        url = url.replace(/^(\/[^.?\/]+[^\/?])(\?[^?]*)?$/, '$1/$2');
    }

    match = this._matchRegExp.exec(url);

    if (match === null) {
        return args;
    }

    args = {};
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

    queryString = match[l + 1];

    if (!queryString) {
        return args;
    }

    queryObject = this._parseQs(queryString);

    if (l === 0) {
        return queryObject;
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
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Function}
 * */
Rule.prototype._compileBuilderFunc = function () {
    var body = [];
    //  function _builderFunc(args) {
    var func = this._astTypeFunctionDeclaration('_builderFunc', body, [
        this._astTypeIdentifier('args')
    ]);
    var stack = [];

    body.push(
        //  var part = '';'
        this._astTypeVarDeclaration('part',
            this._astTypeLiteral('')),
        //  var stack = [];
        this._astTypeVarDeclaration('stack',
            this._astTypeArrayExpression([])),
        //  var value;
        this._astTypeVarDeclaration('value'));

    this.inspectRule(function (part, stackPop, n) {

        if (part.type === RuleSep.TYPE) {
            //  part += '/';
            body.push(
                this._astCasePartSelfPlus(
                    this._astTypeLiteral('/')));

            return;
        }
//
        if (part.type === RuleAny.TYPE) {
            body.push(
                //  part += `this._valEscape(part.text)`;
                this._astCasePartSelfPlus(
                    this._astTypeLiteral(this._valEscape(part.text))));

            return;
        }

        if (part.type === RuleSeq.TYPE) {
//            //  optional
            if (stackPop) {
                body = stack.pop();
                body.push(
                    //  part = stack[`n`] + part;
                    this._astCaseAssignPart(
                        this._astTypeBinaryExpression('+',
                            this._astTypeMemberExpression(
                                this._astTypeIdentifier('stack'),
                                this._astTypeLiteral(n),
                                true),
                            this._astTypeIdentifier('part'))));

                return;
            }

            body.push(
                //  stack[`n`] = part;
                this._astCaseAssignmentStatement('=',
                    this._astTypeMemberExpression(
                        this._astTypeIdentifier('stack'),
                        this._astTypeLiteral(n),
                        true),
                    this._astTypeIdentifier('part')),
                //  part = '';
                this._astCaseResetPart());

            stack.push(body);
            //  RULE_SEQ_`n`: {
            body.push(
                this._astTypeLabeledStatement('RULE_SEQ_' + n, body = []));

            return;
        }

        body.push(
            this._astCaseResetValue(),
            this._astTypeIfStatement(
                this._astCaseHasPropertyCall(
                    [
                        this._astTypeIdentifier('args'),
                        this._astTypeLiteral(part.name)]
                ),
                [

                    this._astCaseAssignmentStatement('=',
                        this._astTypeIdentifier('value'),
                        this._astTypeMemberExpression(
                            this._astTypeIdentifier('args'),
                            this._astTypeLiteral(part.name),
                            true)),
                    this._astTypeIfStatement(
                        this._astTypeUnaryExpression('!',
                            this._astCaseIsValueArray(),
                            true),
                        [
                            this._astCaseAssignmentStatement('=',
                                this._astTypeIdentifier('value'),
                                this._astTypeArrayExpression([
                                    this._astTypeIdentifier('value')]))]),
                    this._astCaseGetNthValue(part.used)]));

        body.push(
            this._astTypeIfStatement(
                this._astCaseValueCheckExpression('||', '==='),
                [
                    this._astCaseAssignmentStatement('=',
                        this._astTypeIdentifier('value'),
                        this._astTypeLiteral(part.value === void 0 ? null : part.value))]));

        if (n > 1) {
            body.push(
                this._astTypeIfStatement(
                    //  if (value === undefined || value === null || value === ') {
                    this._astCaseValueCheckExpression('||', '==='),
                    [
                        //  part = '';
                        this._astCaseResetPart(),
                        //  break RULE_SEQ_`n - 1`;
                        this._astTypeBreakStatement('RULE_SEQ_' + (n - 1))]),
                //  part += this._qStringify(value);
                this._astCasePartSelfPlus(
                    this._astCaseQueryEscapeValue4Pathname()));
        } else {
            body.push(
                this._astTypeIfStatement(
                    //  if (value !== undefined && value !== null && value !== '') {
                    this._astCaseValueCheckExpression('&&', '!=='),
                    [
                        //  part += this._qStringify(value);
                        this._astCasePartSelfPlus(
                            this._astCaseQueryEscapeValue4Pathname())]));
        }
    });

    body.push(this._astTypeReturnStatement(this._astTypeIdentifier('part')));

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
    var source = this.reduceRule(this._compileMatchRegExpPart);

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
Rule.prototype._compileMatchRegExpPart = function (part, stackPop, n) {
    var type = part.type;

    if (type === RuleSep.TYPE) {

        return regesc('/');
    }

    if (type === RuleAny.TYPE) {

        return this._compileMatchRegExpPartStatic(part);
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
Rule.prototype._compileMatchRegExpPartStatic = function (part) {
    var char;
    var i;
    var l;
    var result = '';
    var text = part.text;

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
Rule.prototype._countPathParams = function () {
    var count = {};

    _.forEach(this._pathParams, function (part) {
        var name = part.name;
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
Rule.prototype._findPathParams = function () {
    var order = [];

    this.inspectRule(function (part) {
        if (part.type === RuleArg.TYPE) {
            order[order.length] = part;
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

    function useArg(part) {
        var name = part.name;

        if (!part.kind) {
            part.kind = defaultType;
        }

        if (part.regex) {
            types[part.kind] = new Type(part.kind, part.regex);
        }

        if (!_.has(types, part.kind)) {
            throw new TypeError(util.format('Unknown %j parameter type %j', name, part.kind));
        }

        if (used[name] === void 0) {
            used[name] = 0;
        } else {
            used[name] += 1;
        }

        part.used = used[name];
    }

    Tools._inspectRule(rule, function (part) {
        if (part.type === RuleArg.TYPE) {
            useArg(part);
        }
    });

    defaultType = 'Str';

    _.forEach(rule.args, useArg);

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
    return this._astTypeLogicalExpression(logicalOp,
        this._astTypeLogicalExpression(logicalOp,
            this._astTypeBinaryExpression(binaryOp,
                this._astTypeIdentifier('value'),
                this._astCaseUndef()),
            this._astTypeBinaryExpression(binaryOp,
                this._astTypeIdentifier('value'),
                this._astTypeLiteral(null))),
        this._astTypeBinaryExpression(binaryOp,
            this._astTypeIdentifier('value'),
            this._astTypeLiteral('')));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseUndef = function () {
    return this._astTypeIdentifier('undefined');
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
    return this._astTypeCallExpression(
        this._astTypeMemberExpression(
            this._astTypeIdentifier('hasProperty'),
            this._astTypeIdentifier('call')),
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
    return this._astTypeCallExpression(
        this._astTypeMemberExpression(
            this._astTypeIdentifier('this'),
            this._astTypeIdentifier('_pStringify')),
        [
            this._astTypeIdentifier('value')]);
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseIsValueArray = function () {
    return this._astTypeCallExpression(
        this._astTypeMemberExpression(
            this._astTypeIdentifier('Array'),
            this._astTypeIdentifier('isArray')),
        [
            this._astTypeIdentifier('value')]);
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
    return this._astCaseAssignmentStatement('=',
        this._astTypeIdentifier('value'),
        this._astTypeMemberExpression(
            this._astTypeIdentifier('value'),
            this._astTypeLiteral(nth),
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
    return this._astCaseAssignmentStatement('+=',
        this._astTypeIdentifier('part'),
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
    return this._astCaseAssignmentStatement('=',
        this._astTypeIdentifier('part'),
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
    return this._astCaseAssignmentStatement('=',
        this._astTypeIdentifier('value'),
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
        this._astTypeLiteral(''));
};

/**
 * @private
 * @memberOf {Rule}
 * @method
 *
 * @param {String} operator
 * @param {Object} left
 * @param {Object} right
 *
 * @returns {Object}
 * */
Rule.prototype._astCaseAssignmentStatement = function (operator, left, right) {
    return this._astTypeExpressionStatement(
        this._astTypeAssignmentExpression(operator, left, right));
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
Rule.prototype._astTypeBreakStatement = function (name) {
    return {
        type: 'BreakStatement',
        label: this._astTypeIdentifier(name)
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
Rule.prototype._astTypeLogicalExpression = function (operator, left, right) {
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
Rule.prototype._astTypeCallExpression = function (callee, args) {
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
Rule.prototype._astTypeIfStatement = function (test, consequent) {
    return {
        type: 'IfStatement',
        test: test,
        consequent: this._astTypeBlockStatement(consequent)
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
Rule.prototype._astTypeLabeledStatement = function (name, body) {
    return {
        type: 'LabeledStatement',
        label: this._astTypeIdentifier(name),
        body: this._astTypeBlockStatement(body)
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
Rule.prototype._astTypeExpressionStatement = function (expression) {
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
Rule.prototype._astTypeAssignmentExpression = function (operator, left, right) {
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
Rule.prototype._astTypeFunctionDeclaration = function (name, body, params) {
    return {
        params: params,
        type: 'FunctionDeclaration',
        id: this._astTypeIdentifier(name),
        body: this._astTypeBlockStatement(body)
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
Rule.prototype._astTypeBlockStatement = function (body) {
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
Rule.prototype._astTypeBinaryExpression = function (operator, left, right) {
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
Rule.prototype._astTypeReturnStatement = function (argument) {
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
Rule.prototype._astTypeArrayExpression = function (elements) {
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
Rule.prototype._astTypeUnaryExpression = function (operator, argument, prefix) {
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
Rule.prototype._astTypeIdentifier = function (name) {
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
Rule.prototype._astTypeVarDeclaration = function (name, init) {
    return {
        type: 'VariableDeclaration',
        declarations: [
            {
                type: 'VariableDeclarator',
                id: this._astTypeIdentifier(name),
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
Rule.prototype._astTypeLiteral = function (value) {
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
Rule.prototype._astTypeMemberExpression = function (object, property, computed) {
    return {
        type: 'MemberExpression',
        object: object,
        property: property,
        computed: computed
    };
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
