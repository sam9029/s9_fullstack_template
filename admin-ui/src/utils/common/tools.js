import SparkMD5 from 'spark-md5';
import { v4 as uuidV4 } from 'uuid';

// 生成uuid
export function uuid(hyphen = '') {
  return uuidV4().replace(/-/g, hyphen);
}

// 固定显示两位小数
export function fixedNumber(param) {
  try {
    let num =
      Number.parseFloat(param).toFixed(2) == 'NaN' ? '0.00' : Number.parseFloat(param).toFixed(2);
    return num.toString();
  } catch (e) {
    console.log('hey, error in fixedNumber');
    return '0.00';
  }
}

// 数组转字符串
export function arr2str(arr) {
  if (Array.isArray(arr)) {
    let str = arr.join(',');
    return str;
  } else {
    return arr;
  }
}

// 把查询对象的属性值全部转为字符串
export function query2str(query) {
  if (!query) return query;
  let str = _.cloneDeep(query);
  for (let key of Object.keys(str)) {
    str[key] = arr2str(str[key]);
  }
  return str;
}

// yy-mm-dd
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

function compare(obj, _obj) {
  const obj_length = Object.keys(obj).length;
  const _obj_length = Object.keys(_obj).length;
  obj._tag = 'old';
  _obj._tag = 'new';

  const loop_obj = obj_length >= _obj_length ? obj : _obj;
  for (let key of Object.keys(loop_obj)) {
    if (key == '_tag') continue;
    if (obj[key] !== _obj[key]) {
      console.log(`${obj._tag}: ${obj[key]} | ${_obj._tag}: ${_obj[key]}`);
    }
  }
}

class TreeNode {
  static counter = 0;
  constructor(pid, label, level, path, id = `${TreeNode.counter++}`, children = []) {
    this.pid = pid;
    this.id = id;
    this.label = label;
    this.children = children;
    this.level = level;
    this.path = path;
  }
}

function getIndex(node, label, level) {
  const index = node.children.findIndex((item) => {
    return item.label === label;
  });
  if (index < 0) {
    const child = new TreeNode(node.id, label, level, level > 1 ? node.path : '');
    if (level > 1) child.path += child.path ? `-${node.id}` : `${node.id}`;
    node.children.push(child);
    return getIndex(node, label);
  }
  return index;
}

function getNode(tree, condition, obj) {
  let node = tree;
  let level = 1;
  condition.forEach((item) => {
    const pid = node.id;
    node = node.children[getIndex(node, obj[item], level)];
    level += 1;
  });
  return node;
}

/**
 * @description: 将数组按需求转成树
 * @param {Array<Object>} source - 源数组
 * @param {String} label - 最后的叶子节点的label
 * @param {String} condition - 每一级分类的tag
 * @return: Tree
 */
export function arrayTotree(source, label, ...condition) {
  const root = new TreeNode(-1, 'root', 0, '', '0');
  source.forEach((item) => {
    const node = getNode(root, condition, item);
    const level = condition.length + 1;
    const child = new TreeNode(node.id, item[label], level, node.path, item.id);
    if (level > 1) child.path += child.path ? `-${node.id}` : `${node.id}`;
    node.children.push(child);
  });
  return root;
}

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

