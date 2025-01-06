const SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt"
const DOMAIN = "https://buy.itunes.apple.com/verifyReceipt"
const request = require("../../request")
const password = '234908c8581943fb8c8970d668785dc2'
const { getVerifyNotification, VerificationStatus, getOrderInfo, bundleId, Environment } = require('./sign')
const { PAYMENT_ORDERS } = require("../../../config/setting")
const knex = require("../../../db/knexManager").knexProxy
const SANDBOX_LIST = process.env.NODE_ENV == "production" ? [10010174, 10000001] : [10000001]

async function APPGetOrder(receipt_data = '', product_id = '', transaction_id = '', trx = knex, account_id = null) {
    let env = Environment.PRODUCTION
    if (SANDBOX_LIST.includes(account_id)) env = Environment.SANDBOX
    if (transaction_id) return await getOrderInfo(transaction_id, env) //如果有交易ID，这个时候通过transaction_id 返回订单数据
    async function checkAppIsXGFX(data = {}, product_id = '') {
        if (!data?.receipt) return Promise.reject('苹果支付订单验证异常！')
        let { receipt } = data
        // console.log(data);
        if (receipt?.bundle_id != bundleId) return Promise.reject('伪造的支付信息，若继续操作将追究法律责任！')
        if (!receipt?.in_app) return Promise.reject('苹果支付订单验证异常，无商品信息！')
        let { in_app } = receipt
        let old_ids = (await trx(PAYMENT_ORDERS).select('transaction_id').whereIn('transaction_id', in_app.map(i => i.transaction_id)))
            .map(i => i.transaction_id)
        // console.log(old_ids, in_app, product_id);
        let find_item = in_app.find(i => i?.product_id == product_id && (!old_ids.includes(i.transaction_id)))
        // console.log(find_item);
        // await getOrderInfo(in_app[0].transaction_id, env).then(res => {
        //     console.log(res);
        // }).catch(err => {
        //     console.log(err, account_id);
        // })
        if (!find_item) return Promise.reject('订单验证异常，商品信息对比失败！')
        data.transaction_id = find_item.transaction_id
        return await getOrderInfo(find_item.transaction_id, env)
        // return Promise.resolve(data)
    }
    return await request({
        url: `${DOMAIN}`,
        method: 'post',
        headers: {
            "Content-type": "application/json",
            Accept: "application/json",
        },
        no_need_retry: true,
        data: {
            'receipt-data': receipt_data,
            'exclude-old-transactions': false,
            password
        }
    }).then(res => {
        if (res?.status == 21007) return request({
            url: `${SANDBOX}`,
            method: 'post',
            headers: {
                "Content-type": "application/json",
                Accept: "application/json",
            },
            no_need_retry: true,
            data: {
                'receipt-data': receipt_data,
                'exclude-old-transactions': false,
                password
            }
        })
        // if (res?.status != 0) return Promise.reject('苹果支付订单验证异常！')
        // return checkAppIsXGFX(res, product_id)
        return Promise.resolve(res)
    }).then(res => {
        if (res?.status != 0) return Promise.reject('苹果支付订单验证异常！')
        return checkAppIsXGFX(res, product_id)
    })
}
const moment = require("moment")
async function makeUnifiedOrder(data = {}, seed_member_id) {
    let { out_trade_no, time_expire, description, amount, product_id, vip_card_id } = data
    // product_id = ''
    return { product_id, vip_card_id, out_trade_no, time_expire, description, amount }
}
const APP_STATUS_MAPPER = {
    PURCHASED: 2,
    REFUND: 3,
}
function formatData(data = {}, pay_type) {
    return {
        in_app_ownership_type: pay_type != 'REFUND' ? data.inAppOwnershipType : 'REFUND',
        transaction_id: data.transactionId,
        purchase_date: moment(data.purchaseDate).format('YYYY-MM-DD HH:mm:ss'),
        cancellation_date: data.revocationDate ? moment(data.revocationDate).format('YYYY-MM-DD HH:mm:ss') : null //退款日期
    }
}
async function applePayCallback(body, headers) {
    // console.log(JSON.stringify(body));
    // console.log(JSON.stringify(headers));
    const ret = await getVerifyNotification(body.signedPayload).catch(err => {
        console.log('苹果支付验签失败！', VerificationStatus[err.status]);
    })
    if (ret) {
        // console.log(ret);
        // if (!['REFUND', 'CONSUMPTION_REQUEST'].includes(ret.notificationType)) return 'undo'
        if (ret.notificationType == 'CONSUMPTION_REQUEST') ret.notificationType = 'REFUND'
        // let transaction_info = formatData(ret.transaction_info, ret.notificationType)
        let transaction_info = await getOrderInfo(ret?.transaction_info?.transactionId)
        // console.log(transaction_info);
        const { serverPayCallback } = require("../tools")
        await serverPayCallback(ret?.out_trade_no, transaction_info).catch(err => {
            console.log('服务端下发权益异常！', err);
        })
    }
    return 'success'
}
module.exports = {
    APPGetOrder,
    makeUnifiedOrder,
    APP_STATUS_MAPPER,
    applePayCallback
}