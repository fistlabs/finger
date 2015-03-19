'use strict';

var RuleSeq = /** @type RuleSeq */ require('./rule-seq');
var RuleAny = /** @type RuleAny */ require('./rule-any');
var RuleSep = /** @type RuleSep */ require('./rule-sep');
var RuleArg = /** @type RuleArg */ require('./rule-arg');
var RulePath = /** @type RulePath */ require('./rule-path');
var StdParser = /** @type StdParser */ require('./build/rule_parser').Parser;
var lexer = require('./build/rule_lexer').lexer;

var yy = {
    createRuleArg: function () {
        return new RuleArg();
    },
    createRuleSeq: function () {
        return new RuleSeq();
    },
    createRuleAny: function () {
        return new RuleAny();
    },
    createRuleSep: function () {
        return new RuleSep();
    },
    createRulePath: function () {
        return new RulePath();
    }
};

/**
 * @class Parser
 * @extends StdParser
 * */
function Parser() {
    StdParser.call(this);
    this.lexer = lexer;
    this.yy = yy;
}

Parser.prototype = Object.create(StdParser.prototype);

Parser.prototype.constructor = Parser;

module.exports = Parser;
