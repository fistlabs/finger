'use strict';

exports.Number = '\\d+';

exports.String = '[\\s\\S]+';

exports.Alnum = '\\w+';

exports.Path = '[^?&]+?';

exports.Ident = '[a-zA-Z]\\w*(?:-[a-zA-Z]\\w*)*';

exports.Segment = '[^/?&]+?';
