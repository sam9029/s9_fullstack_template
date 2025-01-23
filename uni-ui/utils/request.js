// let MainUrl = "http://192.168.108:3020/api";
let MainUrl = "http://192.168.50.104:3020/api";
//let MainUrl = "http://192.168.50.5:3020/api";
// let MainUrl = 'https://joyful.tuixiaoguo.com/api'
// #ifdef  APP-PLUS|H5
// MainUrl = 'http://192.168.110.2:3020/api'
// #endif
if (process.env.NODE_ENV != "development")
  MainUrl = "https://joyful.tuixiaoguo.com/api";
import store from "@/store/index.js";
import { getToken } from "@/utils/user.js";
import { encrypt, decrypt } from "@/utils/auth";
import { getStringMD5 } from "@/utils/tools.js";
let session = null;
let modeling = false; //当前是否已经在模态

const apiWhiteList = {
  "/login/login": true,
  "/applet/home/novel/pre_applet": true,
  "/applet/home/novel/novel_app": true,
};
function isWhitePage() {
  let path = window.location.pathname || ''
  path = String(path).toLowerCase()
  if (path.indexOf('pagesuser/guide/index') != -1) return true
  if (path.indexOf('pagestatic/plan/share') != -1) return true
  return path.indexOf('pagesuser/app_download/index') != -1
}
function LogOut() {
  // #ifdef H5
  if (isWhitePage()) return
  // #endif
  if (modeling) return;
  modeling = true;
  store.dispatch("LogOut");
  uni.showModal({
    title: "登录失效",
    content: "登录失效，请重新登录",
    showCancel: true,
    cancelText: '取消',
    confirmText: "登录",
    confirmColor: store.getters.theme_color,
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: "/pages/login/login" })
        modeling = false;
        // 确定
      } else if (res.cancel) {
        // 取消
        modeling = false;
      }
    },
    complete: () => {
      modeling = false;
    },
  });
}

let pwdmodeling = false;
export function weakPassword() {
  if (pwdmodeling) return;
  pwdmodeling = true;
  uni.showModal({
    title: "安全提示",
    content: "当前账户安全性较低，请修改密码！",
    showCancel: false,
    confirmText: "前去修改",
    confirmColor: store.getters.theme_color,
    success: (res) => {
      uni.navigateTo({
        url: "/pagesUser/setting/account/password",
      });
    },
    complete: () => {
      pwdmodeling = false;
    },
  });
}

function encodeConfig(config) {
  let { deviceid, token, timestamp } = config.header;
  if (deviceid && token) {
    let query_md5 = getStringMD5(`${deviceid}${timestamp}`);
    let s_iv = Buffer.from(query_md5, "hex").subarray(0, 16);
    if (process.env.NODE_ENV !== "development" && !config.skip_encode) { //环境配置了不加密
      if (config?.params) config.params = { l_sign: encrypt(config.params, token, s_iv)?.content };
      // console.log(config);
      if (config?.data) config.data = { l_sign: encrypt(config.data, token, s_iv)?.content };
    }
    config.$s_iv = s_iv;
    config.$s_secret = token;
  }
  // console.log(config);
  return config;
}

import qs from "qs";
let AccountInfo = null;
// #ifdef MP-WEIXIN || MP-KUAISHOU
AccountInfo = uni?.getAccountInfoSync();
// #endif

