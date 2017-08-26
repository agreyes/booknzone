'use strict';

/**
 * Route configuration for the module.
 */
angular.module('app').config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('index', {
                url: '/',
                templateUrl: 'templates/schedule.html'
            })
            .state('history', {
                url: '/history',
                templateUrl: 'templates/history.html'
            })
            .state('profile', {
                url: '/profile',
                templateUrl: 'templates/profile.html'
            })
            .state('schedule', {
                url: '/schedule',
                templateUrl: 'templates/schedule.html'
            });
    }
]);