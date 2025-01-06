const request = require("../../../utils/request");
const toutiao_domain = "https://www.toutiao.com/api/pc/user/fans_stat"
const domain = "https://www.toutiao.com/api/pc/list/feed"
const { get_signature } = require('../toutiao/acrawler')
// console.log(get_signature('https://www.toutiao.com/api/pc/list/feed?category=pc_user_hot&token=MS4wLjABAAAAmiT7kcsEwZMcC6GtLnp9Smh_tlKQ7udpkYa95WhMlMwyR4i2MFUcNR3cW0wBeYSV&aid=24&app_name=toutiao_web'))
// console.log();
function getFansInfo(data) {
    return request({
        url: `${toutiao_domain}`,
        method: 'post',
        headers: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        data
    })
}
function getUserInfo(params) {
    return request({
        url: `${domain}`,
        method: 'get',
        headers: {
            "Content-type": "application/json; charset=utf-8"
        },
        params
    })
}
function getMainUrl(url) {
    return request({
        url,
        method: 'get',
        return_all: true
    })
}
function queryToJson(string) {
    let obj = {}, pairs = string.split('&'), d = decodeURIComponent, name, value;
    pairs.forEach(pair => {
        pair = pair.split('=');
        name = d(pair[0]);
        value = d(pair[1]);
        obj[name] = value;
    });
    return obj;
}
// let url = 'https://v.toutiao.com/88uVYQJ/'
//https://profile.zjurl.cn/rogue/ugc/profile/?version_code=879&version_name=80709&user_id=3826752754565127&media_id=1716758811175939&request_source=1&active_tab=dongtai&device_id=65&app_name=news_article&share_token=baa69821-7520-4a7c-a011-1906000e87fb&tt_from=copy_link&utm_source=copy_link&utm_medium=toutiao_android&utm_campaign=client_share?=

function getToutiaoInfo(url = '') {
    if (!url) return Promise.reject('未设置查询链接！')
    let user_id = null
    if (url.indexOf('profile.zjurl.cn') != -1) {
        let params = queryToJson(url)
        if (!params.user_id) return Promise.reject('主页链接错误！')
        user_id = params.user_id
        url = `https://www.toutiao.com/c/user/${user_id}/?source=m_redirect`
    }

    return new Promise((resolve, reject) => {
        getMainUrl(url).then(res => {
            let back_url = 'https://' + res.request.host + res.request.path
            // console.log(back_url);
            let opus_id = ((back_url.split('?').shift()) || '')
            if (!opus_id) return Promise.reject('信息获取失败！')
            if (opus_id.charAt(opus_id.length - 1) == '/') opus_id = opus_id.substr(0, opus_id.length - 1)
            let token = opus_id.split('/').pop()
            let _signature = get_signature(domain)
            return getUserInfo({ token, category: 'pc_user_hot', aid: 24, app_name: 'toutiao_web', _signature })
        }).then(user => {
            if (user && user.data && user.data[0] && user.data[0].user) user = user.data[0].user
            if (user) {
                let { info, relation_count } = user
                if (!info) return reject('未获取到用户信息！')
                if (info.schema) {
                    let schema = queryToJson(info.schema.split('?').pop())
                    if (schema.uid) user_id = schema.uid
                }
                let back = {
                    platform_account_id: user_id,
                    platform_account_name: info.name,
                    fan_counts: relation_count.followers_count,
                    avatar: info.avatar_url
                }
                return resolve(back)
            }
            return reject('未获取到用户信息！')
        }).catch(err => {
            reject(err.message || err || '未知错误')
        })
    })
}
//https://www.iestoutiao.com/web/api/v2/aweme/iteminfo/?item_ids=7064781119429807363
// 获取抖音作品信息
async function getOpusInfo(url = '') {
    if (!url) return Promise.reject('请填写作品链接！')
    if (url.indexOf('toutiao') == -1) return Promise.reject('非抖音作品链接！')
    let back_info = await getMainUrl(url)
    let back_url = back_info.request.path
    // console.log(back_info.request.path);
    let opus_id = ((back_url.split('?').shift()) || '')
    if (!opus_id) return Promise.reject('作品信息获取失败！')
    if (opus_id.charAt(opus_id.length - 1) == '/') opus_id = opus_id.substr(0, opus_id.length - 1)
    opus_id = opus_id.split('/').pop()
    if (!opus_id) return Promise.reject('作品信息获取失败！')
    // console.log(opus_id);
    let data = await getVideoInfo({ item_ids: opus_id })
    // console.log(data);
    if (data.status_code) return Promise.reject('作品信息获取失败！')
    if (!data.item_list || !data.item_list[0]) return Promise.reject('作品信息获取失败！')
    data.item_list = data.item_list[0]
    let { aweme_id, author } = data.item_list
    let back = {
        platform_account_id: author && author.unique_id ? author.unique_id : author.short_id,
        aweme_id,
    }
    // console.log(back);
    return back
}
// getToutiaoInfo('https://www.toutiao.com/c/user/token/MS4wLjABAAAAmiT7kcsEwZMcC6GtLnp9Smh_tlKQ7udpkYa95WhMlMwyR4i2MFUcNR3cW0wBeYSV/?source=m_redirect')
//https://v.toutiao.com/YnWoe7e/
//https://www.toutiao.com/video/7115953081434574080
// getOpusInfo('https://v.toutiao.com/YnWoe7e/')
module.exports = {
    getToutiaoInfo,
    getOpusInfo
}

