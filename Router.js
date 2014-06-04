'use strict';

var Class = /** @type Class */ require('parent/Class');
var Route = /** @type Route */ require('./route/Route');

var _ = /** @type _*/ require('lodash-node');

/**
 * @class Router
 * @extends Class
 * */
var Router = Class.extend(/** @lends Router.prototype */ {

    /**
     * @protected
     * @memberOf {Router}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Router.Parent.apply(this, arguments);

        /**
         * @private
         * @memberOf {Router}
         * @property
         * @type {Array<Route>}
         * */
        this._routes = [];

        /**
         * @private
         * @memberOf {Router}
         * @property
         * @type {Object}
         * */
        this._index = {};

        /**
         * @private
         * @memberOf {Router}
         * @property
         * @type {Object}
         * */
        this._verbs = Object.create(null);
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

        _.remove(this._routes, function (existingRoute) {

            if ( existingRoute.data.name === route.data.name ) {
                this._reduceVerbs(existingRoute.allow);

                return true;
            }

            return false;
        }, this);

        this._increaseVerbs(route.allow);
        this._routes.push(route);
        this._index[route.data.name] = route;

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

        if ( false === verb in this._verbs ) {

            return [];
        }

        if ( void 0 === route || null === route ) {

            return this._find(verb, pathname, 0);
        }

        route = _.findIndex(this._routes, {data: {name: route}});

        if ( -1 === route ) {

            return null;
        }

        return this._find(verb, pathname, route + 1);
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

        return this._index[name] || null;
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
    _find: function (verb, pathname, index) {

        var l;
        var match;
        var route;
        var allow = [];

        for ( l = this._routes.length; index < l; index += 1 ) {
            route = this._routes[index];
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
    _increaseVerb: function (verb) {

        if ( verb in this._verbs ) {
            this._verbs[verb] += 1;

            return;
        }

        this._verbs[verb] = 1;
    },

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {Array<String>} verbs
     * */
    _increaseVerbs: function (verbs) {
        _.forEach(verbs, this._increaseVerb, this);
    },

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {String} verb
     * */
    _reduceVerb: function (verb) {
        this._verbs[verb] -= 1;

        if ( 0 === this._verbs[verb] ) {
            delete this._verbs[verb];
        }
    },

    /**
     * @private
     * @memberOf {Router}
     * @method
     *
     * @param {Array<String>} verbs
     * */
    _reduceVerbs: function (verbs) {
        _.forEach(verbs, this._reduceVerb, this);
    }

});

module.exports = Router;
