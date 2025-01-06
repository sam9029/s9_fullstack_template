const config = require('../config');
const { ACCOUNT_TABLE, TOKEN_TABLE, ACCOUNT_ROLE, CONCATUS_TABLE, ACTINFO_TABLE, DUOLAI_ACCOUNT_INFO } = require('../config/setting')
const crypto = require('crypto'); //加载加密文件
const { getInviteCode, getUuid, mixPhoneNumber, checkPhone, knexTransaction,
    sleep, getRequestIP, getBaseStation, checkSildeCode, timestampSec } = require('../utils/tools')
const { getLogData, insertLog } = require("./public/operationLog");
const UserModel = require('./marking/user');
const svgCaptcha = require('svg-captcha');
const knex = require('../db/knexManager').knexProxy
const moment = require("moment");
const { getWechatPhoneNumber } = require("./wechat/public");
const { sendSms, checkSms } = require('./public/sms')
const { decodeSignAES, decrypt } = require("../utils/jwt")
const { getToken: getWeChatToken } = require("./wechat/token")
const UAParser = require('ua-parser-js');
const { add: addMessage } = require("./public/message/index")
const tokenModel = require("../db/token")
const { setSession, setCustomCache, getCustomCache, delCustomCache, getRedisClient } = require("../db/redis")
const { getSlideCode, svgToPng } = require("../forks/captimg")
// const { getUidInfo, saveInviteLog } = require("./public/vip/index")
const { getAppUserInfo } = require("./wechat/app");
const { checkKeys, isArrayHas } = require('../utils/check_type');
const { RK_SCAN_LOGIN } = require('../config/redis_key');

async function getWXToken(params) {
    let { token } = params
    if (!token || token != 'qwertyuiopasdfghjkl') return Promise.reject('非法访问！')
    let data = await getWeChatToken()
    return { code: 0, data }
}
async function getWXOAToken(params) {
    const { batchGetToken } = require("./wechat/officialAccount")
    let { token } = params
    if (!token || token != 'qwertyuiopasdfghjkl') return Promise.reject('非法访问！')
    let data = await batchGetToken(false, params.type, params.site)
    return { code: 0, data }
}
/**
 * 管理端只能账号密码登录
 * @param {*} req 
 * @param {*} need_password 默认均需要登录密码，只有注册成功、扫码登录时不需要密码
 * @param {*} trx 
 * @returns 
 */
async function checkLogin(req, need_password = true, trx = knex) {
    let { email, telephone, password, captcha_code, platform = 'pc', fingerprint } = req.body || {}
    let { account_id } = req || {}
    let login_type = 1 //默认是正常登录
    if (need_password) {
        if ((!email && !telephone) || !password || !captcha_code) return Promise.reject('请填写登录账户及密码！')
    } else {
        if (!account_id) return Promise.reject('请填写登录账户及密码！')
    }

    if (need_password) { //需要密码登录时验证验证码
        if (!await checkSildeCode(req, captcha_code)) return Promise.reject('验证码错误或不存在！')
        password = crypto.createHash('md5').update(password + config.deviation).digest('hex');
    }
    // console.log(email, password);
    let userSql = trx.from(`${ACCOUNT_TABLE} as a`)
        .leftJoin(`${ACTINFO_TABLE} as acf`, 'acf.account_id', 'a.id')
        .select('a.id', 'a.name', 'a.telephone', 'a.status', 'a.oem_id', 'a.phone_verification', 'a.account_type', 'a.channel_id', 'a.realname_status')
        .select('acf.gender', 'acf.avatar', 'acf.birth', 'acf.region')
        // .groupBy('a.id')
        .limit(1)
    if (need_password) userSql.where(builder => { //如果是需要密码登录
        builder.where({ email, password }).orWhere({ telephone: email, password })
    })
    else userSql.where({ 'a.id': account_id })
    let userInfo = (await userSql)[0]
    if (!userInfo && need_password) return Promise.reject('账号或密码不正确！')
    if (!userInfo && !need_password) return Promise.reject('该用户未注册！')

    if (req?.koc_req_ip) login_type = 2
    let request_ip = req?.koc_req_ip || getRequestIP(req)
    let user_agent = req?.koc_req_ua || req.headers['user-agent']

    let message = tokenModel.checkUserStatus(userInfo)
    if (message) return Promise.reject(message)

    let data_array = [UserModel.info(userInfo, platform, trx), UserModel.permsMapper({ platform }, userInfo, trx)]
    if (platform == 'pc') data_array.push(UserModel.router({ platform }, userInfo))
    let [info, mapper, router] = await Promise.all(data_array)
    let time_now = parseInt(new Date().getTime() / 1000) //获取当前秒级时间戳
    let { token, device_id } = await tokenModel.makeToken({ time_now, login_type, account_id: userInfo.id, request_ip, user_agent, platform, fingerprint }, trx)
    info.data.device_id = device_id
    return { code: 0, data: info.data, token, routers: router.data, mapper: mapper.data }
}

