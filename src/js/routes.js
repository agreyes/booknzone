'use strict';

/**
 * Route configuration for the RDash module.
 */
angular.module('FFApp').config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('index', {
                url: '/',
                templateUrl: 'templates/schedule.html'
            })
            .state('cards', {
                url: '/cards',
                templateUrl: 'templates/cards.html'
            })
            .state('history', {
                url: '/history',
                templateUrl: 'templates/history.html'
            })
            .state('profile', {
                url: '/profile',
                templateUrl: 'templates/profile.html'
            })
            .state('classes', {
                url: '/classes',
                templateUrl: 'templates/schedule.html'
            });
    }
]);