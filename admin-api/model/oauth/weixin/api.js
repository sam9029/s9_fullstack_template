const domain = 'https://api.weixin.qq.com/'
const request = require("../../../utils/request")
const { production_url } = require("../../../config/index");

function getToken(data) {
    return request({
        url: `${domain}cgi-bin/stable_token`,
        method: 'POST',
        headers: {
            "content-type": "application/json",
        },
        data
    })
}
function getOpenId(params) {
    return request({
        url: `${domain}sns/jscode2session`,
        method: 'GET',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}
// 获取小程序通用支付预支付订单信息
function getOnlineToken(data = {}) {
    return request({
        url: `${production_url}/duolai/login/access_token`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        data: { token: 'asdfghjkqwert‘；ll&*yuibn', ...data }
    })
}
module.exports = {
    getToken,
    getOpenId,
    getOnlineToken
}