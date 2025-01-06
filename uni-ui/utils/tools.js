import store from "@/store/index.js";
import { appInfo } from "@/api/app_info.js";

const crypto = require("crypto");
/**
 * @description: 登录函数
 * @param {*} provider kuaishou - 登录;
 * @return {*}
 */
export function wxLogin(provider = "kuaishou") {
  return new Promise((resolve, reject) => {
    uni.login({
      provider,
      success: function (res) {
        resolve(res);
      },
      fail: function (err) {
        reject(err);
      },
    });
  });
}

export function wxCheckLogin() {
  return new Promise((resolve, reject) => {
    uni.checkSession({
      success: function (res) {
        resolve(res);
      },
      fail: function (err) {
        reject(err);
      },
    });
  });
}

export function uniModel(content, title) {
  return new Promise((resolve, reject) => {
    uni.showModal({
      content,
      cancelColor: "#909399",
      confirmColor: "#2979FF",
      success: function (res) {
        if (res.confirm) {
          resolve(res);
        } else if (res.cancel) {
          reject(res);
        }
      },
    });
  });
}

export function wxGetUserAuth() {
  return new Promise((resolve, reject) => {
    uni.getUserProfile({
      desc: "获取您的头像及其昵称",
      lang: "zh_CN",
      success: function (res) {
        resolve(res);
      },
      fail: function (err) {
        reject(err);
      },
    });
  });
}
export function getImageSrc(sourceType = "album") {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: sourceType,
      success(response) {
        // 选择图片后, 返回的数据
        let fileUrl = response.tempFilePaths[0];
        resolve(fileUrl);
      },
      fail(err) {
        reject(err);
      },
    });
  });
}
export function addArrayItem(array, item) {
  let newArray = JSON.parse(JSON.stringify(array || []));
  newArray.push(item);
  return newArray;
}
export function delArrayItem(array, item) {
  let newArray = [];
  for (let i = 0; i < array.length; i++) {
    if (array[i] != item) newArray.push(array[i]);
  }
  return newArray;
}
export function delObjArrayItem(array, item, key) {
  let newArray = [];
  for (let i = 0; i < array.length; i++) {
    if (array[i][key] != item) newArray.push(array[i]);
  }
  return newArray;
}
export function editObjArrayItem(array, index, key) {
  let newArray = [];
  for (let i = 0; i < array.length; i++) {
    if (array[i][key] != item) newArray.push(array[i]);
  }
  return newArray;
}
// 防止按钮多次点击多次触发事件
//记得在data中挂载   noClick:true
export function noMultipleClicks(method, ...args) {
  let that = this;
  if (that.noClick) {
    that.noClick = false;
    method.apply(that, args);
    setTimeout(function () {
      that.noClick = true;
    }, 2000);
  } else {
    // console.log("请稍后点击");
  }
}

// yy-mm-dd
export function formatDate(date) {
  let myyear = date.getFullYear();
  let mymonth = date.getMonth() + 1;
  let myweekday = date.getDate();

  if (mymonth < 10) {
    mymonth = "0" + mymonth;
  }
  if (myweekday < 10) {
    myweekday = "0" + myweekday;
  }
  return myyear + "-" + mymonth + "-" + myweekday;
}
//获得本月的开始日期
export function getMonthStartDate() {
  let now = new Date(); //当前日期
  let nowMonth = now.getMonth(); //当前月
  let nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0;
  let monthStartDate = new Date(nowYear, nowMonth, 1);
  return formatDate(monthStartDate);
}

