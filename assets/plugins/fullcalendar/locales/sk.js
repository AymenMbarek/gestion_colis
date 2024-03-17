FullCalendar.globalLocales.push(function () {
  'use strict';

  var sk = {
    code: "sk",
    week: {
      dow: 1,
      doy: 4
    },
    buttonText: {
      prev: "Predchádzajúci",
      next: "Nasledujúci",
      today: "Dnes",
      month: "Mesiac",
      week: "Týždeň",
      day: "Deň",
      list: "Rozvrh"
    },
    weekText: "Ty",
    allDayText: "Celý deň",
    moreLinkText: function(n) {
      return "+ďalšie: " + n;
    },
    noEventsText: "Žiadne akcie na zobrazenie"
  };

  return sk;

}());
