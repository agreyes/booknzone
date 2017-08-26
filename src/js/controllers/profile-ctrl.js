/**
 * Profile Controller
 */
angular
    .module('app')
    .controller('ProfileCtrl', ['$scope', "UserService", ProfileCtrl]);

function ProfileCtrl($scope, UserService) {
	$scope.loading = false;

    $scope.user_data = UserService.currentUser;
}