//获得本周的开始日期
export function getWeekStartDate() {
  let date = new Date();
  let today = date.getDay();
  let stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  let stepMonday = 7 - today;
  let time = date.getTime();
  let monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  let sunday = new Date(time + stepMonday * 24 * 3600 * 1000);
  //let startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得上周的开始日期
export function getLastWeekStartDate() {
  let date = new Date();
  let today = date.getDay();
  let stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  let stepMonday = 7 - today;
  let time = date.getTime();
  time = time - 24 * 3600 * 1000 * 7;
  let monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  let sunday = new Date(
    time + stepMonday * 24 * 3600 * 1000 - 24 * 3600 * 1000 * 7
  );
  //let startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得上周的结束日期
export function getLastWeekEndDate() {
  let date = new Date();
  let today = date.getDay();
  let stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  let stepMonday = 7 - today;
  let time = date.getTime();
  time = time - 24 * 3600 * 1000;
  let monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  let sunday = new Date(
    time + stepMonday * 24 * 3600 * 1000 - 24 * 3600 * 1000 * 7
  );
  //let startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得上上周的开始日期
export function getLastLastWeekStartDate() {
  let date = new Date();
  let today = date.getDay();
  let stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  let stepMonday = 7 - today;
  let time = date.getTime();
  time = time - 24 * 3600 * 1000 * 14;
  let monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  let sunday = new Date(
    time + stepMonday * 24 * 3600 * 1000 - 24 * 3600 * 1000 * 7
  );
  //let startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得上上周的结束日期
export function getLastLsatWeekEndDate() {
  let date = new Date();
  let today = date.getDay();
  let stepSunDay = -today + 1;
  if (today == 0) {
    stepSunDay = -7;
  }
  let stepMonday = 7 - today;
  let time = date.getTime();
  time = time - 24 * 3600 * 1000 * 8;
  let monday = new Date(time + stepSunDay * 24 * 3600 * 1000);
  let sunday = new Date(
    time + stepMonday * 24 * 3600 * 1000 - 24 * 3600 * 1000 * 7
  );
  //let startDate = this.transferDate(monday); // 日期变换 2018-11-10
  return formatDate(monday);
}
//获得本月的结束日期
export function getMonthEndDate() {
  let now = new Date(); //当前日期
  let nowMonth = now.getMonth(); //当前月
  let nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0;
  let monthEndDate = new Date(nowYear, nowMonth, getMonthDays(nowMonth));
  return formatDate(monthEndDate);
}

//获得上月开始时间
export function getLastMonthStartDate() {
  let now = new Date(); //当前日期
  let nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0;
  let nowMonth = new Date().getMonth();
  nowYear = nowMonth == 0 ? nowYear - 1 : nowYear;
  let lastMonthDate = new Date(); //上月日期
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  let lastMonth = lastMonthDate.getMonth();
  let lastMonthStartDate = new Date(nowYear, lastMonth, 1);
  return formatDate(lastMonthStartDate);
}
//获得上月结束时间
export function getLastMonthEndDate() {
  let now = new Date(); //当前日期
  let nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0;
  let nowMonth = new Date().getMonth();
  nowYear = nowMonth == 0 ? nowYear - 1 : nowYear;
  let lastMonthDate = new Date(); //上月日期
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  let lastMonth = lastMonthDate.getMonth();
  let lastMonthEndDate = new Date(nowYear, lastMonth, getMonthDays(lastMonth));
  return formatDate(lastMonthEndDate);
}

// 获得某月的天数
export function getMonthDays(myMonth) {
  let now = new Date(); //当前日期
  let nowYear = now.getYear(); //当前年
  nowYear += nowYear < 2000 ? 1900 : 0; //
  let monthStartDate = new Date(nowYear, myMonth, 1);
  let monthEndDate = new Date(nowYear, myMonth + 1, 1);
  let days = (monthEndDate - monthStartDate) / (1000 * 60 * 60 * 24);
  return days;
}

// 获得当年的第一天
export function getNowYearFirstDay(myMonth) {
  let now = new Date().getFullYear();
  return now + "-" + "01-01";
}

// 获得当年的最后一天
export function getNowYearLastDay(myMonth) {
  let now = new Date().getFullYear();
  return now + "-" + "12-31";
}

// 获取昨天日期
export function getYesterDay() {
  let day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000);
  return formatDate(day1);
}
// 获取过去任意一天日期
export function getLastDayByDay(day) {
  let day1 = new Date();
  let flag = day || 1;
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000 * flag);
  return formatDate(day1);
}
// 获取过去七天日期
export function getPassSevenDay() {
  let day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000 * 7);
  return formatDate(day1);
}
// 获取过去30天日期
export function getPassThirtyDay() {
  let day1 = new Date();
  day1.setTime(day1.getTime() - 24 * 60 * 60 * 1000 * 30);
  return formatDate(day1);
}

// 获取明天日期
export function getTomorrow() {
  let day1 = new Date();
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
  return (
    Math.ceil(date2.getTime() / 1000 - date1.getTime() / 1000) / 24 / 60 / 60
  );
}

// 将秒转换成--年月日时分秒
export function getDateStr(seconds) {
  let date = new Date(seconds * 1000);
  if (!seconds) date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  let minute =
    date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  let second =
    date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
  let currentTime =
    year + "-" + month + "-" + day + "  " + hour + ":" + minute + ":" + second;
  return currentTime;
}

// 将秒转换成--年月日时分
export function getDateStrMin(seconds) {
  let date = new Date(seconds * 1000);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  let minute =
    date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  let second =
    date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
  let currentTime = year + "-" + month + "-" + day + "  " + hour + ":" + minute;
  return currentTime;
}

// 将秒转换成--年月日时分秒
export function getDateStrDay(seconds) {
  let date = new Date(seconds * 1000);
  let year = date.getFullYear();
  let month =
    date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1;
  let day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  let currentTime = year + "-" + month + "-" + day;
  return currentTime;
}

// 将毫秒级的时间间隔转换成--以分或秒为单位的表示形式
export function getTimeIntervalFormate(ms) {
  let second = parseInt(ms / 1000);
  if (second < 60) return second + "s";
  let min = Math.floor(second / 60);
  let sec = second % 60;
  return min + "m " + sec + "s";
}
export function queryUrlParams(url) {
  //获取？和#后面的信息
  let askIn = url.indexOf("?"),
    wellIn = url.indexOf("#"),
    askText = "",
    wellText = "";
  //#不存在
  wellIn === -1 ? (wellIn = url.length) : null;
  //?存在
  askIn >= 0 ? (askText = url.substring(askIn + 1, wellIn)) : null;
  wellText = url.substring(wellIn + 1);
  //获取每一部分信息
  let result = {};
  wellText !== "" ? (result["HASH"] = wellText) : null;
  if (askText !== "") {
    let ary = askText.split("&");
    ary.forEach((item) => {
      let itemAry = item.split("=");
      result[itemAry[0]] = itemAry[1];
    });
  }
  return result;
}

// 转化为多少万 等等
export function transformNumber(num) {
  if (!num || isNaN(num)) return 0;
  // 此处为防止字符串形式的数值进来，因为toFixed方法只能用于数值型数
  num = Number(num);
  if (Math.abs(num) > 100000000) {
    return (
      (num % 100000000 == 0 ? num / 100000000 : (num / 100000000).toFixed(2)) +
      "亿"
    );
  } else if (Math.abs(num) > 10000) {
    return (num % 10000 == 0 ? num / 10000 : (num / 10000).toFixed(2)) + "万";
  } else {
    return num;
  }
}

// 导出一个生成 UUID 的函数
export function getUuid() {
  var s = []; // 用于存储生成的 UUID 字符
  var hexDigits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 定义十六进制字符集
  // 循环36次生成UUID的各个部分
  for (var i = 0; i < 36; i++) {
    // 随机选择一个十六进制字符并存入数组
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4"; // 设置第15位为固定值4，用于表示版本号
  // 在第20位上设置一个特定值，确保符合RFC 4122规定
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  // 清空第9、14、19和24位，按照UUID的格式
  s[8] = s[13] = s[18] = s[23] = "";
  // 将数组中的字符连接成字符串
  let uuid = s.join("");
  return uuid; // 返回生成的UUID
}

export const debounce = (fn, delay = 100, promptly = true) => {
  let timer = null;
  return function (...args) {
    // 立即执行
    if (promptly) {
      // 当timer为null时执行
      if (!timer) fn.apply(this, args);
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
      }, delay);
    } else {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    }
  };
};

