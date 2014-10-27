'use strict';

/**
 * @class Match
 *
 * @param {Matcher} matcher
 * @param {String} url
 * */
function Match(matcher, url) {

    /**
     * @public
     * @memberOf {Match}
     * @property
     * @type {Matcher}
     * */
    this.matcher = matcher;

    /**
     * @public
     * @memberOf {Match}
     * @property
     * @type {Number}
     * */
    this.i = 0;

    /**
     * @public
     * @memberOf {Match}
     * @property
     * @type {String}
     * */
    this.url = url;
}

/**
 * @public
 * @memberOf {Match}
 * @method
 *
 * @returns {Object|null}
 * */
Match.prototype.next = function () {
    var rule;
    var matcher = this.matcher;
    var length = matcher.rules.length;

    if (this.i >= length) {

        return {
            done: true,
            value: null
        };
    }

    rule = matcher.rules[this.i];
    this.i += 1;

    return {
        done: this.i === length,
        value: {
            args: rule.match(this.url),
            name: rule.data.name
        }
    };
};

module.exports = Match;
