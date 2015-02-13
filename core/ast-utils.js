'use strict';

exports.typeLiteral = function (value) {
    return {
        type: 'Literal',
        value: value
    };
};

exports.typeIdentifier = function (name) {
    return {
        type: 'Identifier',
        name: name
    };
};

exports.typeBinaryExpression = function (operator, left, right) {
    return {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right
    };
};

exports.typeLogicalExpression = function (operator, left, right) {
    return {
        type: 'LogicalExpression',
        operator: operator,
        left: left,
        right: right
    };
};

exports.typeCallExpression = function (callee, args) {
    return {
        type: 'CallExpression',
        callee: callee,
        arguments: args
    };
};

exports.typeMemberExpression = function (object, property, computed) {
    return {
        type: 'MemberExpression',
        object: object,
        property: property,
        computed: computed
    };
};

exports.typeAssignmentExpression = function (operator, left, right) {
    return {
        type: 'AssignmentExpression',
        operator: operator,
        left: left,
        right: right
    };
};

exports.typeExpressionStatement = function (expression) {
    return {
        type: 'ExpressionStatement',
        expression: expression
    };
};

exports.typeAssignmentStatement = function (operator, left, right) {
    return exports.typeExpressionStatement(
        exports.typeAssignmentExpression(operator, left, right));
};

exports.typeVarDeclaration = function (name, init) {
    return {
        type: 'VariableDeclaration',
        declarations: [
            {
                type: 'VariableDeclarator',
                id: exports.typeIdentifier(name),
                init: init
            }
        ],
        kind: 'var'
    };
};

exports.typeUnaryExpression = function (operator, argument, prefix) {
    return {
        type: 'UnaryExpression',
        operator: operator,
        argument: argument,
        prefix: Boolean(prefix)
    };
};