export function hidePhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";
  return `${phoneNumber.substr(0, 3)}****${phoneNumber.substr(7)}`;
}

export function formatPriceFee(fee, remove_00 = true) {
  if (!fee) return "0";
  const yuan = fee / 100;
  if (!remove_00) return uni.$u.priceFormat(yuan, 2);
  return uni.$u.priceFormat(yuan, 2).replace(/\.?0+$/, "");
}

export function validateUrl(value = "") {
  // return uni.$u.test.url(value);
  if (
    /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]+$/.test(
      value.trim()
    )
  )
    return true;
  // if (/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]/.test(value.trim())) return true
  return false;
}

export function authPushMessage(tmplIds) {
  return new Promise((resolve, reject) => {
    uni.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: function (res) {
        resolve(res);
      },
      fail: function (err) {
        reject(err);
      },
    });
  });
}

export function checkUpdate() {
  const updateManager = uni.getUpdateManager();
  updateManager.onCheckForUpdate(function (res) {
    // console.log(res.hasUpdate);
  });
  updateManager.onUpdateReady(function () {
    uni.showModal({
      title: "更新提示",
      content: "新版本已经准备好，是否重启应用？",
      success(res) {
        if (res.confirm) updateManager.applyUpdate();
      },
    });
  });
}

export function appCheckUpdate() {
  plus.runtime.getProperty(plus.runtime.appid, (plusInfo) => {
    // 获取APP信息
    let type = uni.getSystemInfoSync().platform === "android" ? 1 : 2;
    appInfo({
      type,
    }).then((res) => {
      if (res.data?.version_code > plusInfo.versionCode) {
        let data = {
          describe: res.data.remark.replace(/\n/g, "<br>"),
          edition_url: res.data.url, //apk、wgt包下载地址或者应用市场地址  安卓应用市场 market://details?id=xxxx
          edition_force: 0, //是否强制更新 0代表否 1代表是
          package_type: 0, //0是整包升级（apk或者appstore或者安卓应用市场） 1是wgt升级
          edition_issue: 1, //是否发行  0否 1是 为了控制上架应用市场审核时不能弹出热更新框
          edition_number: res.data.version_code, //版本号 最重要的manifest里的版本号
          edition_name: res.data.version, // 版本名称 manifest里的版本名称
          edition_silence: 0, // 是否静默更新 0代表否 1代表是
        };

        //跳转更新页面 （注意！！！如果pages.json第一页的代码里有一打开就跳转其他页面的操作，下面这行代码最好写在setTimeout里面设置延时3到5秒再执行）
        setTimeout(() => {
          uni.navigateTo({
            url:
              "/uni_modules/rt-uni-update/components/rt-uni-update/rt-uni-update?obj=" +
              JSON.stringify(data),
          });
        }, 1000);
      }
    });
  });
}

export function trimStr(str) {
  // 去除空格与换行
  let reg1 = /\s+/g;
  let reg2 = /[\r\n]/g;
  let trimStr = "";
  if (typeof str === "string") {
    trimStr = str.replace(reg1, "").replace(reg2, "");
  }
  return trimStr;
}

