const domain = 'https://ad.oceanengine.com/open_api/'
const request = require("../../../utils/request")
const { production_url } = require("../../../config/index");


const FormData = require('form-data');
function getToken(data) {
    return request({
        url: `${domain}oauth2/access_token/`,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data
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
function getXTOnlinToken(advertiser_id) {
    return request({
        url: `${production_url}/public/callback/xingtu/token`,
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        },
        params: { token: 'qwertyuiopasdfghjkl', advertiser_id }
    })
}
module.exports = {
    refreshToken,
    getToken,
    getAuthAdvertiser,
    getXTOnlinToken
}