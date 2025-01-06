const DOMAIN = "https://api.mch.weixin.qq.com"
const request = require("../../request")
const qs = require('qs');
// const utils = require("../../../model/public/externalMedia/utils")
const { getUuid } = require('../../tools')
const moment = require("moment")
const serial_no = '535DCB16CB1CEA9E0446688B9C78EC8D4C68C44D'
const mchid = "1648180904"
const appid = "wx834624da80bcd632"
const fs = require("fs")
const path = require('path');
const WxPay = require("wechatpay-node-v3")
const { cert_path, test_amount } = require("../../../config")
// const pay = new WxPay({
//     appid,
//     mchid,
//     serial_no,
//     publicKey: fs.readFileSync(path.join(cert_path, './apiclient_cert.pem')), // 公钥
//     privateKey: fs.readFileSync(path.join(cert_path, './apiclient_key.pem')), // 秘钥
//     key: "745C2A5E73D64A1D892CBB24A33EE9B1"
// });
/* 交易状态，枚举值：
SUCCESS 支付成功
REFUND 转入退款
NOTPAY 未支付
CLOSED 已关闭
REVOKED 已撤销（仅付款码支付会返回）
USERPAYING 用户支付中（仅付款码支付会返回）
PAYERROR 支付失败（仅付款码支付会返 */
const WXPAY_STATUS_MAPPER = {
    SUCCESS: 2,
    REFUND: 3,
    NOTPAY: 1,
    CLOSED: 1,
    REVOKED: 1,
    USERPAYING: 1,
    PAYERROR: 1
}
function getParamsConfig(config = {}) {
    let { data, method, params, url } = config
    let timestamp = utils.timestamp_sec()
    let nonce_str = getUuid()
    // # 获取签名
    let path = `${String(url).replace(DOMAIN, '')}`
    const signature = pay.getSignature(String(method).toUpperCase(), nonce_str, timestamp, path, data || params || null);
    // # 如果是get 请求 则不需要params 参数拼接在url上 例如 /v3/pay/transactions/id/12177525012014?mchid=1230000109
    // # 获取头部authorization 参数
    const authorization = pay.getAuthorization(nonce_str, timestamp, signature);
    /* 
    if (params) {
        let params_str = qs.stringify(params)
        params_str ? path += `?${params_str}` : null
    }
    let sign_str = `${String(method).toUpperCase()}\n${path}\n${timestamp}\n${nonce_str}\n${data ? JSON.stringify(data) : ''}\n`
    // console.log(sign_str);
    let signature = encodeSign(sign_str)
    let Authorization = "mchid=\"" + mchid + "\","
        + "nonce_str=\"" + nonce_str + "\","
        + "timestamp=\"" + timestamp + "\","
        + "serial_no=\"" + serial_no + "\","
        + "signature=\"" + signature + "\"";
    return 'WECHATPAY2-SHA256-RSA2048' + Authorization */
    // console.log(Authorization);
}
/* 
微信支付API v3使用HTTP状态码来表示请求处理的结果。

处理成功的请求，如果有应答的消息体将返回200，若没有应答的消息体将返回204。
已经被成功接受待处理的请求，将返回202。
请求处理失败时，如缺少必要的入参、支付时余额不足，将会返回4xx范围内的错误码。
请求处理时发生了微信支付侧的服务系统错误，将返回500/501/503的状态码。这种情况比较少见。 */
//生成预支付单信息
async function makeUnifiedOrder(data = {}, seed_member_id) {
    let { payer_client_ip, out_trade_no, time_expire, description, amount } = data
    amount = test_amount || amount
    if (seed_member_id) amount = 1 //种子会员，支付一分钱
    let params = {
        description,
        time_expire: moment(time_expire).format("YYYY-MM-DDTHH:mm:ssZ"),
        out_trade_no,
        notify_url: "https://test.domain.cn/api/public/callback/wxpay",
        amount: {
            total: amount, //非生产环境，订单金额一分
            currency: "CNY"
        },
        scene_info: {
            payer_client_ip,
        }
    }
    // console.log(params);
    let back = await pay.transactions_app(params)
    if (back?.status != 200) return Promise.reject(back?.message || back || '未知异常！')
    // if(back.)
    if (back?.amount?.payer_total) back.payer_total = back.amount.payer_total
    if (back?.payer?.openid) back.openid = back.payer.openid
    back.out_trade_no = out_trade_no
    return back
}
async function getOrderInfo(out_trade_no, callback_info) {
    const result = await pay.query({ out_trade_no })
    // console.log('callback_info', callback_info);
    if (result?.status != 200) return Promise.reject(result?.message || result || '微信订单查询异常！')
    if (callback_info?.trade_state == 'REFUND') result.refund_time = moment().format("YYYY-MM-DD HH:mm:ss")
    // console.log(result);
    return result
}
async function getRefoundInfo(out_trade_no) {
    const result = await pay.find_refunds(out_trade_no)
    if (result?.status != 200) return Promise.reject(result?.message || result || '微信订单查询异常！')
    return result
}
async function wxpayCallback(body, headers) {
    // console.log(JSON.stringify(body));
    // console.log(JSON.stringify(headers));
    const params = {
        body: body, // 请求体 body
        signature: headers['wechatpay-signature'],
        serial: headers['wechatpay-serial'],
        nonce: headers['wechatpay-nonce'],
        timestamp: headers['wechatpay-timestamp'],
    };
    const ret = await pay.verifySign(params).catch(err => {
        console.log('微信支付验签失败！');
    })
    if (ret && body.resource) { //微信支付验签成功后，开始下发权益
        let { resource } = body
        let result = pay.decipher_gcm(resource?.ciphertext, resource?.associated_data, resource?.nonce)
        // console.log(result);
        const { serverPayCallback } = require("../tools")
        await serverPayCallback(result?.out_trade_no, null, result).catch(err => {
            console.log('服务端下发权益异常！', err);
        })
    }
    return 'success'
}
module.exports = {
    makeUnifiedOrder,
    getOrderInfo,
    WXPAY_STATUS_MAPPER,
    wxpayCallback
}
// getRefoundInfo('4200001981202311178100512335').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(err);
// })
// makeUnifiedOrder(params).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log('err', err);
// })