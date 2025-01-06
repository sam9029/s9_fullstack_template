import axios from 'axios';
import SparkMD5 from 'spark-md5';
import { getToken } from '@/utils/storage/token';
import { useRouter } from 'vue-router';
import { WHITE_LIST } from '@/routes/whiteList';
import { showNotify, showDialog } from 'vant';
import { useUserStore } from '@/store/modules/user.js';
import errorCode from '../config/errorCode';
import { encrypt, decrypt } from '@/utils/tools/crypto.js';
const router = useRouter();

let session = null;

const service = axios.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: import.meta.env.VITE_BASE_API,
  withCredentials: true, // 跨域设置，使前台能保存cookie
  // 超时
  timeout: 100000,
});

const requestPool = new Set();
let messaging = false;

function generateRequestId(config) {
  const { url, data, method } = config;
  // get忽略
  if (method.toLocaleLowerCase() == 'get') return null;
  // 上传接口忽略
  if (data instanceof FormData || data instanceof File) return null;
  // eg: 头条批量转化追踪
  if (config.skipCheck) return null;
  // .../mkt/type/... 广告创建考虑批量的情况 跳过校验
  if (/\/mkt\/[a-zA-Z_]+\//.test(url)) return null;

  // console.time(config.url);
  const spark = new SparkMD5();
  spark.append(url);
  spark.append(JSON.stringify(data) || '');
  // console.timeEnd(config.url);
  return spark.end();
}

service.interceptors.request.use(
  async (config) => {
    const store = useUserStore();
    const requestId = generateRequestId(config);
    if (requestId) {
      if (requestPool.has(requestId)) {
        const requestErr = new Error('请求频率过于频繁，请稍后再试!');
        requestErr.config = config;
        throw requestErr;
      }
      config.requestId = requestId;
      requestPool.add(requestId);
    }

    // 是否需要设置 token
    const isToken = (config.headers || {}).isToken === false;
    if (session) config.headers['koc-session'] = session || ''; // 让每个请求携带自定义session
    if (getToken() && !isToken) {
      config.headers.token = getToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    config.headers.deviceid = store.getters?.userInfo?.device_id || '';
    config.headers.fingerprint = store.getters?.fingerprint?.fingerprint || '';
    config.headers.timestamp = Math.floor(new Date().getTime() / 1000);
    if (!config.headers.fingerprint) {
      try {
        const data = await store.GET_FINGERPRINT();
        if(data.finger_print) config.headers.fingerprint = data.finger_print;
      } catch (error) {}
    }
    return encodeConfig(config);
  },
  (error) => {
    console.log(error);
    Promise.reject(error);
  },
);

function encodeConfig(config = {}) {
  let { deviceid, fingerprint, token, timestamp } = config.headers;
  if (deviceid && token) {
    let query_md5 = getStringMD5(`${deviceid}${timestamp}`);
    let s_iv = Buffer.from(query_md5, 'hex').subarray(0, 16);
    if (config?.params) {
      config.params = { l_sign: encrypt(config.params, token, s_iv)?.content };
    }
    if (config?.data) {
      config.data = { l_sign: encrypt(config.data, token, s_iv)?.content };
    }
    config.$s_iv = s_iv;
    config.$s_secret = token;
  }
  return config;
}

service.interceptors.response.use(
  (res) => {
    if (res.data?.r_sign)
      res.data = decrypt({ iv: res.config.$s_iv, content: res.data?.r_sign }, res.config.$s_secret);
    if (res.headers?.['koc-version']) {
      if (res.headers?.['koc-version'] != import.meta.env.VITE_VERSION) {
        handleVersionUnmatch();
      }
    }

    const requestId = res.config.requestId;
    if (res && res.headers && res.headers['koc-session']) session = res.headers['koc-session'];
    requestPool.delete(requestId);

    // 未设置状态码则默认成功状态
    const code = res.data.code || 200;
    // 获取错误信息
    const msg =
      errorCode[code] ||
      res.data.msg ||
      res.data.message ||
      res.data.err ||
      errorCode[res.data.ok] ||
      errorCode['default'];
    if (res.status === 401) {
      handleUnauthorized();
    } else if (code === 500) {
      if (!messaging) {
        messaging = true;
        showNotify({
          message: msg,
          type: 'error',
          onClose: () => {
            messaging = false;
          },
        });
      }
      return Promise.reject(msg);
    } else {
      if (res.data && res.data.need_code) return res.data;
      if (res.data && res.data.code && res.data.code != 200) {
        if (res.data.code == 1001) {
          return Promise.reject({ code, message: msg });
        } else {
          return Promise.reject(msg);
        }
      } else return res.data;
    }
  },
  (error) => {
    let { message, config, response } = error;
    requestPool.delete(config?.requestId);

    if (response?.status == 401) {
      goto_unauthorized(response.status);
      return Promise.reject('登录已过期！');
    }

    if (config?.url) {
      if (config.url.indexOf('scan_login') != -1) return Promise.reject(error);
    }
    if (message.startsWith('Cancel Request:')) return Promise.reject(error);
    if (message === 'Network Error') {
      message = '后端接口连接异常';
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时';
    } else if (message.includes('Request failed with status code')) {
      message = '系统接口' + message.substr(message.length - 3) + '异常';
    }
    if (!messaging) {
      messaging = true;
      showNotify({
        message: message,
        type: 'error',
        duration: 5 * 1000,
        onClose: () => {
          messaging = false;
        },
      });
    }
    return Promise.reject(error);
  },
);

function handleVersionUnmatch() {
  if (version) return;
  version = true;
  showConfirmDialog({
    title: '温馨提示',
    message: '新版本已经准备好，是否重启应用？',
    confirmButtonText: '重新启动',
  })
    .then(() => {
      version = false;
      location.reload();
    })
    .catch(() => {
      version = false;
      location.reload();
    });
}

let white_list = WHITE_LIST.map((i) => '/h5' + i.path);
function goto_unauthorized(status_code) {
  let pathname = window?.location?.pathname;
  if (white_list.includes(pathname)) return;
  if (location.href.indexOf(`/h5/error?type=${status_code}`) == -1) {
    location.href = `/h5/error?type=${status_code}`;
  }
}

export default service;
