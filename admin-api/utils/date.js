const moment = require("moment");

function getDate() {
  moment.locale('zh-cn');
  const date = {};
  const _today = moment();
  date.today = _today.format('YYYY-MM-DD');
  date.yesterday = _today.subtract(1, 'days').format('YYYY-MM-DD');
  return date;
};
/**
 *  获取年份
 *  date: new Date()
 *  delimiter: 分隔符
 *  默认返回：****-**-**
 * */
function formatDate(date, delimiter = "-") {
  let myyear = date.getFullYear();
  let mymonth = date.getMonth()+1;
  let myweekday = date.getDate();

  if(mymonth < 10){
    mymonth = "0" + mymonth;
  }
  if(myweekday < 10){
    myweekday = "0" + myweekday;
  }
  return (myyear + delimiter + mymonth + delimiter + myweekday);
}
//获得本月的开始日期 
function getMonthStartDate() {
  var now = new Date(); //当前日期 
  var nowMonth = now.getMonth(); //当前月 
  var nowYear = now.getYear(); //当前年 
  nowYear += (nowYear < 2000) ? 1900 : 0;
  var monthStartDate = new Date(nowYear, nowMonth, 1);
  return formatDate(monthStartDate);
}
// 获取昨天日期
function getYesterDay() {
  var day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000);
  return formatDate(day1);
}
// 获取过去七天日期
function getPassSevenDay() {
  var day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000 * 7);
  return formatDate(day1);
}
// 获取今天日期
function getToday() {
  return formatDate(new Date());
}
/**
 *  获取当前时间 00:00:00的秒数
 *  参数：
 *    second: 时间秒
 * */
function getDayTimeStart(second){
  let date = formatDate(new Date(second*1000));
  return new Date(date + " 00:00:00").getTime()/1000
}

/**
 *  获取当前时间 23:59:59的秒数
 *  参数：
 *    second: 时间秒
 * */
function getDayTimeEnd(second){
  let date = formatDate(new Date(second*1000));
  return new Date(date + " 23:59:59").getTime()/1000
}

/**
 *  获取当前时间 00:00:00的秒数
 *  参数：
 *    date: XXXX-XX-XX
 * */
function getDateTimeStart(date){
  return new Date(date + " 00:00:00").getTime()/1000
}

/**
 *  获取当前时间 23:59:59的秒数
 *  参数：
 *    date: XXXX-XX-XX
 * */
function getDateTimeEnd(date){
  return new Date(date + " 23:59:59").getTime()/1000
}
//获得上月开始时间
function getLastMonthStartDate() {
  var now = new Date(); //当前日期 
  var nowYear = now.getYear(); //当前年 
  nowYear += (nowYear < 2000) ? 1900 : 0;
  var lastMonthDate = new Date(); //上月日期
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  var lastMonth = lastMonthDate.getMonth();
  var lastMonthStartDate = new Date(nowYear, lastMonth, 1);
  return formatDate(lastMonthStartDate);
}
//获得上月结束时间
function getLastMonthEndDate() {
  var now = new Date(); //当前日期 
  var nowYear = now.getYear(); //当前年 
  nowYear += (nowYear < 2000) ? 1900 : 0;
  var lastMonthDate = new Date(); //上月日期
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  var lastMonth = lastMonthDate.getMonth();
  var lastMonthEndDate = new Date(nowYear, lastMonth, getMonthDays(lastMonth));
  return formatDate(lastMonthEndDate);
}
function getMonthDays(myMonth) {
  var now = new Date(); //当前日期  
  var nowYear = now.getYear(); //当前年 
  nowYear += (nowYear < 2000) ? 1900 : 0; //
  var monthStartDate = new Date(nowYear, myMonth, 1);
  var monthEndDate = new Date(nowYear, myMonth + 1, 1);
  var days = (monthEndDate - monthStartDate) / (1000 * 60 * 60 * 24);
  return days;
}

// 获取本周
function getThisWeek(){
  const start_date = new Date();
  const day = start_date.getDay();
  start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * (day-1));
  const end_date = new Date();
  return [formatDate(start_date), formatDate(end_date)]
}

// 获取本月
function getThisMonth(){
  return [getMonthStartDate(), getToday()]
}


module.exports = {
  getDate,
  formatDate,
  getDayTimeStart,
  getDayTimeEnd,
  getDateTimeStart,
  getDateTimeEnd,
  getMonthStartDate,
  getYesterDay,
  getPassSevenDay,
  getToday,
  getLastMonthStartDate,
  getLastMonthEndDate,
  getMonthDays,
  getThisWeek,
  getThisMonth
}