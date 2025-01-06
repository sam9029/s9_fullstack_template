const crypto = require('crypto');
const OSS = require('ali-oss');
const moment = require('moment');
const request = require("../../../utils/request");

const { bucket } = require('../../../config/index');
const store = new OSS(bucket);
const publicHost = bucket.publicHost;

/**
 * @typedef { Object } Option
 * @property  { boolean } [handle_empty]
 * @property  { string } [separator]
 * @property  { (key: string, value: string) => string } [handler]
 * @property  { (a: string, b: string) => number } [compare_fn]
 * @param { Option } [options]
 */
function sort_and_join(params, options = {}) {
  const {
    compare_fn,
    handle_empty = false,
    handler = (key, value) => decodeURIComponent(`${key}=${value}`),
    separator = '&'
  } = options;

  const keys = Reflect.ownKeys(params).sort(compare_fn);

  let values = [];
  for (const key of keys) {
    if (Object.hasOwnProperty.call(params, key)) {
      let value = params[key];
      if (value === null || value === undefined || value === '') {
        if (!handle_empty) {
          continue;
        }
        value = "";
      }
      if (typeof value == 'object') {
        value = JSON.stringify(value);
      }

      let pair = `${key}=${value}`;
      if (handler) {
        pair = handler(key, value);
        if (!pair) continue
      }
      values.push(pair);
    }
  }

  return values.join(separator);
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function hmac_sha256(str, secret, encoding = 'hex') {
  return crypto.createHmac('sha256', secret).update(str).digest(encoding);
}

/**秒级时间戳 */
function timestamp_sec() {
  return ~~(Date.now() / 1000)
}

/**生成随机字符串 */
function nonce_str(len) {
  return crypto.randomBytes(2 * len).toString('hex').substring(0, len);
}

const TRACK_FLAG = '__k_is_track_proxy'
/**追踪已使用过的props */
function track_props(targer, recorder = new Set()) {
  Reflect.set(recorder, TRACK_FLAG, true);
  const { proxy, revoke } = Proxy.revocable(targer, {
    get(_target, prop, reciver) {
      if (prop == TRACK_FLAG) {
        return true;
      }
      if (Reflect.get(recorder, TRACK_FLAG)) {
        recorder.add(prop);
      }
      return Reflect.get(_target, prop, reciver);
    }
  });
  recorder._track_revoke = revoke;

  return { proxy, recorder }
}

/**返回未使用过的props */
function untrack_props(proxy, recorder) {
  if (!(recorder instanceof Set)) {
    throw "recorder must be return by function track_props";
  }

  let is_proxy_recoder = Reflect.has(recorder, TRACK_FLAG);
  if (is_proxy_recoder) {
    // 停止记录 之后会访问getter
    Reflect.set(recorder, TRACK_FLAG, false);
  }

  const extra = Object.create(null);
  const keys = Reflect.ownKeys(proxy);
  for (const key of keys) {
    if (!recorder.has(key)) {
      extra[key] = proxy[key];
    }
  }
  recorder.clear();
  if (is_proxy_recoder) {
    // 释放代理
    recorder._track_revoke?.();
  }

  return extra;
}

/**将外部文件链接转存oss */
async function save_file_to_oss(url, folder = "drama") {
  url = encodeURI(url);
  let name = md5(url)
  let stream = await request({
    url,
    method: 'get',
    retry: 0,
    responseType: "stream"
  });

  let result = await store.putStream(`${folder}/${name}.jpg`, stream);
  return publicHost + result.name
}

function is_empty(value) {
  return value === undefined || value === null || value === '';
}

function split_tags(tags, splitter = '、') {
  let tag_arr = (tags || '')
    .split(splitter)
    .map(v => v.trim())
    .filter(v => v.length > 0);

  if (tag_arr.length) return JSON.stringify(tag_arr);
  return null
}

function filter_vids(book_list, vids, prop = "id") {
  const vid_set = new Set(vids);
  return book_list.filter(v => vid_set.has(String(Reflect.get(v, prop))))
}

function check_params_type(param, key_configs) {
  for (const config of key_configs) {
    const { key, type, required = true } = config;
    switch (type) {
      case 'number':
        _check_param_int(param, key, required);
        break;
      case 'string':
        _check_param_string(param, key, required);
        break;
      case 'date':
        _check_param_date(param, key, required, config.format);
        break;
      default:
        throw 'unimplements chekc parm type ' + type;
    }
  }
}
function _throw_empty_error(key, type) {
  throw `Invaild Param ${key}: expected ${type}, got None`
}
function _throw_type_error(key, type, val) {
  let str_val = val;
  if (typeof str_val != 'string') {
    try {
      str_val = JSON.stringify(str_val)
    } catch {
      str_val = 'struct'
    }
  }
  throw `Invaild Param ${key}: mismatched types, expected ${type}, found ${str_val}`
}
function _check_param_int(params, key, required) {
  let val = params[key];
  if (is_empty(val)) {
    if (required) {
      _throw_empty_error(key, 'integer');
    } else {
      params[key] = 0;
      return;
    }
  }
  let num_key = Number(params[key]);
  // 类型错误
  if (isNaN(num_key)) {
    _throw_type_error(key, 'integer', val);
  }
  // 溢出
  if (num_key > Number.MAX_SAFE_INTEGER) {
    throw `Invaild Param ${key}: literal out of range for integer`
  }
  params[key] = num_key;
}
function _check_param_string(params, key, required) {
  let val = params[key];
  if (is_empty(val)) {
    if (required) {
      _throw_empty_error(key, 'string');
    } else {
      params[key] = '';
      return;
    }
  }
  if (typeof val != 'string') {
    _throw_type_error(key, 'string', val);
  }
  params[key] = val;
}
function _check_param_date(params, key, required, format = 'YYYY-MM-DD HH:mm:ss') {
  let val = params[key];
  if (is_empty(val)) {
    if (required) {
      _throw_empty_error(key, 'date');
    } else {
      params[key] = null;
      return;
    }
  }
  let date = moment(val);
  if (!date.isValid()) {
    _throw_type_error(key, 'date', val);
  }
  params[key] = date.format(format);
}

function aes_256_encrypt(data, key, iv, encoding = "hex") {
  const iv_byte = Buffer.from(iv);
  const key_byte = Buffer.from(key);
  const cipher = crypto.createCipheriv('aes-256-cbc', key_byte, iv_byte);
  let text = data;
  if (typeof text != 'string') {
    text = JSON.stringify(text);
  }
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return encrypted.toString(encoding)
}

function get_kocmount_host() {
  if (process.env.NODE_ENV == "production") {
    return "http://192.168.4.1:8787";
  }
  return (process.env.MOUNT_URL) || ("http://127.0.0.1:" + 3016)
}

function get_boyao_host() {
  if (process.env.NODE_ENV == "production") {
    return "http://192.168.4.1:8620";
  }
  return (process.env.BOYAO_URL) || ("http://127.0.0.1:" + 3018)
}


module.exports = {
  sort_and_join,
  md5,
  hmac_sha256,
  timestamp_sec,
  nonce_str,
  save_file_to_oss,
  is_empty,
  track_props,
  untrack_props,
  split_tags,
  filter_vids,
  check_params_type,
  aes_256_encrypt,
  get_kocmount_host,
  get_boyao_host
}