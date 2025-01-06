//H5唤起媒体进行发布
export async function mediaH5Publish(item = {}) {
  let { schema_url } = item;

  if (!schema_url) return Promise.reject('跳转信息异常，无法发布！');
  const el = document.createElement('a');
  el.href = schema_url;
  el.click();
  return Promise.resolve();
}

//
export async function downLoadUrlSave(val = {}) {
  let { title, url } = val;
  if (!url) return Promise.reject('跳转信息异常，无法发布！');
  let arr = url.split(',');
  let type = arr[0].match(/:(.*?);/)[1];
  let str = atob(arr[1]);
  let len = str.length;
  let utf8Arr = new Uint8Array(len);
  while (len--) {
    utf8Arr[len] = str.charCodeAt(len);
  }
  // 将Blob对象转换成文件并下载到本地
  let blob = new Blob([utf8Arr], {
    type,
  });
  let a = document.createElement('a');
  a.download = title || '推广任务码';
  a.href = URL.createObjectURL(blob);
  a.click();
}

//校验平台
export function validPlatform() {
  const UA = window.navigator.userAgent.toLowerCase();
  if (/micromessenger/i.test(UA)) {
    return 'wechat';
  } else if (/QQ/i.test(UA)) {
    return 'qq';
  } else if (/toutiaomicroapp/i.test(UA)) {
    return 'toutiao';
  } else if (/swan/i.test(UA)) {
    return 'baidu';
  } else if (UA.indexOf('AlipayClient') > -1) {
    return 'ali';
  }
}

//校验设备
export function validMobile() {
  const UA = navigator.userAgent;
  if (/iPhone|webOS|iPad|iPod/i.test(UA)) {
    return 'ios';
  } else if (/Android/i.test(UA) || /Windows Phone/i.test(UA)) {
    return 'android';
  }
}
// query to json
export function queryToJson(string) {
  string = string.split('?').pop();
  let obj = {},
    pairs = string.split('&'),
    d = decodeURIComponent,
    name,
    value;
  pairs.forEach((pair) => {
    pair = pair.split('=');
    name = d(pair[0]);
    value = d(pair[1]);
    obj[name] = value;
  });
  return obj;
}
// intHasDeicmal 整数型是否跟小数 (eg: '0' >>> '0.00', '1' >>> '1.00' )
export function moneyUnit(num, intHasDeicmal = false) {
  if (!num) {
    return 0;
  } else if (num % 100 === 0) {
    return (num / 100).toFixed(intHasDeicmal ? 2 : 0);
  } else {
    return (num / 100).toFixed(2);
  }
}
// 颜色计算
export function colorComputed(color, tint = 0, type = 'light') {
  tint = type == `light` ? tint : 1 - tint;

  let red = parseInt(color.slice(1, 3), 16);
  let green = parseInt(color.slice(3, 5), 16);
  let blue = parseInt(color.slice(5, 7), 16);

  if (type == `light`) {
    red += Math.round(tint * (255 - red));
    green += Math.round(tint * (255 - green));
    blue += Math.round(tint * (255 - blue));
  } else {
    red = Math.round(tint * red);
    green = Math.round(tint * green);
    blue = Math.round(tint * blue);
  }

  red = red.toString(16).padStart('2', '0');
  green = green.toString(16).padStart('2', '0');
  blue = blue.toString(16).padStart('2', '0');

  return `#${red}${green}${blue}`;
}

/**
 * 控制 vconsole 的显隐
 * @param {*} _switch
 */
import { nextTick } from 'vue';
let toggle_status = 0;
export function switchDevConsolePanel() {
  nextTick(() => {
    const vconsoleEl = document.getElementById('__vconsole');
    if (vconsoleEl && vconsoleEl.style) {
      if (toggle_status != 0 && toggle_status % 4 == 0) {
        vconsoleEl.style.display = 'block';
      } else {
        vconsoleEl.style.display = 'none';
      }
    }
    toggle_status += 1;
  });
}

/**
 * @description: 处理输入的两个目标参数，返回非空参数作为对象属性
 * @param {Number|String} target_1 - 第一个目标参数
 * @param {Number|String} target_2 - 第二个目标参数
 * @return {Object} - 返回一个对象，包含第一个非空的目标参数
 */
export function handleReturnId(target_1, target_2) {
  // 优先返回第一个目标参数，如果存在
  if (target_1) {
    return { target_1 };
  }
  // 如果第一个目标参数不存在，则检查第二个目标参数
  if (target_2) {
    return { target_2 };
  }
  // 如果两个目标参数都不存在，返回一个空对象
  return {};
}

/**
 * @description: 创建一个异步的 sleep 函数，用于暂停执行指定的时间（毫秒）。
 * @param {*} time - 需要暂停的时间，单位为毫秒（例如，1000 为 1 秒）。
 * @return {*} 返回一个 Promise，当时间到达后将被解决。
 */
export async function sleep(time) {
  return new Promise((resolve, reject) => {
    // 使用 setTimeout 创建一个定时器
    let id = setTimeout(() => {
      // 在时间到达时调用 resolve，清除定时器以避免内存泄漏
      resolve(clearTimeout(id));
    }, time);
  });
}

