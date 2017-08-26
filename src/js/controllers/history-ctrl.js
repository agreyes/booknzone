/**
 * History Controller
 */

angular
.module('app')
    .controller('HistoryCtrl', ['$scope', '$timeout', '$q', 'ClassesService', 'UserService', 'calendarConfig', HistoryCtrl]);

function HistoryCtrl($scope, $timeout, $q, ClassesService, UserService, calendarConfig) {
    
    $scope.scheduledPage = 1;
    $scope.pastPage = 1;

    $scope.pagination = {
        scheduledPage: 1,
        pastPage: 1,
        pageSize: 10
    }

    $scope.todaysDate = moment().format("YYYY-MM-DD");

    $scope.history = [];

    $scope.selectedFilters = [];

    $scope.tagFilter = function(value){
        return ClassesService.tagFilter(value, $scope.selectedFilters)
    }

    $scope.onReservationClick = function(class_info){
        ClassesService.openClassModal(class_info).result.then(function(reason){
            if(reason != 'close'){
                $scope.refresh();
            }
        });
    }

    $scope.refresh = function(){
        UserService.getHistory().then(function(data){
            if(Array.isArray(data)){
                $scope.history.splice(0, $scope.history.length);
                $scope.history.push.apply($scope.history, data);
            }else{
                AlertsService.error();
                console.log(data);
            }
        });
    }

    $scope.afterToday = function(item){
        return item.date >= moment().format("YYYY-MM-DD");
    }

    $scope.beforeToday = function(item){
        return item.date < moment().format("YYYY-MM-DD");
    }

    
    $scope.refresh();
}