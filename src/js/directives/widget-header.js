/**
 * Widget Header Directive
 */

angular
    .module('app')
    .directive('rdWidgetHeader', rdWidgetTitle);

function rdWidgetTitle() {
    var directive = {
        requires: '^rdWidget',
        scope: {
            title: '@',
            icon: '@'
        },
        transclude: true,
        template: '<div class="widget-header" ng-transclude></div>',
        restrict: 'E'
    };
    return directive;
};