async function login(req, res) {
    let { iv } = req.body || {}
    if (iv) req.body = decrypt(req.body)
    return await checkLogin(req)
}


async function ScanWait(data = {}) {
    let count = 120
    let { unique_id } = data
    if (!unique_id) return Promise.reject('请求参数异常！')
    let redis_key = `${RK_SCAN_LOGIN}${unique_id}`
    do {
        await sleep(1000)
        let data = await getCustomCache(redis_key)
        if (!data) return Promise.reject('二维码已过期或已取消！')
        if (data?.scanned_code) {
            // console.log(data);
            return await checkLogin(data, false)
            // 这里检测到扫码成功后，执行成功登录逻辑
        }
        count--
    } while (count >= 0);
    return Promise.reject('扫码超时！')
}
/**
 * 管理端长连接等待扫码结果
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function scanLogin(req, res) {
    let { time, uuid, check_realname } = checkKeys(req.body, [
        { key: 'time', type: Number, required: true },
        { key: 'uuid', type: String, required: true },
        { key: 'check_realname', type: Boolean, required: false }
    ])
    let koc_req_ip = getRequestIP(req)
    let koc_req_ua = req.headers['user-agent']
    let cityData = getBaseStation(koc_req_ip)
    let now_time = timestampSec()
    if (now_time - time > config.diff_time || time - now_time > config.diff_time) return Promise.reject('请检查time参数！')
    let unique_id = crypto.createHash('md5').update(time + uuid + config.deviation).digest('hex')
    let data = { ...cityData, time, uuid, koc_req_ip, koc_req_ua, unique_id, check_realname }
    let redis_key = `${RK_SCAN_LOGIN}${unique_id}`
    let has_set = await setCustomCache(data, redis_key, 140, { NX: true })
    if (!has_set) return Promise.reject('服务繁忙，请稍后重试！')
    return await ScanWait(data)
}
/**
 * 扫码后用户确认授权登录
 * @param {*} req 
 * @param {*} userInfo 
 * @returns 
 */
async function scanAuth(req, userInfo = {}) {
    let { time, uuid, type } = checkKeys(req.body, [
        { key: 'time', type: Number, required: true },
        { key: 'uuid', type: String, required: true },
        { key: 'type', type: String, required: true, validator: (val) => isArrayHas(['CONFIRM', 'CANCEL'], val) }
    ])
    let { id: account_id, token } = userInfo
    if (!time || !uuid) return Promise.reject('请求参数异常！')
    if (!account_id || !token) return Promise.reject('请求参数异常！')
    let unique_id = crypto.createHash('md5').update(time + uuid + config.deviation).digest('hex')
    // console.log(unique_id, REQ_DATA);
    let redis_key = `${RK_SCAN_LOGIN}${unique_id}`
    let data = await getCustomCache(redis_key)
    if (!data) return Promise.reject('二维码已过期！')
    if (type == 'CONFIRM') {
        let has_set = await setCustomCache({ ...data, account_id, token, scanned_code: true }, redis_key, 120, { XX: true })
        if (!has_set) return Promise.reject('服务繁忙，请稍后重试！')
        //url: `test://scan?scan_id=${unique_id}`
        return { code: 0, data: { message: '扫码成功！' } }
    } else {
        await delCustomCache([redis_key])
        return { code: 0, data: { message: '取消成功！' } }
    }
}
/**
 * 获取扫码登录的信息，地点、省份、IP给用户展示，
 * @param {*} req 
 * @param {*} userInfo 
 * @returns 
 */
