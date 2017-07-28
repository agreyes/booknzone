/**
 * Widget Directive
 */

angular
    .module('FFApp')
    .directive('rdWidget', rdWidget);

function rdWidget() {
    var directive = {
        transclude: true,
        template: '<div class="widget" style="position:relative;" ng-transclude></div>',
        restrict: 'EA'
    };
    return directive;

    function link(scope, element, attrs) {
        /* */
    }
};