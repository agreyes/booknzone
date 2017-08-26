angular.module('app')
    .service('UserService', ['$http', '$window', UserService]);

    function UserService($http, $window){
        var that = this;
        this.currentUser = {
            first_name: "Guest",
            last_name: "",
            fullName: function(){ 
                return this.first_name + (this.last_name ? " " + this.last_name : "");
            },
            email: "",
            student_id: ""
        };

        this.getProfile = function(){
            return $http.get("/user/profile").
                then(function(response) {
                    that.currentUser = angular.extend(that.currentUser, response.data);
                    return response.data;
                },
                function(response){ return response; });
        };

        this.getHistory = function(){
            return $http.get("/user/history/1000").
                then(function(response) {
                    return response.data;
                },
                function(response){ return response; });
        };

        this.requestCancellation = function(id){
            return $http.put("/user/history/cancel/" + id).
                then(function(response) {
                    return response.data;
                },
                function(response){ return response; });
        };

        this.logout = function(){
            return $http.post("/logout").
                then(function(response) {
                    $window.location.reload();
                    return response;
                }, function(response) {
                    return response;
                });
        };
    }
