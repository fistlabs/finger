'use strict';

module.exports = function () {

    this.task('benchmark', ['test'], function (done) {
        /*eslint no-console: 0*/
        var Benchmark = require('benchmark').Benchmark;
        var Suite = Benchmark.Suite;

        var suite = new Suite();

        var Finger = require('../../router');
        var Susanin = require('susanin');

        var susanin = new Susanin();
        var finger = new Finger();

        susanin.addRoute('/');
        susanin.addRoute('/profile/');
        var susaninNews = susanin.addRoute('/news/(<post>/)');

        finger.addRoute('/');
        finger.addRoute('/profile/');
        var fingerNews = finger.addRoute('/news/(<post>/)');

        Benchmark.options.minSamples = 100;

        suite.add('Susanin.Route#match', function () {
            susaninNews.match('/foo/bar/');
            susaninNews.match('/news/42/');
            susaninNews.match('/news/');
        });

        suite.add('finger/route/Route#match', function () {
            fingerNews.match('GET', '/foo/bar/');
            fingerNews.match('GET', '/news/42/');
            fingerNews.match('GET', '/news/');
        });

        suite.add('Susanin.Route#build', function () {
            susaninNews.build({
                post: 'foo',
                a: 5,
                b: 6
            });
            susaninNews.build({
                a: 5,
                b: 6
            });
            susaninNews.build();
        });

        suite.add('finger/route/Route#build', function () {
            fingerNews.build({
                post: 'foo',
                a: 5,
                b: 6
            });
            fingerNews.build({
                a: 5,
                b: 6
            });
            fingerNews.build();
        });

        suite.add('Susanin#findFirst', function () {
            susanin.findFirst('/profile/');
            susanin.findFirst('/news/');
            susanin.findFirst('/news/42/');
            susanin.findFirst('/news/42/x/');
            susanin.findFirst('/upload/');
        });

        suite.add('finger/Router#find', function () {
            finger.find('GET', '/profile/');
            finger.find('GET', '/news/');
            finger.find('GET', '/news/42/');
            finger.find('GET', '/news/42/x/');
            finger.find('GET', '/upload/');
        });

        suite.on('cycle', function (event) {
            console.log(String(event.target));
        });

        suite.on('complete', function () {
            console.log();
            done();
        });

        suite.run({
            queued: true,
            async: true
        });
    });
};
