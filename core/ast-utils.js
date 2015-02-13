'use strict';

exports.literal = function (value) {
    return {
        type: 'Literal',
        value: value
    };
};

exports.identifier = function (name) {
    return {
        type: 'Identifier',
        name: name
    };
};

exports.binaryExpression = function (operator, left, right) {
    return {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right
    };
};

exports.logicalExpression = function (operator, left, right) {
    return {
        type: 'LogicalExpression',
        operator: operator,
        left: left,
        right: right
    };
};

exports.callExpression = function (callee, args) {
    return {
        type: 'CallExpression',
        callee: callee,
        arguments: args
    };
};

exports.memberExpression = function (object, property, computed) {
    return {
        type: 'MemberExpression',
        object: object,
        property: property,
        computed: computed
    };
};

exports.assignmentExpression = function (operator, left, right) {
    return {
        type: 'AssignmentExpression',
        operator: operator,
        left: left,
        right: right
    };
};

exports.expressionStatement = function (expression) {
    return {
        type: 'ExpressionStatement',
        expression: expression
    };
};

exports.assignmentStatement = function (operator, left, right) {
    return exports.expressionStatement(
        exports.assignmentExpression(operator, left, right));
};

exports.varDeclaration = function (name, init) {
    return {
        type: 'VariableDeclaration',
        declarations: [
            {
                type: 'VariableDeclarator',
                id: exports.identifier(name),
                init: init
            }
        ],
        kind: 'var'
    };
};

exports.unaryExpression = function (operator, argument, prefix) {
    return {
        type: 'UnaryExpression',
        operator: operator,
        argument: argument,
        prefix: Boolean(prefix)
    };
};

exports.arrayExpression = function (elements) {
    return {
        type: 'ArrayExpression',
        elements: elements
    };
};

exports.returnStatement = function (argument) {
    return {
        type: 'ReturnStatement',
        argument: argument
    };
};

exports.blockStatement = function (body) {
    return {
        type: 'BlockStatement',
        body: body
    };
};

exports.functionDeclaration = function (name, body, params) {
    return {
        params: params,
        type: 'FunctionDeclaration',
        id: exports.identifier(name),
        body: exports.blockStatement(body)
    };
};

exports.labeledStatement = function (name, body) {
    return {
        type: 'LabeledStatement',
        label: exports.identifier(name),
        body: exports.blockStatement(body)
    };
};

exports.ifStatement = function (test, consequent) {
    return {
        type: 'IfStatement',
        test: test,
        consequent: exports.blockStatement(consequent)
    };
};

exports.breakStatement = function (name) {
    return {
        type: 'BreakStatement',
        label: exports.identifier(name)
    };
};
