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
    var rulesLength = rules.length;

    var alternate;
    var nextRule;
    var ruleMatchesCount;
    var prevMatchIndex = -1;
    var resultLength;
    var nextRuleKind;
    var nextValueIndex;

    overAllRules: while (rulesLength - ruleIndex > 1) {
        ruleIndex += 1;
        nextRule = rules[ruleIndex];
        ruleMatchesCount = 0;
        nextRuleKind = types[nextRule.kind];
        nextValueIndex = prevMatchIndex;

        while (valuesLength - nextValueIndex > 1) {
            nextValueIndex += 1;
            // find next matched value
            if (!nextRuleKind.check(values[nextValueIndex])) {
                // false?
                continue;
            }

            ruleMatchesCount += 1;

            resultLength = result.push(values[nextValueIndex]) - 1;

            if (nextRule.required) {
                if (ruleMatchesCount > 1) {
                    alters[resultLength] = new Alternate(ruleIndex, prevMatchIndex);
                }
            } else {
                alters[resultLength] = new Alternate(ruleIndex, prevMatchIndex);

                if (ruleMatchesCount === 1 && nextRule.value) {
                    alters[resultLength].match = new Match(nextRule.value);
                }
            }

            prevMatchIndex = nextValueIndex;

            if (nextRule.multiple) {
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
                prevMatchIndex = alternate.valueIndex;
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