async function scanLocation(req, userInfo = {}) {
    let { time, uuid } = checkKeys(req.body, [
        { key: 'time', type: Number, required: true },
        { key: 'uuid', type: String, required: true }
    ])
    if (!time || !uuid) return Promise.reject('请求参数异常！')
    let unique_id = crypto.createHash('md5').update(time + uuid + config.deviation).digest('hex')
    // console.log(unique_id, REQ_DATA);
    let redis_key = `${RK_SCAN_LOGIN}${unique_id}`
    let data = await getCustomCache(redis_key)
    if (!data) return Promise.reject('二维码已过期！')
    let { koc_req_ua, koc_req_ip, region_name, city_name } = data
    function maskIP(ip) {
        // 将 IP 地址按 . 分割成数组
        const parts = ip.split('.');
        // 将数组的第三个部分替换为 *
        parts[2] = '*';
        // 重新组合数组成为脱敏后的 IP 地址
        return parts.join('.');
    }
    let { os, browser } = UAParser(koc_req_ua || '')
    // console.log(ua_info);
    let back = {
        time, uuid, ip: maskIP(koc_req_ip),
        title: "网页端登录确认",
        location: region_name + city_name,
        device_model: (os.name ? (os.name + ' ') : '') + browser.name,
        system_version: os.version,
        limit_time: await getRedisClient().TTL(redis_key)
    }
    if (back?.limit_time > 120) back.limit_time = 120
    return { code: 0, data: back }
}


//登出
async function logout(_req, user) {
    await tokenModel.removeToken(user.token)
    return { code: 0, data: 'logout!' }
}
//用户截图
async function screenshot(_req, _res) {
    await sleep(400)
    return { code: 0, data: 'screenshot!' }
}

async function concatInfo(req = {}, res) {
    let { company, name, address, phone, industry, create_time, remark, platform } = req.body || {}
    let ua_info = UAParser(req.headers['user-agent'] || '')
    if (!platform) {
        platform = ua_info.device.type || 'unknown'
        if (!ua_info.device.type && ua_info.os.name == 'Mac OS') platform = 'pc'
    }
    if (platform) platform = platform.toLowerCase()
    if (phone && name) {
        let ip = getRequestIP(req)
        await knex(CONCATUS_TABLE)
            .insert({ company, name, address, phone, industry, create_time, remark, ip, ua: JSON.stringify(ua_info), platform })
    }
    return { code: 0, data: 'success!' }
}

async function loginCaptcha(req, res) {
    var captcha = svgCaptcha.create({
        inverse: false, // 翻转颜色 
        fontSize: 52, // 字体大小 
        noise: 2, // 噪声线条数 
        width: 120, // 宽度 
        height: 42, // 高度 
        size: 4, // 验证码长度
        ignoreChars: '0o1ilODaq', // 验证码字符中排除 0o1i
        color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
        background: '#F5F7FA' // 验证码图片背景颜色
    });
    let svgCode = captcha.text.toLowerCase()
    await setSession(svgCode, res)
    if (req.query.type == 'png') {
        return { code: 0, data: await svgToPng(captcha.data) }
    }
    if (req.query.base64) {
        let base64 = Buffer.from(captcha.data).toString('base64')
        return { code: 0, data: String('data:image/svg+xml;base64,' + base64) }
    }
    return { code: 0, data: String(captcha.data) }
};
async function getSlideCodes(res) {
    return { code: 0, data: await getSlideCode(res) }
}

