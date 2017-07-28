var mongodb = require("mongodb");
var _db;

module.exports = {
	connect: function (callback){
		mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
		  _db = database;
		  return callback(err);
		});
	},
	getDb: function(){ return _db; },
	ObjectID: mongodb.ObjectID
};

