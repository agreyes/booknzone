var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var dbClient = require("./db");
var tsny = require('./models/tsny');
var querystring = require("querystring");
var https = require("https");
var router = express.Router()
var cheerio = require("cheerio");
var stormpath = require('express-stormpath');
var moment = require('moment');
var nodemailer = require('nodemailer');
var extend = require('extend');
//var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = "contacts";
var CLASSES_COLLECTION = "classes";

var CLASSES_HTML_START = '<tr valign="top">';
var CLASSES_HTML_COLUMNS = ["class_id", "class_name", "date_time", "price", "availability"];

var app = express();
app.use(express.static(__dirname + "/public"));
//app.use('/components',  express.static(__dirname + '/bower_components'));
//app.use('/js',  express.static(__dirname + '/bower_components'));

app.use(require('./controllers'));

app.use(stormpath.init(app, { website: true
  ,preRegistrationHandler: function (formData, req, res, next) {
    if(!moment(formData.username).isBefore(moment().subtract(6, "years"))){
      return next(new Error('Please verify your birth date.'));
    }
    tsny.getUserInfo(formData["email"], formData["username"], function(data){
      if(!data.student_id){
        return next(new Error('Please verify your email address and date of birth.'));
      }else{
        formData["username"] = data.student_id + " " + formData.username;
        formData["givenName"] = data.first_name;
        formData["surname"] = data.last_name;
        next();
      }
    });
    
    // TODO: Check for account with TSNY
    //next(new Error('You\'re not allowed to register with \'@some-domain.com\'.'));

    
  }
  //,expandCustomData: true
  //,expand: {
	//	customData: true
	//}
	,web:{
    me: { 
      enabled: false,
      expand: {
        customData: true
      } 
    },
    login: {
      enabled: true,
      nextUri: "/"
    },
    logout: { enabled: true },
		register: {
        nextUri: '/',
	    	form: {
            fieldOrder: ['email', 'username', 'password'],
	      		fields: {
	        		username: {
	          			enabled: true,
	          			label: 'DOB',
	          			placeholder: 'mm/dd/yyyy',
	          			required: true,
	          			type: 'date'
	        		},
              //student_id: {
              //  enabled: false,
              //  label: '',
              //  placeholder: '',
              //  required: false,
              //  type: 'hidden'
              //},
              givenName: {
                enabled: false
              },
              surname: {
                enabled: false
              }
	      		}
	    	}
		}
	}
}));

