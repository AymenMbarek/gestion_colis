FullCalendar.globalLocales.push(function () {
  'use strict';

  var srCyrl = {
    code: "sr-cyrl",
    week: {
      dow: 1,
      doy: 7
    },
    buttonText: {
      prev: "Претходна",
      next: "следећи",
      today: "Данас",
      month: "Месец",
      week: "Недеља",
      day: "Дан",
      list: "Планер"
    },
    weekText: "Сед",
    allDayText: "Цео дан",
    moreLinkText: function(n) {
      return "+ још " + n;
    },
    noEventsText: "Нема догађаја за приказ"
  };

  return srCyrl;

}());
