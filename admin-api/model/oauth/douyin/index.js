const moment = require("moment")
const knex = require('../../../db/knexManager').knexProxy;
const { WITHDRAW_DETAILS, BANK_TABLE, DRAMA_FEEDBACK } = require('../../../config/setting');
const { system_account_id } = require('../../../config/index');
const { getUuid, knexTransaction, validateUrl, sleep } = require("../../../utils/tools");
const { insertLog, getLogData, getExpireDay } = require("../../public/operationLog");
const { getToken, getFansInfo, getUserInfo, getClientToken, getShareId, getTicket,
    refreshToken, refreshAccessToken, getXGSJProductionDYToken, getProductionDYToken } = require("./api")
const { getCustomCache, setCustomCache, delKeys } = require("../../../db/redis")
const XGSJ_APP_KEY = 'awnng6k7loc8o40x'
const TWYQ_APP_KEY = 'awuk8m1ss2gtfouj'
var token_mapper = {}
const CryptoJs = require("crypto-js")
//授权的code 转换成token
async function codeToToken(code = '') {

}
async function makeTicket(refresh = false, client_key = 'awej4eui4zewlyi0') {
    let { access_token } = await makeClientToken(refresh, client_key)
    let { data } = await getTicket({ need_callback: true }, access_token)
    if (data.error_code == 2190008) return await makeShareId(true)
    if (!data.ticket) return Promise.reject('ticket获取失败！')
    return String(data.ticket)
}
async function makeShareId(refresh = false, client_key = 'awej4eui4zewlyi0') {
    let { access_token } = await makeClientToken(refresh, client_key)
    let { data } = await getShareId({ need_callback: true }, access_token)
    if (data.error_code == 2190008) return await makeShareId(true)
    if (!data.share_id) return Promise.reject('data.share_id获取失败！')
    return String(data.share_id)
}
async function makeClientToken(refresh = false, client_key = 'awej4eui4zewlyi0') {
    if (client_key == 'awnng6k7loc8o40x' || client_key == 'awuk8m1ss2gtfouj') {
        let data = await getXGSJProductionDYToken({ token: 'qwertyuiopasdfghjkl', refresh, client_key })
        if (data && data.code == 0) return data.data
        return Promise.reject('获取小果视界线上抖音token失败！')
    }
    if (process.env.NODE_ENV != "production") {//非生产环境，获取线上token
        let data = await getProductionDYToken({ token: 'qwertyuiopasdfghjkl', refresh, client_key })
        if (data && data.code == 0) return data.data
        return Promise.reject('获取线上抖音token失败！')
    }
    let time_now = parseInt(new Date().getTime() / 1000)
    let token = token_mapper[client_key]
    if (token && token.access_token && time_now < token.token_after && !refresh) return token
    await getClientToken(client_key).then(({ data }) => {
        if (data && data.access_token) {
            token = {
                access_token: data.access_token,
                token_after: time_now + (data.expires_in || 600) - 300
            }
            token_mapper[client_key] = token
        }
    })
    return token
}
async function checkBeforeOauth(token_info = {}, data = {}, trx = knex) {
    let { access_token, expires_in, open_id, refresh_token, scope } = token_info
    let { platform_id, blogger_id } = data
    let expires_at = moment().add(expires_in - 600, 'seconds').unix()
    let before_data = await trx(AUTH_ACCOUNT).select('id', 'status', 'blogger_id').where({ platform_id, open_id })
    let update_data = {
        access_token,
        expires_at,
        open_id,
        refresh_token,
        auth_status: 1
    }


}
async function grantToken(open_id, access_token, refresh_token, client_key, expires_at) {
    let { data: token_info } = await refreshAccessToken(refresh_token, client_key)
    if (token_info && token_info.error_code == 10010) { //refresh_token过期了
        let { data: refresh_info } = await refreshToken(refresh_token, client_key)
        if (refresh_info.error_code) return { open_id, access_token, refresh_token, client_key, expires_at, auth_status: 2 } //授权失败
        refresh_token = refresh_info.refresh_token
        let { data: new_token_info } = await refreshAccessToken(refresh_token, client_key)
        if (new_token_info.error_code) return { open_id, access_token, refresh_token, client_key, expires_at, auth_status: 2 } //授权失败
        access_token = new_token_info.access_token
        refresh_token = new_token_info.refresh_token
        expires_at = moment().add(new_token_info.expires_in - 600, 'seconds').unix()
    }
    return { open_id, access_token, refresh_token, client_key, expires_at, auth_status: 1 }
}
async function refreshUserToken(open_id, access_token, refresh_token, client_key, expires_at) {
    let back = { open_id, access_token, refresh_token, client_key, expires_at, auth_status: 1 }
    let time_now = moment().unix()
    if (time_now >= expires_at) {
        let expire_token = await grantToken(open_id, access_token, refresh_token, client_key, expires_at)
        back = { ...back, ...expire_token }
    }
    let { data: user_info } = await getUserInfo({ open_id, access_token })
    if (user_info && user_info.error_code) {
        let outtime_token = await grantToken(open_id, access_token, refresh_token, client_key, expires_at)
        back = { ...back, ...outtime_token }
    }
    return back
}
async function refreshUserInfo(data = {}) {
    let { expires_at, access_token, refresh_token, client_key, open_id } = data
    let new_token = await refreshUserToken(open_id, access_token, refresh_token, client_key, expires_at)
    if (new_token.auth_status == 2) return new_token
    expires_at = new_token.expires_at
    access_token = new_token.access_token
    refresh_token = new_token.refresh_token
    client_key = new_token.client_key
    open_id = new_token.open_id
    // let keys = ['expires_at', 'access_token', 'refresh_token', 'client_key', 'open_id']
    let [fans_info, user_info] = await Promise.all([getFansInfo({ open_id, date_type: 7 }, access_token), getUserInfo({ open_id, access_token })])
    // console.log(fans_info);
    let { avatar, nickname, union_id } = user_info.data
    let back = {
        fan_counts: getFansNumber(fans_info),
        name: nickname,
        union_id,
        avatar,
        auth_status: 1,
    }
    // console.log(back);
    return back
}
function getFansNumber(fans_info) {
    let { data } = fans_info || {}
    if (!data || !data.result_list) return 0
    if (!data.result_list.length) return 0
    let item = data.result_list.pop()
    return item.total_fans || 0
}
async function oauthAdd(body = {}, userInfo = {}) {
    let { code, client_key = 'awej4eui4zewlyi0' } = body
    let data = checkData(body, userInfo)
    if (!code) return Promise.reject('参数异常，请检查参数！')
    let { data: token_info } = await getToken(code, client_key)
    if (!token_info || !token_info.access_token) {
        console.log('授权失败：', JSON.stringify(token_info));
        return Promise.reject('授权出现异常，请稍后重试！')
    }
    let { access_token, expires_in, open_id, refresh_token, scope } = token_info
    let expires_at = moment().add(expires_in - 600, 'seconds').unix()
    // console.log(token_info, expires_at);
    await sleep(500)
    let [fans_info, user_info] = await Promise.all([getFansInfo({ open_id, date_type: 7 }, access_token), getUserInfo({ open_id, access_token })])
    let { avatar, nickname, union_id } = user_info.data
    if (!union_id) Promise.reject('授权出现异常，请稍后重试！')
    let insert_data = {
        ...data,
        access_token,
        expires_at,
        open_id,
        refresh_date: moment().format('YYYY-MM-DD'),
        refresh_token,
        scope,
        fan_counts: getFansNumber(fans_info),
        name: nickname,
        union_id,
        avatar,
        auth_status: 1,
        status: 1,
        client_key
    }
    data = await knexTransaction(async (trx) => {
        let id = (await trx(AUTH_ACCOUNT).insert(insert_data).onConflict(['platform_id', 'union_id', 'oem_id']).merge())[0]
        await insertLog(trx, getLogData(id, 1316, insert_data, userInfo))
        return id
    })
    // console.log(insert_data);
    return { code: 0, data }
}
async function codeToUser(code, client_key = 'awej4eui4zewlyi0') {
    if (!code) return Promise.reject('参数异常，请检查参数！')
    let { data: token_info } = await getToken(code, client_key)
    if (!token_info || !token_info.access_token) {
        console.log('授权失败：', JSON.stringify(token_info));
        return Promise.reject('授权出现异常，请稍后重试！')
    }
    let { access_token, expires_in, open_id, refresh_token, scope } = token_info
    let expires_at = moment().add(expires_in - 600, 'seconds').unix()
    // console.log(token_info, expires_at);
    await sleep(500)
    let user_info = await getUserInfo({ open_id, access_token })
    let { avatar, nickname, union_id } = user_info.data
    if (!union_id) Promise.reject('授权出现异常，请稍后重试！')
    let insert_data = {
        access_token,
        expires_at,
        open_id,
        refresh_date: moment().format('YYYY-MM-DD'),
        refresh_token,
        scope,
        fan_counts: 0,
        name: nickname,
        union_id,
        avatar,
        auth_status: 1,
        status: 1,
        client_key
    }
    return insert_data
}
function checkData(body, userInfo, type = "add") {
    let user_id = userInfo.id;
    let checkKeys = ["blogger_id", "category_id", "platform_id"];
    let dataKeys = [];
    let data = {};
    if (type == "add") {
        data = {
            create_user_id: user_id,
            update_user_id: user_id,
            oem_id: userInfo.oem_id,
        };
        checkKeys.forEach((key) => {
            if (!body[key]) throw new Error(`字段${key}参数不合法！请检查参数`);
            data[key] = body[key];
        });
    } else if (type == "edit") {
        data = { update_user_id: user_id };
    }
    checkKeys.concat(dataKeys).forEach((key) => {
        if (Object.hasOwnProperty.call(body, key)) data[key] = body[key];
    });
    return data;
}
async function douyinShare(data = {}) {
    let share_id = await makeShareId(false, 'awej4eui4zewlyi0')
    let key = `xgfx:douyin:share:${share_id}`
    await setCustomCache(data, key, 60 * 60)
    return share_id
}
//根据抖音的消息订阅添加发布作品
// "content": {
//     "share_id": "1759159424171015",
//     "item_id": "@9VwK2PTEV548MHT5b4xtWM7912XsOPmFOpJ3rAykJ1Yaafn460zdRmYqig357zEBZBg9EfkqSCrpT1srL8z+Jw==",
//     "has_default_hashtag": null,
//     "video_id": "7205517176562879784"
// },
async function douyinAutoPublish(content = {}, open_id = '', client_key = 'awej4eui4zewlyi0') {
    let { share_id, item_id, video_id } = content
    let key = `xgfx:douyin:share:${share_id}`
    let data = await getCustomCache(key)
    if (!data) return Promise.reject('该分享不存在！')
    let { account_id, platform_id, oem_id, advertiser_type, id: plan_id, drama_id } = data
    if (!account_id || !platform_id || !advertiser_type || !oem_id) return Promise.reject('用户信息不存在！')
    let insert_data = {
        category_id: null,//暂时不填
        create_user_id: account_id,
        update_user_id: account_id,
        platform_id: platform_id,
        advertiser_type: advertiser_type,
        platform_primary_id: 0,
        opus_type: 2,
        opus_url: `https://www.douyin.com/video/${video_id}`,
        oem_id: oem_id,
        account_id: account_id,
        item_id,
        video_id,
        share_id,
        verify_status: 2,
        client_key,
        drama_id: drama_id || 0,
        drama_plan_id: plan_id || 0
    }
    // console.log(insert_data);
    data = await knexTransaction(async (trx) => {
        let id = (await trx(DRAMA_FEEDBACK).insert(insert_data))[0]
        await insertLog(trx, getLogData(id, 4165, insert_data, { id: account_id, oem_id }))
        await delKeys([key])
        return id
    })
    return data
}
async function makeH5ShareSign(data = {}) {
    let nonce_str = getUuid()
    let timestamp = String(moment().unix())
    let client_key = 'awej4eui4zewlyi0'
    let ticket = await makeTicket(false, client_key)
    let str = `nonce_str=${nonce_str}&ticket=${ticket}&timestamp=${timestamp}`
    let signature = CryptoJs.MD5(str).toString()
    let share_id = await makeShareId(false, client_key)
    let key = `xgfx:douyin:share:${share_id}`
    await setCustomCache(data, key, 60 * 60)
    return { nonce_str, timestamp, client_key, ticket, signature, share_id }
}
module.exports = {
    oauthAdd,
    makeShareId,
    douyinShare,
    douyinAutoPublish,
    makeTicket,
    makeH5ShareSign,
    refreshUserInfo,
    makeClientToken,
    codeToUser,
    XGSJ_APP_KEY,
    TWYQ_APP_KEY
}