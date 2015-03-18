'use strict';

function Path(ruleIndex, valueIndex) {
    this.ruleIndex = ruleIndex;
    this.valueIndex = valueIndex;
    this.value = null;
}

function matchValues(rules, kinds, value) {
    /*eslint max-depth: 0, no-constant-condition: 0, complexity: 0*/
    var kind = void 0;
    var path = null;
    var rule = void 0;
    var match = [];
    var paths = [];
    var matchCount = 0;
    var matchIndex = -1;
    var rulesIndex = 0;
    var valueIndex = matchIndex;
    var valueLength = value.length;
    var rulesLength = rules.length;
    var matchLength = 0;

    do {
        rule = rules[rulesIndex];
        kind = kinds[rule.kind];
        matchCount = 0;
        valueIndex = matchIndex;

        while (valueLength - valueIndex > 1) {
            valueIndex += 1;
            // find next matched value
            if (!kind.check(value[valueIndex])) {
                continue;
            }

            matchCount += 1;
            matchLength = match.push(value[valueIndex]) - 1;

            if (rule.required) {
                if (matchCount > 1) {
                    paths[matchLength] = new Path(rulesIndex, matchIndex);
                }
            } else {
                path = paths[matchLength] = new Path(rulesIndex, matchIndex);

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
                match.push(rule.value);
            }
            continue;
        }

        path = null;

        // back to alternate path
        while (match.pop()) {
            matchLength = match.length;
            // find alternate
            path = paths[matchLength];
            // remove alternate (used)
            paths[matchLength] = null;

            if (!path) {
                continue;
            }

            // alternate found
            matchIndex = path.valueIndex;
            rulesIndex = path.ruleIndex;

            if (path.value) {
                match.push(path.value);
            }

            break;
        }

        // how to avoid double `if (alter)` with no labels?
        if (!path) {
            // no alternates found
            return null;
        }

    } while ((rulesIndex += 1) < rulesLength);

    return match;
}

module.exports = matchValues;
