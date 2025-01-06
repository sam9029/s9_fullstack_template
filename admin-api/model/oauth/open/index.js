const moment = require("moment")
const knex = require('../../../db/knexManager').knexProxy;
const { WITHDRAW_DETAILS, BANK_TABLE, ADVERTISER_TABLE } = require('../../../config/setting');
const { system_account_id } = require('../../../config/index');
const { getUuid, knexTransaction, validateUrl, sleep } = require("../../../utils/tools");
const { insertLog, getLogData, getExpireDay } = require("../../public/operationLog");
const { getCustomCache, setCustomCache, delKeys } = require("../../../db/redis")
const CryptoJs = require("crypto-js")
const { sort_and_join, timestamp_sec, md5 } = require("../../public/externalMedia/utils")
var mapper = {}
async function getAppSecret(app_key = '') {
    if (!app_key) return Promise.reject('参数错误，app_key不存在！')
    if (mapper[app_key]) return mapper[app_key]
    let data = (await knex(ADVERTISER_TABLE).select('id as advertiser_type', 'app_key', 'app_secret').where({ app_key }))[0]
    if (!data) return Promise.reject('参数错误，app_key不存在！')
    mapper[app_key] = data
    return data
}
async function checkSign(params, sign = '') {
    let { time_stamp, app_key } = params || {}
    if (!time_stamp || !app_key || !sign) return Promise.reject('参数错误，app_key、authorization或time_stamp不存在！')
    let now_time = timestamp_sec()
    if (now_time - time_stamp > 60 || time_stamp - now_time > 0) return Promise.reject('请检查time_stamp参数！')
    let { app_secret, advertiser_type } = await getAppSecret(app_key)
    let params_str = sort_and_join(params) + `&app_secret=${app_secret}`
    // console.log(md5(params_str));
    if (md5(params_str) != sign) return Promise.reject('签名校验失败！')
    return advertiser_type
}
module.exports = {
    checkSign
}
// checkSign({ a: 'hdjsjsj', b: 'jxsjxks', time_stamp: 'djdjsjs', app_key: 'dkksmxkwndlcmswl' },'jdkdjsjskkskw')