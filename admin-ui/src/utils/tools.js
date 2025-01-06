import SparkMD5 from 'spark-md5';
import { checkPermi } from '@/utils/permission.js'
export function getUuid() {
  var s = [];
  var hexDigits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4';
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = '';
  let uuid = s.join('');
  return uuid;
}

// 数据转化 千分位i增加，
export function transform(number) {
  if (!number) {
    return 0;
  }
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
// 转化为多少万 等等
export function transformNumber(num) {
  if (!num || isNaN(num)) return 0;
  // 此处为防止字符串形式的数值进来，因为toFixed方法只能用于数值型数
  num = Number(num);
  if (Math.abs(num) > 100000000) {
    return (num / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(num) > 10000) {
    return (num / 10000).toFixed(2) + 'w';
  } else {
    return num;
  }
}
export function validatePhone(rule, value, callback) {
  if (!value) return callback(new Error('请输入手机号码！'));
  if (!/^1[3456789]\d{9}$/.test(value)) return callback(new Error('手机号格式不合法！'));
  callback();
}

export function validateUrl(rule, value = '', callback) {
  if (!value) return callback(new Error('请输入链接！'));
  if (
    !/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]+$/.test(value.trim())
  )
    return callback(new Error('请输入正确的链接！'));
  callback();
}

//粉丝量校验
export function validateFans(rule, value, callback) {
  if ((Number(value) > 0 || Number(value) == 0) && value) {
    callback();
  } else {
    callback(new Error('请输入大于0的数字'));
  }
}

/**
 * @param {any} mapper
 * @param { (key:string, value:any ) => boolean } filter
 * @returns
 */
export function mapperToOptions(mapper, filter) {
  const keys = Reflect.ownKeys(mapper);
  const opts = [];
  keys.forEach((k) => {
    if (k == '__ob__') return;
    if (/^\d+$/.test(k)) k = +k;
    if (filter?.(k, mapper[k])) return;
    const item = { value: k, label: mapper[k] };
    opts.push(item);
  });
  return opts;
}

/**
 * @param {any} mapper 多级枚举集合 {...mapper1, ...mapper2 , ...}
 * @param {number} parentKeyLength 父级key长度
 * @param {number} childLevel 子级key多出来的长度
 * @returns
 */
export function transformToOptions(mapper, parentKeyLength = 4, childLevel = 2) {
  const options = [];

  for (const key in mapper) {
    if (mapper.hasOwnProperty(key) && key.length === parentKeyLength) {
      const value = mapper[key];
      let childKeyLength = parentKeyLength + childLevel;
      const option = {
        value: key,
        label: value,
        children: transformToOptions(getChildren(key, mapper), childKeyLength)
      };
      if (option.children.length === 0) delete option.children;
      options.push(option);
    }
  }
  return options;
}

export function getChildren(parentKey, mapper) {
  const children = {};

  for (const key in mapper) {
    if (key.startsWith(parentKey)) {
      children[key] = mapper[key];
    }
  }
  return children;
}

export function setSearchItemOpts(search, model, options) {
  const item = search.item.find((v) => v.model == model);
  if (!item) return false;
  item.options = options;
}

export function renderPrice(p, prefix = '¥', suffix = null) {
  let yuan = '';
  if (p === undefined || p === null || p === '') {
    yuan = '0';
  } else {
    yuan = (p / 100).toFixed(2).replace(/\.?0+$/, '');
  }
  if (prefix) {
    yuan = prefix + ' ' + yuan;
  }
  if (suffix) {
    yuan = yuan + ' ' + suffix;
  }
  return yuan;
}

export function renderCount(p, suffix = '') {
  let count = '';
  if (p === undefined || p === null || p === '') {
    count = '0';
  } else {
    count = transform(p);
  }
  if (suffix) {
    count = count + suffix;
  }
  return count;
}

export function devWarning(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
}

//#region 导出字段提取 =====
export function exportColumns(tableItems = [], excludes = []) {
  const cols = [];
  tableItems.forEach((col) => {
    const { prop, label, children, slots, infos } = col;
    if (prop == 'action') return;
    // 嵌套表格字段 提取
    if (children?.length) {
      children.forEach((ch) => {
        if (excludes.includes(ch.prop)) return;
        cols.push({ prop: ch.prop, label: col.label + ch.label });
      });
    }
    // 自定义 infos 表格字段 提取
    else if (slots?.customRender == 'infos' && infos?.length > 0) {
      infos.forEach((inf) => {
        if (excludes.includes(inf.prop)) return;
        let tempLabel = (col.label + inf.label).replace('：', '');
        cols.push({ prop: inf.prop, label: tempLabel });
      });
    } else {
      if (excludes.includes(prop)) return;
      cols.push({ prop, label });
    }
  });
  return cols;
}
//#endregion

/**
 * 处理 { id:,name:} 数据转为 {value:,label:}
 * @param {Array} arr 
 * @param {Array} keyArr 需要被转换的字段数据 默认['id','name'] 索引依次对应value,label 
 */
export function formToOptions(arr, keyArr = ['id', 'name']) {
  if (arr.length == 0) return [];
  let temp = [];
  arr.forEach((item) => {
    temp.push({
      value: item[keyArr[0]] || item.value,
      label: item[keyArr[1]] || item.label,
    });
  });
  return temp;
}

export function sizeTostr(size) {
  var data = "";
  if (size < 0.1 * 1024) { //如果小于0.1KB转化成B  
    data = size.toFixed(2) + "B";
  } else if (size < 0.1 * 1024 * 1024) {//如果小于0.1MB转化成KB  
    data = (size / 1024).toFixed(2) + "KB";
  } else if (size < 0.1 * 1024 * 1024 * 1024) { //如果小于0.1GB转化成MB  
    data = (size / (1024 * 1024)).toFixed(2) + "MB";
  } else { //其他转化成GB  
    data = (size / (1024 * 1024 * 1024)).toFixed(2) + "GB";
  }
  var sizestr = data + "";
  var len = sizestr.indexOf("\.");
  var dec = sizestr.substring(len + 1, len + 3);
  if (dec == "00") {//当小数点后为00时 去掉小数部分  
    return sizestr.substring(0, len) + sizestr.substring(len + 3, len + 5);
  }
  return sizestr;
}

// 处理金额
export const moneyUnit = (money) => {
  if (!money) {
    return 0;
  } else if (money % 100 === 0) {
    return '￥' + (money / 100).toFixed(0);
  } else {
    return '￥' + (money / 100).toFixed(2);
  }
}

// 省略字符
export const omittedStr = (str, num) => {
  if (str?.length > num) {
    return str.substring(0, num) + '...'
  } else {
    return str
  }
}

// 权限控制筛选项是否显示
// field: 处理的字段 | searchItems: 筛选项列表 | auth: 权限标识
export const validSearchAuth = (field, searchItems, auth) => {
  if (searchItems && searchItems instanceof Array && searchItems.length > 0) {
    if (!checkPermi(auth)) {
      searchItems.forEach(el => {
        if (el.model == field) {
          el['show'] = false
        }
      })
    }
  } else {
    throw new Error('请确保searchItems为Array类型，并且length大于0!')
  }
}

// 权限控制table项增加或删除
// table: 当前列表 | target: 目标列表项的prop | auth: 权限标识
export const validTableItemAuth = (table = [], target, auth) => {
  if (target && typeof target === 'string') {
    switch (checkPermi(auth)) {
      case true:
        return table
      case false:
        return table.filter(el => el.prop !== target)
    }
  } else {
    throw new Error('请确保target为String类型!')
  }
}

// 移除空对象元素
export const removeObjectEmpty = (obj) => {
  if (obj.constructor === Object) {
    return Object.keys(obj)
      .filter(
        (key) =>
          obj[key] !== null && obj[key] !== undefined && obj[key] !== ""
      )
      .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});
  } else {
    throw new Error("参数必须为对象");
  }
};

