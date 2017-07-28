angular.module('FFApp')
    .service('AlertsService', [AlertsService]);

    function AlertsService(){

        this.alerts = [
        /*{
            type: 'success',
            msg: 'Thanks for visiting! Feel free to create pull requests to improve the dashboard!'
        },*/
        ];

        this.add = function(message, type) {
            if(!message) return;
            for(var i = 0;  i < this.alerts.length; i++){
                var a = alerts[i];
                if(a.message == message && a.type == type) return;
            }
            this.alerts.push({
                type: type || 'success',
                msg: message
            });
        };

        this.error = function(message) {
            this.add(message || "Oops, something went wrong!", 'danger');
        };

        this.info = function(message) {
            this.add(message || "Hello!", 'info');
        };

        this.success = function(message) {
            this.add(message || "Success!", 'success');
        };

        this.closeAlert = function(index) {
            this.alerts.splice(index, 1);
        };
    }