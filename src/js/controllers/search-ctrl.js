/**
 * Search Controller
 */

angular
.module('FFApp')
    .controller('SearchCtrl', ['$scope', '$timeout', '$q', '$cookieStore', 'ClassesService', SearchCtrl]);

function SearchCtrl($scope, $timeout, $q, $cookieStore, ClassesService, calendarConfig) {

    // Find closes parent with a selectedFilters property
    var temp = $scope.$parent;
    while(temp){
        if(temp.selectedFilters){
            $scope.selectedFilter = temp.selectedFilters;
            break;
        }
        temp = temp.$parent;
    }
    if(!$scope.selectedFilters) $scope.selectedFilters = [];

    $scope.selectedFilter = { val: null };

    $scope.onSearchClick = function() {
        if ($scope.selectedFilter.val) {
            $scope.onFilterSelect($scope.selectedFilter.val, {
                name: $scope.selectedFilter.val,
                category: "Search",
                icon: 'search',
                text: ($scope.selectedFilter.val || "").trim(),
                test: function(e){
                    var regex = new RegExp(this.text, 'i');
                    if(regex.test(e.class_name)) return true;
                    if(regex.test(e.start_time)) return true;
                    if(regex.test(e.end_time)) return true;
                    if(regex.test(moment(e.date).format("dddd, MMMM DD, YYYY"))) return true;
                    if(regex.test(e.spots)) return true;
                    var date = moment(this.text);
                    if(date.year() == 2001) date.year(moment().year()); // Fix default moment year from 2001 to current year
                    if(date.isValid() && date.format("YYYY-MM-DD") == e.date) return true;
                    return false;
                },
                description: "Search for '" + $scope.selectedFilter.val + "'"
            });
            $scope.selectedFilter.val = null;
        }
    }

    $scope.onFilterKeyUp = function(event){
        var keyCode = event.which || event.keyCode;
        if (keyCode === 13){ //Enter
            if($scope.selectedFilter.noResults) $scope.onSearchClick();
        }else if (keyCode === 27){ // Esc
            $scope.selectedFilter.val = null;
        }
    }

    $scope.availableFilters = ClassesService.getTags();

    $scope.onFilterSelect = function(item, model){
        for(var i = 0; i < $scope.selectedFilters.length; i++){
            if(model.category && $scope.selectedFilters[i].category == model.category){
                $scope.selectedFilters[i] = model;
            }
        }
        if($scope.selectedFilters.indexOf(model) == -1){
            $scope.selectedFilters.push(model);
        }

        $scope.selectedFilter.val = null;
    }

    $scope.removeFilter = function(i){
        if(typeof(i) === "undefined"){
            $scope.selectedFilters.splice(0, $scope.selectedFilters.length);
        }else if(typeof(i) === "number"){
            $scope.selectedFilters.splice(i,1);
        }
    }
}