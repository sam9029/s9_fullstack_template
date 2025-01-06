import moment from 'moment';

export function formatDate(date, template = 'YYYY-MM-DD') {
  return moment(date).format(template);
}

//获得本月的开始日期
export function getMonthStartDate() {
  return moment().startOf('months').format('YYYY-MM-DD');
}
//获得本月的结束日期
export function getMonthEndDate() {
  return moment().endOf('months').format('YYYY-MM-DD');
}

//获得上月开始时间
export function getLastMonthStartDate() {
  return moment().subtract(1, 'months').startOf('months').format('YYYY-MM-DD');
}
//获得上月结束时间
export function getLastMonthEndDate() {
  return moment().subtract(1, 'months').endOf('months').format('YYYY-MM-DD');
}

//获得本周的开始日期
export function getWeekStartDate() {
  return moment().startOf('weeks').format('YYYY-MM-DD');
}
//获得本周的结束日期
export function getWeekEndDate() {
  return moment().endOf('weeks').format('YYYY-MM-DD');
}

//获得上周的开始日期
export function getLastWeekStartDate() {
  return moment().subtract(1, 'weeks').startOf('weeks').format('YYYY-MM-DD');
}
//获得上周的结束日期
export function getLastWeekEndDate() {
  return moment().subtract(1, 'weeks').endOf('weeks').format('YYYY-MM-DD');
}

// 获取过去任意一天日期
export function getLastDayByDay(day) {
  return moment().subtract(day, 'days').format('YYYY-MM-DD');
}
// 获取过去七天日期
export function getPassSevenDay() {
  return getLastDayByDay(6);
}
// 获取过去30天日期
export function getPassThirtyDay() {
  return getLastDayByDay(29);
}
