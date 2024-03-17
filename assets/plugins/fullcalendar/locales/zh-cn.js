FullCalendar.globalLocales.push(function () {
  'use strict';

  var zhCn = {
    code: "zh-cn",
    week: {
      dow: 1,
      doy: 4
    },
    buttonText: {
      prev: "上月",
      next: "下月",
      today: "今天",
      month: "月",
      week: "周",
      day: "日",
      list: "日程"
    },
    weekText: "周",
    allDayText: "全天",
    moreLinkText: function(n) {
      return "另外 " + n + " 个";
    },
    noEventsText: "没有事件显示"
  };

  return zhCn;

}());
