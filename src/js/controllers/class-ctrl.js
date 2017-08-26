/**
 * Class Controller
 */

angular
    .module('app')
    .controller('ClassCtrl', ['$scope', "ClassesService", "UserService", "$uibModalInstance", "class_data", ClassCtrl]);

function ClassCtrl($scope, ClassesService, UserService, $uibModalInstance, class_data) {
	$scope.paymentMethods = [
		{name: "Class Card", value: 4},
		{name: "Gift Certificate", value: 5}
	];
	$scope.currentMode = "details";
	$scope.data = class_data;
    
	$scope.reg = {
		options: {
			paymentMethod: '4', // Class card
			spots: '1',
			cancellationPolicy: false
		}
	}

    if($scope.data && $scope.data.reg){
        $scope.reg.options.spots = $scope.data.reg.persons;
        $scope.reg.options.paymentMethod = $scope.data.reg.paymentMethod;
    }

	$scope.loading = false;
	$scope.profile = UserService.currentUser;
    $scope.todaysDate = moment().format("YYYY-MM-DD");

	$scope.calcTax = function(){
		if($scope.reg.options.paymentMethod != 4){
			return 0.0575 // (0% city / 5.75% state sales taxes)
		}
		return 0;
	}

    $scope.violatesCancellationPolicy = function(){
        return moment().isAfter(moment($scope.data.date).subtract(2, "days"));
    }

    $scope.onCancellationConfirmed = function(){
        if($scope.violatesCancellationPolicy() && !$scope.reg.options.cancellationPolicy) return false;
        $scope.loading = true; 
        UserService.requestCancellation($scope.data.reg.id).then(function(class_info){
                if(!class_info || !class_info.reg){
                    $scope.error = "Oops, something went wrong.";
                }else if(class_info.reg.cancelled){
                    $scope.data.reg.cancelled = class_info.reg.cancelled;
                    $scope.mode('details');
                }
                if($scope.error) $scope.mode('error');
                $scope.loading = false; 
            });
    }

    $scope.confirmRegistration = function(){
    	if(!$scope.reg.options.cancellationPolicy || $scope.loading) return false;
    	$scope.loading = true;
    	ClassesService.registerForClass($scope.data.date 
    		, $scope.data.class_id
    		, $scope.reg.options.spots
    		, $scope.reg.options.paymentMethod).then(function(class_info){
    			if(!class_info || !class_info.reg){
    				$scope.error = "Oops, something went wrong. Please reload and try again.";
    			}else{
    				if(class_info.spots < class_info.reg.persons){
    					$scope.error = "Oops, there are not enough spots available in the class.";
    				}else if(!class_info.reg.student_id){
    					$scope.error = "Please log in or register before attempting to sign up for a class.";
    				}else if(class_info.reg.error){
    					$scope.error = "Oops, something went wrong while attempting to register for the class.  Please reload and try again.";
    				}else if(class_info.reg.success){
    					$scope.mode('complete');
    				}else{
    					$scope.error = "Oops, something went wrong.";
    				}
    			}
    			if($scope.error) $scope.mode('error');
    			$scope.loading = false; 
    		});
    }

    $scope.getClassTags = function(){
    	return ClassesService.getTags($scope.data);
    }
    
    $scope.modalTitle = function(){
        switch($scope.mode()){
            case 'cancel':
                return 'Cancel Registration';
            case 'complete':
                return 'Registration Complete';
            case 'confirm':
                return 'Confirm Registration';
            case 'register':
                return 'Register for Class';
            case 'details':
            case 'error':
            case 'default':
                return $scope.data.reg ? 'Registration Details' : 'Class Details';
        }
    }

    $scope.selectedSpots = function(){
    	return $scope.reg.options.spots;
    }

    $scope.mode = function(mode){
    	switch(mode){
    		case 'register':
    			if(!$scope.data.spots) return;
    		case 'confirm':
    			$scope.reg.options.cancellationPolicy = false;
    		case 'details':
    		case 'complete':
    		case 'error':
            case 'cancel':
    			$scope.currentMode = mode;
    			break;
    		default:
    			return $scope.currentMode;
    	}
    }
}