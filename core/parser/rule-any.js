'use strict';

/**
 * @class RuleAny
 * */
function RuleAny() {

    /**
     * @public
     * @memberOf {RuleAny}
     * @property
     * @type {String}
     * */
    this.type = RuleAny.TYPE;
    /**
     * @public
     * @memberOf {RuleAny}
     * @property
     * @type {String}
     * */
    this.text = '';
}

/**
 * @public
 * @static
 * @memberOf {RuleAny}
 * @property
 * @type {String}
 * */
RuleAny.TYPE = 'RULE_ANY';

/**
 * @public
 * @memberOf {RuleAny}
 * @method
 *
 * @param {String} text
 *
 * @returns {RuleAny}
 * */
RuleAny.prototype.addText = function (text) {
    this.text += RuleAny.unBackSlash(text);

    return this;
};

/**
 * @public
 * @static
 * @memberOf {RuleAny}
 * @method
 *
 * @param {String} text
 *
 * @returns {String}
 * */
RuleAny.unBackSlash = function (text) {
    return text.replace(/\\([\s\S])/g, '$1');
};

module.exports = RuleAny;
