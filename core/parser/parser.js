'use strict';

var Parser = require('jison').Parser;
var RuleSeq = require('./rule-seq');
var RuleAny = require('./rule-any');
var RuleSep = require('./rule-sep');
var RuleArg = require('./rule-arg');

var fs = require('fs');
var path = require('path');
var grammar = fs.readFileSync(path.join(__dirname, 'parser.jison'), 'utf-8');

var parser = new Parser(grammar, {
    type: 'slr'
});

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
    }
};

module.exports = parser;
