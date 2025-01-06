const knex = require("../db/knexManager").knexProxy
const moment = require("moment");
const IPDB = require('ipdb')
const qqwry_ipdb = require('qqwry.ipdb');
const ipdb = new IPDB(qqwry_ipdb);
const { v4: uuidv4 } = require("uuid")
const crypto = require("crypto");
const config = require("../config/index");
const { ACCOUNT_TABLE, CHANNEL_TABLE } = require("../config/setting");
const Validator = require('validator').default


/**
 * 获取两日期间所有日期数组，日期格式为 YYYY-MM-DD (2024-01-01)，且包含start、end
 * @param {Date} start 开始日期 日期格式为 YYYY-MM-DD
 * @param {Date} end 结束日期 日期格式为 YYYY-MM-DD
 * @returns {Array} 日期数组
 */
function getDaysBetweenDate(start, end) {
  function getDate(datestr) {
    let temp = datestr.split("-");
    return new Date(temp[0], temp[1] - 1, temp[2]);
  }
  let date_all = [],
    i = 0;
  let startTime = getDate(start);
  let endTime = getDate(end);
  while ((endTime.getTime() - startTime.getTime()) >= 0) {
    let year = startTime.getFullYear();
    let month = (startTime.getMonth() + 1).toString().length == 1 ? "0" + (startTime.getMonth() + 1).toString() : (startTime.getMonth() + 1).toString();
    let day = startTime.getDate().toString().length == 1 ? "0" + startTime.getDate() : startTime.getDate();
    date_all[i] = year + "-" + month + "-" + day;
    startTime.setDate(startTime.getDate() + 1);
    i += 1;
  }
  return date_all;
}

function formatRangeTime(range_day) {
  const statr_time = moment(range_day[0]).startOf('day').format("YYYY-MM-DD HH:mm:ss")
  const end_time = moment(range_day[1]).endOf('day').format("YYYY-MM-DD HH:mm:ss")

  return [statr_time, end_time];
}
/**
 * @description 获取32位UUID
 * @param {boolean} [symbol=false] 默认:false; true:返回’-‘分割符号，false:不返回分割符号
 * @returns {String} uuid
 */
function getUuid(symbol = false) {
  if (symbol) return uuidv4().toUpperCase()
  return uuidv4().replace(/-/g, '').toUpperCase()
}
async function getInviteCode(times = 0) {
  if (times > 3) return Promise.reject('生成次数已达上限！')
  times++
  let code = getUuid().substring(6, 14)
  let has = (await knex(ACCOUNT_TABLE).select('id').where({ uid: code }).limit(1))[0]
  if (has) return await getInviteCode(times)
  return code
}
function getWeakPassword() {
  let arr_pwd = []
  config.weak_pwd.forEach(element => {
    arr_pwd.push(crypto.createHash('md5').update(element + config.deviation).digest('hex'))
  });
  return arr_pwd
}
/**
 * @typedef {import("knex").Knex.Transaction } KnexTransaction
 */

/**
 * @param { (trx: KnexTransaction) => Promise<any> } callback
 * @returns
 */
async function knexTransaction(callback) {
  return await new Promise((resolve, reject) => {
    knex.transaction(trx => {
      callback(trx).then(async res => {
        await trx.commit()
        resolve(res)
      }).catch(async err => {
        let message = String(err?.message || err || '未知异常！')
        await trx.rollback(message)
        reject(err)
      })
    }).catch(err => {
      reject(err)
    })
  })

}
function mixPhoneNumber(phone) {
  if (!phone) return ''
  let reg = /^(\d{3})\d{4}(\d{4})$/;
  return phone.replace(reg, '$1****$2');
}
//由于excel 导入时的日期格式不固定，需要对日期进行统一处理
function getImportDate(date, type = 'YYYY-MM-DD') {
  if (!date) return ''
  if (date.constructor == Number && date < 100000) return moment(new Date(1900, 0, date - 1)).format(type)
  return moment(date).format(type)
}

