FullCalendar.globalLocales.push(function () {
  'use strict';

  var hi = {
    code: "hi",
    week: {
      dow: 0,
      doy: 6
    },
    buttonText: {
      prev: "पिछला",
      next: "अगला",
      today: "आज",
      month: "महीना",
      week: "सप्ताह",
      day: "दिन",
      list: "कार्यसूची"
    },
    weekText: "हफ्ता",
    allDayText: "सभी दिन",
    moreLinkText: function(n) {
      return "+अधिक " + n;
    },
    noEventsText: "कोई घटनाओं को प्रदर्शित करने के लिए"
  };

  return hi;

}());
