const { getUuid } = require('../../tools')
const fs = require("fs")
const path = require('path');
const AlipaySdk = require('alipay-sdk').default
const { cert_path, test_amount } = require("../../../config")
// console.log(fs.readFileSync(path.join(cert_path, './ali_public_key.pem'), 'ascii'));
// const pay = new AlipaySdk({
//     appId: "2021004104608230",
//     signType: "RSA2",
//     encryptKey: "zKprGFCS/ZuQz/PbDnttGg==",
//     keyType: 'PKCS1', // 默认值。请与生成的密钥格式保持一致，参考平台配置一节
//     alipayPublicKey: fs.readFileSync(path.join(cert_path, './ali_public_key.pem'), 'ascii'), // 公钥
//     privateKey: fs.readFileSync(path.join(cert_path, './ali_private_key.pem'), 'ascii'), // 秘钥
// });
async function makeUnifiedOrder(data = {}, seed_member_id) {
    let { payer_client_ip, out_trade_no, time_expire, description, amount } = data
    // const result = await pay.exec('alipay.open.public.info.query');
    // console.log(result);
    amount = test_amount || amount
    if (seed_member_id) amount = 1 //种子会员，支付一分钱
    let params = {
        bizContent: {
            out_trade_no,
            product_code: "QUICK_MSECURITY_PAY",
            subject: description,
            body: description,
            total_amount: Number(amount / 100).toFixed(2), //非生产环境，订单金额一分
            time_expire,
            // enable_pay_channels:'balance,moneyFund,bankPay,debitCardExpress,honeyPay' //https://opendocs.alipay.com/open/common/wifww7
        },
        notifyUrl: 'https://test.domain.cn/api/public/callback/alipay',
    }
    // console.log(params);
    return { out_trade_no, time_expire, description, amount, alipay: await pay.sdkExec('alipay.trade.app.pay', params) }
}
// 1、待支付 2、已支付 3、已退款 9、未知状态
// WAIT_BUYER_PAY （交易创建，等待买家付款）、
// TRADE_CLOSED （未付款交易超时关闭，或支付完成后全额退款）、
// TRADE_SUCCESS （交易支付成功）、
// TRADE_FINISHED （交易结束，不可退款
const ALIPAY_STATUS_MAPPER = {
    WAIT_BUYER_PAY: 1,
    TRADE_CLOSED: 3, // TRADE_CLOSED（未付款交易超时关闭，或支付完成后全额退款）
    TRADE_SUCCESS: 2,
    TRADE_FINISHED: 3
}
async function getOrderInfo(out_trade_no = '', callback_info = null) {
    let params = {
        bizContent: {
            out_trade_no
        }
    }
    let back = await pay.exec('alipay.trade.query', params)
    // console.log(callback_info);
    if (back?.code != 10000) return Promise.reject(back?.subMsg || back || '未知异常！')
    if (callback_info?.gmt_refund) back.refund_time = callback_info?.gmt_refund
    // console.log(back);
    return back
}
async function aliCallBack(body) {
    // console.log(JSON.stringify(body));
    let rtl = pay.checkNotifySign(body)
    if (rtl) {
        // console.log(body);
        const { serverPayCallback } = require("../tools")
        await serverPayCallback(body?.out_trade_no, null, body).catch(err => {
            console.log('服务端下发权益异常！', err);
        })
    }
    return 'success'
}
module.exports = {
    makeUnifiedOrder,
    getOrderInfo,
    ALIPAY_STATUS_MAPPER,
    aliCallBack
}
// getOrderInfo('AND-ALIPAY-2024022200000007').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log('err', err);
// })