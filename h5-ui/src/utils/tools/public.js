export function queryUrlParams(url) {
  try {
    let urlObj = new URL(url);
    return urlObj.searchParams;
  } catch {
    //手动获取？和#后面的信息
    let askIn = url.indexOf('?'),
      wellIn = url.indexOf('#'),
      askText = '',
      wellText = '';
    //#不存在
    wellIn === -1 ? (wellIn = url.length) : null;
    //?存在
    askIn >= 0 ? (askText = url.substring(askIn + 1, wellIn)) : null;
    wellText = url.substring(wellIn + 1);
    //获取每一部分信息
    let result = {};
    wellText !== '' ? (result['HASH'] = wellText) : null;
    if (askText !== '') {
      let ary = askText.split('&');
      ary.forEach((item) => {
        let itemAry = item.split('=');
        result[itemAry[0]] = itemAry[1];
      });
    }
    return result;
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

export function trimStr(str) {
  // 去除空格与换行
  let reg1 = /\s+/g;
  let reg2 = /[\r\n]/g;
  let trimStr = '';
  if (typeof str === 'string') {
    trimStr = str.replace(reg1, '').replace(reg2, '');
  }
  return trimStr;
}

/**
 * @param {Number} len uuid的长度
 * @param {Boolean} firstU 将返回的首字母置为"u"
 * @param {Nubmer} radix 生成uuid的基数(意味着返回的字符串都是这个基数),2-二进制,8-八进制,10-十进制,16-十六进制
 */
export function getUuid(len = 32, firstU = true, radix = null) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  const uuid = [];
  radix = radix || chars.length;

  if (len) {
    // 如果指定uuid长度,只是取随机的字符,0|x为位运算,能去掉x的小数位,返回整数位
    for (let i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    let r;
    // rfc4122标准要求返回的uuid中,某些位为固定的字符
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    for (let i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  // 移除第一个字符,并用u替代,因为第一个字符为数值时,该guuid不能用作id或者class
  if (firstU) {
    uuid.shift();
    return `u${uuid.join('')}`;
  }
  return uuid.join('');
}