async function sendSmsByType(body = {}, req) {
    let { sms_type, account_id, phone, bind_code, captcha_code } = body || {}
    if (!sms_type) return Promise.reject('未设置验证码类型！')
    if (phone) checkPhone(phone)
    if (!await checkSildeCode(req, captcha_code)) return Promise.reject('验证码错误或不存在！')
    let back = {}
    switch (Number(sms_type)) {
        case 1: //首次登录手机号认证
            let info = (await knex(ACCOUNT_TABLE).select('telephone').where({ id: account_id, phone_verification: 2 }))[0]
            if (!info) return Promise.reject('未查询到用户信息！')
            back = await sendSms({ sms_type, phone: info.telephone })
            break;
        case 2: //注册验证码验证
            let before_info = (await knex(ACCOUNT_TABLE).select('id').where({ telephone: phone }))[0]
            if (before_info) return Promise.reject('该手机号已注册！')
            back = await sendSms({ sms_type, phone })
            break;
        case 3: //找回密码验证码
            return await sendForgetSms(req, body)
        case 4: //个人中心修改手机号
            let before_data = (await knex(ACCOUNT_TABLE).select('id').where({ telephone: phone }))[0]
            if (before_data) return Promise.reject('手机号已被使用，不可修改为该手机号！')
            back = await sendSms({ sms_type, phone })
            break;
        case 5: //登录注册验证码
            back = await sendSms({ sms_type, phone })
            break;
        case 6: //登录要求绑定手机号
            if (!bind_code) return Promise.reject('请检查参数bind_code！')
            let bind_data = await getCustomCache(`xgfx:bind:code:${bind_code}`) //获取绑定手机号缓存
            // console.log(bind_data);
            if (!bind_data) return Promise.reject('登录超时，请重新登陆！')
            let { login_type } = bind_data
            let phone_info = (await knex(ACCOUNT_TABLE).select('id', 'apple_id', 'wechat_id').where({ telephone: phone }))[0]
            if (phone_info) {
                if (login_type == 3 && phone_info.wechat_id) return Promise.reject('该账户已绑定微信，无法绑定！')
                if (login_type == 4 && phone_info.apple_id) return Promise.reject('该账户已绑定苹果账户，无法绑定！')
            }
            back = await sendSms({ sms_type, phone })
            break;
        case 7: //注销验证码
        case 8: //银行卡签约验证码
            let user = await tokenModel.getTokenUser(req)
            back = await sendSms({ sms_type, phone: user.telephone })
            break;
        default:
            break;
    }
    return { code: 0, data: back }
}
async function checkSmsByType(body = {}, token = "", req) {
    let { sms_type, sms_id, code, password, bind_code } = body || {}
    if (!sms_type || !sms_id || !code) return Promise.reject('请检查验证参数！')
    if (sms_type == 3 && !password) return Promise.reject("未设置新密码！")
    let info = await checkSms({ sms_id, code, sms_type })
    let back = {}
    switch (Number(sms_type)) {
        case 1://首次登录认证
            await knex(ACCOUNT_TABLE).update({ phone_verification: 1 }).where({ telephone: info.phone, phone_verification: 2 })
            break;
        case 2://用户注册
            back = info
            break;
        case 3://忘记密码
            password = crypto.createHash('md5').update(password + config.deviation).digest('hex');
            await knex(ACCOUNT_TABLE).update({ password }).where({ telephone: info.phone })
            back = '密码修改成功！'
            break;
        case 4://个人中心重置手机号
            if (!token) return Promise.reject("身份鉴权未通过！")
            let time_now = parseInt(new Date().getTime() / 1000) //获取当前秒级时间戳
            //去token 表中查询数据 
            let token_data = (await knex(TOKEN_TABLE).select('account_id')
                .where('token_after', '>=', time_now)
                .where('token', token)
                .orderBy('id', 'desc').limit(1))[0]
            if (!token_data) return Promise.reject("用户凭据不存在！")
            await knex(ACCOUNT_TABLE).update({ telephone: info.phone }).where({ id: token_data.account_id })
            back = '手机号修改成功！'
            break;
        case 6: //登录要求绑定手机号
            if (!bind_code) return Promise.reject('请检查参数bind_code！')
            let bind_key = `xgfx:bind:code:${bind_code}`
            let bind_data = await getCustomCache(bind_key) //获取绑定手机号缓存
            if (!bind_data) return Promise.reject('绑定超时，请重新登陆！')
            let { login_type } = bind_data
            await delCustomCache([bind_key]).catch(err => {
                console.log('绑定码删除失败：', bind_key);
            })
            let phone_info = (await knex(ACCOUNT_TABLE).select('id', 'apple_id', 'wechat_id', 'union_id', 'oem_id').where({ telephone: info.phone }))[0]
            //先查询该用户是否存在（存在 更新绑定信息并返回登录token，不存在 执行注册逻辑）
            if (phone_info) { //快速登录，绑定手机号后注册
                if (login_type == 3 && phone_info.wechat_id) return Promise.reject('该账户已绑定微信，无法绑定！')
                if (login_type == 4 && phone_info.apple_id) return Promise.reject('该账户已绑定苹果账户，无法绑定！')
                return await knexTransaction(async trx => {
                    let can_update = {}
                    bind_data.wechat_id && (can_update.wechat_id = bind_data.wechat_id)
                    bind_data.union_id && (can_update.union_id = bind_data.union_id)
                    bind_data.apple_id && (can_update.apple_id = bind_data.apple_id)
                    // console.log(can_update);
                    if (Object.keys(can_update)?.length) {
                        await trx(ACCOUNT_TABLE).update(can_update).where({ id: phone_info.id })
                        await insertLog(trx, getLogData(phone_info.id, 109, can_update, phone_info, phone_info))
                    }
                    let { token } = await tokenModel.makeToken({
                        time_now: parseInt(new Date().getTime() / 1000),
                        login_type: 5, account_id: phone_info.id, request_ip: getRequestIP(req),
                        user_agent: req.headers['user-agent'], platform: "applet"
                    }, trx)
                    return await UserModel.info({ ...phone_info, token }, 'pc', trx)
                })
            } else {
                return await addBlogger(req, { ...bind_data, telephone: info.phone }, null, async (blogger, uid, trx) => {
                    let { token } = await tokenModel.makeToken({
                        time_now: parseInt(new Date().getTime() / 1000),
                        login_type, account_id: blogger.id, request_ip: getRequestIP(req),
                        user_agent: req.headers['user-agent'], platform: "applet"
                    }, trx)
                    return await UserModel.info({ ...blogger, token }, 'pc', trx)
                })
            }
        default:
            back = info
            break;
    }
    return { code: 0, data: back }
}
/**
 * 目前关闭管理端注册功能，请不要打开
 * @param {*} req 
 * @returns 
 */
