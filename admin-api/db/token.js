const redisClient = require('redis');
const config = require('../config/index')
const { TOKEN_TABLE, ACCOUNT_TABLE, ACTINFO_TABLE, ACCOUNT_ROLE, ROLE_TABLE, PLATFORM_ACCOUNT_TABLE, OEM_TABLE, FINGERPRINT_TABLE } = require('../config/setting')
const crypto = require('crypto'); //加载加密文件
const knex = require('./knexManager').knexProxy
const { getUuid, getBaseStation, timestampSec, getStringMD5, selectName, mixPhoneNumber } = require('../utils/tools')
const { getCustomCache, setCustomCache } = require('./redis');
const { RK_LOGIN_TOKEN } = require('../config/redis_key');
const { decrypt, encrypt } = require('../utils/jwt');

let can_use = false
const client = redisClient.createClient({
    url: config.redis.url,
    socket: {
        reconnectStrategy: (options) => { return Math.max(options * 100, 3000) }
    }
});
client.on('ready', () => {
    can_use = true
})
client.on('error', async (err) => {
    can_use = false
    if (err.message.indexOf('connect ECONNREFUSED') == -1) console.log('Redis 异常：', err.message)
});
client.connect().catch(err => {
    console.log('Redis 连接异常：', err)
})
async function setToken(key = "", data = {}, expire_time = 0) {
    let new_key = `${RK_LOGIN_TOKEN}${key}`
    let value = JSON.stringify(data)
    let val = await client.set(new_key, value, {
        EX: expire_time || config.redis.default_expire_time,
        NX: true
    });
    if (!val) return Promise.reject('登录异常，请稍后再试！')
    return val
}
async function removeToken(keys = []) {
    if (keys && keys.length) {
        return await client.del(keys.map(key => `${RK_LOGIN_TOKEN}${key}`))
    }
    return
}
async function getToken(key = "") {
    let new_key = `${RK_LOGIN_TOKEN}${key}`
    let data = await client.get(new_key)
    if (data) return JSON.parse(data)
    return null
}
function checkUserStatus(user) {
    let message = null
    if (!user) return '身份验证失败，该用户不存在！'
    if (Object.prototype.hasOwnProperty.call(user, 'company_status') && user.company_status != 1) return '公司账户状态异常！'
    if (user.status == 2) message = '该账户已关闭，禁止登录！'
    if (user.status == 3) message = '该账户已删除，禁止登录！'
    if (user.status == 4) message = '该账户已注销，禁止登录！'
    if (user.status != 1) message = '该账户状态异常！'
    if (user.phone_verification == 2) message = `该账户手机号码未认证！#${mixPhoneNumber(user.telephone)}#${user.id}`
    return message
}
async function getTokenUser(req) {
    // let req_token = req.headers.token || ''
    let { token: req_token, timestamp } = req.headers || {}
    let now_time = timestampSec()
    if (!timestamp || !req_token) return Promise.reject('非法请求！')
    if (now_time - timestamp > config.diff_time || timestamp - now_time > config.diff_time) return Promise.reject('请检查timestamp参数！')
    let { account_id, device_id, fingerprint } = await checkSign(req)
    let user = (await knex.select('acc.*', 'tok.token', 'tok.token_after')
        .select(selectName('acc', 'oem_id', OEM_TABLE, 'status', 'company_status'))
        .from(`${TOKEN_TABLE} as tok`)
        .leftJoin(`${ACCOUNT_TABLE} as acc`, 'tok.account_id', 'acc.id')
        .leftJoin(`${ACTINFO_TABLE} as acf`, 'acc.id', 'acf.account_id')
        .where('acc.id', account_id)
        .where('tok.token', req_token)
        .limit(1))[0]
    if (!user) return Promise.reject('身份验证失效，请重新登录！')
    user.role_ids = await getAccountRoleIds(account_id)
    let message = checkUserStatus(user)
    if (message) return Promise.reject(message)
    req.$user = { ...user, device_id, fingerprint }
    return user
}
/**
 * 根据sign 还原参数
 * @param {*} req 
 */
