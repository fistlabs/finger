'use strict';

exports.Number = '\\d+';

exports.String = '[\\s\\S]+';

exports.Alnum = '\\w+';

exports.Path = '[^?&]+?';

exports.Ident = '(?:[$a-zA-Z][$a-zA-Z\\d]*)(?:_[$a-zA-Z][$a-zA-Z\\d]*)*' +
    '(?:-(?:[$a-zA-Z][$a-zA-Z\\d]*)(?:_[$a-zA-Z][$a-zA-Z\\d]*)*)*';

exports.Segment = '[^/?&]+?';
