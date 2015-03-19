'use strict';

var RuleSeq = /** @type RuleSeq */ require('./rule-seq');
var RuleAny = /** @type RuleAny */ require('./rule-any');
var RuleSep = /** @type RuleSep */ require('./rule-sep');
var RuleArg = /** @type RuleArg */ require('./rule-arg');
var RulePath = /** @type RulePath */ require('./rule-path');

exports.createRuleArg = function () {
    return new RuleArg();
};

exports.createRuleSeq = function () {
    return new RuleSeq();
};

exports.createRuleAny = function () {
    return new RuleAny();
};

exports.createRuleSep = function () {
    return new RuleSep();
};

exports.createRulePath = function () {
    return new RulePath();
};
