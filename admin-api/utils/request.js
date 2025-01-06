const axios = require('axios');
const http = require("http");
const https = require("https");

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

/**
 * @typedef { import("axios").AxiosInstance } AxiosInstance
 * @type { AxiosInstance }
 */
const service = axios.create({
  timeout: 40000,
  // 下面两个属性，用来设置，请求失败或者超时，自动重新请求的次数和间隙时间
  retry: 2, // 请求次数
  retryInterval: 1000, // 求期间隙
  maxContentLength: "Infinity",
  maxBodyLength: 'Infinity',
  httpAgent,
  httpsAgent
})
service.interceptors.request.use(config => {
  return config
}, error => {
  Promise.reject(error)
})

// respone interceptor 请求之后异常状态拦截
service.interceptors.response.use(
  response => {
    let httpStatusCode = response.statusCode
    if ([201, 400, 401, 403, 405, 404, 500].includes(httpStatusCode)) return Promise.reject(response);
    let data = response.data
    if (!data) return Promise.reject({ message: '无响应数据' });
    if (response && response.config && response.config.retryCount) console.log("已经重试成功：", response.config.retryCount)
    if (response && response.config && response.config.return_all) return response
    // if (res.code == 0) return res.data 
    return data;
  },
  async function axiosRetryInterceptor(res) {
    if (!res) return Promise.reject({ message: '异常' });
    let config = res.config;
    //如果配置不存在或重试属性未设置，抛出promise错误
    if (!config || !config.retry) return Promise.reject(res);
    if (config.no_need_retry) return Promise.reject(res);
    //设置一个变量记录重新请求的次数
    config.retryCount = config.retryCount || 0;
    console.log(`接口${config.url}报错重试${config.retryCount + 1}次`)
    // 检查重新请求的次数是否超过我们设定的请求次数
    if (config.retryCount >= config.retry) return Promise.reject({ message: '已超出重试次数' });
    //重新请求的次数自增
    config.retryCount += 1;
    // 创建新的Promise来处理重新请求的间隙
    let back = new Promise(function (resolve) {
      //console.log("接口" + config.url + "请求超时，重新请求")
      setTimeout(function () {
        resolve();
      }, config.retryInterval || 1000);
    });
    //返回axios的实体，重试请求
    await back
    return service(config)
  },
  error => {
    console.log('get err: ' + JSON.stringify(error))// for debug
    //return Promise.reject('error')
  }
)

module.exports = service