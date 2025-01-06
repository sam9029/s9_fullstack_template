const { isNull } = require('lodash')
const { sort_and_join, md5 } = require('../../public/externalMedia/utils')
const exclude_keys = ['sign', 'access_token']

function getSign(data = {}, app_secret = '') {
    let new_sign_data = {}
    Object.keys(data).forEach(key => {
        if (!exclude_keys.includes(key) && !isNull(data[key])) {
            new_sign_data[key] = data[key]
        }
    })
    let str = sort_and_join(new_sign_data, { handler: (key, value) => `${key}=${value}` }) + app_secret
    // console.log(str);
    return md5(str)
}
// getSign({
//     "open_id": "5b748c61ef2901405450656638e8f702d3",
//     "out_order_no": "kdj1231113454676",
//     "total_amount": 100,
//     "subject": "肯德基10元代金券",
//     "type": 1,
//     "detail": "详情介绍",
//     "expire_time": 3600,
//     "notify_url": "https://xxxx.kuaishou.com/zeus/epay/notify",
//     "sign": "dfb2a4b482d4f9a0cb4a60ad7fbe839e"
// })
module.exports = {
    getSign
}