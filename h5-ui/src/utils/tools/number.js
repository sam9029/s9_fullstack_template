import { moneyUnit } from '@/utils/tools/tools.js';

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
    yuan = yuan + '' + suffix;
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

export function tranformMoneyToThousandthDigit(num) {
  // 先除于 100, 再转化千分位
  let res = transform(moneyUnit(num, true));
  // 金额为0时 也要确保显示金额格式化为0.00
  return res != '0' ? res : '0.00';
}
