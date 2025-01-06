const knex = require("../../db/knexManager").knexProxy;
const { TOKEN_TABLE } = require("../../config/setting")
const { getRequestIP, getBaseStation, sleep } = require('../../utils/tools')
const logger = require("./logstash");
const { delKeys } = require("../../db/redis");
const { makeSendSign } = require("../../db/token");

const LOG_WHITE = {
    '/api/login/captcha': true,
    '/api/login/concat': true,
    '/api/login/scan_login': true,
    '/api/login/slide_code': true,
    '/api/applet/tool/system_config/explosive_quantity/daily': true,
    '/api/applet/marking/user/bank': true,
    '/api/applet/business/public/project/def': true,

    // preview
    '/api/applet/popularize/keyword/source/list': true,
    '/api/applet/user/favorite/list': true,
    '/api/applet/user/watch/list': true,
}
const LOG_WHITE_REG = [
    { path: /\/api\/applet\/realization\/drama/, method: "get" },
    { path: /\/api\/applet\/v2\/realization\/drama/, method: "get" },
]
async function saveReqLogs(req, res) {
    let { koc_request_id: request_id, query, body, path, method, headers } = req
    if (LOG_WHITE[path]) return
    let ip = getRequestIP(req)
    req.$req_ip = ip
    let token = req.headers.token || null
    if (token) token = String(token).substring(0, 100)
    let request_time = new Date().getTime()
    // let ua_info = UAParser(req.headers['user-agent'] || '')
    let location = getBaseStation(ip)
    if (['HEAD', 'OPTIONS'].includes(method)) return //这类请求不记录日志
    let country = location.country_name || null
    let province = location.region_name || null
    let city = location.city_name || null
    let insert_data = {
        ip, token, country, province, city, request_id, request_time, path, method,
        ua_info: null,
        // query: JSON.stringify(query) != '{}' ? JSON.stringify(query) : null,
        // body: JSON.stringify(body) != '{}' ? JSON.stringify(body) : null,
        headers: JSON.stringify(headers) != '{}' ? JSON.stringify(headers) : null,
    }
    res.request_insert_data = insert_data
}
async function insertLog(req, res, restArgs) {
    let { request_insert_data } = res
    if (request_insert_data) {
        let back_info = restArgs[0]
        let back_time = new Date().getTime()
        request_insert_data.back_info = JSON.stringify(back_info)
        request_insert_data.back_time = back_time
        request_insert_data.diff_time = request_insert_data.request_time ? back_time - request_insert_data.request_time : null
        request_insert_data.query = JSON.stringify(req.query)
        request_insert_data.body = JSON.stringify(req.body)
        if (back_info && back_info.code) {
            request_insert_data.type = 2
            request_insert_data.error_info = JSON.stringify(back_info)
            request_insert_data.error_message = back_info.raw_message || back_info.message || '未知错误'
        }
        if (req && req.$user) {
            request_insert_data.account_id = req.$user.id || null
        }
        if (request_insert_data.token && !request_insert_data.account_id) {
            let info = (await knex(TOKEN_TABLE).select('account_id').where('token', request_insert_data.token).limit(1))[0]
            info && (request_insert_data.account_id = info.account_id)
        }
        let log_meta = {
            ...request_insert_data,
            account_name: req?.$user?.name,
            ...(req.$open_user || {})
        }
        if (request_insert_data?.error_message) {
            logger.error(request_insert_data?.error_message, log_meta);
        } else {
            logger.info(request_insert_data.request_id, log_meta);
        }
    }
}
const endMiddleware = (req, res, next) => {
    const defaultSend = res.send;
    req.times = 1
    res.send = (...restArgs) => {
        if (!req._responseSent) {
            insertLog(req, res, restArgs).catch(err => {
                console.log('日志写入异常！', err);
            })
            restArgs = makeSendSign(req, restArgs)
            if (req._$loading_key) delKeys([req._$loading_key])
        }
        req._responseSent = true;
        return defaultSend.apply(res, restArgs);
    };
    next();
};
module.exports = {
    saveReqLogs,
    endMiddleware,
    logger
}