'use strict';

function Path(rulesIndex, valueIndex, matchLength) {
    this.rulesIndex = rulesIndex;
    this.valueIndex = valueIndex;
    this.matchLength = matchLength;
}

function matchValues(rules, kinds, value) {
    /*eslint complexity: 0*/ // 11 now =(
    var kind = void 0;
    var path = null;
    var rule = void 0;
    var match = [];
    var paths = [];
    var matchCount = 0;
    var matchIndex = -1;
    var rulesIndex = 0;
    var valueIndex = 0;
    var valueLength = value.length;
    var rulesLength = rules.length;

    while (rulesIndex < rulesLength) {
        rule = rules[rulesIndex];
        kind = kinds[rule.kind];

        if (valueIndex < valueLength) {

            if (!kind.check(value[valueIndex])) {
                valueIndex += 1;
                continue;
            }

            matchCount += 1;

            if (!rule.required || matchCount > 1) {
                paths[paths.length] = new Path(rulesIndex, matchIndex, match.length);
            }

            match[match.length] = value[valueIndex];
            matchIndex = valueIndex;
            valueIndex += 1;

            if (rule.multiple) {
                continue;
            }
        }

        if (matchCount) {
            matchCount = 0;
            valueIndex = matchIndex + 1;
            rulesIndex += 1;
            continue;
        }

        if (rule.required) {

            if (!paths.length) {
                return null;
            }

            path = paths.pop();
            matchIndex = path.valueIndex;
            rulesIndex = path.rulesIndex;
            match.length = path.matchLength;
            rule = rules[rulesIndex];
        }

        if (rule.value) {
            match[match.length] = rule.value;
        }

        valueIndex = matchIndex + 1;
        rulesIndex += 1;
    }

    return match;
}

module.exports = matchValues;
