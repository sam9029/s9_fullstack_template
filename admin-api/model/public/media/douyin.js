const request = require("../../../utils/request");
const douyin_domain = "https://www.iesdouyin.com/web/api/v2/user/info/"
const douyin_video = "https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/"
function getOpenUserInfo(params) {
    return request({
        url: `${douyin_domain}`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
}
function getVideoInfo(params) {
    return request({
        url: `${douyin_video}`,
        method: 'get',
        headers: {
            "content-type": "application/json",
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
// let url = 'https://v.douyin.com/88uVYQJ/'
function getDouyinInfo(url) {
    return new Promise((resolve, reject) => {
        getMainUrl(url).then(res => {
            let back_url = res.request.path
            let back_info = queryToJson(back_url.split('?').pop())
            if (!back_info.sec_uid) {
                back_info = {
                    sec_uid: ((url.split('/').pop()) || '').split('?').shift()
                }
            }
            // console.log({ sec_uid: back_info.sec_uid });
            return getOpenUserInfo({ sec_uid: back_info.sec_uid })
        }).then(info => {
            if (info && info.status_code == 0) {
                let { user_info } = info
                if (!user_info) return reject('未获取到用户信息！')
                let data = {
                    platform_account_id: user_info.unique_id ? user_info.unique_id : user_info.short_id,
                    platform_account_name: user_info.nickname,
                    fan_counts: user_info.follower_count,
                    avatar: user_info.avatar_medium.url_list[0]
                }
                return resolve(data)
            }
            return reject('未获取到用户信息！')
        }).catch(err => {
            reject(err.message || err || '未知错误')
        })
    })
}
//https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=7064781119429807363
// 获取抖音作品信息
async function getOpusInfo(url = '') {
    if (!url) return Promise.reject('请填写作品链接！')
    if (url.indexOf('douyin') == -1) return Promise.reject('非抖音作品链接！')
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
//https://v.douyin.com/YnWoe7e/
//https://www.douyin.com/video/7115953081434574080
// getOpusInfo('https://v.douyin.com/YnWoe7e/')
module.exports = {
    getDouyinInfo,
    getOpusInfo
}

