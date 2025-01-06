const { getRedisClient, getWaitLock, getCustomCache, setCustomCache } = require("../../../db/redis")
const { RK_DLKD_TOKEN_LOCK, RK_DLKD_TOKEN } = require("../../../config/redis_key")
const { DUOLAI_APPLET } = require("../../../config/setting")
const { production_url } = require("../../../config/index")
const { getToken, getOpenId, getOnlineToken } = require("./api")
const { md5 } = require('../../public/externalMedia/utils')
const { checkKeys } = require("../../../utils/check_type")
const moment = require('moment')
const knex = require("../../../db/knexManager").knexProxy
const serial_no = '535DCB16CB1CEA9E0446688B9C78EC8D4C68C44D'
const mchid = "1648180904"
const fs = require("fs")
const path = require('path');
const WxPay = require("wechatpay-node-v3")
const { cert_path } = require("../../../config")
let key_object = { publicKey: null, privateKey: null, key: '' }
try {
    key_object = {
        publicKey: fs.readFileSync(path.join(cert_path, './apiclient_cert.pem')), // 公钥
        privateKey: fs.readFileSync(path.join(cert_path, './apiclient_key.pem')), // 秘钥
        key: "745C2A5E73D64A1D892CBB24A33EE9B1"
    }
} catch (error) {
    console.log(error);
}


async function getUserOpenid(js_code = '', appid = '') {
    let { app_secret } = await getAccessToken(appid)
    let user_info = await getOpenId({ secret: app_secret, js_code, appid, grant_type: 'authorization_code' })
    // console.log(user_info);
    if (!user_info?.openid) return Promise.reject('用户信息获取异常！')
    return user_info
}
/**
 * 查询快手订单信息，app_id 和 out_order_no
 * @param {*} data 
 * @returns 订单信息
 */
async function queryOrder(data, biz_type, refund_amount) {
    // let { access_token, app_secret } = await getAccessToken(data.app_id)
    let check_data = checkKeys(data, ['out_order_no', 'app_id', 'create_time'])
    const paySdk = new WxPay({ ...key_object, appid: data.app_id, mchid, serial_no, });
    const order_info = await paySdk.query({ out_trade_no: check_data.out_order_no })
    // console.log(order_info);
    if (order_info?.status != 200) return Promise.reject(order_info?.error_msg || '订单信息获取异常！')
    return formatOrder(order_info || {}, biz_type, data, refund_amount)
}
/**
 * 用户退款逻辑 'out_order_no', 'app_id', 'reason', 'total_amount'
 * @param {*} data 
 * @returns 
 */
async function refoundOrders(data = {}) {
    let { out_order_no, app_id, reason, total_amount, refound_amount } = checkKeys(data, ['out_order_no', 'app_id', 'reason', 'total_amount', 'refound_amount'])
    const paySdk = new WxPay({ ...key_object, appid: app_id, mchid, serial_no, });
    let send_data = {
        out_trade_no: out_order_no,
        out_refund_no: out_order_no,
        reason,
        notify_url: `${production_url}/public/callback/duolai_refound/weixin/${app_id}`,
        amount: {
            refund: refound_amount,
            currency: 'CNY',
            total: total_amount
        }
    }
    let refound_info = await paySdk.refunds(send_data)
    // console.log(refound_info);
    if (refound_info?.code) return Promise.reject(refound_info?.message || '订单退款异常！')
    return refound_info.refund_id
}
const WXPAY_STATUS_MAPPER = {
    SUCCESS: 2,
    REFUND: 3,
    NOTPAY: 1,
    CLOSED: 1,
    REVOKED: 1,
    USERPAYING: 1,
    PAYERROR: 1
}
const PAYPLATFORM_MAPPER = {
    WECHAT: "WXPAY",
    ALIPAY: "ALIPAY",
    APPLE_PAY: "APPLE"
}
function formatOrder(order_info = {}, biz_type, unified_order_info = {}, refund_amount) {
    let data = { pay_platform: PAYPLATFORM_MAPPER.WECHAT }
    let keys = ['trade_state', 'transaction_id', 'success_time', 'amount']
    keys.forEach(key => {
        switch (key) {
            case 'trade_state':
                if (order_info[key]) data.pay_status = WXPAY_STATUS_MAPPER[order_info[key]] || 9
                if (biz_type == 'REFUND') {
                    data.pay_status = 3
                    if (refund_amount) data.refund_amount = refund_amount
                    data.refund_time = moment().format('YYYY-MM-DD HH:mm:ss')
                    data.refund_date = moment().format('YYYY-MM-DD')
                }
                if (unified_order_info?.pay_status == 3) data.pay_status = 3
                break;
            case 'transaction_id':
                if (order_info[key]) data.transaction_id = order_info[key]
                break;
            case 'success_time':
                if (order_info[key]) {
                    data.pay_time = moment(order_info[key]).format('YYYY-MM-DD HH:mm:ss')
                    data.pay_date = moment(data.pay_time).format('YYYY-MM-DD')
                }
                break;
            case 'amount':
                if (order_info[key]) {
                    data.total_amount = order_info[key]?.total
                    data.payer_total_amount = order_info[key]?.total
                }
                break;
            default:
                break;
        }
    })
    if (order_info) data.other_info = JSON.stringify(order_info)
    if (Object.keys(data)?.length) return data
    return null
}
/**
 * 获取快手预支付接口
 * @param {*} data 支付信息 'open_id', 'total_amount', 'detail', 'attach?', 'detail'
 */