//获得本周的开始日期
export function getWeekStartDate() {
  var date = new Date();
  var today = date.getDay();
  var stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  var stepMonday = 7 - today;
  var time = date.getTime();
  var monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  var sunday = new Date(time + stepMonday * 24 * 3600 * 1000);
  //var startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得上周的开始日期
export function getLastWeekStartDate() {
  var date = new Date();
  var today = date.getDay();
  var stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  var stepMonday = 7 - today;
  var time = date.getTime();
  time = time - 24 * 3600 * 1000 * 7;
  var monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  var sunday = new Date(time + stepMonday * 24 * 3600 * 1000 - 24 * 3600 * 1000 * 7);
  //var startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得上周的结束日期
export function getLastWeekEndDate() {
  var date = new Date();
  var today = date.getDay();
  var stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  var stepMonday = 7 - today;
  var time = date.getTime();
  time = time - 24 * 3600 * 1000;
  var monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  var sunday = new Date(time + stepMonday * 24 * 3600 * 1000 - 24 * 3600 * 1000 * 7);
  //var startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得上上周的开始日期
export function getLastLastWeekStartDate() {
  var date = new Date();
  var today = date.getDay();
  var stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  var stepMonday = 7 - today;
  var time = date.getTime();
  time = time - 24 * 3600 * 1000 * 14;
  var monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  var sunday = new Date(time + stepMonday * 24 * 3600 * 1000 - 24 * 3600 * 1000 * 7);
  //var startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得上上周的结束日期
export function getLastLsatWeekEndDate() {
  var date = new Date();
  var today = date.getDay();
  var stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  var stepMonday = 7 - today;
  var time = date.getTime();
  time = time - 24 * 3600 * 1000 * 8;
  var monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  var sunday = new Date(time + stepMonday * 24 * 3600 * 1000 - 24 * 3600 * 1000 * 7);
  //var startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
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
  var now = new Date(); //当前日期
  var nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0;
  let nowMonth = new Date().getMonth();
  nowYear = nowMonth == 0 ? nowYear - 1 : nowYear;
  var lastMonthDate = new Date(); //上月日期
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  var lastMonth = lastMonthDate.getMonth();
  var lastMonthStartDate = new Date(nowYear, lastMonth, 1);
  return formatDate(lastMonthStartDate);
}
//获得上月结束时间
export function getLastMonthEndDate() {
  var now = new Date(); //当前日期
  var nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0;
  let nowMonth = new Date().getMonth();
  nowYear = nowMonth == 0 ? nowYear - 1 : nowYear;
  var lastMonthDate = new Date(); //上月日期
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  var lastMonth = lastMonthDate.getMonth();
  var lastMonthEndDate = new Date(nowYear, lastMonth, getMonthDays(lastMonth));
  return formatDate(lastMonthEndDate);
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
// 获取过去任意一天日期
export function getLastDayByDay(day) {
  var day1 = new Date();
  let flag = day || 1;
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000 * flag);
  return formatDate(day1);
}
// 获取过去七天日期
export function getPassSevenDay() {
  var day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000 * 7);
  return formatDate(day1);
}
// 获取过去30天日期
export function getPassThirtyDay() {
  var day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000 * 30);
  return formatDate(day1);
}

// 获取过去180天日期
export function getPassHalfYear() {
  var day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000 * 180);
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
/**
 * 根据传递日期和day获取过去日期
 * @param {*} currentDate
 * @param {*} day
 */
export function getLastDayByDate(currentDate, day) {
  let date = currentDate ? new Date(currentDate) : new Date();
  let num = day || 1;
  date.setTime(date.getTime() - 24 * 60 * 60 * 1000 * num);
  return formatDate(date);
}
/**
 * 获取日期差
 * @param {date} dateStart
 * @param {date} dateEnd
 */
export function getDateDiffDay(dateStart, dateEnd) {
  let date1 = new Date(dateStart);
  let date2 = new Date(dateEnd);
  return Math.ceil(date2.getTime() / 1000 - date1.getTime() / 1000) / 24 / 60 / 60;
}

// 将秒转换成--年月日时分秒
export function getDateStr(seconds) {
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

// 将秒转换成--年月日时分
export function getDateStrMin(seconds) {
  var date = new Date(seconds * 1000);
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  var second = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  var currentTime = year + '-' + month + '-' + day + '  ' + hour + ':' + minute;
  return currentTime;
}

// 将秒转换成--年月日时分秒
export function getDateStrDay(seconds) {
  var date = new Date(seconds * 1000);
  var year = date.getFullYear();
  var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  var currentTime = year + '-' + month + '-' + day;
  return currentTime;
}

// 将毫秒级的时间间隔转换成--以分或秒为单位的表示形式
export function getTimeIntervalFormate(ms) {
  let second = parseInt(ms / 1000);
  if (second < 60) return second + 's';
  let min = Math.floor(second / 60);
  let sec = second % 60;
  return min + 'm ' + sec + 's';
}

// 数据转化 千分位i增加，
export function transform(number) {
  if (!number) return 0;
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

// 去除数组内的undefined和empty以及null, 返回值为去除掉三种值的新数组
export function delUndefinedInArr(arr) {
  let res = new Array();
  if (arr instanceof Array) {
    arr.forEach(function (item) {
      if (item) {
        res.push(item);
      } else if (typeof item !== 'undefined' && typeof item !== 'object') {
        res.push(item);
      }
    });
    return res;
  } else {
    return arr;
  }
}

/**
 * @description: 生成一定长度的数字字母混合字符串
 * @param { Number } length - 生成字符串的长度
 * @return { String }
 */
export function createBidUrl(length) {
  const lowerAlphabet = 'qwertyuiopasdfghjklzxcvbnm';
  const number = '1234567890';
  const source = [...lowerAlphabet, ...number];
  let res = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * source.length);
    res += source[index];
  }
  return res;
}

/**
 * @description: 根据字符串 截取 空格、回车 ,，；;
 * @param { String }
 * @return { Array }
 */
export function returnSplitArray(str) {
  let temp = str.split(/[\n\s+,，；;]/g);
  for (let i = 0; i < temp.length; i++) {
    temp[i] = temp[i].trim();
    if (temp[i] == '') {
      // 删除数组中空值
      temp.splice(i, 1);
      i--;
    }
  }
  return temp;
}

export function ConverSearchFilter(query) {
  let params = '';
  let queryObj = _.cloneDeep(query);
  for (var key in queryObj) {
    if (queryObj[key] != null) {
      params += `${key}=${queryObj[key]}&`;
    }
  }
  return params.substring(0, params.length - 1);
}

/**
 * @description: 获取target的数据类型
 * @param {Object} target - 观察对象
 * @return: 数据类型字符串
 */
export function getType(target) {
  const str = Object.prototype.toString.call(target);
  return str.slice(8, str.length - 1);
}

export function lastDate30() {
  const start_date = new Date();
  let date = start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * 29);
  return formatDate(new Date(date));
}
export function ArrQuery2str(query) {
  if (!query) return query;
  let str = Object.assign({}, query);
  let strAll = '';
  for (let key of Object.keys(str)) {
    if (Array.isArray(str[key])) {
      for (let j = 0; j < str[key].length; j++) {
        let val = str[key];
        strAll = strAll + key + '=' + val[j] + '&';
      }
    } else {
      strAll = strAll + key + '=' + str[key] + '&';
    }
  }
  strAll = strAll.substring(0, strAll.length - 1);
  // console.log(strAll)
  return strAll;
}

// 增加css样式
export function addNewStyle(newStyle) {
  var styleElement = document.getElementById('styles_js');

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.id = 'styles_js';
    document.getElementsByTagName('head')[0].appendChild(styleElement);
  }

  styleElement.appendChild(document.createTextNode(newStyle));
}

