/**
 * Alerts Controller
 */

angular
    .module('app')
    .controller('AlertsCtrl', ['$scope', "AlertsService", AlertsCtrl]);

function AlertsCtrl($scope, AlertsService) {
    $scope.alerts = AlertsService.alerts;
    
    $scope.closeAlert = function(index) {
        AlertsService.closeAlert(index);
    };
}