export const rateUnit = (rate) => {
  if (rate === undefined || rate === null) {
    return null;
  } else if (rate === 0) {
    return 0;
  } else if (rate % 100 === 0) {
    return (rate / 100).toFixed(0) + '%';
  } else {
    return (rate / 100).toFixed(2) + '%';
  }
};

export function getUrlPath(url = '', keep_sep = true) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname || '';
  if (keep_sep) return pathname;

  return pathname.replace(/^\//, '');
}

/**
 * 设定超时过期时间
 * @param {number} [expire_time=0] 过期时间 单位秒
 * @param {Promise} promise 
 */
export function promiseWithTimeout(promise, expire_time) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Promise timed out after ${expire_time} seconds`));
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
 * @description: 累加函数
 * @param {Array} data 数据
 * @param {Array} fields 需要累加的字段
 * @return {Number} total
 */
export const accumulateTotal = (data, fields) => {
  // 初始化累加总和
  let total = 0;

  // 遍历数据，累加指定字段
  data.forEach(item => {
    fields.forEach(field => {
      // 确保字段存在且为数字类型
      if (field in item && typeof item[field] === 'number') {
        total += item[field];
      }
    });
  });

  return total;
};
/**
 * 获取字符串的md5
 * @param {String} data 
 * @returns 
 */
export const getStringMD5 = (data = '') => {
  const spark = new SparkMD5();
  spark.append(data);
  return spark.end();
};