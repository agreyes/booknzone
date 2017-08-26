/**
 * Loading Directive
 * @see http://tobiasahlin.com/spinkit/
 */

angular
    .module('app')
    .directive('rdLoading', rdLoading);

function rdLoading() {
    var directive = {
        restrict: 'AE',
        template: '<div class="loading" style="position:absolute; width:100%; height:100%; background-color: rgba(0,0,0,0.3); top: 0; bottom:0; left:0; right:0; z-index: 999; border-radius: 2px; margin:auto;"><div style="height:100%; width:100%; text-align:center;"><i class="fa fa-spinner fa-spin fa-4x" style="position:relative; top:50%;" aria-hidden="true"></i></div>'
    };
    return directive;
};