export default async function request(data = {}) {
  let sendData = data.data;
  if (typeof sendData === "object")
    Object.keys(sendData).forEach((key) => {
      if (data["data"][key] === undefined || data["data"][key] === null)
        delete data["data"][key];
    });
  // if (!apiWhiteList[data?.url] && !(await store.dispatch('lockLogin'))) return Promise.reject('未正常登录！')
  // #ifdef MP-KUAISHOU
  if (data?.method) data.method = String(data.method).toUpperCase(); //快手需要大写
  // #endif
  let sendUrl =
    String(data.url).indexOf("http") != -1 ? data.url : MainUrl + data.url;
  return await new Promise((resolve, reject) => {
    if (data.timeout && Number(data.timeout)) {
      let timer = setTimeout(() => {
        clearTimeout(timer);
        return reject("网络请求超时！");
      }, data.timeout);
    }
    let time = new Date().getTime();
    data.header = {
      token: getToken() || "",
      deviceid: store.getters?.device_id || "",
      fingerprint: store.getters?.fingerprint || "",
      timestamp: String(parseInt(time / 1000)),
      "content-type": "application/json", //自定义请求头信息
      "koc-session": session || "",
      // #ifdef MP-TOUTIAO
      "koc-referer": `https://tmaservice.developer.toutiao.com/?appid=${tt.getEnvInfoSync()?.microapp?.appId}&version=${tt.getEnvInfoSync()?.microapp?.mpVersion}`,
      // #endif
      // #ifdef MP-WEIXIN
      "koc-referer": `https://servicewechat.com/${AccountInfo?.miniProgram?.appId}/${AccountInfo?.miniProgram?.envVersion}/page-frame.html`,
      // #endif
      // #ifdef MP-KUAISHOU
      "koc-referer": `https://miniapi.ksapisrv.com/${AccountInfo?.miniProgram?.appId}/${AccountInfo?.miniProgram?.envVersion}/page-frame.html`,
      // #endif
      ...(data.header || {}),
    };
    if (!data.header?.fingerprint) data.header.fingerprint = store.dispatch("GetFingerPrint");
    // 根据开发环境判断是否需要接口加密
    data = encodeConfig(data); //执行加密操作
    if (data.method === "GET" || data.method === "get") {
      // 如果是get请求，且params是数组类型如arr=[1,2]，则转换成arr=1&arr=2
      const newData = qs.stringify(data.data, { arrayFormat: "repeat" });
      delete data.data;
      sendUrl = newData ? `${sendUrl}?${newData}` : `${sendUrl}`;
    }
    uni.request({
      ...data,
      url: sendUrl,
      success: (res) => {
        if (res?.header?.["koc-session"]) session = res.header["koc-session"];
        if (res.data?.r_sign) res.data = decrypt({ iv: data.$s_iv, content: res.data.r_sign }, data.$s_secret);
        if (res?.statusCode === 401) {
          reject("登录已过期！");
          return LogOut();
        }
        if (res?.statusCode !== 200) return reject(`HTTP状态码：${res.statusCode}` || "网络异常");
        if (res?.data && Reflect.has(res.data, "code") && res.data.code !== 0) return reject(res.data);
        if (data.back_difftime && res.data) res.data.back_difftime = new Date().getTime() - time;
        resolve(res.data);
      },
      fail: (error) => {
        reject(error.message || "网络异常");
      },
    });
  });
}

export function upload(data = {}, path = "") {
  let sendData = data.data;
  if (typeof sendData === "object")
    Object.keys(sendData).forEach((key) => {
      if (data["data"][key] === undefined) delete data["data"][key];
    });
  return new Promise((resolve, reject) => {
    let header = {
      token: getToken() || "",
      "koc-session": session || "",
      deviceid: store.getters?.device_id || "",
      fingerprint: store.getters?.fingerprint || "",
      timestamp: parseInt(new Date().getTime() / 1000 - 5),
      ...(data.header || {}),
    }
    let query_md5 = getStringMD5(`${header.deviceid}${header.timestamp}`);
    let s_iv = Buffer.from(query_md5, "hex").subarray(0, 16);
    uni.uploadFile({
      ...data,
      url: MainUrl + data.url,
      filePath: path,
      name: "file",
      formData: data.data,
      header,
      success: (res) => {
        res.data = JSON.parse(res.data);
        if (res.data?.r_sign) res.data = decrypt({ iv: s_iv, content: res.data.r_sign }, header.token);
        if (res && res.header && res.header["koc-session"]) session = res.header["koc-session"];
        if (res && res.statusCode == 401) {
          reject(`登录已过期！`);
          return LogOut();
        }
        if (res.statusCode != 200) return reject(`HTTP状态码：${res.statusCode}` || "网络异常");
        resolve(res.data);
      },
      fail: (error) => {
        reject(error.message || "网络异常");
      },
    });
  });
}

export { MainUrl };
