FullCalendar.globalLocales.push(function () {
  'use strict';

  var de = {
    code: "de",
    week: {
      dow: 1,
      doy: 4
    },
    buttonText: {
      prev: "Zurück",
      next: "Vor",
      today: "Heute",
      year: "Jahr",
      month: "Monat",
      week: "Woche",
      day: "Tag",
      list: "Terminübersicht"
    },
    weekText: "KW",
    allDayText: "Ganztägig",
    moreLinkText: function(n) {
      return "+ weitere " + n;
    },
    noEventsText: "Keine Ereignisse anzuzeigen"
  };

  return de;

}());