export function ImportSDK() {
  var sdkwx = uni.requireNativePlugin("DouYin-SdkWX");
  var clientkey = "awnng6k7loc8o40x"; // 需要到开发者网站申请并替换
  sdkwx.initWithKey(clientkey);
  return sdkwx;
}
export function douyinAuth(sdkwx = null) {
  if (!sdkwx) sdkwx = ImportSDK();
  return new Promise((resolve, reject) => {
    sdkwx.authorize(
      {
        scope: getScope("douyin"), // 用户授权时必选权限
        state: "", //用于保持请求和回调的状态，授权请求后原样带回给第三方，可传任意String
      },
      function (res) {
        // console.log(JSON.stringify(res));
        if (!res) return reject("授权失败，请稍后重试！");
        if (res.errorCode)
          return reject(res.errorMsg || "授权失败，请稍后重试！");
        return resolve(res.authCode);
      }
    );
  });
}
export function ChooseVideo(share_id = "") {
  return new Promise((resolve, reject) => {
    uni.chooseVideo({
      sourceType: ["album"],
      // #ifdef H5
      extension: [".mp4", ".mov"],
      // #endif
      compressed: false,
      success: function (res) {
        res.share_id = share_id;
        resolve(res);
      },
      fail: (err) => {
        reject(err.errMsg || "无法选择视频文件，请确认权限是否正常！");
      },
    });
  });
}
export function chooseImage(share_id = "") {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      sourceType: ["album"],
      count: 1, // 单选 最多 1 张
      // #ifdef H5
      extension: [".jpg", ".jpeg", ".png", ".gif"],
      // #endif
      compressed: false,
      success: function (res) {
        res.share_id = share_id;
        resolve(res);
      },
      fail: (err) => {
        reject(err.errMsg || "无法选择图片文件，请确认权限是否正常！");
      },
    });
  });
}
export function ShareVideo(
  tempFilePath = null,
  sdkwx = null,
  microAppInfo,
  share_id = "",
  type_name = "选择视频"
) {
  if (!sdkwx) sdkwx = ImportSDK();
  if (type_name == "抖音拍摄") {
    return new Promise((resolve, reject) => {
      sdkwx.openRecordPage(
        {
          state: share_id, //用于保持请求和回调的状态，授权请求后原样带回给第三方，可传任意String
          microAppInfo,
        },
        function (res) {
          if (res && res.errorCode) return reject(res.errorMsg || "分享失败！");
          resolve(res);
        }
      );
    });
  }
  return new Promise((resolve, reject) => {
    if (!tempFilePath) return reject("未选择视频文件！");
    sdkwx.share(
      {
        videoPaths: [plus.io.convertLocalFileSystemURL(tempFilePath)], //imagePaths和videoPaths二选其一
        state: share_id, //用于保持请求和回调的状态，授权请求后原样带回给第三方，可传任意String
        microAppInfo,
        /* microAppInfo: { //可选，分享内容携带小程序1000001
      appId: "tt999cef2106a26f6101",
      appTitle: "《新绝世妖孽》后续2",
      appUrl: "pages/videoInfoSub/videoInfoSub?bookId=41000100205&chapterId=1&channelId=11798&from=dy&referral_id=23456",
      description: "《新绝世妖孽》后续"
    } */
      },
      function (res) {
        if (res && res.errorCode) return reject(res.errorMsg || "分享失败！");
        resolve(res);
      }
    );
  });
}
//APP唤起媒体进行发布
export async function mediaAppPublish(
  item = {},
  getShareId,
  sdkwx = null,
  type_name = "选择视频"
) {
  // console.log(item);
  let { microAppInfo, platform_id = 1, id: plan_id } = item;
  if (!microAppInfo) return Promise.reject("跳转信息异常，无法发布！");
  switch (Number(platform_id)) {
    case 1: //抖音
      return getShareId({
        plan_id,
      })
        .then((res) => {
          if (res.code) return Promise.reject("分享视频繁忙，请稍后重试！");
          if (type_name == "抖音拍摄")
            return Promise.resolve({
              share_id: res.data,
            });
          return ChooseVideo(res.data);
        })
        .then((file) => {
          return ShareVideo(
            file.tempFilePath,
            sdkwx,
            microAppInfo,
            file.share_id,
            type_name
          );
        });
      break;
    case 2: //快手
      return LaunchApp(microAppInfo);
      break;
    default:
      break;
  }
}
export function getScope(type = "douyin") {
  let scope = {
    douyin: "user_info,data.external.user",
    kuaishou: "",
  };
  let online_scope = store.getters.auth_scope || {};
  scope = {
    ...scope,
    ...online_scope,
  };
  // console.log(scope);
  return scope[type] || "";
}
export async function getDouyinH5Auth(data = {}) {
  // snssdk1128://webview?url=http%3A%2F%2Fbaidu.com&from=webview&refer=web

  let scope = getScope("douyin");
  data.client_key = "awuk8wnz3cwv3ppy";
  let url = `https://open.douyin.com/platform/oauth/connect?response_type=code&client_key=awuk8wnz3cwv3ppy&scope=${scope}&state=${JSON.stringify(
    data
  )}&redirect_uri=https://xgsj.lizhibj.cn/api/public/callback/douyin/`;
  // console.log(url);
  let schema_url = `snssdk1128://webview?url=${encodeURIComponent(
    url
  )}&from=webview&refer=web`;
  mediaH5Publish({
    schema_url: url,
  });
}

//H5唤起媒体进行发布
export async function mediaH5Publish(item = {}) {
  let { schema_url } = item;

  if (!schema_url) return Promise.reject("跳转信息异常，无法发布！");
  const el = document.createElement("a");
  el.href = schema_url;
  el.click();
  return Promise.resolve();
}

async function checkAppInstall(url) {
  let pname = "",
    action = "",
    app_name = "";
  if (String(url).indexOf("snssdk1128://") != -1) {
    pname = "com.ss.android.ugc.aweme";
    action = "snssdk1128://";
    app_name = "抖音";
  } else if (String(url).indexOf("ksminiapp://") != -1) {
    pname = "com.smile.gifmaker";
    action = "ksminiapp://";
    app_name = "快手";
  } else if (String(url).indexOf("kwai://") != -1) {
    pname = "com.smile.gifmaker";
    action = "kwai://";
    app_name = "快手";
  } else if (String(url).indexOf("weixin://") != -1) {
    pname = "com.tencent.mm";
    action = "weixin://";
    app_name = "微信";
  }
  if (!pname || !action) return Promise.reject("跳转链接异常！");
  let has_install = plus.runtime.isApplicationExist({
    pname,
    action,
  });
  if (!has_install)
    return Promise.reject(`未安装${app_name}(非极速版APP），请安装后重试！`);
  return;
}
export function LaunchApp(url) {
  return new Promise((resolve, reject) => {
    if (plus.os.name == "Android") {
      checkAppInstall(url)
        .then(() => {
          // plus.runtime.launchApplication({
          // 	pname: "com.smile.gifmaker",
          // 	action: 'com.mini.entrance.MiniRouteActivity',
          // 	extra: {
          // 		url,
          // 		data:url,
          // 		KSMP_source: "011012",
          // 		KSMP_internal_source: "011012",
          // 		path: "pages%2FvideoInfoSub%2FvideoInfoSub%3FbookId%3D41000010025%26chapterId%3D1%26channelId%3D10519%26from%3Dks%26custom_params%3D597882%26referral_id%3D597882",
          // 		kpn: 'KUAISHOU',
          // 		appId: 'ks715227916484291037',
          // 	},
          // 	newTask: true
          // }, function(e) {
          // 	console.log(e);
          // 	return reject('APP唤醒失败，请咨询在线客服！')
          // });
          // console.log(url);
          plus.runtime.openURL(`${url}&xnowt=${new Date().getTime()}`, (e) => {
            // console.log(e);
            return reject("APP唤醒失败，请咨询在线客服！");
          });
        })
        .catch((err) => {
          return reject(err.message || err);
        });
    } else if (plus.os.name == "iOS") {
      plus.runtime.launchApplication(
        {
          action: url,
        },
        function (e) {
          // console.log(e);
          return reject("APP唤醒失败，请咨询在线客服！");
        }
      );
    }
  });
}

