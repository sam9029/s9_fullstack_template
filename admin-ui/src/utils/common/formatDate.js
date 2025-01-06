import moment from 'moment';
export function getLastSevenDays() {
  //获取系统当前时间
  var now = new Date();
  var nowTime = now.getTime();
  var oneDayTime = 24 * 60 * 60 * 1000;
  let dateArr = [];
  for (var i = 0; i < 7; i++) {
    var ShowTime = nowTime + (i + 1) * oneDayTime;
    //初始化日期时间
    var myDate = new Date(ShowTime);
    var year = myDate.getFullYear() < 10 ? '0' + myDate.getFullYear() : myDate.getFullYear();
    var month =
      myDate.getMonth() + 1 < 10 ? '0' + Number(myDate.getMonth() + 1) : myDate.getMonth() + 1;
    var date = myDate.getDate() < 10 ? '0' + myDate.getDate() : myDate.getDate();
    //  var year = myDate.getFullYear();
    //  var month = myDate.getMonth();
    //  var date = myDate.getDate();
    dateArr.push(year + '-' + month + '-' + date);
    //var str = "星期" + "日一二三四五六".charAt(myDate.getDay());
  }
  return dateArr;
}
// 将对象里面的字符串数组转化成数组
export function formatArr(data) {
  if (JSON.stringify(data) == '{}') {
    return {};
  } else {
    for (var key in data) {
      if (
        !!data[key] &&
        Object.prototype.toString.call(data[key]) == '[object String]' &&
        data[key].substr(0, 1) == '[' &&
        data[key].substr(data[key].length - 1, 1) == ']'
      ) {
        data[key] = JSON.parse(data[key]);
      }
    }
    return data;
  }
}

//获得本月的开始日期
export function getMonthStartDate() {
  var now = new Date(); //当前日期
  var nowMonth = now.getMonth(); //当前月
  var nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0;
  var monthStartDate = new Date(nowYear, nowMonth, 1);
  return formatDate(monthStartDate);
}
//获得本月的结束日期
export function getMonthEndDate() {
  var now = new Date(); //当前日期
  var nowMonth = now.getMonth(); //当前月
  var nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0;
  var monthEndDate = new Date(nowYear, nowMonth, getMonthDays(nowMonth));
  return formatDate(monthEndDate);
}
//获得上月开始时间
export function getLastMonthStartDate() {
  var lastMonthDate = new Date(); //上月日期
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  var lastMonth = lastMonthDate.getMonth();
  let lastYear = lastMonthDate.getYear();
  lastYear += lastYear < 2000 ? 1900 : 0;
  var lastMonthStartDate = new Date(lastYear, lastMonth, 1);
  return formatDate(lastMonthStartDate);
}
//获得上月结束时间
export function getLastMonthEndDate() {
  var lastMonthDate = new Date(); //上月日期
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  var lastMonth = lastMonthDate.getMonth();
  let lastYear = lastMonthDate.getYear();
  lastYear += lastYear < 2000 ? 1900 : 0;
  var lastMonthEndDate = new Date(lastYear, lastMonth, getMonthDays(lastMonth));
  return formatDate(lastMonthEndDate);
}

//获得近3个月开始结束时间
export function getLastThreeMonths() {
  var currentDate = new Date(); // 当前日期
  var currentMonth = currentDate.getMonth();
  var currentYear = currentDate.getYear();
  currentYear += currentYear < 2000 ? 1900 : 0;
  var lastThreeMonthsEndDate = new Date(currentYear, currentMonth, 1); // 本月开始时间
  var lastThreeMonthsStartDate = new Date(currentYear, currentMonth - 2, 1); // 三个月前开始时间
  return {
    startDate: formatDate(lastThreeMonthsStartDate),
    endDate: formatDate(lastThreeMonthsEndDate)
  };
}
  
//获得近六个月开始结束时间
export function getLastSixMonths() {
  var currentDate = new Date(); // 当前日期
  var currentMonth = currentDate.getMonth();
  var currentYear = currentDate.getYear();
  currentYear += currentYear < 2000 ? 1900 : 0;
  var lastSixMonthsEndDate = new Date(currentYear, currentMonth, 1); // 本月开始时间
  var lastSixMonthsStartDate = new Date(currentYear, currentMonth - 5, 1); // 六个月前开始时间
  return {
    startDate: formatDate(lastSixMonthsStartDate),
    endDate: formatDate(lastSixMonthsEndDate)
  };
}

//获得近一年开始结束时间
export function getLastYear() {
  var currentDate = new Date(); // 当前日期
  var currentMonth = currentDate.getMonth();
  var currentYear = currentDate.getFullYear();
  var lastYearEndDate = new Date(currentYear, currentMonth, 1); // 本月开始时间
  var lastYearStartDate = new Date(currentYear - 1, currentMonth, 1); // 去年开始时间
  return {
    startDate: formatDate(lastYearStartDate),
    endDate: formatDate(lastYearEndDate)
  };
}

