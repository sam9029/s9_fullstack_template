const { getAccessToken, getProductionToken } = require("./api")
const { wechat_appid, wechat_secret } = require("../../config/index")
var token = {
    access_token: null,
    token_after: 0 //token过期的时间，秒级时间戳
}
async function getToken(refresh = false) {
    if (process.env.NODE_ENV != "production") {//非生产环境，获取线上token
        let data = await getProductionToken({ token: 'qwertyuiopasdfghjkl' })
        if (data && data.code == 0) return data.data
        return Promise.reject('获取线上微信token失败！')
    }
    let time_now = parseInt(new Date().getTime() / 1000)
    if (token.access_token && time_now < token.token_after && !refresh) return token
    let params = {
        grant_type: "client_credential",	//string	填写 client_credential
        appid: wechat_appid,	//string 小程序唯一凭证，即 AppID，可在「微信公众平台 - 设置 - 开发设置」页中获得。（需要已经成为开发者，且帐号没有异常状态）
        secret: wechat_secret,	//string 小程序唯一凭证密钥，即 AppSecret，获取方式同 appid
    }
    await getAccessToken(params).then(res => {
        if (res && res.access_token) {
            token = {
                access_token: res.access_token,
                token_after: time_now + (res.expires_in || 600) - 300
            }
        }
    })
    return token

}
module.exports = {
    getToken
}