// 判断是否为微信浏览器
export function isMiniProgramBrowser() {
  // #ifdef H5
  let ua = window.navigator.userAgent.toLowerCase();
  
  // 判断是否是微信小程序
  const isWeChat = /MicroMessenger/i.test(ua);
  
  // 判断是否是支付宝小程序
  const isAlipay = /AlipayClient/i.test(ua);
  
  // 判断是否是百度小程序
  const isBaiDu = /BaiDu/i.test(ua);
  
  // 可以根据需求继续添加其他小程序的判断
  
  return isWeChat || isAlipay || isBaiDu;
  // #endif
  return false;
}

export function clickHttpUrl(url) {
  // #ifdef APP
  plus.runtime.openWeb(`${url}&xnowt=${new Date().getTime()}`, (e) => {
    // console.log(e);
  });
  // #endif

  // #ifdef H5
  let document = document || window.document;
  const a = document.createElement("a");
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // #endif
}
export function clickSchemaUrl(url) {
  // #ifdef APP
  LaunchApp(url);
  // #endif

  // #ifdef H5
  let document = document || window.document;
  const a = document.createElement("a");
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // #endif
}

export function downloadFile(
  type = "video",
  file_url,
  file_name,
  that,
  disabledName
) {
  that[disabledName] = false;
  // #ifdef H5
  uni.showLoading({
    title: "正在下载",
    mask: true,
  });
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    // 判断网络传输过程是否出现问题，获取到4就说明没有出现问题：
    if (xhr.readyState !== 4) return;
    // 判断请求和服务器端有没有出现问题：
    // 1、200~299表示没问题 304也是成功的
    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
      // 成功提示
      uni.hideLoading();
      uni.showToast({
        icon: "none",
        mask: true,
        title: "保存成功", //保存路径
        duration: 3000,
      });
      that[disabledName] = true;
    } else {
      //下载失败
      uni.hideLoading();
      uni.showToast({
        icon: "none",
        mask: true,
        title: "下载失败，请稍后重试",
      });
      that[disabledName] = true;
    }
  };
  xhr.open("GET", file_url, true);
  xhr.responseType = "blob"; // 返回类型blob
  xhr.onload = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      let blob = this.response;
      // 转换一个blob链接
      let u = window.URL.createObjectURL(new Blob([blob]));
      let a = document.createElement("a");
      a.download = type === "video" ? `${file_name}.mp4` : `${file_name}.png`; //下载后保存的名称
      a.href = u;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      uni.hideLoading();
    }
  };
  xhr.send();
  // #endif

  // #ifdef APP
  uni.showLoading({
    title: "正在下载",
    mask: true,
  });
  var url = file_url;
  let downloadTask = uni.downloadFile({
    url,
    header: {
      "Access-Control-Expose-Headers": "Content-Disposition",
    },
    complete: (res) => {
      if (res.statusCode == 200) {
        switch (type) {
          case "video":
            // 保存视频到手机相册
            uni.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success: function () {
                // 成功提示
                uni.hideLoading();
                uni.showToast({
                  icon: "none",
                  mask: true,
                  title: "保存成功", //保存路径
                  duration: 3000,
                });
                that[disabledName] = true;
              },
              fail: (res) => {
                //下载失败
                uni.hideLoading();
                uni.showToast({
                  icon: "none",
                  mask: true,
                  title: "下载失败，请稍后重试",
                });
                that[disabledName] = true;
              },
            });
            break;
          case "image":
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: function () {
                // 成功提示
                uni.hideLoading();
                uni.showToast({
                  icon: "none",
                  mask: true,
                  title: "保存成功", //保存路径
                  duration: 3000,
                });
              },
              fail: () => {
                //下载失败
                uni.hideLoading();
                uni.showToast({
                  icon: "none",
                  mask: true,
                  title: "下载失败，请稍后重试",
                });
              },
            });
            break;
        }
      } else {
        //下载失败
        uni.hideLoading();
        uni.showToast({
          icon: "none",
          mask: true,
          title: "下载失败，请稍后重试",
        });
        that[disabledName] = true;
      }
    },
  });
  // #endif

  // #ifdef MP

  uni.authorize({
    /* scope.writePhotosAlbum 类型是保存到相册 */
    scope: "scope.writePhotosAlbum",
    success() {
      uni.showLoading({
        title: "正在下载",
        mask: true,
      });
      var url = file_url;
      let downloadTask = uni.downloadFile({
        url,
        header: {
          "Access-Control-Expose-Headers": "Content-Disposition",
        },
        complete: (res) => {
          if (res.statusCode == 200) {
            switch (type) {
              case "video":
                // 保存视频到手机相册
                uni.saveVideoToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success: function () {
                    // 成功提示
                    uni.hideLoading();
                    uni.showToast({
                      icon: "none",
                      mask: true,
                      title: "保存成功", //保存路径
                      duration: 3000,
                    });
                    that[disabledName] = true;
                  },
                  fail: (res) => {
                    //下载失败
                    uni.hideLoading();
                    uni.showToast({
                      icon: "none",
                      mask: true,
                      title: "若保存失败，请长按图片保存",
                    });
                    that[disabledName] = true;
                  },
                });
                break;
              case "image":
                uni.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success: function () {
                    // 成功提示
                    uni.hideLoading();
                    uni.showToast({
                      icon: "none",
                      mask: true,
                      title: "保存成功", //保存路径
                      duration: 3000,
                    });
                  },
                  fail: () => {
                    //下载失败
                    uni.hideLoading();
                    uni.showToast({
                      icon: "none",
                      mask: true,
                      title: "若保存失败，请长按图片保存",
                    });
                  },
                });
                break;
            }
          } else {
            //下载失败
            uni.hideLoading();
            uni.showToast({
              icon: "none",
              mask: true,
              title: "下载失败，请稍后重试",
            });
            that[disabledName] = true;
          }
        },
      });
      downloadTask.onProgressUpdate((res) => {
        uni.showLoading({
          title: `已下载：${res.progress}%`,
          mask: true,
        });
      });
    },
    complete(res) {
      /* 判断如果没有授权就打开设置选项让用户重新授权 */
      uni.getSetting({
        success(res) {
          if (!res.authSetting["scope.writePhotosAlbum"]) {
            /* 打开设置的方法 */
            uni.showModal({
              content: "没有授权保存图片到相册,点击确定去允许授权",
              success: function (res) {
                if (res.confirm) {
                  /* 打开设置的API*/
                  uni.openSetting({
                    success(res) {
                      console.log(res.authSetting);
                    },
                  });
                } else if (res.cancel) {
                  uni.showModal({
                    cancelText: "取消",
                    confirmText: "重新授权",
                    content: "你点击了取消，将无法进行保存操作",
                    success: function (res) {
                      if (res.confirm) {
                        uni.openSetting({
                          success(res) {
                            /* 授权成功 */
                            // console.log(res.authSetting);
                            uni.showToast({
                              icon: "none",
                              mask: true,
                              title: "授权成功", //保存路径
                              duration: 3000,
                            });
                            that[disabledName] = true;
                          },
                        });
                      } else if (res.cancel) {
                        uni.showToast({
                          icon: "none",
                          mask: true,
                          title: "授权失败", //保存路径
                          duration: 3000,
                        });
                        that[disabledName] = true;
                      }
                    },
                  });
                }
              },
            });
          }
        },
      });
    },
  });
  // #endif
}

