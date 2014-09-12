'use strict';

var Route = /** @type Route */ require('./route/route');

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

            if (existingRoute.data.name === route.data.name) {
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
     * @param {String} path
     * @param {*} [route] Можно продолжить искать после этого роута
     *
     * @returns {Array}
     * */
    find: function (verb, path, route) {

        if (!_.has(this.__verbs, verb)) {

            return [];
        }

        if (_.isUndefined(route) || _.isNull(route)) {

            return this.__find(verb, path, 0);
        }

        route = _.findIndex(this.__routes, {data: {name: route}});

        if (route === -1) {

            return null;
        }

        return this.__find(verb, path, route + 1);
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

        return _.has(this.__index, name) ? this.__index[name] : void 0;
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
     * @param {String} path
     * @param {Number} index
     *
     * @returns {*}
     * */
    __find: function (verb, path, index) {
        var l;
        var match;
        var route;
        var allow = [];

        for (l = this.__routes.length; index < l; index += 1) {
            route = this.__routes[index];
            match = route.match(verb, path);

            if (!match.path) {

                continue;
            }

            if (match.verb) {
                match.route = route.data.name;

                return match;
            }

            Array.prototype.push.apply(allow, route.allow);
        }

        if (allow.length === 0) {

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

        if (_.has(this.__verbs, verb)) {
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

        if (this.__verbs[verb] === 0) {
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