async function register(req) {
    let { telephone, reg_type = 1, password = null, captcha_code, phone_code, platform = 'applet', sms_id, uid, avatar, gender, name } = req.body || {}
    req.body.telephone = telephone
    req.body.platform = platform //小程序注册
    if (!telephone) return Promise.reject('请填写手机号码！')
    if (!password) return Promise.reject('请填写登录密码！')
    if (!name) return Promise.reject('请填写用户昵称！')
    if (!captcha_code) return Promise.reject('请填写注册验证码！')
    if (!['pc', 'applet'].includes(platform)) return Promise.reject('注册平台类型错误！')
    if (reg_type != 1) return Promise.reject('错误的注册类型！')
    // if (phone_code || login_code) reg_type = 2 //微信快速注册
    // console.log(req.session.captcha, req.$session);
    if (reg_type == 1) { //验证短信验证码
        checkPhone(telephone) //检查手机号格式是否异常
        if (!sms_id) return Promise.reject('手机验证码验证失败！')
        await checkSms({ sms_id, code: captcha_code, sms_type: 2 })
    }
    password = crypto.createHash('md5').update(password + config.deviation).digest('hex');
    let before_info = (await knex(ACCOUNT_TABLE).select('id').where({ telephone }))[0]
    if (before_info) return Promise.reject('该手机号已注册！')
    // if (!uid) return Promise.reject('无注册邀请码！')
    let add_data = { name, avatar, gender, telephone, password }
    await addBlogger(req, add_data, uid, async (blogger_info, uid_info,) => { })
    await sleep(1500)
    return await checkLogin(req, false)
}