//爱奇艺广告投放字段转化
export function aiqiyiScheduleTransform(data, bool = false) {
  let arr = data;
  const week = {
    0: '星期天',
    1: '星期一',
    2: '星期二',
    3: '星期三',
    4: '星期四',
    5: '星期五',
    6: '星期六',
  };
  let result = arr.map((item, index) => {
    let res = item.match(/0+|1+/g);
    let str = '';
    let count = 0;
    return (item = res.map((v) => {
      if (Array.from(new Set(v.split('')))[0] == 0) {
        count += v.length;
      }
      if (Array.from(new Set(v.split('')))[0] == 1) {
        str +=
          (count < 10 ? '0' : '') +
          `${count}:00` +
          '-' +
          `${count + v.length}:00` +
          '&nbsp' +
          '&nbsp' +
          '&nbsp';
        count += v.length;
      }
      return (v = str);
    }));
  });
  if (bool) {
    return result.map((b, index) => {
      if (b[b.length - 1]) {
        return week[index] + ':' + '&nbsp' + '&nbsp' + '&nbsp' + b[b.length - 1] + '</br>';
      } else {
        return '';
      }
    });
  }
  return result
    .map((b, index) => {
      if (b[b.length - 1]) {
        return week[index] + ':' + '&nbsp' + '&nbsp' + '&nbsp' + b[b.length - 1] + '</br>';
      } else {
        return '';
      }
    })
    .join('');
}
//头条广告投放字段转化
export function toutiaoScheduleTransform(data, bool = false) {
  let arr = JSON.parse(JSON.stringify(data));
  const week = {
    0: '星期天',
    1: '星期一',
    2: '星期二',
    3: '星期三',
    4: '星期四',
    5: '星期五',
    6: '星期六',
  };
  let result = arr.map((item, index) => {
    let res = item.match(/0+|1+/g);
    let str = '';
    let count = 0;
    return (item = res.map((v) => {
      if (Array.from(new Set(v.split('')))[0] == 0) {
        count += v.length;
      }
      if (Array.from(new Set(v.split('')))[0] == 1) {
        // str += (count < 10 ? '0' : '') +`${count}:00` + '-' + `${count+v.length}:00` +'&nbsp'+'&nbsp'+'&nbsp'
        if (count % 2 == 0) {
          str += (count < 20 ? '0' : '') + `${count / 2}:00`;
          if ((count + v.length) % 2 == 0) {
            str += '~' + `${(count + v.length) / 2}:00` + '&nbsp' + '&nbsp' + '&nbsp';
          } else {
            str += '~' + `${Math.floor((count + v.length) / 2)}:30` + '&nbsp' + '&nbsp' + '&nbsp';
          }
        } else {
          str += (count < 20 ? '0' : '') + `${Math.floor(count / 2)}:30`;
          if ((count + v.length) % 2 == 0) {
            str += '~' + `${(count + v.length) / 2}:00` + '&nbsp' + '&nbsp' + '&nbsp';
          } else {
            str += '~' + `${Math.floor((count + v.length) / 2)}:30` + '&nbsp' + '&nbsp' + '&nbsp';
          }
        }
        count += v.length;
      }
      return (v = str);
    }));
  });
  if (bool) {
    return result.map((b, index) => {
      if (b[b.length - 1]) {
        return (
          '<div style="line-height:16px">' +
          week[index] +
          '：' +
          '&nbsp' +
          '&nbsp' +
          '&nbsp' +
          b[b.length - 1] +
          '</div>'
        );
      } else {
        return '';
      }
    });
  }
  return result
    .map((b, index) => {
      if (b[b.length - 1]) {
        return (
          '<div style="line-height:16px">' +
          week[index] +
          '：' +
          '&nbsp' +
          '&nbsp' +
          '&nbsp' +
          b[b.length - 1] +
          '</div>'
        );
      } else {
        return '';
      }
    })
    .join('');
}
export function gdtScheduleTransform(data) {
  let arr = JSON.parse(JSON.stringify(data));
  const week = {
    0: '星期天',
    1: '星期一',
    2: '星期二',
    3: '星期三',
    4: '星期四',
    5: '星期五',
    6: '星期六',
  };
  let result = arr.map((item, index) => {
    let res = item.match(/0+|1+/g);
    let str = '';
    let count = 0;
    return (item = res.map((v) => {
      if (Array.from(new Set(v.split('')))[0] == 0) {
        count += v.length;
      }
      if (Array.from(new Set(v.split('')))[0] == 1) {
        // str += (count < 10 ? '0' : '') +`${count}:00` + '-' + `${count+v.length}:00` +'&nbsp'+'&nbsp'+'&nbsp'
        if (count % 2 == 0) {
          str += (count < 20 ? '0' : '') + `${count / 2}:00`;
          if ((count + v.length) % 2 == 0) {
            str += '~' + (count + v.length < 20 ? '0' : '') + `${(count + v.length) / 2}:00` + ' ';
          } else {
            str +=
              '~' +
              (count + v.length < 20 ? '0' : '') +
              `${Math.floor((count + v.length) / 2)}:30` +
              ' ';
          }
        } else {
          str += (count < 20 ? '0' : '') + `${Math.floor(count / 2)}:30`;
          if ((count + v.length) % 2 == 0) {
            str += '~' + (count + v.length < 20 ? '0' : '') + `${(count + v.length) / 2}:00` + ' ';
          } else {
            str +=
              '~' +
              (count + v.length < 20 ? '0' : '') +
              `${Math.floor((count + v.length) / 2)}:30` +
              ' ';
          }
        }
        count += v.length;
      }
      return (v = str);
    }));
  });
  if (data.length == 1) {
    return result
      .map((b, index) => {
        if (b[b.length - 1]) {
          return b[b.length - 1];
        } else {
          return '';
        }
      })
      .join('');
  } else {
    return result
      .map((b, index) => {
        if (b[b.length - 1]) {
          return week[index] + '：' + b[b.length - 1];
        } else {
          return '';
        }
      })
      .join('<br>');
  }
}
export function kuaishouScheduleTransform(data, bool) {
  let arr = JSON.parse(JSON.stringify(data));
  const week = {
    0: '星期天',
    1: '星期一',
    2: '星期二',
    3: '星期三',
    4: '星期四',
    5: '星期五',
    6: '星期六',
  };
  let result = arr.map((item, index) => {
    let res = item.match(/0+|1+/g);
    let str = '';
    let count = 0;
    return (item = res.map((v) => {
      if (Array.from(new Set(v.split('')))[0] == 0) {
        count += v.length;
      }
      if (Array.from(new Set(v.split('')))[0] == 1) {
        if (str != '') str += '、' + (count < 10 ? '0' : '') + `${count}:00`;
        else str += (count < 10 ? '0' : '') + `${count}:00`;
        str += '~' + (count + v.length < 10 ? '0' : '') + `${count + v.length}:59`;
        count += v.length;
      }
      return (v = str);
    }));
  });
  if (bool) {
    return result.map((b, index) => {
      if (b[b.length - 1]) {
        return week[index] + '(' + b[b.length - 1] + ')';
      }
      // else {
      //   return week[index] + '(不投放)'
      // }
    });
  } else {
    return result
      .map((b, index) => {
        if (b[b.length - 1]) {
          return week[index] + '：' + b[b.length - 1];
        } else {
          return '';
        }
      })
      .join('<br>');
  }
}
export function fomatFloat(src, pos) {
  if (src.toString() == 'Infinity' || src.toString() == 'NaN') src = 0;
  //console.log(src);
  //保留两位小数，不改变类型
  return Math.round(src * Math.pow(10, pos)) / Math.pow(10, pos);
}

