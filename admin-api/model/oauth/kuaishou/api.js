const domain = 'https://open.kuaishou.com/'
const request = require("../../../utils/request")
const { production_url } = require("../../../config/index");

const FormData = require('form-data');
function getToken(data) {
    return request({
        url: `${domain}oauth2/access_token`,
        method: 'POST',
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams(data)
    })
}
function getOpenId(data) {
    return request({
        url: `${domain}oauth2/mp/code2session`,
        method: 'POST',
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams(data)
    })
}
function refreshToken(data) {
    return request({
        url: `${domain}oauth2/refresh_token/`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data
    })
}
/**
 * 获取已授权的账户
 * @param {*} data 
 * @returns 
 */
function getAuthAdvertiser(data) {
    return request({
        url: `${domain}oauth2/advertiser/get/`,
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        },
        data
    })
}
function makeKsOrder(data, access_token) {
    return request({
        url: `${domain}openapi/mp/developer/epay/create_order`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data,
        params: { app_id: data.app_id, access_token }
    })
}
function makeKsIosOrder(data, access_token) {
    return request({
        url: `${domain}openapi/mp/developer/epay/iap/create_order`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data,
        params: { app_id: data.app_id, access_token }
    })
}
function queryKsOrder(data, access_token) {
    return request({
        url: `${domain}openapi/mp/developer/epay/query_order`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data,
        params: { app_id: data.app_id, access_token }
    })
}
function settleKsOrder(data, access_token) {
    return request({
        url: `${domain}openapi/mp/developer/order/v1/report`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data,
        params: { app_id: data.app_id, access_token }
    })
}
// function settleKsOrder(data, access_token) {
//     return request({
//         url: `${domain}openapi/mp/developer/order/v1/report`,
//         method: 'POST',
//         headers: {
//             "Content-Type": "application/json",
//         },
//         data,
//         params: { app_id: data.app_id, access_token }
//     })
// }
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
function refoundKsOrder(data, access_token) {
    return request({
        url: `${domain}openapi/mp/developer/epay/apply_refund`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data,
        params: { app_id: data.app_id, access_token }
    })
}
function addContent(data, access_token) {
    return request({
        url: `${domain}/openapi/mp/developer/feed/add`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data,
        params: { app_id: data.app_id, access_token }
    })
}
function delContent(data, access_token) {
    return request({
        url: `${domain}/openapi/mp/developer/feed/delete`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        params: { app_id: data.app_id, access_token, thirdId: data.thirdId }
    })
}
module.exports = {
    refreshToken,
    getToken,
    getAuthAdvertiser,
    makeKsOrder,
    getOpenId,
    queryKsOrder,
    settleKsOrder,
    makeKsIosOrder,
    getOnlineToken,
    refoundKsOrder,
    addContent,
    delContent
}