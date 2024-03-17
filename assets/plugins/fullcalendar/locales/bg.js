FullCalendar.globalLocales.push(function () {
  'use strict';

  var bg = {
    code: "bg",
    week: {
      dow: 1,
      doy: 7
    },
    buttonText: {
      prev: "назад",
      next: "напред",
      today: "днес",
      month: "Месец",
      week: "Седмица",
      day: "Ден",
      list: "График"
    },
    allDayText: "Цял ден",
    moreLinkText: function(n) {
      return "+още " + n;
    },
    noEventsText: "Няма събития за показване"
  };

  return bg;

}());
