FullCalendar.globalLocales.push(function () {
  'use strict';

  var kk = {
    code: "kk",
    week: {
      dow: 1,
      doy: 7
    },
    buttonText: {
      prev: "Алдыңғы",
      next: "Келесі",
      today: "Бүгін",
      month: "Ай",
      week: "Апта",
      day: "Күн",
      list: "Күн тәртібі"
    },
    weekText: "Не",
    allDayText: "Күні бойы",
    moreLinkText: function(n) {
      return "+ тағы " + n;
    },
    noEventsText: "Көрсету үшін оқиғалар жоқ"
  };

  return kk;

}());
