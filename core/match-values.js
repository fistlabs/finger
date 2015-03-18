'use strict';

function Path(rulesIndex, valueIndex, matchLength) {
    this.rulesIndex = rulesIndex;
    this.valueIndex = valueIndex;
    this.matchLength = matchLength;
    this.value = '';
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

    do {
        // match current rule
        rule = rules[rulesIndex];
        kind = kinds[rule.kind];
        matchCount = 0;
        valueIndex = matchIndex;

        while (valueLength - valueIndex > 1) {
            // match all values to rule
            valueIndex += 1;

            if (!kind.check(value[valueIndex])) {
                // the value is not suitable
                continue;
            }

            // Score! We have a match!
            matchCount += 1;

            if (rule.required) {
                if (matchCount > 1) {
                    // every optional match in required rule is an alternate path
                    // save link to previous match
                    paths.push(new Path(rulesIndex, matchIndex, match.length));
                }
            } else {
                // every match on optional rule is an alternate path
                path = new Path(rulesIndex, matchIndex, match.length);

                if (matchCount === 1) {
                    // save default value for the case when alternate is to skip the rule
                    path.value = rule.value;
                }

                paths.push(path);
            }
            // Save result
            match.push(value[valueIndex]);
            // save success match index
            matchIndex = valueIndex;

            if (!rule.multiple) {
                // rule supports single match, stop matching rule
                break;
            }
            // the rule supports for multiple matches
        }

        if (matchCount > 0) {
            // matches found, jump to next rule
            continue;
        }

        if (rule.required) {
            // rule is required, need to find alternate path
            if (!paths.length) {
                // no alternates
                return null;
            }

            path = paths.pop();

            // alternate found, unpack state
            matchIndex = path.valueIndex;
            rulesIndex = path.rulesIndex;
            rule = rules[rulesIndex];
            // crop match result
            match.length = path.matchLength;
        }

        if (rule.value) {
            // have value with alternate
            match.push(rule.value);
        }

    } while ((rulesIndex += 1) < rulesLength);

    return match;
}

module.exports = matchValues;
