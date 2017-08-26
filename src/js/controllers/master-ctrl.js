/**
 * Master Controller
 */

angular.module('app')
    .controller('MasterCtrl', ['$scope', '$cookieStore', 'UserService', 'AlertsService', MasterCtrl]);

function MasterCtrl($scope, $cookieStore, UserService, AlertsService) {
    /**
     * Sidebar Toggle & Cookie Control
     */
    var mobileView = 992;

    $scope.getWidth = function() {
        return window.innerWidth;
    };

    $scope.loggedIn = function(){
        return !!$scope.user["student_id"];
    }

    $scope.logout = function(){
        UserService.logout();
    }

    $scope.username = function(){
        return $scope.user.nickname || $scope.user.first_name || "Guest";
    }

    $scope.user = {};
    UserService.getProfile().then(function(data){
        $scope.user = data || {};
        if($scope.loggedIn()){
            AlertsService.success("Login succesfull! Welcome back, " + $scope.username() + ".");
        }else{
            AlertsService.info("Welcome! Login or register to access more features.");
        }
    });

    $scope.$watch($scope.getWidth, function(newValue, oldValue) {
        if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = ! $cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = true;
            }
        } else {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function() {
        $scope.toggle = !$scope.toggle;
        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function() {
        $scope.$apply();
    };
}