// 格式化日期：yyyy-MM-dd
export function formatDate(date) {
  var myyear = date.getFullYear();
  var mymonth = date.getMonth() + 1;
  var myweekday = date.getDate();

  if (mymonth < 10) {
    mymonth = '0' + mymonth;
  }
  if (myweekday < 10) {
    myweekday = '0' + myweekday;
  }
  return myyear + '-' + mymonth + '-' + myweekday;
}
// 获得某月的天数
export function getMonthDays(myMonth) {
  var now = new Date(); //当前日期
  var nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0; //
  var monthStartDate = new Date(nowYear, myMonth, 1);
  var monthEndDate = new Date(nowYear, myMonth + 1, 1);
  var days = (monthEndDate - monthStartDate) / (1000 * 60 * 60 * 24);
  return days;
}
// 获得当年的第一天
export function getNowYearFirstDay(myMonth) {
  var now = new Date().getFullYear();
  return now + '-' + '01-01';
}
// 获得当年的最后一天
export function getNowYearLastDay(myMonth) {
  var now = new Date().getFullYear();
  return now + '-' + '12-31';
}
// 获取昨天日期
export function getYesterDay() {
  var day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000);
  return formatDate(day1);
}
// 获取明天日期
export function getTomorrow() {
  var day1 = new Date();
  day1.setTime(day1.getTime() + 24 * 60 * 60 * 1000);
  return formatDate(day1);
}
// 获取今天日期
export function getToday() {
  return formatDate(new Date());
}

// 将秒转换成--年月日时分秒
export function getDateStr(seconds) {
  if (!seconds) return '--';
  var date = new Date(seconds * 1000);
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  var second = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  var currentTime = year + '-' + month + '-' + day + '  ' + hour + ':' + minute + ':' + second;
  return currentTime;
}

// 将秒转换成--年月日
export function getDateStrDay(seconds) {
  if (!seconds) return '--';
  var date = new Date(seconds * 1000);
  var year = date.getFullYear();
  var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  var currentTime = year + '-' + month + '-' + day;
  return currentTime;
}

//将秒转化为年月日时分
export function getDateStrTomin(seconds) {
  if (!seconds) return '--';
  var date = new Date(seconds * 1000);
  var year = date.getFullYear();
  var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  //    var second = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
  var currentTime = year + '-' + month + '-' + day + '  ' + hour + ':' + minute;
  return currentTime;
}

export function getDateStrTomins(seconds) {
  if (!seconds) return '--';
  var date = new Date(seconds * 1000);
  var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  var currentTime = hour + ':' + minute;
  return currentTime;
}

// 数据转化 千分位i增加，
export function transform(number) {
  var num = number.toString();
  var numArr = num.split('.');
  var [num, dotNum] = numArr;
  var operateNum = num.split('').reverse();
  var result = [],
    len = operateNum.length;
  for (var i = 0; i < len; i++) {
    result.push(operateNum[i]);
    if ((i + 1) % 3 === 0 && i !== len - 1) {
      result.push(',');
    }
  }
  if (dotNum) {
    result.reverse().push('.', ...dotNum);
    return result.join('');
  } else {
    return result.reverse().join('');
  }
}
// 判断是否是uft-8的模式
export function isUTF8(bytes) {
  var i = 0;
  while (i < bytes.length) {
    if (
      // ASCII
      bytes[i] == 0x09 ||
      bytes[i] == 0x0a ||
      bytes[i] == 0x0d ||
      (0x20 <= bytes[i] && bytes[i] <= 0x7e)
    ) {
      i += 1;
      continue;
    }

    if (
      // non-overlong 2-byte
      0xc2 <= bytes[i] &&
      bytes[i] <= 0xdf &&
      0x80 <= bytes[i + 1] &&
      bytes[i + 1] <= 0xbf
    ) {
      i += 2;
      continue;
    }

    if (
      // excluding overlongs
      (bytes[i] == 0xe0 &&
        0xa0 <= bytes[i + 1] &&
        bytes[i + 1] <= 0xbf &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf) || // straight 3-byte
      (((0xe1 <= bytes[i] && bytes[i] <= 0xec) || bytes[i] == 0xee || bytes[i] == 0xef) &&
        0x80 <= bytes[i + 1] &&
        bytes[i + 1] <= 0xbf &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf) || // excluding surrogates
      (bytes[i] == 0xed &&
        0x80 <= bytes[i + 1] &&
        bytes[i + 1] <= 0x9f &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf)
    ) {
      i += 3;
      continue;
    }

    if (
      // planes 1-3
      (bytes[i] == 0xf0 &&
        0x90 <= bytes[i + 1] &&
        bytes[i + 1] <= 0xbf &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf &&
        0x80 <= bytes[i + 3] &&
        bytes[i + 3] <= 0xbf) || // planes 4-15
      (0xf1 <= bytes[i] &&
        bytes[i] <= 0xf3 &&
        0x80 <= bytes[i + 1] &&
        bytes[i + 1] <= 0xbf &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf &&
        0x80 <= bytes[i + 3] &&
        bytes[i + 3] <= 0xbf) || // plane 16
      (bytes[i] == 0xf4 &&
        0x80 <= bytes[i + 1] &&
        bytes[i + 1] <= 0x8f &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf &&
        0x80 <= bytes[i + 3] &&
        bytes[i + 3] <= 0xbf)
    ) {
      i += 4;
      continue;
    }
    return false;
  }
  return true;
}

