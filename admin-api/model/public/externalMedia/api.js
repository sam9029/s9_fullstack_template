const domain = "https://kscms.xiegangsir.com/"
const request = require("../../../utils/request");
const token = "8b2e04eda77f3fdff36e027780a66921"
function getUserInfo(params) {
    if (process.env.NODE_ENV == "production") return request({
        url: `${domain}mini/user/check/`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
    return request({
        url: `https://tuixiaoguo.domain.cn/api/public/external/xigua_check`,
        method: 'get',
        headers: {
            "content-type": "application/json",
            token
        },
        params
    })
}
function getOrderList(params) {
    if (process.env.NODE_ENV == "production") return request({
        url: `${domain}mini/order/list/`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        },
        params
    })
    return request({
        url: `https://tuixiaoguo.domain.cn/api/public/external/xigua_list`,
        method: 'get',
        headers: {
            "content-type": "application/json",
            token
        },
        params
    })
}


module.exports = {
    getUserInfo,
    getOrderList,
}