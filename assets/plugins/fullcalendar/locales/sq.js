FullCalendar.globalLocales.push(function () {
  'use strict';

  var sq = {
    code: "sq",
    week: {
      dow: 1,
      doy: 4
    },
    buttonText: {
      prev: "mbrapa",
      next: "Përpara",
      today: "sot",
      month: "Muaj",
      week: "Javë",
      day: "Ditë",
      list: "Listë"
    },
    weekText: "Ja",
    allDayText: "Gjithë ditën",
    moreLinkText: function(n) {
      return "+më tepër " + n;
    },
    noEventsText: "Nuk ka evente për të shfaqur"
  };

  return sq;

}());
