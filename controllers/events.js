var express = require('express');
var moment = require('moment');
var tsny = require('../models/tsny');
var events = require('../models/events');
var settings = require('../client/settings');

var router = express.Router();


/*  "/events"
 *    GET: gets events on the desired date
 */
router.get("/get/:desired_date?", function(req,res) {
	tsny.getClasses(req.params["desired_date"], function(data){
		res.json(data);
	});
});

router.get("/schedule/:desired_date?", function(req,res) {
	tsny.getSchedule(req.params["desired_date"], function(data){
		res.json(data);
		//res.write(JSON.stringify(data));
		//res.end();
	});
});

router.post("/query", function(req,res) {
	var query = "";
	req.setEncoding('utf8');
    req.on('data', function (chunk) {
    	query += chunk;
    });
    req.on('end', function() { 
    	console.log(query);
    	var queryObject = parseQuery(query);
    	var range = validateDateRange(queryObject.start_date, queryObject.end_date);
    	queryObject.start_date = range[0];
    	queryObject.end_date = range[1];
    	var length = range[2];

    	console.log(queryObject);

    	// a. If not range, get date.
    	// b. Limit to today forward up to 12 weeks.
    	// c. If less than a week get classes (up to 7)
    	// d. Else get schedule (up to 3)

		tsny.getClasses(desired_date, function(data){

			// Match time

			// Search by type

			// Construct string

			// Respond

			// Send to API

			res.write(JSON.stringify(data));
			res.end();
		});
    });

});



// router.get("/user/:email/:dob", function(req,res) {
// 	console.log(req.params);
// 	tsny.getUserInfo(req.params["email"], req.params["dob"], function(data){
// 		res.write(JSON.stringify(data));
// 		res.end();
// 	});
// });



//router.post("/", function(req,res,next){ next(); },function(req,res) {
//	console.log(req);
//	tsny.getClasses(req.body["desired_date"], function(data){
//		res.write(JSON.stringify(data));
//		res.end();
//	});
//});

module.exports = router;