'use strict';

function Alternate(ruleIndex, valueIndex) {
    this.ruleIndex = ruleIndex;
    this.valueIndex = valueIndex;
    this.value = null;
}

function matchValues(rules, types, values) {
    /*eslint
        max-depth: 0,
        no-constant-condition: 0,
        complexity: 0
        */
    var result = [];
    var alters = [];
    var valuesLength = values.length;
    var rulesLength = rules.length;
    var matchLength = 0;
    var ruleIndex = 0;
    var matchCount = 0;
    var matchIndex = -1;
    var valueIndex = matchIndex;

    var path = null;
    var rule = void 0;
    var type = void 0;

    do {
        rule = rules[ruleIndex];
        type = types[rule.kind];
        matchCount = 0;
        valueIndex = matchIndex;

        while (valuesLength - valueIndex > 1) {
            valueIndex += 1;
            // find next matched value
            if (!type.check(values[valueIndex])) {
                continue;
            }

            matchCount += 1;
            matchLength = result.push(values[valueIndex]) - 1;

            if (rule.required) {
                if (matchCount > 1) {
                    alters[matchLength] = new Alternate(ruleIndex, matchIndex);
                }
            } else {
                path = alters[matchLength] = new Alternate(ruleIndex, matchIndex);

                if (matchCount === 1) {
                    path.value = rule.value;
                }
            }

            matchIndex = valueIndex;

            if (rule.multiple) {
                continue;
            }

            break;
        }

        if (matchCount > 0) {
            // ok!
            continue;
        }

        if (!rule.required) {
            if (rule.value) {
                // push default value if rule is not required
                result.push(rule.value);
            }
            continue;
        }

        path = null;

        // back to alternate path
        while (result.pop()) {
            matchLength = result.length;
            // find alternate
            path = alters[matchLength];
            // remove alternate (used)
            alters[matchLength] = null;

            if (path) {
                // alternate found
                matchIndex = path.valueIndex;
                ruleIndex = path.ruleIndex;

                if (path.value) {
                    result.push(path.value);
                }

                break;
            }
        }

        // how to avoid double `if (alter)` with no labels?
        if (!path) {
            // no alternates found
            return null;
        }

    } while ((ruleIndex += 1) < rulesLength);

    return result;
}

module.exports = matchValues;
