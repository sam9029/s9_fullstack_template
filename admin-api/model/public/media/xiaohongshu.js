const request = require("../../../utils/request");
const domain = "https://weibo.com/ajax/profile/info"
function getOpenUserInfo(params) {
    return request({
        url: `${domain}`,
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
        return_all: true,
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
// let url = 'https://www.xiaohongshu.com/user/profile/5e0c889a00000000010033ed'
// let url
function getXiaoHongShuInfo(url) {
    return new Promise((resolve, reject) => {
        url = (url.split('?'))[0]
        let uid = url.split('/').pop()
        resolve({
            platform_account_id: uid,
            platform_account_name: '',
            fan_counts: '',
            avatar: ''
        })
    })
}
module.exports = {
    getXiaoHongShuInfo
}