async function checkSign(req) {
    let { token, timestamp, fingerprint: h_fingerprint, deviceid: h_deviceid } = req.headers || {}
    let token_data = await getToken(token)
    if (!token_data) return Promise.reject('登录失效，请重新登录！')
    let { account_id, fingerprint, device_id } = token_data
    if (!Number(account_id)) return Promise.reject('当前账户检测异常，请重新登录！')
    if (h_fingerprint != fingerprint) return Promise.reject({ code: 403, message: '当前环境检测异常，请重新登录！' })
    if (h_deviceid && h_deviceid != device_id) return Promise.reject({ code: 403, message: '当前设备检测异常，请重新登录！' })
    let s_iv = Buffer.from(getStringMD5(`${device_id}${timestamp}`), 'hex').subarray(0, 16).toString('hex')
    if (h_deviceid && token) {
        let s_secret = String(token).substring(0, 32)
        req.$s_iv = Buffer.from(s_iv, 'hex')
        req.$s_secret = s_secret
        if (req.query?.l_sign) {
            req.query = decrypt({ iv: s_iv, content: req.query?.l_sign }, s_secret)
        }
        if (req.body?.l_sign) {
            req.body = decrypt({ iv: s_iv, content: req.body?.l_sign }, s_secret)
        }
    }
    return { account_id, device_id, fingerprint }
}
/**
 * 将返回数据进行加密处理
 * @param {*} req 
 * @returns 
 */
function makeSendSign(req, restArgs) {
    try {
        let { $s_iv, $s_secret } = req || {}
        if (!restArgs || !restArgs?.length) return restArgs
        if ($s_iv && $s_secret) {
            restArgs[0] = { r_sign: encrypt(restArgs[0], $s_secret, $s_iv).content }
            return restArgs
        }
        return restArgs
    } catch (error) {
        return restArgs
    }
}
async function getAccountRoleIds(account_id = '') {
    if (!account_id) return ''
    const cache_key = `xgfx:account:role_ids:${account_id}`
    let cache = await getCustomCache(cache_key)
    if (cache) return cache
    let data = (await knex(`${ACCOUNT_ROLE} as acr`).select('acr.role_id')
        .leftJoin(`${ROLE_TABLE} as role`, 'role.id', 'acr.role_id')
        .where({ 'acr.status': 1, 'role.status': 1, 'acr.account_id': account_id }))
        .map(i => i.role_id).join(',')
    // console.log(data);
    await setCustomCache(data, cache_key, 1200)
    return data
}
// getAccountRoleIds(10009882)
const allow_sametime_login = [10010174]
async function makeToken({ time_now = 0, login_type = 1, account_id = 0, platform = 'pc', request_ip, user_agent, fingerprint }, trx = knex) {
    let cityData = getBaseStation(request_ip)
    let old_tokens = (await trx(TOKEN_TABLE).select('token')
        .where('token_after', '>=', time_now)
        .where('platform', platform)
        .where('account_id', account_id)).map(i => i.token)
    if (old_tokens.length && process.env.NODE_ENV == "production") {
        if (!allow_sametime_login.includes(Number(account_id))) await removeToken(old_tokens)
    }
    if (!fingerprint || !fingerprint?.fingerprint) return Promise.reject({ code: 403, message: '设备检测异常，禁止登录！' })
    let new_token = crypto.createHash('md5').update(account_id + config.deviation + getUuid()).digest('hex');
    let score = fingerprint?.score
    fingerprint = fingerprint?.fingerprint
    let device_id = getStringMD5(`${fingerprint}${new_token}`)

    let token_after = config.redis.default_expire_time
    if (platform == "applet") token_after = token_after * 30//小程序的token过期时间设置为30天
    if (platform == "pc") token_after = token_after * 7//管理端的token过期时间设置为7天
    if (platform == "h5") token_after = token_after * 30//h5的token过期时间设置为7天
    if (platform == "preview") token_after = token_after * 7//预览的token过期时间设置为7天
    const insert_data = {
        token: new_token,
        login_type,
        account_id,
        version: '1.0',
        token_after: time_now + token_after,
        ip: request_ip,
        ua: user_agent,
        country: cityData.country_name || null,
        province: cityData.region_name || null,
        city: cityData.city_name || null,
        platform
    }
    let [token_id] = await trx(TOKEN_TABLE).insert(insert_data)
    await trx(FINGERPRINT_TABLE).insert(
        { fingerprint, score, ua: user_agent, account_id, ip: request_ip, token_id }
    ).onConflict(['account_id', 'fingerprint']).merge()

    await setToken(new_token, { account_id, fingerprint, device_id }, token_after)
    return { token: new_token, device_id }
}
//通过req 中的信息获取当前的user
async function getUserInfo(req) {
    let req_token = req.headers.token || ''
    if (!req_token) return null
    let account_id = await getToken(req_token)
    if (!account_id) return null
    let user = (await knex.select('acf.gender', 'acf.account_id')
        .select(knex.raw(`group_concat(acc_role.role_id) as role_ids`))
        .select(knex.raw(`group_concat(DISTINCT pct.platform_id) as platform_ids`))
        .select(knex.raw(`group_concat(DISTINCT pct.id) as platform_primary_ids`))
        .from(`${ACTINFO_TABLE} as acf`)
        .leftJoin(`${PLATFORM_ACCOUNT_TABLE} as pct`, builder => {
            builder.on('pct.blogger_id', '=', 'acf.account_id').andOn('pct.status', '!=', 3)
        })
        .leftJoin(knex.raw(`${ACCOUNT_ROLE} as acc_role on acc_role.account_id = acf.account_id and acc_role.status = 1`))
        // .where('tok.token_after', '>', time_now)
        .where('acf.account_id', account_id)
        .limit(1)
        .groupBy(['acf.account_id']))[0]
    if (!user) return null
    if (user.role_ids) user.role_ids = user.role_ids.split(',').map(i => Number(i))
    if (user.platform_ids) user.platform_ids = user.platform_ids.split(',').map(i => Number(i))
    if (user.platform_primary_ids) user.platform_primary_ids = user.platform_primary_ids.split(',').map(i => Number(i))
    return user
}

