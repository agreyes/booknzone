/**
 * Calendar Controller
 */

angular
.module('FFApp')
    .controller('CalendarController', ['$scope', '$timeout', '$q', 'ClassesService', 'calendarConfig', CalendarController]);

function CalendarController($scope, $timeout, $q, ClassesService, calendarConfig) {
    
    $scope.mainView = 'week';
    $scope.mainCal = {
        view: 'month',
        cellIsOpen: true,
        viewDate: moment().day() == 6 && moment().hours() > 20 ? moment().add(1,"days").toDate(): moment().toDate(),
        events: []
    }

    $scope.selectedFilters = [];

    $scope.setMainView = function(view){
        switch(view){
            case 'month':
            case 'day':
                $scope.mainCal.view = view;
            default:
                $scope.mainView = view || 'week';
        }
    }
    
    $scope.scheduleTitle = function(){
        if($scope.mainView == 'month'){
            return moment($scope.mainCal.viewDate).format("MMMM YYYY");
        }else if($scope.mainView == 'week'){
            return "Week of " + moment($scope.mainCal.viewDate).day(0).format("MMMM D, YYYY");
        }else{
            return moment($scope.mainCal.viewDate).format("dddd, MMMM D, YYYY");
        }
    }
    $scope.calendarEventClicked = function(event){
        $scope.mainCal.viewDate = moment(event.date).toDate();
        ClassesService.openClassModal(event).result.then(function(reason){
            if(reason == 'complete' || reason == 'error'){
                $scope.fetchDate(event.date, true);
            }
        });
    }
    $scope.viewChangeClick = function(calDate, nextView){
        $scope.mainCal.viewDate = calDate;
        console.log("viewChangeClick", $scope.mainCal.calDate, $scope.mainCal.cellIsOpen);
        return false;
    }
    $scope.onTimespanClick = function(calendarDate, calendarCell){
        // Skip if in past
        if(!calendarCell.isFuture && !calendarCell.isToday) return false;
        // Set date if in month
        if(calendarCell.inMonth){
            $scope.mainCal.viewDate = calendarDate;  
        } else{
            $scope.fetchDate(moment(calendarDate).format("YYYY-MM-DD"));
        }
        $scope.mainCal.cellIsOpen = !$scope.mainCal.cellIsOpen;
        console.log("onTimespanClick", calendarDate, calendarCell);
    }

    $scope.$watch("mainCal.viewDate", function(newValue, oldValue) {
        if (newValue && oldValue && newValue.getTime() != oldValue.getTime()) {
            $scope.fetchCurrentView();
            console.log("$watch mainCal.viewDate", newValue);
        }
    });
    $scope.$watch("mainView", function(newValue, oldValue) {
        if (newValue != oldValue && newValue) {
            $scope.fetchCurrentView();
        }
    });

    $scope.$watch("selectedFilters", function(newValue){
        for(var i = 0; i < newValue.length; i++){
            var filter = newValue[i];

            if(filter.text){
                var regex = new RegExp(filter.text, 'i');
                // 1. Find Month (.isValid() and matches string) and set it to the Month in year (future)
                // 2. If Day of Week  (.isValid() and matches string) set it to the next Day Of Week (future)
                // 3. Otherwise, use date value

                var temp = moment(filter.text, "MMMM");
                var today = moment();
                if(temp.format("MMMM").match(regex)){
                    // is Month
                    temp.year(today.year());
                    // make sure month is in the future
                    if(temp.month() < today.month()) temp.add(1,"year");
                }else{
                    temp = moment(filter.text, "dddd");
                    if(temp.format("dddd").match(regex)){
                        // is Day
                        temp = moment().day(temp.day());
                        // make sure day is in the future
                        if(temp.day() < today.day()) temp.add(1, "weeks");
                    }else{
                        temp = moment(filter.text);
                    }
                }
                if(temp.year() == 2001) temp.year(2017); // Fix default moment year from 2001 to current year
                if(temp.isValid() && temp.isAfter(today) && temp.isBefore(today.add(3,"months"))) {
                    $scope.mainCal.viewDate = temp.toDate();
                    newValue.splice(i,1);
                }
            }
        }
        $scope.filterClasses($scope.mainCal.events);
    }, true);

    $scope.minFetchedDate = function(){
        if(!$scope.mainCal.events.length) return null;
        return moment($scope.mainCal.events[0].date).format("YYYY-MM-DD");
    }

    $scope.maxFetchedDate = function(){
        if(!$scope.mainCal.events.length) return null;
        return moment($scope.mainCal.events[$scope.mainCal.events.length-1].date).format("YYYY-MM-DD");
    }

    $scope.fetchedDates = [];
    $scope.fetchDateQueue = [];
    $scope.fetching = false;
    $scope.fetchDate = function(date, force){
        if(force || ($scope.fetchedDates.indexOf(date) == -1 && $scope.fetchDateQueue.indexOf(date) == -1)){
            $scope.fetchDateQueue.push(date);

            if(!$scope.fetching){
                $scope.fetching = true;
                //console.group('Fetch ' + date);
                //console.time('Fetch ' + date);
                $scope.fetchFromQueue(force).then(function(){
                    $scope.fetching = false;
                    //console.groupEnd('Fetch ' + date);
                    //console.timeEnd('Fetch ' + date);
                });
            }
        }
    }

    $scope.fetchCurrentView = function(){
        var dates = [];

        if($scope.mainView == "week"){
            // For week view, fetch entire week
            dates = $scope.getWeekDays();
        }else if($scope.mainView == "month"){
            // For month view, fetch until the first of next month.
            dates = [moment($scope.mainCal.viewDate).day(1).add(1,"month").format("YYYY-MM-DD")];
        }else{
            // Attempt to fetch current date
            dates = [moment($scope.mainCal.viewDate).format("YYYY-MM-DD")];
        }

        for(var i = 0; i < dates.length; i++){
            $scope.fetchDate(dates[i]);
        }
    }

    $scope.fetchFromQueue = function(force){
        var date = $scope.fetchDateQueue[0]; // Read but don't shift until processed
        if(!date) return $q.when();
        //console.log("fetch(" + $scope.fetchDateQueue.length + "):", date);
        if(!$scope.fetchComplete && (!$scope.maxFetchedDate() || date > $scope.maxFetchedDate())){
            return $scope.fetchSchedule().then($scope.fetchFromQueue);
        }

        if(moment(date).format("YYYYMMDD") < moment().format("YYYYMMDD") || date > $scope.maxFetchedDate()) {
            var temp = $scope.fetchDateQueue.shift();
            if($scope.fetchedDates.indexOf(temp) == -1) $scope.fetchedDates.push(temp);
            return $scope.fetchFromQueue();
        }
        
        return ClassesService.getClasses(date, force).then(function(data){
            $scope.refreshEvents(data, date);
            var temp = $scope.fetchDateQueue.shift();
            if($scope.fetchedDates.indexOf(temp) == -1) $scope.fetchedDates.push(temp);
            return $scope.fetchFromQueue();
        }, function(response){
            $scope.fetchDateQueue = [];
            AlertsService.error();
            return $q.when();
        });
    }

    $scope.schedulesFetched = 0;
    $scope.fetchCompelte = false;
    $scope.fetchSchedule = function(){
        if($scope.fetchComplete || $scope.loading) return $q.when();
        $scope.loading = true;
        var desired_date = moment().add($scope.schedulesFetched*4,"weeks").format("YYYY-MM-DD");
        $scope.schedulesFetched++;
        return ClassesService.getSchedule(desired_date).then(function(data){
            if(!data || data.length <= 0){
                $scope.fetchComplete = true;
            }else if(data.length > 0){
                var events = [];

                for(var i = 0; i < data.length; i++){
                    if(data[i].date < moment().format("YYYY-MM-DD")) continue;
                    events.push($scope.createEvent(data[i]));
                }
                //$scope.createTags(data);
                $scope.mainCal.events.push.apply($scope.mainCal.events, events);
                $scope.filterClasses(events);
            }else{
                AlertsService.error();
            }
            $scope.loading = false;
        }, function(res){
            AlertsService.error();
            $scope.loading = false;
        });
    }

    $scope.getEventHtmlBadge = function(event, color, icon){
        var innerHtml = "";

        if(event.status == "open"){
            innerHtml = event.spots;
        }else{
            innerHtml = "<i class='fa fa-" + (icon || $scope.getEventBadgeIcon(event)) + "'></i>";
        }

        return "<span class='badge' style='background-color:"+ (color || "#71777C") +"'>" + innerHtml + "</span>";
    }

    $scope.getEventBadgeIcon = function(event){
        switch(event.status){
            case "open":
                return "";
            case "cancelled":
                return "ban";
            case "private":
                return "lock";
            case "full":
            case "closed":
                return "minus-circle";
            default:
                return "warning";
        }
    }

    $scope.refreshEvents = function(allData, date){
        var colors = {
            red: {primary: "#DE3E3B", secondary: "#FAAAA8"},
            blue: {primary: "#4BA1A0", secondary: "#B0DBDB"},
            green: {primary: "#9EBC61", secondary: "#D9E8BB"},
            yellow: {primary: "#E2A95A", secondary: "#FBDFB8"},
            orange: {primary: "#E17445", secondary: "#FBC4AD"},
            gray: {primary: "#71777C", secondary: "#B8C5D1"}
        }
        var events = $scope.getDayEvents(date);
        for(var e = 0; e < events.length; e++){
            var event = events[e];
            var id = ClassesService.getTagId(event);
            for(var d = 0; d <= allData.length; d++){
                var data = (d < allData.length) ? allData[d] : {
                    start_time: event.start_time,
                    instructor: event.instructor,
                    class_name: event.class_name,
                    status: "closed",
                    spots: 0,
                    note: "Closed" 
                };
                if(data.matchFound) continue;
                if(event.start_time == data.start_time 
                    && event.instructor == data.instructor 
                    && id == ClassesService.getTagId(data)){
                    // Match found. Update event.
                    event.note = data.note;
                    event.spots = data.spots;
                    event.status = data.status;
                    event.class_id = data.class_id;
                    switch(event.status){
                        case "full":
                            event.color = colors.red; // red
                            break;
                        case "open":
                            event.color = event.spots <= 2 ? colors.yellow : colors.green;
                            break;
                        default:
                            event.color = colors.gray;
                    }

                    event.title = $scope.getEventHtmlBadge(event, event.color.primary) + event.class_name;
                    
                    data.matchFound = true;
                    break;
                }
            }
        }
    }

    $scope.gridOptions = {
        enableSorting: true,
        columnDefs: [
          { name:'Name', field: 'class_name' },
          { name:'Time', field: 'start-time' },
          { name:'Price', field: 'price'},
          { name:'Status', field: 'note'}
        ],
        data : []
      };

    $scope.collapsedDays = [];
    $scope.eventCount = [];

    $scope.getWeekDays = function(){
        var d = moment($scope.mainCal.viewDate).day(0);
        var today = moment().format("YYYY-MM-DD");
        var i = 0;
        var days = [];
        while(i < 7){
            var date = d.day(i++).format("YYYY-MM-DD");
            if(date < today) continue;
            days.push(date);
        }
        return days;
    }

    $scope.getDayEvents = function(day){
        var startIndex = -1;
        var endIndex = -1;
        for(var i = 0; i < $scope.mainCal.events.length; i++){
            if($scope.mainCal.events[i].date == day){
                if(startIndex == -1) startIndex = i;
                endIndex = i;
            } else if(startIndex > -1){
                break;
            }
        }

        var events = $scope.mainCal.events.slice(startIndex, endIndex + 1);

        $scope.eventCount[day] = 0;

        events.forEach(function(e){ if(e.incrementsBadgeTotal) $scope.eventCount[day]++; });

        return $scope.mainCal.events.slice(startIndex, endIndex + 1);
    }

    $scope.filterClasses = function(events){
        $scope.eventCount = [];
        for(var e = 0; e < events.length; e++){
            var event = events[e];
            
            if(ClassesService.tagFilter(event, $scope.selectedFilters)){
                event.cssClass = event.cssClass.replace(/(\s*no-match\s*)?$/i, "");
                event.incrementsBadgeTotal = true;
            } else {
                event.cssClass = event.cssClass.replace(/(\s*no-match\s*)?$/i, " no-match");
                event.incrementsBadgeTotal = false;
            }
        }
    }

    $scope.canPrevious = function(cal){
        if(!cal.viewDate) return false;
        if($scope.mainView == 'month') return moment(cal.viewDate).format("YYYYMM") > moment().format("YYYYMM");
        if($scope.mainView == 'week') return moment(cal.viewDate).format("YYYYww") > moment().format("YYYYww");
        return moment(cal.viewDate).format("YYYYMMDD") > moment().format("YYYYMMDD");
    }

    $scope.canNext = function(cal){
        // TODO: Set max / user isn't allowed to browse more than 3 months?
        var nextDay = moment(cal.viewDate).add(1, $scope.mainView + "s");
        if($scope.mainView == 'month') nextDay.date(0);
        if($scope.mainView == 'week') nextDay.day(0);
        return (!$scope.fetchComplete || nextDay.format("YYYY-MM-DD") <= $scope.maxFetchedDate())
        && moment().add(3,"months").isAfter(nextDay);
    }

    $scope.showToday = function(cal){
        cal.viewDate = moment().toDate();
    }

    $scope.showNext = function(cal){
        $scope.mainCal.cellIsOpen = false;
        if($scope.mainView == 'month') {
            cal.viewDate = moment(cal.viewDate).add(1, "months").toDate();
        }else if($scope.mainView == 'week'){
            cal.viewDate = moment(cal.viewDate).add(1, "weeks").toDate();
        }else{
            cal.viewDate = moment(cal.viewDate).add(1, "days").toDate();
        }
        console.log('showNext');
    }

    $scope.showPrevious = function(cal){
        $scope.mainCal.cellIsOpen = false;
        if($scope.mainView == 'month') {
            cal.viewDate = moment(cal.viewDate).subtract(1, "months").toDate();
        }else if($scope.mainView == 'week'){
            cal.viewDate = moment(cal.viewDate).subtract(1, "weeks").toDate();
        }else{
            cal.viewDate = moment(cal.viewDate).subtract(1, "days").toDate();
        }
        console.log('showPrevious');
    }

    $scope.createEvent = function(data){
        var newEvent = angular.extend({
            /*actions: [{ // an array of actions that will be displayed next to the event title
                label: '<i class=\'glyphicon glyphicon-pencil\'></i>', // the label of the action
                cssClass: 'edit-action', // a CSS class that will be added to the action element so you can implement custom styling
                onClick: function(args) { // the action that occurs when it is clicked. The first argument will be an object containing the parent event
                    console.log('Edit event', args.calendarEvent);
                }
            }],*/
            draggable: false, //Allow an event to be dragged and dropped
            resizable: false, //Allow an event to be resizable
            incrementsBadgeTotal: true, //If set to false then will not count towards the badge total amount on the month and year view
            allDay: false // set to true to display the event as an all day event on the day view
        }, data);

        newEvent.title = $scope.getEventHtmlBadge(data, null, "spinner fa-spin") + data.class_name;
        var start = moment(data.date + data.start_time, "YYYY-MM-DDh:mma");
        newEvent.startsAt = start.toDate();
        newEvent.endsAt = moment(data.date + data.end_time, "YYYY-MM-DDh:mma").toDate();
        newEvent.color = {primary: "#71777C", secondary: "#B8C5D1"};

        newEvent.cssClass = (start.format() < moment().format()) ? "past-event" : "";

        return newEvent;
    }

    $scope.fetchCurrentView();
}