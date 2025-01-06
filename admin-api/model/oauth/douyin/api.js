const request = require("../../../utils/request")
// const domain = 'https://open.douyin.com/'
const domain = process.env.NODE_ENV == "production" ? 'http://192.168.4.2:3070/douyin_open/' : 'https://open.douyin.com/'
const appletDomain = 'https://developer.toutiao.com'
// const domain = 'http://127.0.0.1:3070/douyin_open/'

function getDownloadUrl(url) {
    const download_domain = 'http://192.168.4.2:3000/mkt/public/download'
    // return `${download_domain}?url=${encodeURIComponent(url)}`
    if (process.env.NODE_ENV == "production") return `${download_domain}?url=${encodeURIComponent(url)}`
    return url
}
const { production_url, xgsj_production_url } = require("../../../config/index");
const app_key = {
    // awuk8wnz3cwv3ppy: { //h5
    //     client_secret: '365b999be9215e9cdca3895dd1e43fb3',
    //     client_key: 'awuk8wnz3cwv3ppy'
    // },
    awej4eui4zewlyi0: { //APP
        client_secret: 'a607906950c8dd86bf963d4965ea21a2',
        client_key: 'awej4eui4zewlyi0'
    }
}
const FormData = require('form-data');
function getToken(code = '', client_key = 'awej4eui4zewlyi0') {
    return request({
        url: `${domain}oauth/access_token/`,
        method: 'post',
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams({ ...app_key[client_key], code, grant_type: 'authorization_code' })
    })
}

function refreshToken(refresh_token = '', client_key = 'awej4eui4zewlyi0') {
    return request({
        url: `${domain}oauth/renew_refresh_token/`,
        method: 'post',
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams({ ...app_key[client_key], refresh_token })
    })
}
function refreshAccessToken(refresh_token = '', client_key = 'awej4eui4zewlyi0') {
    return request({
        url: `${domain}oauth/refresh_token/`,
        method: 'post',
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams({ client_key, refresh_token, grant_type: "refresh_token" })
    })
}
// 获取用户信息
function getUserInfo(data = {}) {
    return request({
        url: `${domain}oauth/userinfo/`,
        method: 'post',
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams(data)
    })
}
//获取粉丝数
function getFansInfo(params = {}, access_token = '') {
    return request({
        url: `${domain}/data/external/user/fans/`,
        method: 'get',
        headers: {
            "content-type": "application/json",
            "access-token": access_token
        },
        params
    })
}
// 获取client_token 
function getClientToken(client_key = 'awej4eui4zewlyi0') {
    const form = new FormData();
    form.append('client_secret', app_key[client_key].client_secret);
    form.append('client_key', app_key[client_key].client_key);
    form.append('grant_type', 'client_credential');
    const formHeaders = form.getHeaders();
    return request({
        url: `${domain}oauth/client_token/`,
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
            ...formHeaders
        },
        data: form
    })
}
// 获取视频的share_id
function getShareId(params = {}, client_token = '') {
    return request({
        url: `${domain}/share-id/`,
        method: 'get',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        params
    })
}
// 获取Ticket
function getTicket(params = {}, client_token = '') {
    return request({
        url: `${domain}/open/getticket/`,
        method: 'get',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        params
    })
}