function checkPhone(phone) {
  if (!(/^1[3456789]\d{9}$/.test(phone))) throw new Error('手机号格式不合法！')
}
function getUrl(str) {
  const reg =
    /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
  const strValue = str.match(reg);
  if (strValue && strValue.length > 0) {
    return strValue[0];
  }
  return null;
}
function validateUrl(value = "") {
  if (!value) return true
  return !Validator.isURL(val, { protocols: ['http', 'https'], validate_length: true })
};
function bufferToStream(buffer) {
  let Duplex = require('stream').Duplex;
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
async function sleep(time) {
  return new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      resolve(clearTimeout(id))
    }, time);
  })
}

async function sleep_while(condtion_func, deadline = 10000) {
  let start = Date.now();
  for (; true;) {
    let now = Date.now();
    let condition = await condtion_func(start, now);
    if (condition == false || now - start > deadline) break;

    let next_sleep_time = 300;
    if (typeof condition === 'number') {
      next_sleep_time = condition;
    }
    await sleep(next_sleep_time);
  }
}

function getRequestIP(req) { // 获取当前请求的IP
  let ip = req.headers['x-forwarded-for'] ||
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress || '';
  if (ip.split(',').length > 0) ip = ip.split(',')[0]
  ip = ip.substr(ip.lastIndexOf(':') + 1, ip.length);
  return ip
}

function getBaseStation(ip) {
  let data = ipdb.find(ip) || {}
  return data.data || {}
}

async function highConcat(trx = knex) {
  await trx.schema.raw(`SET SESSION group_concat_max_len = 1024 * 10000`);
}
function selectName(idTable, idFiled, nameTable, nameFiled = "name", asFiled, nameTableKey = 'id') {
  return knex.raw(`(SELECT p.${nameFiled} FROM ${nameTable} p where ${idTable}.${idFiled} = p.${nameTableKey}  LIMIT 0, 1 ) as ${asFiled}`)
}
//检查验证码
function checkCode(req, captcha_code) {
  let code = req.$session || null
  let new_captcha_code = (captcha_code || '').toLowerCase().trim()
  if (!code || new_captcha_code != code) return false
  return true
}
//检查验证码或滑动验证码
async function checkSildeCode(req, captcha_code, remove_session = true) {
  const { removeSession } = require("../db/redis")
  let code = req.$session || null
  if (!code) return false
  let swip = Number(captcha_code)
  let code_str = Number(code)
  // console.log(swip, code, code_str);
  if (String(swip) === 'NaN' || String(code_str) === 'NaN') {
    captcha_code = String(captcha_code || '').toLowerCase().trim()
    if (captcha_code === code) {
      if (remove_session) await removeSession([req.headers['koc-session']])
      return true
    }
    else return false
  }
  //下面是校验滑动
  let access_range = [code - 6, code + 6]
  if (swip < access_range[0] || swip > access_range[1]) return false
  if (remove_session) await removeSession([req.headers['koc-session']])
  return true
}
async function groupData(data = [], callback) {
  if (!data.length) return
  const ConcurrentNum = 100
  let len = Math.ceil(data.length / ConcurrentNum)
  for (let index = 0; index < len; index++) {
    console.log(`数据一共有${len}组，正在处理数据第${index + 1}组`)
    let be_select = data.slice(index * ConcurrentNum, (index + 1) * ConcurrentNum)
    if (callback) await callback(be_select)
  }
}

function queryToJson(string) {
  string = string.split('?').pop()
  let obj = {}, pairs = string.split('&'), d = decodeURIComponent, name, value;
  pairs.forEach(pair => {
    pair = pair.split('=');
    name = d(pair[0]);
    value = d(pair[1]);
    obj[name] = value;
  });
  return obj;
}

function mergeParams(url = '', params = {}) {
  if (!url) throw new Error('推广链接异常！')
  let old_params = queryToJson(url)
  let path = url.split('?').shift()
  let new_params = new URLSearchParams({ ...old_params, ...params })
  let new_url = `${path}?${new_params.toString()}`
  // console.log(new_path);
  return new_url
}

function getUrlPath(url = '', keep_sep = true) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname || '';
  if (keep_sep) return pathname;

  return pathname.replace(/^\//, '');
}

/**@param {string} url  */
function replaceUrlOrigin(url, origin) {
  const urlObj = new URL(url);
  return url.replace(urlObj.origin, origin);
}

