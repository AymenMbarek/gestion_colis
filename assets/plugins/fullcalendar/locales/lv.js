FullCalendar.globalLocales.push(function () {
  'use strict';

  var lv = {
    code: "lv",
    week: {
      dow: 1,
      doy: 4
    },
    buttonText: {
      prev: "Iepr.",
      next: "Nāk.",
      today: "Šodien",
      month: "Mēnesis",
      week: "Nedēļa",
      day: "Diena",
      list: "Dienas kārtība"
    },
    weekText: "Ned.",
    allDayText: "Visu dienu",
    moreLinkText: function(n) {
      return "+vēl " + n;
    },
    noEventsText: "Nav notikumu"
  };

  return lv;

}());
