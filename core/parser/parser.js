'use strict';

var StdParser = /** @type StdParser */ require('./build/rule_parser').Parser;

var lexer = require('./build/rule_lexer').lexer;
var yy = require('./yy');

/**
 * @class Parser
 * @extends StdParser
 * */
function Parser() {
    StdParser.call(this);
    this.yy = yy;
    this.lexer = lexer;
}

Parser.prototype = Object.create(StdParser.prototype);

Parser.prototype.constructor = Parser;

module.exports = Parser;