function compareUrlOsskey(url1, url2) {
  return getUrlPath(url1, false) == getUrlPath(url2, false);
}

function timestampSec(params) {
  return ~~(Date.now() / 1000)
}

/**从obj中取出对应prop值 */
function extractProp(obj, props) {
  const ext = {};
  if (!Array.isArray(props)) props = [props];
  props.forEach(k => {
    ext[k] = obj[k];
    delete obj[k];
  })
  return ext;
}

/**获得source与taget不同的部分 */
function objectDifferent(source, target) {
  const keys = Reflect.ownKeys(source);
  const data = {};
  keys.forEach(k => {
    if (!Reflect.has(target, k) || source[k] != target[k]) {
      data[k] = source[k];
    }
  });
  return data;
}

/**按key对应关系将provides数组混入targets数组中 */
function injectProvides(targets = [], target_key, provides = [], provide_key, mix_func) {
  mix_func = mix_func ?? Object.assign;
  const map = new Map();
  provides.forEach(v => {
    map.set(v[provide_key], v);
  });
  targets.forEach(v => {
    const provide = map.get(v[target_key]);
    if (provide) {
      mix_func(v, provide);
    }
  })
}

async function factoryListResponse(query, table, filed = 'id', pagination = "page") {
  const response = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1) || 1,
    pagesize: Number(query.pagesize || 20) || 20,
    site: 0,
    next_page_site: 0,
  }

  if (response.pagesize > 100) throw "分页上限为100条！";

  if (pagination == 'page' && table) {
    if (response.page == 1) {
      const { getTableSite } = require("./sqlHelper")
      response.site = await getTableSite(table, filed);
    } else {
      response.site = query.site || 0;
    }
  } else {
    response.next_page_site = query.next_page_site || 0;
  }

  if (pagination == 'page') {
    delete response.next_page_site;
  } else {
    delete response.site;
  }

  return response;
}

async function factoryAppListResponse(query, table, filed = 'id', pagination = "page") {
  const response = {
    code: 0,
    data: {
      // count: 0,
      list: [],
      page: Number(query.page) || 1,
      pagesize: Number(query.pagesize) || 20,
      site: 0,
      next_page_site: 0,
    }
  }

  if (response.data.pagesize > 100) throw "分页上限为100条！";

  if (pagination == "page" && table) {
    if (response.data.page == 1) {
      const { getTableSite } = require("./sqlHelper")
      response.data.site = await getTableSite(table, filed);
    } else {
      response.data.site = query.site || 0;
    }
  } else {
    response.data.next_page_site = query.next_page_site || 0;
  }

  if (pagination == 'page') {
    delete response.data.next_page_site;
  } else {
    delete response.data.site;
    delete response.data.page;
  }

  return response;
}

function renderPrice(p, prefix = '¥', suffix = '') {
  let yuan = '';
  if (p === undefined || p === null || p === '') {
    yuan = '0';
  } else {
    yuan = (p / 100).toFixed(2).replace(/\.?0+$/, '');
  }
  if (prefix) {
    yuan = prefix + ' ' + yuan;
  }
  if (suffix) yuan += suffix
  return yuan;
}
//判断两个时间是否有交集
function isDateIntersection(start1, end1, start2, end2) {
  var startdate1 = new Date(start1.replace("-", "/").replace("-", "/"));
  var enddate1 = new Date(end1.replace("-", "/").replace("-", "/"));

  var startdate2 = new Date(start2.replace("-", "/").replace("-", "/"));
  var enddate2 = new Date(end2.replace("-", "/").replace("-", "/"));

  if (startdate1 >= startdate2 && startdate1 <= enddate2) { //startdate1介于另一个区间之间
    return true;
  }

  if (enddate1 >= startdate2 && enddate1 <= enddate2) { //enddate1介于另一个区间之间
    return true;
  }

  if (startdate1 <= startdate2 && enddate1 >= enddate2) { //startdate1-enddate1的区间大于另一个区间，且另一个区间在startdate1-enddate1之间
    return true;
  }

  return false;
}
//从文本中匹配作品链接 8.94 复制打开抖音，看看测试作品  https://v.douyin.com/iR25o2Db/ 09/09 N@J.vS qEU:/
function extractLinks(text) {
  // 正则表达式匹配链接
  var regex = /((http|https):\/\/[^\s]+)/g;
  var links = text.match(regex);
  return links;
}