/**
 * @description: 格式化金额，转换为指定单位的货币字符串
 * @param {*} money - 传入的金额，单位为分
 * @param {*} unit - 是否添加货币单位，默认为true
 * @param {*} thousand - 是否使用千位分隔符，默认为false
 * @return {*} 返回格式化后的货币字符串
 */
export function unitMoney(money = null, unit = true, thousand = false) {
  if (!money) {
    return unit ? "￥0" : "0";
  }

  const baseMoney = money / 100; // 将金额从分转换为元
  let formattedMoney = baseMoney.toFixed(2); // 先格式化为两位小数

  // 如果需要千分位分隔符，手动添加
  if (thousand) {
    formattedMoney = addThousandSeparator(formattedMoney);
  } else {
    // 如果不需要千分位分隔符，但金额是整数，则去除小数点
    if (money % 100 === 0) {
      formattedMoney = formattedMoney.split(".")[0];
    }
  }

  return unit ? "￥" + formattedMoney : formattedMoney;
}

function addThousandSeparator(num) {
  const parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/**
 * @description: 将给定的百分比值转换为指定格式的字符串或数值。
 * @param {number|null} rate - 要转换的百分比率，默认为null。
 * @param {boolean} unit - 是否以字符串形式返回带有百分号的结果，默认为true。
 * @return {string|number} - 转换后的值，可能是带百分号的字符串或数字。
 */
export function unitRate(rate = null, unit = true) {
  // 如果 rate 为 null 或未定义，返回 null
  if (rate === null) {
    return null;
  }

  // 根据 unit 参数决定返回的格式
  if (unit) {
    // 返回带百分号的字符串格式
    return rate === 0
      ? "0%"
      : rate % 100 === 0
      ? (rate / 100).toFixed(0) + "%"
      : (rate / 100).toFixed(2) + "%";
  } else {
    // 返回数字格式
    return rate === 0
      ? 0
      : rate % 100 === 0
      ? (rate / 100).toFixed(0)
      : (rate / 100).toFixed(2);
  }
}

// 截流函数
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 复制
export function copy({ content = "", type = "text" }, vm) {
  uni.setClipboardData({
    data: content.toString(),
    showToast: false,
    success: () => {
      if (vm?.toastMsg) {
        vm.toastMsg(
          type === "url" ? "复制成功,请在浏览器打开" : "复制成功",
          "success"
        );
      } else {
        uni.showToast({
          icon: "success",
          title: type === "url" ? "复制成功,请在浏览器打开" : "复制成功",
        });
      }
    },
    fail: () => {
      if (vm?.toastMsg) {
        vm.toastMsg("复制失败", "error");
      } else {
        uni.showToast({
          icon: "error",
          title: "复制失败",
        });
      }
    },
  });
}

// 获取解析链接
export function getUrl(str) {
  const reg =
    /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
  const strValue = str.match(reg);
  if (strValue && strValue.length > 0) {
    return strValue[0];
  }
  return null;
}

// 图片压缩
export function compress(fileObj) {
  return new Promise((resolve, reject) => {
    try {
      let quality = 0.5; // 默认图片质量为0.5
      let sizeToMb = fileObj.size / 1024 / 1024;
      if (sizeToMb < 4) {
        quality = 0.7;
      } else if (sizeToMb < 10) {
        quality = 0.6;
      } else if (sizeToMb < 20) {
        quality = 0.5;
      } else {
        quality = 0.4;
      }
      // #ifdef H5
      let newUrl;
      const image = new Image();
      image.src = fileObj.url;
      image.onload = function () {
        const that = this;
        // 默认按比例压缩
        let w = that.width;
        let h = that.height;
        const scale = w / h;
        w = fileObj.width || w;
        h = fileObj.height || w / scale;
        w = Math.floor(w * quality);
        h = Math.floor(h * quality);
        // 生成canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        // 创建属性节点
        const anw = document.createAttribute("width");
        anw.nodeValue = w;
        const anh = document.createAttribute("height");
        anh.nodeValue = h;
        canvas.setAttributeNode(anw);
        canvas.setAttributeNode(anh);
        ctx.drawImage(that, 0, 0, w, h);
        // 图像质量
        if (fileObj.quality && fileObj.quality <= 1 && fileObj.quality > 0) {
          quality = fileObj.quality;
        }
        // quality值越小，所绘制出的图像越模糊
        const data = canvas.toDataURL("image/jpeg", quality);
        const newFile = convertBase64UrlToBlob(data);
        if (newFile.size / 1024 / 1024 > 2) {
          reject("图片过大，请重试");
        }
        newUrl = URL.createObjectURL(newFile);
        resolve(newUrl);
      };
      // #endif
      // #ifndef H5

      uni.compressImage({
        src: fileObj.url,
        quality: quality * 100,
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: (err) => {
          reject(err);
        },
      });
      // #endif
    } catch (e) {
      // console.log(e);
      reject("压缩失败");
    }
  });
}

// base64转Blob
export function convertBase64UrlToBlob(urlData) {
  const bytes = window.atob(urlData.split(",")[1]); // 去掉url的头，并转换为byte
  // 处理异常,将ascii码小于0的转换为大于0
  const ab = new ArrayBuffer(bytes.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) {
    ia[i] = bytes.charCodeAt(i);
  }
  return new Blob([ab], {
    type: "image/jpg",
  });
}

// 存储sms_id
export function saveSmsIdToLoacl(id = null, key = "sms_key") {
  if (!id) {
    throw new Error("sms_id不能为空!");
  } else {
    let locKey = "boyao_sms_" + key;
    return uni.setStorageSync(locKey, id);
  }
}

// 获取本地sms_id
export function getSmsIdFromLocal(key = "sms_key") {
  if (!key) {
    throw new Error("请传入key!");
  } else {
    let locKey = "boyao_sms_" + key;
    return uni.getStorageSync(locKey);
  }
}

// 清除本地sms_id
export function delSmsIdFromLocal() {
  const { keys } = uni.getStorageInfoSync();
  if (keys.length > 0) {
    keys.forEach((el) => {
      if (el.indexOf("boyao_sms") != -1) {
        uni.removeStorageSync(el);
      }
    });
  }
}

/**
 * @description: 计算标签高度
 * @param {Object} that 组件this
 * @param {String} el 计算的标签id或class
 * @param {String} navbar_height 导航栏高度 一般都为0
 * @return {String} height
 */
export async function computedHeight(that, el, navbar_height) {
  let height = 0;
  if (!that) {
    throw new Error("请传入组件this!");
  } else if (!el) {
    throw new Error("请传入需要计算的标签id或class");
  } else {
    const topRect = await that.$u.getRect(el);
    height = navbar_height + topRect.height + "px";
    return height;
  }
}

// 名称字段展示
export function titleProcess(source1 = "", final = "", source2 = "") {
  let str = "";
  let source = source1 || source2;
  str = source || final;
  return str;
}

/**
 * @description: 获取服务供应商
 * @param {String} service oauth:授权登陆 share:分享 payment:支付 push:推送
 * @return {Object} service:string - 服务类型；provider:array - 得到的服务供应商；providers:array - 得到的服务供应商服务对象（App 3.5.1+）
 */
export function getProvider(service = "oauth") {
  return new Promise((resolve, reject) => {
    uni.getProvider({
      service,
      success: (res) => {
        resolve(res);
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
}

/**
 *
 * @param {Object} query
 */
export function setPayInfo(query) {
  const custom_timestamp = Math.floor(Date.now() / 1000);
  let { clickid, adid, creativeid, creativetype, spl = 0 } = query || {};
  // 有cparam
  let pay_info = {
    custom_timestamp,
    collection_id: query?.cid,
    search_code_id: query?.search_code_id,
    original_info: query,
    spl,
  };
  if (clickid)
    pay_info.ad_info = {
      clickid,
      adid,
      creativeid,
      creativetype,
    };
  if (Object.hasOwnProperty.call(query, "cagent") && Number(query.cagent) >= 0)
    pay_info.cagent = Number(query.cagent);
  if (query.cparam) pay_info.cparam = String(query.cparam);
  if (pay_info.cagent >= 0) store.commit("SET_PAY_INFO", pay_info);
}
/**
 * 将广告参数添加到订单参数中，公共处理逻辑
 * @param {*} params
 */
export function getPayInfo(params = {}) {
  params = params || {};
  const pay_info = store.getters.pay_info || {};
  let cagent = Number(pay_info.cagent);
  params.ad_info = pay_info?.ad_info || null;
  params.original_info = pay_info?.original_info || null;
  if (cagent || cagent == 0) {
    //需要锚点的视频和购买的视频一致，才允许透传参数，将该逻辑放于API中
    params.source_collection_id = pay_info?.collection_id;
    params.custom_params = pay_info?.cparam || "";
    params.custom_agent_id = cagent;
    params.custom_timestamp = Number(pay_info.custom_timestamp);
    params.search_code_id = pay_info?.search_code_id || null;
  }
  return params;
}
export function sleep(time = 300) {
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, time);
  });
}

// 将秒转换时:分:秒
export function secondsToHms(sec) {
  sec = Number(sec) || 0;
  var hours = Math.floor(sec / 3600).toFixed(0);
  var minutes = Math.floor((sec % 3600) / 60).toFixed(0);
  var seconds = (sec % 60).toFixed(0);
  let arr = sec > 3600 ? [hours, minutes, seconds] : [minutes, seconds];
  let str = arr
    .map((num) => (num < 10 ? "0" + num : num))
    .filter((num) => num)
    .join(":");
  return str;
}

export function setThemeColor(mode = "light", primaryColor = "#4478FF") {
  if (mode == "dark") {
    // #ifdef MP-TOUTIAO
    tt?.setNavigationBarColor({
      frontColor: "#ffffff",
      backgroundColor: "#17181A",
    });
    tt?.setTabBarItem({
      index: 0,
      iconPath: "static/tabbar/dark_home_tag_off.png",
      selectedIconPath: "static/tabbar/dark_home_tag_on.png",
    });
    tt?.setTabBarItem({
      index: 1,
      iconPath: "static/tabbar/dark_mine_off.png",
      selectedIconPath: "static/tabbar/dark_mine_on.png",
    });
    tt?.setTabBarStyle({
      backgroundColor: "#17181A",
      selectedColor: "#ffffff",
      color: "#d0d1d6",
      borderStyle: "black",
    });
    // #endif
    // #ifdef MP-KUAISHOU || MP-WEIXIN
    uni?.setBackgroundColor({
      backgroundColor: "#17181A",
    });
    uni?.setNavigationBarColor({
      frontColor: "#ffffff",
      backgroundColor: "#17181A",
    });
    uni?.setTabBarItem({
      index: 0,
      iconPath: "static/tabbar/dark_home_tag_off.png",
      selectedIconPath: "static/tabbar/dark_home_tag_on.png",
    });
    uni?.setTabBarItem({
      index: 1,
      iconPath: "static/tabbar/dark_mine_off.png",
      selectedIconPath: "static/tabbar/dark_mine_on.png",
    });
    uni?.setTabBarStyle({
      backgroundColor: "#17181A",
      selectedColor: "#ffffff",
      color: "#d0d1d6",
      borderStyle: "black",
    });
    // #endif
  } else {
    // #ifdef MP-TOUTIAO
    tt?.setNavigationBarColor({
      frontColor: "#000000",
      backgroundColor: "#ffffff",
    });
    tt?.setTabBarItem({
      index: 0,
      iconPath: "static/tabbar/home_off.png",
      selectedIconPath: "static/tabbar/home_tag_on.png",
    });
    tt?.setTabBarItem({
      index: 1,
      iconPath: "static/tabbar/home_mine_off.png",
      selectedIconPath: "static/tabbar/home_mine_on.png",
    });
    tt?.setTabBarStyle({
      backgroundColor: "#FFFFFF",
      selectedColor: "#000000",
      color: "#606266",
      borderStyle: "white",
    });
    // #endif
    // #ifdef MP-KUAISHOU || MP-WEIXIN
    uni?.setBackgroundColor({
      backgroundColor: "#ffffff",
    });
    uni?.setNavigationBarColor({
      frontColor: "#000000",
      backgroundColor: "#ffffff",
    });
    uni?.setTabBarItem({
      index: 0,
      iconPath: "static/tabbar/home_off.png",
      selectedIconPath: "static/tabbar/home_tag_on.png",
    });
    uni?.setTabBarItem({
      index: 1,
      iconPath: "static/tabbar/home_mine_off.png",
      selectedIconPath: "static/tabbar/home_mine_on.png",
    });
    uni?.setTabBarStyle({
      color: "#606266",
      selectedColor: "#000000",
      backgroundColor: "#ffffff",
      borderStyle: "white",
    });
    // #endif
  }
}

export function setSystemInfo() {
  return new Promise((resolve, reject) => {
    let system_info = uni.getSystemInfoSync();
    let os = String(system_info?.system || uni.$u?.os()).toLowerCase();
    let system = "AND";
    if (/ios/.test(os)) system = "IOS";
    resolve(system);
  });
}

/**
 * @description: 获取缓存订单
 * @param {*} paymentRef 支付组件实例
 * @param {*} only_order 是否仅返回订单号
 * @param {*} id 合集id/卡片id
 * @return {String|Boolean} 订单号或false
 */
export function getCheckoutOrder(
  paymentRef,
  only_order = false,
  id,
  mode = "default"
) {
  let newId = Number(id);
  // 先判断订单是否存在
  let res = uni?.getStorageSync(
    mode == "default"
      ? `STORAGE_ORDER_DEFAULT_${newId}`
      : `STORAGE_ORDER_CHARGE`
  );
  if (!res) return false;
  const { out_order_no, time, collection_id } = JSON.parse(res);
  // 订单大于5分钟就return false
  const now_time = new Date().getTime() / 1000;

  if (mode == "default") {
    if (now_time - time > 300 || collection_id != newId) return false;
  } else {
    if (now_time - time > 300) return false;
  }
  // 订单存在，开始支付
  if (!only_order) {
    // 需要启用支付查询
    paymentRef?.verifyPaymentSubmit(out_order_no);
  } else {
    // 仅仅返回订单号
    return out_order_no;
  }
}

export function removeCheckoutOurder(id, mode = "default") {
  uni.removeStorageSync(
    mode == "default" ? `STORAGE_ORDER_DEFAULT_${id}` : `STORAGE_ORDER_CHARGE`
  );
}

/**
 * @description: 检查并设置一天之内的记录
 * @param {String} keyPrefix 存储索引
 * @param {*} vm 组件实例
 * @return {Boolean} true 初次设置缓存成功 false 已存在缓存
 */
export function checkAndSetDailyRecord(vm, keyPrefix) {
  if (!vm || !keyPrefix) return;
  let currentDate = new Date();
  let key = vm.$u.timeFormat(currentDate, "yyyy-mm-dd");
  let existingRecord = uni.getStorageSync(`${keyPrefix}_${key}`);
  if (!existingRecord) {
    uni.setStorageSync(`${keyPrefix}_${key}`, 1);
    return true;
  }
  return false;
}
/**
 * 获取字符串的md5
 * @param {String} data
 * @returns
 */
export function getStringMD5(data = "") {
  return crypto.createHash("md5").update(data, "utf8").digest("hex");
}

// 移除空对象元素
export const removeObjectEmpty = (obj) => {
  if (obj.constructor === Object) {
    return Object.keys(obj)
      .filter(
        (key) => obj[key] !== null && obj[key] !== undefined && obj[key] !== ""
      )
      .reduce(
        (acc, key) => ({
          ...acc,
          [key]: obj[key],
        }),
        {}
      );
  } else {
    throw new Error("参数必须为对象");
  }
};
//高精度两数相乘
export const abMul = (a, b) => {
  let result = (a * 100 * (b * 100)) / 10000;
  return result.toFixed(2);
};