async function sendAddBloggerMessage(data, upper_info) {
    if (!data || !data.blogger_id) return
    let { blogger_id, blogger_name, telephone, create_time } = data
    let receiver_user_ids = [upper_info.id]
    await sleep(10000) //10秒后开始发消息
    let message = {
        "type": 6,
        "receiver_user_ids": receiver_user_ids,
        "sender_user_id": config.system_account_id,
        "sub_type": 604,
        "message": {
            "blogger_id": blogger_id,       //博主ID
            "blogger_name": blogger_name,//博主名称
            "telephone": mixPhoneNumber(telephone),  //联系方式
            "create_time": create_time //入驻时间 
        },
        "path": "/pagesUser/manage/list?tab=blogger"
    }
    return await addMessage(message, upper_info)
}
// share_code 分享人邀请码
async function addBlogger(req, info = {}, share_code = '', callback) {
    let logType = 1104
    for (let j in info) {
        if (info[j]) info[j] = (info[j] + '').replace(/\s+/g, '');
    }
    return await knexTransaction(async (trx) => {
        let uid_info = await getUidInfo(share_code, null, trx)
        let { oem_id, inviter_id } = uid_info
        let { name, avatar, gender, telephone, password, wechat_id, apple_id, union_id, channel_id } = info;
        let user_id = inviter_id || null
        let accountInsertData = {
            uid: await getInviteCode(),
            name: name || `用户${getUuid().substring(0, 6)}`,
            password: password || null,
            telephone,
            wechat_id,
            apple_id,
            union_id,
            phone_verification: 1,
            status: 1,
            create_user_id: user_id,
            direct_leader: inviter_id || 0,
            oem_id: oem_id || 1,
            version: '2.0',
            // vip_level: 0,
            account_type: 1,//默认注册均为博主
            channel_id: channel_id || 0
        };

        let account_id = (await trx(ACCOUNT_TABLE).insert(accountInsertData))[0];
        if (!user_id) user_id = account_id
        let accountRoleInsertData = {
            account_id,
            role_id: 3,
            status: 1,
            create_user_id: user_id,
            update_user_id: user_id,
            oem_id: oem_id || 0
        }
        let register_type = 2
        wechat_id && (register_type = 1)
        apple_id && (register_type = 3)
        let accountInfoInsertData = {
            account_id,
            avatar: avatar || null,
            avatar_type: 1,
            gender: gender || 1,
            register_type, //默认使用手机号注册
            auth_type: 1,
            data_type: 1
        };
        await trx(ACCOUNT_ROLE).insert(accountRoleInsertData);
        await trx(ACTINFO_TABLE).insert(accountInfoInsertData);
        let logs = []
        let create_time = moment().format("YYYY-MM-DD HH:mm:ss")
        if (share_code) {
            uid_info.id = uid_info.inviter_id
            uid_info.invite_account_id = account_id
            uid_info.invite_time = create_time
            await saveInviteLog(uid_info, trx)
            logs.push(getLogData(account_id, logType, uid_info, uid_info))
        } else {
            uid_info.id = user_id
        }

        logs.push(getLogData(account_id, logType, accountInsertData, uid_info),
            getLogData(account_id, logType, accountRoleInsertData, uid_info),
            getLogData(account_id, logType, accountInfoInsertData, uid_info))
        await insertLog(trx, logs);
        if (callback) return await callback({ id: account_id, name, telephone, create_time }, uid_info, trx)
        else return
    })
}

async function getPhoneNumber(query) {
    if (!query.phone_code) return Promise.reject('未设置微信code');
    let phoneNumber = (await getWechatPhoneNumber(query.phone_code, 'applet-register')).phoneNumber;
    return { code: 0, phoneNumber }
}