export function number_format(number, decimals, dec_point, thousands_sep) {
  /*
   * 参数说明：
   * number：要格式化的数字
   * decimals：保留几位小数
   * dec_point：小数点符号
   * thousands_sep：千分位符号
   * */
  number = (number + '').replace(/[^0-9+-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 2 : Math.abs(decimals),
    sep = typeof thousands_sep === 'undefined' ? ',' : thousands_sep,
    dec = typeof dec_point === 'undefined' ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return '' + Math.ceil(n * k) / k;
    };

  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  var re = /(-?\d+)(\d{3})/;
  while (re.test(s[0])) {
    s[0] = s[0].replace(re, '$1' + sep + '$2');
  }

  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}
// var json2csv = require('json2csv');
export function down_load(json_fields, rows, name) {
  let fields = Object.keys(json_fields);
  let data = [];
  if (rows && rows.length) {
    rows.forEach((element) => {
      let item = {};
      fields.forEach((i) => {
        let key = json_fields[i];
        item[i] = element[key];
      });
      data.push(item);
    });
  }
  try {
    const result = json2csv.parse(data, {
      fields: fields,
      excelStrings: false,
    });
    if (MyBrowserIsIE()) {
      // IE10以及Edge浏览器
      var BOM = '\uFEFF';
      // 文件转Blob格式
      var csvData = new Blob([BOM + result], {
        type: 'text/csv',
      });
      navigator.msSaveBlob(csvData, name);
    } else {
      let csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + result;
      // 非ie 浏览器
      createDownLoadClick(csvContent, name);
    }
  } catch (err) {
    alert(err);
  }
}
// 判断是否IE浏览器
export function MyBrowserIsIE() {
  let isIE = false;
  if (navigator.userAgent.indexOf('compatible') > -1 && navigator.userAgent.indexOf('MSIE') > -1) {
    // ie浏览器
    isIE = true;
  }
  if (navigator.userAgent.indexOf('Trident') > -1) {
    // edge 浏览器
    isIE = true;
  }
  return isIE;
}
//创建下载元素
export function createDownLoadClick(content, fileName) {
  const link = document.createElement('a');
  link.href = encodeURI(content);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
export function nowDateFormat(formatStr) {
  var now = new Date();
  var str = formatStr;
  var Week = ['日', '一', '二', '三', '四', '五', '六'];

  str = str.replace(/yyyy|YYYY/, now.getFullYear());
  str = str.replace(
    /yy|YY/,
    now.getYear() % 100 > 9 ? (now.getYear() % 100).toString() : '0' + (now.getYear() % 100),
  );

  str = str.replace(
    /MM/,
    now.getMonth() > 9 ? (now.getMonth() + 1).toString() : '0' + (now.getMonth() + 1),
  );
  str = str.replace(/M/g, now.getMonth());

  str = str.replace(/w|W/g, Week[now.getDay()]);

  str = str.replace(/dd|DD/, now.getDate() > 9 ? now.getDate().toString() : '0' + now.getDate());
  str = str.replace(/d|D/g, now.getDate());

  str = str.replace(/hh|HH/, now.getHours() > 9 ? now.getHours().toString() : '0' + now.getHours());
  str = str.replace(/h|H/g, now.getHours());
  str = str.replace(
    /mm/,
    now.getMinutes() > 9 ? now.getMinutes().toString() : '0' + now.getMinutes(),
  );
  str = str.replace(/m/g, now.getMinutes());

  str = str.replace(
    /ss|SS/,
    now.getSeconds() > 9 ? now.getSeconds().toString() : '0' + now.getSeconds(),
  );
  str = str.replace(/s|S/g, now.getSeconds());

  return str;
}
export function arr_diff(a, b) {
  let e = Array.from(new Set([...a, ...b]));
  let f = [...e.filter((_) => !a.includes(_)), ...e.filter((_) => !b.includes(_))];
  return f;
}

export function _debounce(fn, delay = 300) {
  var timer = null;
  return function () {
    var _this = this;
    var args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(_this, args);
    }, delay);
  };
}

