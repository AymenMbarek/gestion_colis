FullCalendar.globalLocales.push(function () {
  'use strict';

  var fa = {
    code: "fa",
    week: {
      dow: 6,
      doy: 12
    },
    direction: 'rtl',
    buttonText: {
      prev: "قبلی",
      next: "بعدی",
      today: "امروز",
      month: "ماه",
      week: "هفته",
      day: "روز",
      list: "برنامه"
    },
    weekText: "هف",
    allDayText: "تمام روز",
    moreLinkText: function(n) {
      return "بیش از " + n;
    },
    noEventsText: "هیچ رویدادی به نمایش"
  };

  return fa;

}());
