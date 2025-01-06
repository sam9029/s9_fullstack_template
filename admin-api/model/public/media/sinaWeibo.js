const request = require("../../../utils/request");
const domain = "https://weibo.com/ajax/profile/info"
function getOpenUserInfo(params) {
    return request({
        url: `${domain}`,
        method: 'get',
        headers: {
            "content-type": "application/json",
            "cookie": 'wb_view_log_7386985940=1920*10801; _s_tentry=passport.weibo.com; Apache=9699771739416.512.1641450416067; SINAGLOBAL=9699771739416.512.1641450416067; ULV=1641450416070:1:1:1:9699771739416.512.1641450416067:; lang=zh-hk; login_sid_t=7b356776246d8e933e4230cc6e39532c; cross_origin_proto=SSL; _ga=GA1.2.2141329246.1641450465; _gid=GA1.2.228265611.1641450465; wb_view_log=1920*10801; UOR=,,www.baidu.com; SUB=_2A25M0v40DeRhGeFN41QY-CvFzzyIHXVvpmj8rDV8PUNbmtAKLUPmkW9NQ9G1aDGbbUWYIywtkJA5A1xuikNVYfrC; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9W54ScwlQKhCe7Z7lxSifCi75JpX5KzhUgL.FoM01hq41h-4Sh52dJLoIpnLxKqLBK.L1KnLxK.LBKzL1hzp1K.4ehqt; ALF=1672987107; SSOLoginState=1641451108; XSRF-TOKEN=o3UVuvul1aCg6P9gDznP59T-; webim_unReadCount=%7B%22time%22%3A1641451671592%2C%22dm_pub_total%22%3A19%2C%22chat_group_client%22%3A0%2C%22chat_group_notice%22%3A0%2C%22allcountNum%22%3A56%2C%22msgbox%22%3A0%7D; WBPSESS=x_5V1W3t1k3CUo-fCjUhZWNXPhCIiC4EVNQEPnjaIJrAKg2_LlrCbsh8aR01D0nd1-8csgDUTYsA_R4j0U0as5xEMavJZUYeL1ocDNs9BVEYfP2_DpSXBzTPdTsUetmYVVXze9gxPlrM5EAdm2EHIw=='
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
// let url = 'https://weibo.com/u/2492465520'
// let url
function getSinaInfo(url) {
    return new Promise((resolve, reject) => {
        let uid = url.split('/').pop()
        getOpenUserInfo({ uid }).then(res => {
            if (res && res.ok == 1) {
                let user_info = res.data.user
                if (!user_info) return reject('未获取到用户信息！')
                let data = {
                    platform_account_id: user_info.idstr,
                    platform_account_name: user_info.screen_name,
                    fan_counts: user_info.followers_count,
                    avatar: user_info.avatar_hd
                }
                return resolve(data)
            } else {
                return resolve({
                    platform_account_id: uid,
                    platform_account_name: '',
                    fan_counts: '',
                    avatar: ''
                })
            }
        }).catch(err => {
            reject(err.message || err || '未知错误')
        })
    })
}
// getSinaInfo('https://weibo.com/u/1792088665').then(res=>{
//     console.log(res);
// })
module.exports = {
    getSinaInfo
}