export function countStringLength(string) {
  var len = string.length;
  var count = 0;
  for (var i = 0; i < len; i++) {
    var num = string.charCodeAt(i);
    if (num == 94 || num > 127) {
      count += 2;
    } else {
      count += 1;
    }
  }
  return count;
}

export function timeToDate(date, fmt) {
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
  };
  for (let k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      let str = o[k] + '';
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : padLeftZero(str));
    }
  }
  return fmt;
}

function padLeftZero(str) {
  return ('00' + str).substr(str.length);
}

// 处理时间拼接 (年月日 hh:mm) 为时间戳
export function handleDateJoint(data, time) {
  // console.log('需要拼接的时间',data,time);
  let dateTex = new Date(data);
  let year = dateTex.getFullYear();
  let month = dateTex.getMonth() + 1;
  let day = dateTex.getDate();
  let bancTime = `${year}-${month}-${day} ${time}`;
  // console.log('拼接完成后',bancTime);
  // console.log('返回的时间戳',new Date(bancTime).getTime());
  return new Date(bancTime).getTime();
}

export function formatDateSjc(shijianchuo) {
  //shijianchuo是整数，否则要parseInt转换
  var time = new Date(shijianchuo);
  var y = time.getFullYear();
  var m = time.getMonth() + 1;
  var d = time.getDate();
  return y + '-' + add0(m) + '-' + add0(d);
}
function add0(m) {
  return m < 10 ? '0' + m : m;
}

