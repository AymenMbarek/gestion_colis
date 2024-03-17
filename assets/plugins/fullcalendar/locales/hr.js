FullCalendar.globalLocales.push(function () {
  'use strict';

  var hr = {
    code: "hr",
    week: {
      dow: 1,
      doy: 7
    },
    buttonText: {
      prev: "Prijašnji",
      next: "Sljedeći",
      today: "Danas",
      month: "Mjesec",
      week: "Tjedan",
      day: "Dan",
      list: "Raspored"
    },
    weekText: "Tje",
    allDayText: "Cijeli dan",
    moreLinkText: function(n) {
      return "+ još " + n;
    },
    noEventsText: "Nema događaja za prikaz"
  };

  return hr;

}());
