var mongodb = require("mongodb");
var _db;

var table_names = module.exports._table_names = {
	CONTACTS_COLLECTION:"contacts",
	EVENTS_COLLECTION: "events",
	USERS_COLLECTION:"users"
};

module.exports._connect = function (callback){
	mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
	  _db = database;
	  return callback(err);
	});
};
module.exports._getDb = function(){ return _db; };
module.exports._ObjectID = mongodb.ObjectID;

module.exports.events = function(){
  return _db.collection(table_names.EVENTS_COLLECTION);
}

module.exports.users = function(){
  return _db.collection(table_names.SERS_COLLECTION); 
}