export function copyText(text = '', event = { pageY: 0 }) {
  if (!text) return false;
  if (navigator.clipboard) {
    // clipboard api 复制
    navigator.clipboard.writeText(text);
  } else {
    var textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    // 隐藏此输入框
    textarea.style.position = 'fixed';
    textarea.style.clip = 'rect(0 0 0 0)';
    textarea.style.top = '10px';
    // 赋值
    textarea.value = text;
    // 选中
    textarea.select();
    // 复制
    document.execCommand('copy', true);
    // 移除输入框
    document.body.removeChild(textarea);
  }
  return true;
}

export function promiseFileMd5(file) {
  let currentChunk = 4194304; // 4M
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    reader.onload = ({ target: { result } }) => {
      spark.append(result);
      if (currentChunk >= file.size) {
        reader.removeEventListener('load', reader.onload);
        reader.removeEventListener('error', reader.onerror);
        resolve(spark.end());
      } else {
        const start = currentChunk;
        currentChunk += 2097152;
        const end = Math.min(currentChunk, file.size);
        reader.readAsArrayBuffer(blobSlice.call(file, start, end));
      }
    };
    reader.onerror = function () {
      reader.removeEventListener('load', reader.onload);
      reader.removeEventListener('error', reader.onerror);
      reject('E_READ_FAIL');
    };
    const end = Math.min(currentChunk, file.size);
    reader.readAsArrayBuffer(blobSlice.call(file, 0, end));
  });
}

