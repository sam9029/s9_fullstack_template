const { getPhoneNumber, getSessionKey, getAppletLink, getAppletScheme } = require("./api")
const { getToken } = require("./token")
const decryptData = require("./decoded")
const { wechat_appid, wechat_secret } = require("../../config/index")
const moment = require("moment");
async function getWechatPhoneNumber(phone_code = '', type = 'login') {
    if (!phone_code) return Promise.reject('phone_code 参数不合法！')
    let { access_token } = await getToken()
    if (!access_token) return Promise.reject('access_token 不合法！')
    let data = await getPhoneNumber({ code: phone_code }, access_token)
    // console.log(data);
    if (!data) return Promise.reject('手机号获取异常')
    if (data.errcode) {
        console.log(`获取微信手机号错误，来源：${type}`, JSON.stringify(data));
        await getToken(true)
        return Promise.reject('不合法的code（code不存在、已过期或者使用过）')
    }
    if (!data.phone_info || !data.phone_info.phoneNumber) return Promise.reject('用户信息获取异常！')
    return data.phone_info || {}
}

async function getWechatPhoneNumberByIv({ login_code = '', encryptedData = '', iv = '' }) {
    if (!login_code) return Promise.reject('login_code 参数不合法！')
    if (!encryptedData) return Promise.reject('encryptedData 参数不合法！')
    if (!iv) return Promise.reject('iv 参数不合法！')
    let session_info = await getSessionKey({
        appid: wechat_appid,//	string		是	小程序 appId
        secret: wechat_secret,//	string		是	小程序 appSecret
        js_code: login_code,//	string		是	登录时获取的 code
        grant_type: "authorization_code",//	string		是	授权类型，此处只需填写 authorization_code
    })
    if (!session_info || session_info.errcode) return Promise.reject('不合法的code（code不存在、已过期或者使用过）')
    let { session_key, openid } = session_info
    let data = decryptData(session_key, encryptedData, iv, wechat_appid)
    if (!data || !data.phoneNumber) return Promise.reject('用户信息获取异常！')
    // console.log(data);
    return { ...data, openid }
}
async function getAppletUrl(query = null) {
    if (!query) return Promise.reject('query 参数不合法！')
    let { access_token } = await getToken()
    if (!access_token) return Promise.reject('access_token 不合法！')
    let [link, scheme] = await Promise.all([
        getAppletLink({
            path: 'pages/login/register',
            is_expire: true,
            expire_type: 1,
            expire_interval: 30,
            query
        }, access_token),
        getAppletScheme({
            jump_wxa: {
                path: 'pages/login/register',
                query
            },
            is_expire: true,
            expire_type: 1,
            expire_interval: 30,
        }, access_token)])
    if (!link) return Promise.reject('小程序链接获取异常！')
    if (!scheme) return Promise.reject('小程序scheme获取异常！')
    if (link.errcode) return Promise.reject(link.errmsg)
    if (scheme.errcode) return Promise.reject(scheme.errmsg)
    if (!link.url_link || !scheme.openlink) return Promise.reject('小程序链接获取异常！')
    return { applet_link: link.url_link, applet_scheme: scheme.openlink, expire_date: moment().add(29, 'days').format("YYYY-MM-DD") }
}
async function getWechatOpenID(code = '') {
    if (!code) return Promise.reject('code 参数不合法！')
    let data = await getSessionKey({
        appid: wechat_appid,//	string		是	小程序 appId
        secret: wechat_secret,//	string		是	小程序 appSecret
        js_code: code,//	string		是	登录时获取的 code
        grant_type: "authorization_code",//	string		是	授权类型，此处只需填写 authorization_code
    })
    if (!data) return Promise.reject('信息获取异常！')
    if (data.errcode) {
        return Promise.reject('不合法的code（code不存在、已过期或者使用过）')
    }
    return data
}
module.exports = {
    getWechatPhoneNumber,
    getWechatPhoneNumberByIv,
    getAppletUrl,
    getWechatOpenID
}