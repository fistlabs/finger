'use strict';

function Alternate(ruleIndex, valueIndex) {
    this.ruleIndex = ruleIndex;
    this.valueIndex = valueIndex;
    this.match = null;
}

function Match(value) {
    this.value = value;
}

function matchValues(rules, types, values) {
    /*eslint
        no-labels: 0,
        max-depth: 0,
        block-scoped-var: 0,
        no-constant-condition: 0,
        complexity: 0
        */
    var result = [];
    var alters = [];
    var valuesLength = values.length;
    var ruleIndex = -1;
    var valueIndex = -1;
    var rulesLength = rules.length;

    var alternate;
    var nextRuleIndex;
    var nextRule;
    var ruleMatchesCount;
    var prevMatchIndex;
    var resultLength;
    var matchIndex;
    var nextRuleKind;
    var nextValueIndex;

    overAllRules: while (rulesLength - ruleIndex > 1) {
        nextRuleIndex = ruleIndex += 1;
        nextRule = rules[nextRuleIndex];
        ruleMatchesCount = 0;
        prevMatchIndex = valueIndex;
        nextRuleKind = types[nextRule.kind];
        nextValueIndex = valueIndex + 1;

        while (nextValueIndex < valuesLength) {
            // find next matched value
            if (!nextRuleKind.check(values[nextValueIndex])) {
                nextValueIndex += 1;
                continue;
            }

            matchIndex = nextValueIndex;
            ruleMatchesCount += 1;

            resultLength = result.push(values[matchIndex]) - 1;

            if (nextRule.required) {
                if (ruleMatchesCount > 1) {
                    alters[resultLength] = new Alternate(nextRuleIndex, prevMatchIndex);
                }
            } else {
                alters[resultLength] = new Alternate(nextRuleIndex, prevMatchIndex);

                if (ruleMatchesCount === 1 && nextRule.value) {
                    alters[resultLength].match = new Match(nextRule.value);
                }
            }

            valueIndex = prevMatchIndex = matchIndex;

            if (nextRule.multiple) {
                nextValueIndex = valueIndex + 1;
                continue;
            }

            break;
        }

        if (ruleMatchesCount > 0) {
            continue;
        }

        if (!nextRule.required) {
            if (nextRule.value) {
                result.push(nextRule.value);
            }
            continue;
        }

        ruleIndex -= 1;

        // back to alternate path
        while (result.length) {
            result.pop();
            // find alternate
            alternate = alters[result.length];
            // remove alternate (used)
            alters[result.length] = null;

            if (alternate) {
                // alternate found
                valueIndex = alternate.valueIndex;
                ruleIndex = alternate.ruleIndex;

                if (alternate.match) {
                    result.push(alternate.match.value);
                }

                continue overAllRules;
            }
        }

        return null;
    }

    return result;
}

module.exports = matchValues;
