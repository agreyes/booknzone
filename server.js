var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var dbClient = require("./db");
var tsny = require('./models/tsny');
var querystring = require("querystring");
var https = require("https");
var router = express.Router()
var cheerio = require("cheerio");
var moment = require('moment');
var nodemailer = require('nodemailer');
var extend = require('extend');
var settings = require('./client/settings');
//var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = "contacts";
var CLASSES_COLLECTION = "classes";

var CLASSES_HTML_START = '<tr valign="top">';
var CLASSES_HTML_COLUMNS = ["class_id", "class_name", "date_time", "price", "availability"];

var app = express();
app.use(express.static(__dirname + "/public"));
//app.use('/components',  express.static(__dirname + '/bower_components'));
//app.use('/js',  express.static(__dirname + '/bower_components'));

app.use(function(req, res, next){
  if(!settings || !settings.preProcessRequest) {
      next();
  }else{
    for(key in settings.preProcessRequest){
      if(settings.preProcessRequest.hasOwnProperty(key)){
        settings.preProcessRequest[key](req,res,next);
        return;
      }
    }
    next();
  }
});

app.use(require('./controllers'));

app.use(bodyParser.json());

// Connect to the database before starting the application server.
dbClient._connect(function (err) {
  console.log("Database connection ready");

  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
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
app.get('/user/profile', function (req, res) {
  /*
    If we get here, the user is logged in.  Otherwise, they
    were redirected to the login page - lies
   */
   var user = req.user || {};
    tsny.getUserInfo(user.email, (user.username || "").split(' ')[1], function(data){
      res.json(data);
    });
});

/*  "/user/history/:length?/:page?"
 *    GET: Get user registration history
 */
app.get('/user/history/:length?/:page?', function(req,res){
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
app.put("/user/history/cancel/:id", function(req, res) {
  
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
app.post('/class/:desired_date/:class_id/:persons/:payment_type?', function (req, res) {
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
