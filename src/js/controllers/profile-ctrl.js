/**
 * Profile Controller
 */
angular
    .module('FFApp')
    .controller('ProfileCtrl', ['$scope', "UserService", ProfileCtrl]);

function ProfileCtrl($scope, UserService) {
	$scope.loading = false;

    $scope.user_data = UserService.currentUser;
}