app.on('stormpath.ready', function () {
  // Initialize the app.
  console.log("Stormpath ready.");
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
dbClient.connect(function (err) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = dbClient.getDb();
  console.log("Database connection ready");
});

// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/user/profile"
 *    GET: Get user profile
 */
app.get('/user/profile', stormpath.loginRequired, function (req, res) {
  /*
    If we get here, the user is logged in.  Otherwise, they
    were redirected to the login page
   */
    tsny.getUserInfo(req.user.email, (req.user.username || "").split(' ')[1], function(data){
      res.json(data);
    });
});

/*  "/user/history/:length?/:page?"
 *    GET: Get user registration history
 */
app.get('/user/history/:length?/:page?', stormpath.loginRequired, function(req,res){
  req.user.getCustomData(function(err, data){
    if(err || !data) {
      console.log(err);
      res.json([]);
    }else{
      var length = req.params["length"] || 10;
      var page =  req.params["page"] || 0;
      res.json((data.history || []).slice(page * length, length));  
    }
  });  
});

/*  "/user/history/cancel/:id"
 *    PUT: Request cancellation
 */
app.put("/user/history/cancel/:id", stormpath.loginRequired, function(req, res) {
  
  req.user.getCustomData(function(err, customData){
    if(err || !customData) {
      return handleError(res, "Unable to find registration.", err);
    }else{
      var history = customData.history;
      var id = req.params["id"];
      console.log("cancel class:", id);
      if(!history) return handleError(res, "Unable to get history.", "Unable to get user history.", 404);
      if(!id || !history[id]) return handleError(res, "Unable to find registration: " + id, "Unable to find registration.", 404);

      var class_info = history[id];

      if(class_info.reg.cancelled) return handleError(res, "Post already cancelled: " + class_info.reg.cancelled, "A cancellation attempt for this reservation has already been made.", 304);

      var textBody = `Hi,

      Please open up the following reservation for FIRST_NAME LAST_NAME. (EMAIL_ADDRESS):

      CLASS_NAME
      CLASS_DATE
      CLASS_TIME
      SPOTS spot(s)
      Class Id: CLASS_ID

      Thank you,
      FIRST_NAME
      EMAIL_ADDRESS
      `;

      if(moment().isAfter(moment(class_info.date).subtract(2, "days"))){
        // After cancellation policy
        textBody += `
        P.S. 

        I am aware of the cancellation policy and understand that, if the spots for not fill, I will be responsible for payment of all spots in this reservation whether I attend or not.
        `;
      }

      textBody = textBody.replace(/FIRST_NAME/g, req.user.givenName);
      textBody = textBody.replace(/LAST_NAME/g, req.user.surname);
      textBody = textBody.replace(/EMAIL_ADDRESS/g, req.user.email);
      textBody = textBody.replace("SPOTS", class_info.reg.persons);
      textBody = textBody.replace("CLASS_ID", class_info.reg.class_id);
      textBody = textBody.replace("CLASS_NAME", class_info.class_name);
      textBody = textBody.replace("CLASS_DATE", moment(class_info.date).format("dddd, MMMM D, YYYY"));
      textBody = textBody.replace("CLASS_TIME", class_info.start_time + " - " + class_info.end_time);

      var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'frequentflyerapp@gmail.com', // Your email id
                pass: 'Trapezep123' // Your password
            }
        });

      var mailOptions = {
          from: '"' + req.user.givenName + ' ' + req.user.surname + '" <' + req.user.email + '>', // sender address
          replyTo: req.user.email,
          to: 'reyesalexg@gmail.com', // list of receivers
          cc: req.user.email,
          subject: 'Cancel: ' + moment(class_info.date).format("M/D/YYYY ") + class_info.start_time + " " + class_info.class_name.substring(0, 25), // Subject line
          text: textBody
      };

      transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error, info);
            return handleError(res, JSON.stringify(error), "Unable send cancellation email.");
        }else{
           class_info.reg.cancelled = moment().format("YYYY-MM-DD");
           customData.save(function(error){
            if(error){
              return handleError(res, JSON.stringify(error), "Email sent successfully. Unable save changes.");
            }else{
              res.json(class_info);
            }
           });
        };
      });
    }
  });  
});

/*  "/class"
 *    POST: Register for class
 */
app.post('/class/:desired_date/:class_id/:persons/:payment_type?', stormpath.loginRequired, function (req, res) {
  //If we get here, the user is logged in.  Otherwise, they
  //were redirected to the login page
  req.user.getCustomData(function(err, customData){
    if(err || !customData) {
      return handleError(res, "Registration failed.", err);
    }else{
      // Get parameters
      var desired_date = req.params["desired_date"];
      var class_id =  req.params["class_id"];
      var persons =  parseInt(req.params["persons"]);
      var errorMessage = "";
      if(!persons){
        errorMessage = "Invalid registration count. (" + persons + ")";
      } else if (persons < 1){
        errorMessage = "Must register more than one person. (" + persons + ")";
      } else if(persons > 3){
        errorMessage = "cannot register more than one three people. (" + persons + ")";
      }

      var payment_type =  req.params["payment_type"] || 4; // Class card
      if(payment_type != 4) errorMessage = "Invalid payment type (" + payment_type + ")";

      var student_id = (req.user.username || '').split(' ')[0];
      if(!student_id) errorMessage = "Unable to get student id.";

      if(errorMessage){
        res.json({ reg: { error: errorMessage }});
        return;
      }
      tsny.getClasses(desired_date, function(data){
        var matchFound = false;
        for(var i = 0; i < data.length; i++){
          if(data[i].class_id == class_id){
            var class_info = data[i];
            // Found class and user. Perform registration
            if(!class_info.spots){
              res.json({ reg: { error: "No spots available." }, class_info: class_info });
            }else{
              tsny.registerForClass(class_id, desired_date, student_id, persons, payment_type, function(data){

                class_info.reg = data;

                customData.history = customData.history || [];
                class_info.reg.id = customData.history.length;
                customData.history.push(class_info);
                customData.save(function (err) {
                  if (err) {
                    class_info.reg.id = -1;
                  }
                  res.json(class_info);
                });
              });
            }
            matchFound = true;
          }
        }
        if(!matchFound) res.json({ reg: { error: "Unable to get class information." }, class_info: class_info });
      });
    }
  });
});

/*  "/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

/*app.get("/contacts", function(req, res) {
  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

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
});*/