async function sendForgetSms(req, body = {}) {
    // let server_code = req.session.captcha || req.$session
    const { phone } = body || {}
    if (!phone) return Promise.reject('请输入帐户手机号！')
    let before_account = (await knex.select('telephone').from(ACCOUNT_TABLE)
        .where('telephone', phone).limit(1))[0]
    if (!before_account) return Promise.reject('不存在该手机号绑定的帐户！')
    let telephone = before_account.telephone
    let back = await sendSms({ sms_type: 3, phone: telephone })
    return { code: 0, data: { ...back, phone: mixPhoneNumber(telephone) } }
}
async function getConcat(query, userInfo = {}) {
    let data = config.concat_info
    if (userInfo?.vip_status == 2) data = config.vip_concat_info
    return { code: 0, data }
}
//app统一登录接口，仅app使用
async function unifiedLogin(req, res) {
    // console.log(req.body);
    let body_data = {}
    try {
        body_data = JSON.parse(decodeSignAES(req.body.data, req.body.iv))
    } catch (error) {
        return Promise.reject('签名认证错误或其他异常!')
    }
    // console.log(body_data);
    let { telephone, password, captcha_code, sms_id, name, avatar, wechat_code, apple_id, share_code } = body_data
    // captcha_code 验证码 图形验证码|短信验证码
    let login_type = 1
    function checkAllowKeys(data, keys = []) {
        let obj_kes = Object.keys(data)
        obj_kes.forEach(key => {
            if (!keys.includes(key)) throw new Error('传递的参数字段有误')
        })
    }
    if (telephone) { //手机号账号密码登录 需要填写验证码
        login_type = 1
        if (!captcha_code) return Promise.reject('请填写验证码!')
        if (sms_id) { //短信验证码登录
            checkAllowKeys(body_data, ['telephone', 'name', 'avatar', 'sms_id', 'captcha_code', 'share_code'])
            await checkSms({ sms_id, code: captcha_code, sms_type: 5, phone: telephone })
        } else { //账号密码登录
            checkAllowKeys(body_data, ['telephone', 'password', 'name', 'avatar', 'captcha_code'])
            if (!password) return Promise.reject('请填写密码!')
            if (!await checkSildeCode(req, captcha_code)) return Promise.reject('验证码错误!')
        }
        return await loginOrRegister({ telephone, password, name, avatar, share_code }, login_type, req)
    } else if (wechat_code) { //微信登录
        checkAllowKeys(body_data, ['wechat_code', 'name', 'avatar'])
        login_type = 3
        let wechat_info = await getAppUserInfo(wechat_code)
        // wechat_info = { wechat_id, union_id, name, avatar }
        return await loginOrRegister(wechat_info, login_type, req)
    } else if (apple_id) { //苹果ID登录
        checkAllowKeys(body_data, ['apple_id', 'name', 'avatar'])
        login_type = 4
        return await loginOrRegister({ apple_id, name, avatar }, login_type, req)
    } else {
        return Promise.reject('参数错误，请检查必填参数!')
    }
}
async function loginOrRegister(data = {}, login_type, req) { //登录或者是注册
    let { telephone, password, name, avatar, wechat_id, apple_id, union_id, share_code } = data
    if (password) password = crypto.createHash('md5').update(password + config.deviation).digest('hex')
    let where_data = { telephone, wechat_id, apple_id }
    let data_keys = Object.keys(where_data).filter(key => where_data[key])
    if (!data_keys.length) return Promise.reject('参数错误，请检查必填参数!')
    let has_user = (await knex(ACCOUNT_TABLE).select('id', 'password', 'status', 'telephone').where(builder => {
        data_keys.forEach(key => builder.where(key, where_data[key]))
    }).limit(1))[0]
    let time_now = parseInt(new Date().getTime() / 1000) //获取当前秒级时间戳
    let bind_code = getUuid()
    if (password && !has_user) return Promise.reject('该账户不存在或未注册！') //密码登录时账户不存在报错
    let bing_phone = { type: 'NEED_BIND_PHONE', bind_code }
    if (has_user) {
        if (has_user.status != 1) return Promise.reject('账号已关闭或删除，禁止登录！')
        if (password && password != has_user.password) return Promise.reject('密码错误，禁止登录！')
        if (!has_user.telephone) return Promise.reject('账号绑定信息异常，禁止登录！')
        let { token } = await tokenModel.makeToken({ time_now, login_type, account_id: has_user.id, request_ip: getRequestIP(req), user_agent: req.headers['user-agent'], platform: "applet" })
        return await UserModel.info({ ...has_user, token }, 'pc')
    } else { //开始执行注册逻辑
        //微信、苹果登录未注册时是执行绑定操作，不进行自动静默注册
        if ([3, 4].includes(Number(login_type))) {
            await setCustomCache({ ...data, fast_register: true, login_type }, `xgfx:bind:code:${bind_code}`, 300) //绑定手机号缓存
            return { code: 1, data: bing_phone, message: "账户未绑定手机号码！" }
        }
        //手机号直接注册
        return await addBlogger(req, { telephone, password, name, avatar, wechat_id, apple_id, union_id }, share_code, async (blogger, uid, trx) => {
            let { token } = await tokenModel.makeToken({ time_now, login_type, account_id: blogger.id, request_ip: getRequestIP(req), user_agent: req.headers['user-agent'], platform: "applet" }, trx)
            return await UserModel.info({ ...blogger, token }, 'pc', trx)
        })
    }

}
async function getDouYinToken(params) {
    let { token } = params
    if (!token || token != 'qwertyuiopasdfghjkl') return Promise.reject('非法访问！')
    const { makeClientToken } = require("./oauth/douyin/index")
    let data = await makeClientToken(params.refresh, params.client_key)
    return { code: 0, data }
}
module.exports = {
    login,
    loginCaptcha,
    logout,
    scanLogin,
    scanAuth,
    scanLocation,
    concatInfo,
    sendSmsByType,
    checkSmsByType,
    register,
    getPhoneNumber,
    sendForgetSms,
    getWXToken,
    getWXOAToken,
    screenshot,
    getConcat,
    getSlideCodes,
    unifiedLogin,
    getDouYinToken,
    addBlogger,
}