async function channel_advertisers(userinfo, query) {
  const channel_id = userinfo?.channel_id ?? query?.channel_id ?? 0;

  let channel_advers = [];
  if (!channel_id) return channel_advers;

  const ch_adv_json = (
    await knex(CHANNEL_TABLE)
      .select("advertiser_types")
      .where("id", channel_id)
  )[0]?.advertiser_types;
  if (!ch_adv_json) return channel_advers;
  /**@type { any[] | null } */
  const ch_advs = JSON.parse(ch_adv_json);
  if (!ch_advs) return channel_advers;

  return ch_advs;
}
/**
 * 从referer 获取小程序app_id 和版本号
 * @param {*} referer 
 * @returns 
 */
function getRefererAppId(referer = '') {
  let back = { app_id: null, version: null }
  try {
    if (!referer) return back
    let path = getUrlPath(referer, false)
    let info = queryToJson(referer)
    if (info?.appid) return { app_id: info.appid, version: info.version }
    if (!path) return back
    let [app_id, version] = String(path).split('/')
    if (!app_id || !version) return back
    return { ...back, app_id, version }
  } catch (error) {
    return back
  }
}
/**
 * 设定超时过期时间
 * @param {number} [expire_time=0] 过期时间 单位秒
 * @param {Promise} promise 
 */
function promiseWithTimeout(promise, expire_time) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      return reject(new Error(`Promise timed out after ${expire_time} seconds`));
    }, expire_time * 1000);

    promise.then((result) => {
      clearTimeout(timeout);
      resolve(result);
    }).catch((err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
/**
 * 通过身份证号码获取年龄
 * @param {*} id_card 身份证号
 * @returns 
 */
function getPeopleAge(id_card = '') {
  if (!id_card) return
  let date = new Date();
  let currentYear = date.getFullYear();
  let currentMonth = date.getMonth() + 1;
  let currentDate = date.getDate();
  let idxSexStart = id_card.length == 18 ? 16 : 14;
  let birthYearSpan = id_card.length == 18 ? 4 : 2;
  let year;
  let month;
  let day;
  let sex;
  let birthday;
  let age;
  let idxSex = 1 - id_card.substr(idxSexStart, 1) % 2;
  sex = idxSex == '1' ? '女' : '男';
  //生日
  year = (birthYearSpan == 2 ? '19' : '') + id_card.substr(6, birthYearSpan);
  month = id_card.substr(6 + birthYearSpan, 2);
  day = id_card.substr(8 + birthYearSpan, 2);
  birthday = year + '-' + month + '-' + day;
  //年龄
  let monthFloor = (currentMonth < parseInt(month, 10) || (currentMonth == parseInt(month, 10) && currentDate < parseInt(day, 10))) ? 1 : 0;
  age = currentYear - parseInt(year, 10) - monthFloor;
  return age
}
/**
 * 获取字符串的md5
 * @param {String} str 
 * @returns 
 */
function getStringMD5(str = '') {
  if (!str) throw new Error('error string')
  return crypto.createHash('md5').update(str).digest('hex')
}
module.exports = {
  getDaysBetweenDate,
  formatRangeTime,
  getUuid,
  knexTransaction,
  mixPhoneNumber,
  getImportDate,
  checkPhone,
  bufferToStream,
  getUrl,
  validateUrl,
  sleep,
  sleep_while,
  getRequestIP,
  getBaseStation,
  highConcat,
  selectName,
  checkCode,
  groupData,
  checkSildeCode,
  timestampSec,
  queryToJson,
  mergeParams,
  getUrlPath,
  replaceUrlOrigin,
  compareUrlOsskey,
  getWeakPassword,
  getInviteCode,
  extractProp,
  objectDifferent,
  injectProvides,
  getWeakPassword,
  factoryListResponse,
  factoryAppListResponse,
  renderPrice,
  isDateIntersection,
  extractLinks,
  channel_advertisers,
  getRefererAppId,
  promiseWithTimeout,
  getPeopleAge,
  getStringMD5
}