async function makeOrder(data, system = 'AND', system_rate = null) {
    // let { access_token, app_secret } = await getAccessToken(data.app_id)
    let check_data = checkKeys(data, ['open_id', 'total_amount', 'detail', 'attach?', 'out_order_no'])
    const paySdk = new WxPay({ ...key_object, appid: data.app_id, mchid, serial_no, });
    let send_data = {
        // attach: '',//开发者自定义字段，回调原样回传.
        description: check_data.detail,
        time_expire: moment().add(30, 'minutes').format("YYYY-MM-DDTHH:mm:ssZ"),
        out_trade_no: check_data.out_order_no,
        notify_url: `${production_url}/public/callback/duolai_pay/weixin/${data.app_id}`,
        amount: {
            total: check_data.total_amount, //非生产环境，订单金额一分
            currency: "CNY"
        },
        payer: {
            openid: check_data.open_id,
        }
    }
    let order_info = await paySdk.transactions_jsapi(send_data)
    if (order_info?.status != 200) return Promise.reject(order_info?.error_msg || '订单信息获取异常！')
    // console.log(order_info);
    return { out_order_no: check_data.out_order_no, data: order_info, total_amount: check_data.total_amount, sleep_time: 2000 }

}
/**
 * 获取要支付的总金额
 * @param {*} total_amount 总金额
 * @param {*} system 操作系统
 * @param {*} system_rate 平台费率
 */
function get_pay_price(total_amount = 0, system, system_rate) {
    return total_amount
}
/**
 * 
 * @param {*} app_id 获取token的APPID
 * @param {*} refresh 是否强制刷新，默认false
 * @returns 
 */
async function getAccessToken(app_id = '', trx = knex, refresh = false) {
    if (!app_id) return Promise.reject('app_id不存在！')
    const lock_key = `${RK_DLKD_TOKEN_LOCK}:${app_id}`
    const redis_key = `${RK_DLKD_TOKEN}:${app_id}`
    let token_info = await getCustomCache(redis_key)
    if (token_info && !refresh) return token_info
    return await getWaitLock(lock_key, async () => {
        let secrt = (await trx(DUOLAI_APPLET).select('secret').where('app_id', app_id).limit(1))[0]?.secret
        if (!secrt) return Promise.reject('app_id错误或不存在！')
        token_info = process.env.NODE_ENV != "production" ? (await getOnlineToken({ app_id, provider: 'weixin' }))?.data : await getToken({ appid: app_id, secret: secrt, grant_type: 'client_credential', force_refresh: true })
        if (!token_info?.access_token) return Promise.reject('access_token获取异常！')
        token_info.app_secret = secrt
        await setCustomCache(token_info, redis_key, token_info?.expires_in ? (token_info.expires_in - 800) : 600)
        return token_info
    }, 5, 300)
}
/**
 * 
 */
async function verifyWXSign(body, headers, query, params) {
    const data = {
        body: body, // 请求体 body
        signature: headers['wechatpay-signature'],
        serial: headers['wechatpay-serial'],
        nonce: headers['wechatpay-nonce'],
        timestamp: headers['wechatpay-timestamp'],
    };
    const paySdk = new WxPay({ ...key_object, appid: params.app_id, mchid, serial_no, });
    const ret = await paySdk.verifySign(data).catch(err => {
        // console.log('微信支付验签失败！');
    })
    if (!ret) return Promise.reject('微信支付验签失败！')
    let { resource, event_type } = body
    let result = paySdk.decipher_gcm(resource?.ciphertext, resource?.associated_data, resource?.nonce)
    if (event_type == 'REFUND.SUCCESS') body.biz_type = 'REFUND'
    return {
        out_order_no: result?.out_trade_no,
        biz_type: body?.biz_type,
        refund_amount: result?.amount?.payer_refund
    }

}

// queryOrder({app_id:'wxdfa6ed9ccb6fc3e6', out_order_no: "XGDL-2024080800026936", create_time: "2024-04-09 13:39:50" }).then(res=>{
//     console.log(res);
// })
// getAccessToken('wxdfa6ed9ccb6fc3e6').then(res=>{
//     console.log(res);
// })
module.exports = {
    getAccessToken,
    makeOrder,
    getUserOpenid,
    queryOrder,
    verifyWXSign,
    get_pay_price,
    refoundOrders
}