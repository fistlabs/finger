'use strict';

exports.typeLiteral = function (value) {
    return {
        type: 'Literal',
        value: value
    };
};
