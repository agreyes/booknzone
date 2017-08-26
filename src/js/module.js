/*angular.module('RDash', ['ui.bootstrap', 'ui.router', 'ngCookies', 'ui.grid']);*/
angular.module('app', ['ui.bootstrap', 'ui.router', 'ngCookies', 'ui.grid', 'mwl.calendar', 'hl.sticky'])
.config(['calendarConfig', function(calendarConfig) {

    //calendarConfig.templates.calendarMonthView = 'path/to/custom/template.html'; //change the month view template globally to a custom template

    calendarConfig.dateFormatter = 'moment'; //use either moment or angular to format dates on the calendar. Default angular. Setting this will override any date formats you have already set.

    calendarConfig.allDateFormats.moment.date.hour = 'h A'; //this will configure times on the day view to display in 24 hour format rather than the default of 12 hour
    calendarConfig.allDateFormats.moment.date.time = 'h:mma'; 

    //calendarConfig.allDateFormats.moment.title.day = 'ddd D MMM'; //this will configure the day view title to be shorter

    //calendarConfig.i18nStrings.weekNumber = ''; //This will set the week number hover label on the month view

    calendarConfig.displayAllMonthEvents = true; //This will display all events on a month view even if they're not in the current month. Default false.
  }]);