// 获取线上公众号access_token 防止重复获取导致线上失效
function getProductionDYToken(params) {
    return request({
        url: `${production_url}/login/douyin_token`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}
// 获取线上公众号access_token 防止重复获取导致线上失效
function getXGSJProductionDYToken(params) {
    return request({
        url: `${xgsj_production_url}/login/douyin_token`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}
// 获取团长ID
// const JSONbig = require("json-bigint")
function transform_json_bigint(data) {
    if (!data) return data;
    try {
        return JSONbig.parse(data)
    } catch (error) {
        throw {
            response_data: data,
            error: new Error('E_JSON_PARSE')
        };
    }
}
function getAgentId(data = {}, client_token = '') {
    return request({
        url: `${domain}api/match/v1/taskbox/save_agent/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        transformResponse: [transform_json_bigint],
        data
    })
}
function chengeAgentBind(data = {}, client_token = '') {
    return request({
        url: `${domain}api/match/v1/taskbox/change_user_bind_agent/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        transformResponse: [transform_json_bigint],
        data
    })
}
function getAgentLink(data = {}, client_token = '') {
    return request({
        url: `${domain}api/match/v1/taskbox/gen_agent_link/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        // transformResponse: [transform_json_bigint],
        data
    })
}
function getAgentBindPeople(data = {}, client_token = '') {
    return request({
        url: `${domain}api/match/v1/taskbox/get_agency_user_bind_record/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        transformResponse: [transform_json_bigint],
        data
    })
}
function getAgentVideoData(data = {}, client_token = '', version = 'v2') {
    if (version == 'v1' && !data?.page_no) data.page_no = data.page_num
    return request({
        url: `${domain}api/match/${version}/taskbox/query_agency_video_daily_data/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        transformResponse: [transform_json_bigint],
        data
    })
}
//获取任务ID
function getTaskIds(data = {}, client_token = '') {
    return request({
        url: `${domain}api/match/v1/taskbox/query_app_task_id/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        transformResponse: [transform_json_bigint],
        data
    })
}
//获取任务ID详情
function getTaskInfo(data = {}, client_token = '') {
    return request({
        url: `${domain}api/match/v1/taskbox/query_task_info/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        transformResponse: [transform_json_bigint],
        data
    })
}
// 获取excel 账单数据
function getAgentBillLink(data = {}, client_token = '', version = 'v2') {
    return request({
        url: `${domain}api/match/${version}/taskbox/agency_query_bill_link/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        transformResponse: [transform_json_bigint],
        data
    })
}
// 获取违规达人信息
function getViolateTalent(data = {}, client_token = '', version = 'v2') {
    return request({
        url: `${domain}api/match/${version}/taskbox/query_violate_talent_list/`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "access-token": client_token
        },
        transformResponse: [transform_json_bigint],
        data
    })
}
// 获取小程序用户openid
function getOpenId(data = {}) {
    return request({
        url: `${appletDomain}/api/apps/v2/jscode2session`,
        method: 'post',
        headers: {
            "content-type": "application/json",
        },
        data
    })
}
// 获取小程序 access_token 
function getAppletToken(data = {}) {
    return request({
        url: `${domain}oauth/client_token/`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        data
    })
}
// 获取小程序预支付信息
function makeDYOrder(data = {}) {
    return request({
        url: `${appletDomain}/api/apps/ecpay/v1/create_order`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        data
    })
}
// 获取小程序担保支付预支付订单信息
function queryDYOrder(data = {}) {
    return request({
        url: `${appletDomain}/api/apps/ecpay/v1/query_order`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        data
    })
}
// 获取推送小程序支付后订单信息
function pushDYOrder(data = {}) {
    return request({
        url: `${appletDomain}/api/apps/order/v2/push`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        data
    })
}
// 获取小程序通用支付预支付订单信息
function queryCommonDYOrder(data = {}, access_token) {
    return request({
        url: `${domain}api/trade_basic/v1/developer/order_query/`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access-token': access_token
        },
        data
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
// 获取小程序通用支付发起退款
function refoundCommonOrder(data = {}, access_token) {
    return request({
        url: `${domain}api/trade_basic/v1/developer/refund_create/`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access-token': access_token
        },
        data
    })
}
module.exports = {
    getFansInfo,
    getUserInfo,
    refreshToken,
    getToken,
    getClientToken,
    getShareId,
    getTicket,
    refreshAccessToken,
    getProductionDYToken,
    getAgentId,
    getAgentLink,
    getAgentBindPeople,
    getAgentVideoData,
    getTaskIds,
    getTaskInfo,
    getXGSJProductionDYToken,
    chengeAgentBind,
    getAgentBillLink,
    getViolateTalent,
    getDownloadUrl,
    getOpenId,
    getAppletToken,
    makeDYOrder,
    queryDYOrder,
    pushDYOrder,
    queryCommonDYOrder,
    getOnlineToken,
    refoundCommonOrder
}