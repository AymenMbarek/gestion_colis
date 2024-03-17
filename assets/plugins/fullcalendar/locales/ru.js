FullCalendar.globalLocales.push(function () {
  'use strict';

  var ru = {
    code: "ru",
    week: {
      dow: 1,
      doy: 4
    },
    buttonText: {
      prev: "Пред",
      next: "След",
      today: "Сегодня",
      month: "Месяц",
      week: "Неделя",
      day: "День",
      list: "Повестка дня"
    },
    weekText: "Нед",
    allDayText: "Весь день",
    moreLinkText: function(n) {
      return "+ ещё " + n;
    },
    noEventsText: "Нет событий для отображения"
  };

  return ru;

}());
