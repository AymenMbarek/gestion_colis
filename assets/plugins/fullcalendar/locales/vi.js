FullCalendar.globalLocales.push(function () {
  'use strict';

  var vi = {
    code: "vi",
    week: {
      dow: 1,
      doy: 4
    },
    buttonText: {
      prev: "Trước",
      next: "Tiếp",
      today: "Hôm nay",
      month: "Tháng",
      week: "Tuần",
      day: "Ngày",
      list: "Lịch biểu"
    },
    weekText: "Tu",
    allDayText: "Cả ngày",
    moreLinkText: function(n) {
      return "+ thêm " + n;
    },
    noEventsText: "Không có sự kiện để hiển thị"
  };

  return vi;

}());
