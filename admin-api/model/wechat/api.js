const { wechat_domain, production_url } = require("../../config/index");
const request = require("../../utils/request");


// 获取小程序access_token
function getAccessToken(params) {
    return request({
        url: `${wechat_domain}/cgi-bin/token`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}

// 获取用户手机号
function getPhoneNumber(data, access_token) {
    return request({
        url: `${wechat_domain}/wxa/business/getuserphonenumber?access_token=${access_token}`,
        method: 'post',
        headers: {
            "content-type": "application/json",
        },
        data
    })
}
// 生成小程序链接
function getAppletLink(data, access_token) {
    return request({
        url: `${wechat_domain}/wxa/generate_urllink?access_token=${access_token}`,
        method: 'post',
        headers: {
            "content-type": "application/json",
        },
        data
    })
}
// 生成小程序链接
function getAppletScheme(data, access_token) {
    return request({
        url: `${wechat_domain}/wxa/generatescheme?access_token=${access_token}`,
        method: 'post',
        headers: {
            "content-type": "application/json",
        },
        data
    })
}
// 根据登录code获取session_key
function getSessionKey(params) {
    return request({
        url: `${wechat_domain}/sns/jscode2session`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}
// 获取线上access_token 防止重复获取导致线上失效
function getProductionToken(params) {
    return request({
        url: `${production_url}/login/wechat_access_token`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}

// 发送订阅消息
function sendWechatMessage(data, access_token) {
    return request({
        url: `${wechat_domain}/cgi-bin/message/subscribe/send?access_token=${access_token}`,
        method: 'post',
        headers: {
            "content-type": "application/json",
        },
        data
    })
}
// app端登录后获取用户的access_token
function snsGetAccessToken(params) {
    return request({
        url: `${wechat_domain}/sns/oauth2/access_token`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}
// app端获取用户的信息
function snsGetUserInfo(params, access_token) {
    return request({
        url: `${wechat_domain}/sns/userinfo?access_token=${access_token}`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}



//#region 公众号发布
// 获取线上公众号access_token 防止重复获取导致线上失效
function getProductionOAToken(params) {
    return request({
        url: `${production_url}/login/wechat_oa_token`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}

// 上传公众号图片
function uploadImage(file = {}, access_token = '') {
    const form = new FormData();
    form.append('type', 'image');
    form.append('media', file.stream, { ...file.headers });
    const formHeaders = form.getHeaders();
    let length = form.getLengthSync()
    return request({
        url: `${wechat_domain}/cgi-bin/material/add_material?access_token=${access_token}`,
        method: 'POST',
        no_need_retry: true,
        headers: {
            'Content-Length': length,
            'Content-Type': 'multipart/form-data',
            ...formHeaders
        },
        data: form
    })
}

// 新建草稿
function draft_add(params = {}, access_token = '') {
    const data = {
        articles: [get_draft_add_param(params)]
    }
    return request({
        url: `${wechat_domain}/cgi-bin/draft/add?access_token=${access_token}`,
        method: 'POST',
        data: data
    })
}
function get_draft_add_param(params) {
    return {
        title: params.title,
        author: params.author,
        digest: params.title,
        content: params.content,
        content_source_url: params.click_url,
        thumb_media_id: params.media_id
    }
}

function draft_publish(media_id, access_token) {
    return request({
        url: `${wechat_domain}/cgi-bin/freepublish/submit?access_token=${access_token}`,
        method: 'POST',
        data: {
            access_token,
            media_id
        }
    })
}

/**获取公众号api调用次数 */
function query_quota(cgi_path, access_token) {
    return request({
        url: `${wechat_domain}/cgi-bin/openapi/quota/get?access_token=${access_token}`,
        method: 'post',
        headers: {
            "content-type": "application/json",
        },
        data: { cgi_path }
    })
}

/**清除公众号api调用次数 */
function clear_quota(appid, access_token) {
    return request({
        url: `${wechat_domain}/cgi-bin/clear_quota?access_token=${access_token}`,
        method: 'post',
        headers: {
            "content-type": "application/json",
        },
        data: { appid }
    })
}
//#endregion

module.exports = {
    getAccessToken,
    getPhoneNumber,
    getSessionKey,
    getAppletLink,
    getAppletScheme,
    getProductionToken,
    sendWechatMessage,
    snsGetAccessToken,
    snsGetUserInfo,
    // 公众号发布
    uploadImage,
    wxDraftAdd: draft_add,
    wxDraftPublish: draft_publish,
    getProductionOAToken,
    query_quota,
    clear_quota,
}

