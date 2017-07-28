var moment = require('moment');

exports.parse = function(query, options){
  console.log(query);
  var queryObject = parseQuery(query);
  var range = validateDateRange(queryObject.start_date, queryObject.end_date);
  queryObject.start_date = range[0];
  queryObject.end_date = range[1];
  var length = range[2];
  if(length == 0){ // day


  }else if(length <= 7){ // week
    

  }else if(length > 7){ // multiple weeks

  }

  console.log(queryObject);
}

function validateDateRange(rangeStart, rangeEnd){
  var startDate = min = moment();
  var max = moment().add(12, "weeks");
  var endDate;
  if(!rangeStart) return [startDate, null, 1];
  if(Array.isArray(rangeStart)){
    startDate = rangeStart[0] || startDate;
    if(rangeStart.length > 0) endDate = rangeStart[1] || moment();
  }else{
    startDate = rangeStart || startDate;
  }

  if(startDate < min) startDate = min();
  if(startDate > max) startDate = max();
  if(endDate){
    if(endDate > max) endDate = max();
    if(endDate < min) endDate = min();
  }

  var length = !endDate ? 0 : moment.duration(endDate.diff(startDate)).asDays();
  
  return [startDate, null, length];
}

function parseQuery(query){
  // Match time
      var timeMatch = ((query.match(/((\d?\d)(:\d\d)?[\s]?(([ap]\.?m\.?)|(o'?clock)))|(afternoon)|(morning)|(evening)[\s]*/i) || [])[0] || "").trim();
    query = query.replace(timeMatch, ""); // Remove time text

    // Match date
    var dateMatch = ((query.match(/(tomorrow'?s?)|(monday'?s?)|(tuesday'?s?)|(wednesday'?s?)|(thursday'?s?)|(friday'?s?)|(saturday'?s?)|(sunday'?s?)|((january)|(february)|(march)|(april)|(may)|(june)|(july)|(august)|(september)|(october)|(november)|(december)([\s]\d+(st|nd|rd|th)?)?)([^\w]|$)+/i) || [])[0] || "").trim();
    query = query.replace(dateMatch, ""); // Remove date text

    // Match modifiers
    var modMatches = query.match(/(after)|(before)|(next)|(latest)|(earliest)|(week'?s?)|(month'?s?)|(last)|(first)|(around)([^\w]|$)+/ig) || [];
    var i = 0;
    if(modMatches) while(modMatches[i]) query = query.replace(modMatches[i++], ""); // Remove mod text
    modMatches = modMatches.join("").toLowerCase();

    // Remove filler words
    var typeMatches = query.replace(/((today'?s?)|(class)|(classes)|(at)|(on)|(in)|(the)|(any)|(this)|(other)|(than)|(by)|(with)|('s))([^\w]|$)+/ig, "").trim().toLowerCase();

    var getLatest = false;
    var getFirst = null;

    var start_date = moment();
    var end_date = null;
    var response = "today";

    if(dateMatch.match(/tomorrow/)){ // Tomorrow
      start_date = moment().add(1, 'days');
      response = "tomorrow";
    }else if(dateMatch.match(/(monday)|(tuesday)|(wednesday)|(thursday)|(friday)|(saturday)|(sunday)/i)){ // Day of Week
      start_date = moment().day(dateMatch);
      if(start_date < moment()) start_date.add(1, 'week');

      response = dateMatch.match(/[\w]*/i)[0];

      if(modMatches.indexOf('next') > -1){
        start_date.add(1,'week');
        response = "next " + response;
        getFirst = false;
      }

      response += start_date.format(", MMMM Do,");
    }else if(dateMatch.split(' ').length > 1){ // Full Date
      start_date = moment().month(dateMatch.split(' ')[0]).date(parseInt(dateMatch.split(' ')[1]));
      response += start_date.format("dddd, MMMM Do");
    }else if(dateMatch) { // Month
      start_date = moment().month(dateMatch).date(1);
      end_date = moment().month(dateMatch).add(1,'month').date(1).add(-1,'day');
      response = "in " + start_date.format("MMMM");
    }else if(modMatches.indexOf('week') > -1){ // This/Next Week
      start_date = moment();
      end_date = moment().add(1, 'week');
      response = "this week";
      if(modMatches.indexOf('next') > -1){
        start_date.add(1, 'week');
        end_date.add(1, 'week');
        response = "next week";
        getFirst = false;
      }
    }else if(modMatches.indexOf('month') > -1){ // This/Next Month
      start_date = moment().date(1);
      end_date = moment().add(1, 'month').date(1).add(-1,'day');
      response = "this month";
      if(modMatches.indexOf('next') > -1){
        start_date.add(1, 'month');
        end_date.add(2, 'month').date(1).add(-1,'day');
        response = "next month";
        getFirst = false;
      }
    }

    var start_time = null;
    var end_time = null;
    var timeResponse = "";
    if(timeMatch.match(/morning/i)){ 
      start_time = moment().hour(7).minute(0).millisecond(0);
      end_time = moment().hour(12).minute(0).millisecond(0);
      timeResponse = "in the morning";
    }else if(timeMatch.match(/afternoon/i)){
      start_time = moment().hour(11).minute(0).millisecond(0);
      end_time = moment().hour(6).minute(0).millisecond(0);
      timeResponse = "in the afternoon";
    }else if(timeMatch.match(/evening/i)){ 
      start_time = moment().hour(5).minute(0).millisecond(0);
      end_time = moment().hour(11).minute(0).millisecond(0);
      timeResponse = "in the evening";
    }else if(timeMatch) {
      var pm = timeMatch.match(/p/i);
      start_time = moment().hour((parseInt(timeMatch) + (pm ? 12 : 0)) % 24 ).minute(parseInt(timeMatch.split(":")[1] || 0)).millisecond(0);
      timeResponse = "at " + start_time.format("h:mm a");
    }

    if(modMatches.indexOf('after') > -1){
      if(start_time && !end_time){ // time
        end_time = moment(start_time).hours(23).minutes(59);
        timeResponse = 'after ' + timeResponse.replace("at ", "");
      }else { // dates
        start_date = (end_date || start_date).add(1,"day");
        end_date = moment().add(3,"months");
        response = "after " + response;
      }
    }else if(modMatches.indexOf('before') > -1){
      if(start_time && !end_time){ // time
        end_time = moment(start_time);
        start_time.hours(0).minutes(0);
        timeResponse = 'before ' + timeResponse.replace("at ", "");
      }else { // dates
        end_date = moment(start_date).add(-1,"day");
        start_date = moment().add(-3,"months");
        response = "before " + response;

      }
    }else if(modMatches.indexOf('around') > -1 && start_time && !end_time){
      end_time = moment(start_time).add(2, "hours");
      start_time.add(-2, "hours");
      timeResponse = 'around ' + timeResponse;
    }

    var preResponse
    // Return modifiers
    if(modMatches.indexOf('earliest') > -1 || modMatches.indexOf('first') > -1){
      getFirst = true;
      preResponse = "the first {0}class ";
    }else if(modMatches.indexOf('latest') > -1 || modMatches.indexOf('last') > -1 ){
      getFirst = true;
      getLatest = true;
      preResponse = "the last {0}class ";
    }else if(getFirst === null && modMatches.indexOf('next') > -1){
      getFirst = true;
      preResponse = "the next {0}class ";
    }else{
      preResponse = "{0}classes ";
    }

    if(timeResponse) timeResponse += " ";
    if(typeMatches) typeMatches += " ";
    response = preResponse + timeResponse + response;

    return {
      start_date: start_date,
      end_date: end_date,
      start_time: start_time,
      end_time: end_time,
      take: getFirst ? 1 : 0,
      sort: getLatest ? 'desc' : 'asc',
      type: typeMatches,
      textResponse: response.replace("{0}",typeMatches).trim()
    };
}