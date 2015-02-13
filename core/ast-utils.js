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
