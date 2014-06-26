'use strict';

var Route = /** @type Route */ require('./route/Route');

var _ = /** @type _*/ require('lodash-node');
var inherit = require('inherit');

/**
 * @class Router
 * */
var Router = inherit(/** @lends Router.prototype */ {

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {Object} [params]
     *
     * @constructs
     * */
    __constructor: function (params) {

        /**
         * @public
         * @memberOf {Router}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);

        /**
         * @private
         * @memberOf {Router}
         * @property
         * @type {Array<Route>}
         * */
        this.__routes = [];

        /**
         * @private
         * @memberOf {Router}
         * @property
         * @type {Object}
         * */
        this.__index = {};

        /**
         * @private
         * @memberOf {Router}
         * @property
         * @type {Object}
         * */
        this.__verbs = {};
    },

    /**
     * @public
     * @memberOf {Router}
     * @method
     *
     * @param {String} pattern      шаблон урла запроса
     * @param {*} [data]            любые закрепленные данные
     * @param {*} [data.name]       Уникальный идентификатор маршрута
     *
     * @returns {Route}
     * */
    addRoute: function (pattern, data) {

        var route = this._createRoute(pattern, this.params, data);

        _.remove(this.__routes, function (existingRoute) {

            if ( existingRoute.data.name === route.data.name ) {
                this.__reduceVerbs(existingRoute.allow);

                return true;
            }

            return false;
        }, this);

        this.__increaseVerbs(route.allow);
        this.__routes.push(route);
        this.__index[route.data.name] = route;

        return route;
    },

    /**
     * @public
     * @memberOf {Router}
     * @method
     *
     * @param {String} verb
     * @param {String} pathname
     * @param {*} [route] Можно продолжить искать после этого роута
     *
     * @returns {Array}
     * */
    find: function (verb, pathname, route) {

        if ( !_.has(this.__verbs, verb) ) {

            return [];
        }

        if ( void 0 === route || null === route ) {

            return this.__find(verb, pathname, 0);
        }

        route = _.findIndex(this.__routes, {data: {name: route}});

        if ( -1 === route ) {

            return null;
        }

        return this.__find(verb, pathname, route + 1);
    },

    /**
     * @public
     * @memberOf {Router}
     * @method
     *
     * @param {String} name
     *
     * @returns {Route}
     * */
    getRoute: function (name) {

        return this.__index[name] || null;
    },

    /**
     * @protected
     * @memberOf {Router}
     * @method
     *
     * @param {String} pattern
     * @param {Object} params
     * @param {Object} data
     *
     * @returns {Route}
     * */
    _createRoute: function (pattern, params, data) {

        return new Route(pattern, params, data);
    },

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {String} verb
     * @param {String} pathname
     * @param {Number} index
     *
     * @returns {*}
     * */
    __find: function (verb, pathname, index) {

        var l;
        var match;
        var route;
        var allow = [];

        for ( l = this.__routes.length; index < l; index += 1 ) {
            route = this.__routes[index];
            match = route.match(verb, pathname);

            if ( null === match[1] ) {

                continue;
            }

            if ( match[0] ) {

                return {
                    route: route,
                    match: match[1]
                };
            }

            Array.prototype.push.apply(allow, route.allow);
        }

        if ( 0 === allow.length ) {

            return null;
        }

        return _.uniq(allow);
    },

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {String} verb
     * */
    __increaseVerb: function (verb) {

        if ( _.has(this.__verbs, verb) ) {
            this.__verbs[verb] += 1;

            return;
        }

        this.__verbs[verb] = 1;
    },

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {Array<String>} verbs
     * */
    __increaseVerbs: function (verbs) {
        _.forEach(verbs, this.__increaseVerb, this);
    },

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {String} verb
     * */
    __reduceVerb: function (verb) {
        this.__verbs[verb] -= 1;

        if ( 0 === this.__verbs[verb] ) {
            delete this.__verbs[verb];
        }
    },

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {Array<String>} verbs
     * */
    __reduceVerbs: function (verbs) {
        _.forEach(verbs, this.__reduceVerb, this);
    }

});

module.exports = Router;