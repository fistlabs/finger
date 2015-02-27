'use strict';

var RuleSeq = /** @type RuleSeq */ require('./rule-seq');
var RuleAny = /** @type RuleAny */ require('./rule-any');
var RuleSep = /** @type RuleSep */ require('./rule-sep');
var RuleArg = /** @type RuleArg */ require('./rule-arg');
var RulePath = /** @type RulePath */ require('./rule-path');

var parser = require('./build/rule_parser').parser;
var lexer = require('./build/rule_lexer').lexer;

parser.lexer = lexer;

parser.yy = {
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

module.exports = parser;
