'use strict';

/**
 * @class Match
 *
 * @param {Object} args
 * @param {Object} data
 * */
function Match(args, data) {

    /**
     * @public
     * @memberOf {Match}
     * @property
     * @type {Object}
     * */
    this.args = args;

    /**
     * @public
     * @memberOf {Match}
     * @property
     * @type {Object}
     * */
    this.data = data;
}

module.exports = Match;
