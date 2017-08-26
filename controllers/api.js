var express = require('express');
var moment = require('moment');
var tsny = require('../models/tsny');
var events = require('../models/events');
var settings = require('../client/settings');
var createFilter = require('odata-v4-mongodb').createFilter;

var router = express.Router();


/*  "/events"
 *    GET: gets events on the desired date
 */
router.get("/events", function(req,res) {
	var filter = createFilter(req.query.$filter);
	console.log(filter);
	events.get(createFilter(req.query.$filter), function(err, data){
		if(err) data = [];
		console.log(data);
		res.write(JSON.stringify(data));
		res.end();
	});
});

module.exports = router;