/**
 * 生成文件的base64预览链接
 * @param {*} base64Data // 包括图片、视频，文档等数据
 * @returns
 */
export function generatePreviewLink(base64Data) {
  // 由于传入的是File对象，我们直接使用其type属性作为文件类型
  const fileType = base64Data.type;

  // 创建一个Blob对象，将Base64数据和文件类型作为参数传入
  const blob = new Blob([base64Data], { type: fileType });

  // 利用URL.createObjectURL创建一个URL
  const fileUrl = URL.createObjectURL(blob);

  // 返回这个URL，即可用于文件的预览
  return fileUrl;
}

/**
 *  获取 视频 第一帧 作为封面
 * @param {video_file_url} video _videoEl
 * @return {String} imgUrl base64_image_url
 */
export function generateVideoScreenshot(video_file_url) {
  // 创建视频元素
  let videoEl = document.createElement('video');
  videoEl.src = video_file_url;

  // 设定
  let imgUrl = null;
  videoEl.currentTime = 2; // 第一帧
  videoEl.oncanplay = () => {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d'); // 绘制2d
    canvas.width = videoEl.clientWidth; // 获取视频宽度
    canvas.height = videoEl.clientHeight; // 获取视频高度
    // 利用canvas对象方法绘图
    ctx.drawImage(videoEl, 0, 0, videoEl.clientWidth, videoEl.clientHeight);
    // 转换成base64形式
    imgUrl = canvas.toDataURL('image/png');
  };
  return imgUrl;
}
