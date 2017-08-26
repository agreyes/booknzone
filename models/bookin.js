var moment = require('moment');

var event_status = ["open", "closed", "cancelled"];
var event_types ["default"];

var event = function(id){
	this.id = id || 0;
	this.name = "new_event";
	this.description = "";
	this.start_time = moment();
	this.end_time = moment();
	this.date = moment();
	this.price = 0;
	this.capacity = 1;
	this.availability = 1;
	this.status = "open";
	this.cost = 0;
	this.tax = 0;
	this.type = "default";
}

    interface events {
        function query(start_date, end_date);
        function remove(child);
        function getChild(index);
    } 

    class eventType {
    	id;
    	name;
    	description;
    	defaultEvent:
    }

    class event {
    	id;
    	name;
    	description;
    	start_time;
    	end_time;
    	date;
    	price;
    	capacity;
    	availability;
    	status;
    	cost;
    	tax;
    	type;
    }

    class user {
		id;
		email;
		created_date;
		first_name;
		last_name;
		nickname;
		guardian;
		DOB;
		address1;
		address2;
		city;
		zip_code;
		country;
		phone;
		other;
    }