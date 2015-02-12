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