let SHARE_WHITELIST_PATH = ['/share_plan/def', '/share_plan/publish', '/upload_access']
async function getShareTokenUser(req) {
    console.log('share', req.path);
    if (!SHARE_WHITELIST_PATH.includes(req.path)) return Promise.reject('暂无访问权限！请勿非法访问')
    let req_token = req.headers.token || ''
    let account_id = await getToken(req_token)
    if (!account_id) return Promise.reject('该链接已失效，请更换链接！')
    let user = (await knex.select('acc.*').from(`${ACCOUNT_TABLE} as acc`).where('acc.id', account_id).limit(1))[0]
    let message = checkUserStatus(user)
    if (message) return Promise.reject(message)
    let koc_role = user.koc_role ? user.koc_role.split(',') : [2]
    user.koc_role = Number(koc_role.length == 1 ? koc_role[0] : 1)
    req.$user = user
    return user
}
/**
 * 生成临时token，用于抖音二维码分享场景
 * @param {*} account_id 
 * @returns token
 */
async function makeShareToken(account_id) {
    function getTokenString() {
        let str = crypto.createHash('md5').update(account_id + config.deviation + getUuid()).digest('hex');
        return `share_token_${str}`
    }
    let new_token = getTokenString()
    let redis_have_key = null
    do {
        redis_have_key = await getToken(new_token)
        if (redis_have_key) new_token = getTokenString() //如果redis内存在该token 则重新生成token
    } while (redis_have_key);
    let token_after = config.redis.default_expire_time * 30//分享的token过期时间设置为30天
    await setToken(new_token, account_id, token_after)
    return new_token
}
/**
 * 通过openid生成token，token有效期为30天
 * @param {String} openid 
 * @param {string} [provider=''] 平台 kuaishou
 */
async function setDuoLaiToken(openid = '', provider = '', duolai_account_id = '', blacklist_type = 'UNSET') {
    let token = getUuid()
    await setToken(token, { openid, provider, duolai_account_id, blacklist_type }, 60 * 60 * 24 * 30)
    return token
}
/**
 * token 获取open_id
 * @param {*} req 
 * @returns opend_id
 */
async function getDuoLaiOpenid(req) {
    let req_token = req.headers.token || ''
    if (!req_token) return Promise.reject('非法请求！')
    let user = await getToken(req_token)
    if (!user || !user?.duolai_account_id) return Promise.reject('无效token！')
    req.$open_user = user
    return user
}
module.exports = {
    setToken, getToken, removeToken, makeToken, getTokenUser, getUserInfo, makeShareToken, checkUserStatus, getAccountRoleIds,
    setDuoLaiToken, getDuoLaiOpenid, makeSendSign
}