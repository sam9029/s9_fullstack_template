const request = require("../../../utils/request");
const { sleep, validateUrl } = require("../../../utils/tools");
const domain = "https://www.kuaishou.com/graphql"
async function getDataByUrl(url, browser) {
    const page = await browser.newPage();
    await page.goto(url);
    let res = await page.waitForResponse(response => {
        let request_info = response.request()
        return request_info.url() == 'https://www.kuaishou.com/graphql'
            && response.request().method() == 'POST'
            && ((request_info.postData() || '').indexOf(`"operationName":"visionProfile"`) != -1)
    }, { timeout: 8000 })
    if (!res) return Promise.reject('不存在拦截请求！')
    let data = await res.json()
    page.close()
    let userInfo = data.data.visionProfile ? data.data.visionProfile.userProfile : null
    if (!userInfo) return Promise.reject('由于用户隐私限制，无法获取信息！')
    return userInfo
}
function getOpenUserInfo(user_id, cookie) {
    return request({
        url: `${domain}`,
        method: 'post',
        headers: {
            "content-type": "application/json",
            "cookie": cookie,
            "referer": `https://www.kuaishou.com/profile/${user_id}`
        },
        data: {
            "operationName": "visionProfile",
            "variables": {
                "userId": user_id
            },
            "query": "query visionProfile($userId: String) {\n  visionProfile(userId: $userId) {\n   result\n   userProfile {\n  profile {\n  gender\n   user_name\n  user_id\n   headurl\n   }\n }\n }\n}\n"
        }
    })
}

function getMainUrl(url, headers = {}) {
    return request({
        url,
        headers,
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
async function getKuaiShouInfo(url, browser) {
    return {
        platform_account_id: null,
        platform_account_name: null,
        fan_counts: 0,
        avatar: null
    }
    if (validateUrl(url)) return Promise.reject('主页链接不合法！')
    let { profile } = await getKsId(url).then(new_url => {
        return getDataByUrl(new_url, browser)
    })
    if (!profile) return Promise.reject('未查询到用户信息！')
    return {
        platform_account_id: profile.user_id || null,
        platform_account_name: profile.user_name,
        fan_counts: 0,
        avatar: profile.headurl
    }
}
// getMainUrl('https://v.kuaishou.com/4WAqVg').then(res => {
//     // console.log(res);
//     let didInfo = res.headers['set-cookie']
//     if (!didInfo || !didInfo.length) return Promise.reject('cookie 获取失败！')
//     didInfo = didInfo.map(item => {
//         return item.split(';').shift()
//     })
//     console.log(didInfo);
//     return getOpenUserInfo('5e0c889a00000000010033ed', didInfo.join(';'))
// }).then(back => {
//     console.log(back);
// }).catch(err => {

// })
async function getKsId(url) {
    let back = await getMainUrl(url)
    let back_url = back.request.path
    let id = ((back_url.split('/').pop()) || '').split('?').shift()
    return `https://www.kuaishou.com/profile/${id}`
}
// getKuaiShouInfo('https://www.kuaishou.com/profile/3xqm7mmfu9v29zg')
module.exports = {
    getKuaiShouInfo
}