export function defaultPickerOptions() {
  return {
    disabledDate(val) {
      if (moment(val).format('YYYY-MM-DD') > moment().format('YYYY-MM-DD')) return true;
      return false;
    },
    shortcuts: [
      {
        text: '今天',
        onClick(picker) {
          picker.$emit('pick', [new Date(), new Date()]);
        },
      },
      {
        text: '昨天',
        onClick(picker) {
          const date = new Date();
          date.setTime(date.getTime() - 3600 * 1000 * 24);
          picker.$emit('pick', [date, date]);
        },
      },
      {
        text: '近3天',
        onClick(picker) {
          const start_date = new Date();
          start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * 2);
          picker.$emit('pick', [start_date, new Date()]);
        },
      },
      {
        text: '近7天',
        onClick(picker) {
          const start_date = new Date();
          start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * 6);
          picker.$emit('pick', [start_date, new Date()]);
        },
      },
      {
        text: '近30天',
        onClick(picker) {
          const start_date = new Date();
          start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * 29);
          picker.$emit('pick', [start_date, new Date()]);
        },
      },
      {
        text: '本周',
        onClick(picker) {
          const start_date = new Date();
          const nowDayOfWeek = start_date.getDay();
          start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * (nowDayOfWeek - 1));
          const end_date = new Date();
          picker.$emit('pick', [start_date, end_date]);
        },
      },
      {
        text: '上周',
        onClick(picker) {
          const start_date = new Date();
          const nowDayOfWeek = start_date.getDay();
          start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * (nowDayOfWeek - 1 + 7));
          const end_date = new Date();
          end_date.setTime(end_date.getTime() - 3600 * 1000 * 24 * nowDayOfWeek);
          picker.$emit('pick', [start_date, end_date]);
        },
      },
      {
        text: '本月',
        onClick(picker) {
          picker.$emit('pick', [getMonthStartDate(), getToday()]);
        },
      },
      {
        text: '上月',
        onClick(picker) {
          picker.$emit('pick', [getLastMonthStartDate(), getLastMonthEndDate()]);
        },
      },
    ],
  };
}

export function monthPickerOptions() {
  return {
    disabledDate(val) {
      if (moment(val).format('YYYY-MM-DD') > moment().format('YYYY-MM-DD')) return true;
      return false;
    },
    shortcuts: [
      {
        text: '本月',
        onClick(picker) {
          picker.$emit('pick', [getMonthStartDate(), getToday()]);
        },
      },
      {
        text: '上月',
        onClick(picker) {
          picker.$emit('pick', [getLastMonthStartDate(), getLastMonthEndDate()]);
        },
      },
      {
        text: '近三个月',
        onClick(picker) {
          picker.$emit('pick', [getLastThreeMonths().startDate, getLastThreeMonths().endDate]);
        },
      },
      {
        text: '近半年',
        onClick(picker) {
          picker.$emit('pick', [getLastSixMonths().startDate, getLastSixMonths().endDate]);
        },
      },
      {
        text: '近一年',
        onClick(picker) {
          picker.$emit('pick', [getLastYear().startDate, getLastYear().endDate]);
        },
      },
    ],
  };
}

export function getWeekDays() {
  let start = moment().weekday(0).format('YYYY-MM-DD');
  let end = moment().weekday(6).format('YYYY-MM-DD');
  return [start, end];
}


/**
 * 将 'YYYY-MM-DD' 'YYYY-MM-DD SS:SS:SS' 等类型 转换为 'MM/DD' 型
 * @param {Date String} date  
 * @returns 'MM/DD' 型 Date String
 */
export function formatDate2MMDD(date) {
  if(!date) return '--'
  let newdate = moment(date).format('YYYY-MM-DD');
  return newdate;
}