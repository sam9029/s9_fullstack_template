const request = require("../../../utils/request");
const domain = "https://api.bilibili.com/x/"
function getOpenUserInfo(uid) {
    return request({
        url: `${domain}space/acc/info?mid=${uid}&jsonp=jsonp`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        }
    })
}
function getOpenFanInfo(uid) {
    return request({
        url: `${domain}relation/stat?vmid=${uid}&jsonp=jsonp`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        }
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
//https://api.bilibili.com/x/space/acc/info?mid=272434160&jsonp=jsonp
//https://api.bilibili.com/x/relation/stat?vmid=272415160&jsonp=jsonp
//https://space.bilibili.com/272415160
//【橘颂从不投币的个人空间-哔哩哔哩】 https://b23.tv/025fKww
async function getAllInfo(uid) {
    let [acc_info, fan_info] = await Promise.all([getOpenUserInfo(uid), getOpenFanInfo(uid)]).catch(err => {
        console.log(err);
    })
    acc_info = acc_info && acc_info.code == 0 ? acc_info.data : {}
    fan_info = fan_info && fan_info.code == 0 ? fan_info.data : {}
    let data = {
        platform_account_id: String(acc_info.mid ? acc_info.mid : uid),
        platform_account_name: acc_info.name || '',
        fan_counts: fan_info.follower || 0,
        avatar: acc_info.face || ''
    }
    return data
}
function getBiliBiliInfo(url) {
    return new Promise((resolve, reject) => {
        getMainUrl(url).then(res => {
            let back_url = res.request.path
            let uid = ((back_url.split('/').pop()) || '').split('?').shift()
            if (!uid) return reject('未获取到用户UID！')
            // console.log({ sec_uid: back_info.sec_uid });
            return getAllInfo(uid)
        }).then(info => {
            return resolve(info)
        }).catch(err => {
            reject(err.message || err || '未知错误')
        })
    })
}
// getBiliBiliInfo('https://space.bilibili.com/272415160').then(res => {console.log(res);}).catch(err => { })
module.exports = {
    getBiliBiliInfo
}

