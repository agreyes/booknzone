var dbClient = require("../db");
var groupBy = require("group-by");
var ObjectID = dbClient.ObjectID;

var CONTACTS_COLLECTION = "contacts";
var CLASSES_COLLECTION = "classes";

/*  "/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

exports.get = function(req, res) {
  dbClient.getDb().collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
};

// exports.batchUpdate = function(tsnyStores){
// 	var allClasses = dbClient.getDb().collection(CONTACTS_COLLECTION);
// 	var classesByDate = groupBy(tsnyStores || [], "date");
// 	var dates = [];
// 	for(var date in classesByDate){
// 		if(!classesByDate.hasOwnProperty(date)) continue;
// 		dates.push(date);
// 	}
// 	allClasses.find({date: {$in: dates}}).toArray(function(err, docs) {
// 	    if (err) {
// 	      handleError(res, err.message, "Failed to get contacts.");
// 	    } else {
// 	      res.status(200).json(docs);
// 	    }
//   	});

//   	dates.forEach(function(i,d){

//   	});
// }

app.post("/contacts", function(req, res) {
  var newContact = req.body;
  newContact.createDate = new Date();

  if (!(req.body.firstName || req.body.lastName)) {
    handleError(res, "Invalid user input", "Must provide a first or last name.", 400);
  }

  db.collection(CONTACTS_COLLECTION).insertOne(newContact, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new contact.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/contacts/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(204).end();
    }
  });
});