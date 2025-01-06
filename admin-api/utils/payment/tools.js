const knex = require("../../db/knexManager").knexProxy;
const { PAYMENT_ORDERS, WITHDRAW_DETAILS, WITHDRAW_SERVICE_ORDER } = require("../../config/setting")
// const UAParser = require('ua-parser-js');
const { system_account_id } = require("../../config/index")
const { RK_ORDER_SN_LOCK, RK_PAYMENT_ORDER_SN_LOCK, RK_PAYMENT_SERVICE_ORDER_SN_LOCK } = require("../../config/redis_key")
const { getRequestIP, getBaseStation, sleep, knexTransaction } = require('../../utils/tools')
const { makeUnifiedOrder: WxMakeUnifiedOrder, getOrderInfo: WxGetOrder, WXPAY_STATUS_MAPPER } = require("./wxpay/api")
const { makeUnifiedOrder: AliMakeUnifiedOrder, getOrderInfo: AliGetOrder, ALIPAY_STATUS_MAPPER } = require("./alipay/api")
const { makeUnifiedOrder: APPMakeUnifiedOrder, APPGetOrder, APP_STATUS_MAPPER } = require("./apple/api")
const { userMakeSign } = require("./daxiongpay/api")
const moment = require("moment")
const { insertLog, getLogData } = require("../../model/public/operationLog")
const { operateEquity } = require("./equity")
const { getWaitLock, getRedisClient, getCustomCache } = require('../../db/redis')

// var order_num_mapper = {}
// let order_loading = false
async function getOrderSn(pay_platform = 'WX', system = "IOS") {
    return await getWaitLock(RK_ORDER_SN_LOCK, async () => {
        let date = moment().format('YYYYMMDD')
        let count_key = `${RK_ORDER_SN_LOCK}:${date}`
        let expire_sec = 3 * 24 * 60 * 60
        let data = await getCustomCache(count_key)
        if (!data) { //当天没有订单计数key时，尝试获取数据库当天的count最大值
            let count = (await knex(PAYMENT_ORDERS).count('id as count').where('create_date', moment().format('YYYY-MM-DD')))[0]?.count
            console.log(count);
            await getRedisClient().multi().set(count_key, count, { NX: true, EX: expire_sec }).exec()
        }
        // let prefix = process.env.NODE_ENV == "production" ? "XG" : "XGDEV"
        let [_add_status, order_count] = await getRedisClient().multi().set(count_key, 0, { NX: true, EX: expire_sec })
            .incrBy(count_key, 1).exec()
        let sn = `${system}-${pay_platform}-${date}${String(order_count).padStart(8, '0')}`
        // console.log(sn);
        return sn
    }, 5, 300)
    // if (order_loading) {
    //     await sleep(500)
    //     return await getOrderSn(pay_platform, system)
    // }
    // order_loading = true
    // let date = moment().format('YYYYMMDD')
    // if (Object.hasOwnProperty.call(order_num_mapper, date)) order_num_mapper[date] = (order_num_mapper[date] || 0) + 1
    // else { //去数据库里查当天的支付订单数
    //     let count = (await knex(PAYMENT_ORDERS).count('id as count').where('create_date', moment().format('YYYY-MM-DD')))[0].count
    //     order_num_mapper[date] = count + 1
    // }
    // // console.log('order_num_mapper[date]', order_num_mapper[date]);
    // order_loading = false
    // return `${system}-${pay_platform}-${date}${String(order_num_mapper[date]).padStart(8, '0')}`
}
let pay_order_loading = false
var pay_order_num_mapper = {}
async function getPayOrderSn(pay_platform = 'WXPAY', system = "PAY") {
    return await getWaitLock(RK_PAYMENT_ORDER_SN_LOCK, async () => {
        let date = moment().format('YYYYMMDD')
        let count_key = `${RK_PAYMENT_ORDER_SN_LOCK}:${date}`
        let expire_sec = 3 * 24 * 60 * 60
        let data = await getCustomCache(count_key)
        if (!data) { //当天没有订单计数key时，尝试获取数据库当天的count最大值
            let count = (await knex(WITHDRAW_DETAILS).max('ask_for_payment_id as count')
            .whereNotNull('ask_for_payment_id')
            .where('create_date', moment().format('YYYY-MM-DD')))[0].count;
            if (count) count = Number(count.split(`-${date}`)[1])
            else count = 0
            // console.log(count);
            await getRedisClient().multi().set(count_key, count, { NX: true, EX: expire_sec }).exec()
        }
        let [_add_status, order_count] = await getRedisClient().multi().set(count_key, 0, { NX: true, EX: expire_sec })
            .incrBy(count_key, 1).exec()
        let sn = `${system}-${pay_platform}-${date}${String(order_count).padStart(8, '0')}`
        // console.log(sn);
        return sn
    }, 5, 300)

    // if (pay_order_loading) {
    //     await sleep(200)
    //     return await getPayOrderSn(pay_platform)
    // }
    // pay_order_loading = true
    // let date = moment().format('YYYYMMDD')
    // let str = `${system}-${pay_platform}-${date}`
    // if (Object.hasOwnProperty.call(pay_order_num_mapper, date)) pay_order_num_mapper[date] = (pay_order_num_mapper[date] || 0) + 1
    // else { //去数据库里查当天的支付订单数
    //     let count = (await knex(WITHDRAW_DETAILS).max('ask_for_payment_id as count')
    //         .whereNotNull('ask_for_payment_id')
    //         .where('create_date', moment().format('YYYY-MM-DD')))[0].count
    //     if (count) count = Number(count.split(`-${date}`)[1])
    //     else count = 0
    //     pay_order_num_mapper[date] = (count || 0) + 1
    // }
    // pay_order_loading = false
    // return `${str}${String(pay_order_num_mapper[date]).padStart(8, '0')}`
}
// getPayOrderSn('')
let service_order_loading = false
var service_order_num_mapper = {}
async function getServiceOrderSn(pay_platform = 'ACPAY', system = "SPO") {
    return await getWaitLock(RK_PAYMENT_SERVICE_ORDER_SN_LOCK, async () => {
        let date = moment().format('YYYYMMDD')
        let count_key = `${RK_PAYMENT_SERVICE_ORDER_SN_LOCK}:${date}`
        let expire_sec = 3 * 24 * 60 * 60
        let data = await getCustomCache(count_key)
        if (!data) { //当天没有订单计数key时，尝试获取数据库当天的count最大值
            let count = (await knex(WITHDRAW_SERVICE_ORDER).max('service_order_num as count')
            .where('create_date', moment().format('YYYY-MM-DD')))[0].count;
            console.log(3, count)
            if (count) count = Number(count.split(`-${date}`)[1])
            else count = 0
            // console.log(count);
            await getRedisClient().multi().set(count_key, count, { NX: true, EX: expire_sec }).exec()
        }
        let [_add_status, order_count] = await getRedisClient().multi().set(count_key, 0, { NX: true, EX: expire_sec })
            .incrBy(count_key, 1).exec()
        let sn = `${system}-${pay_platform}-${date}${String(order_count).padStart(8, '0')}`
        // console.log(sn);
        return sn
    }, 5, 300)

    // if (service_order_loading) {
    //     await sleep(200)
    //     return await getPayOrderSn(pay_platform)
    // }
    // service_order_loading = true
    // let date = moment().format('YYYYMMDD')
    // if (Object.hasOwnProperty.call(service_order_num_mapper, date)) service_order_num_mapper[date] = (service_order_num_mapper[date] || 0) + 1
    // else { //去数据库里查当天的支付订单数
    //     let count = (await knex(WITHDRAW_SERVICE_ORDER).count('id as count')
    //         .where('create_date', moment().format('YYYY-MM-DD')))[0].count
    //     service_order_num_mapper[date] = count + 1
    // }
    // service_order_loading = false
    // return `${system}-${pay_platform}-${date}${String(service_order_num_mapper[date]).padStart(8, '0')}`
}
async function getUnifiedOrder(data = {}, seed_member_id = 0) {
    switch (data.pay_platform) {
        case "WXPAY":
            return await WxMakeUnifiedOrder(data, seed_member_id)
        case "ALIPAY":
            return await AliMakeUnifiedOrder(data, seed_member_id)
        case "APPLE":
            return await APPMakeUnifiedOrder(data, seed_member_id)
        default:
            throw "未知的支付平台类型！"
    }
}
// 苹果支付会把 order_info 传入
async function verifyPaymentResults(data = {}, userInfo = {}, trx = knex, order_info = null, callback_info = null) {
    // let order_info = {}
    let unified_order_info = (await trx(PAYMENT_ORDERS).select('*').where('out_trade_no', data.out_trade_no))[0]
    if (!unified_order_info) return Promise.reject('订单不存在，非法请求！')
    let update_data = {}
    switch (data.pay_platform) {
        case "WXPAY":
            order_info = await WxGetOrder(data.out_trade_no, callback_info)
            update_data = makeWxData(order_info)
            break
        case "ALIPAY":
            order_info = await AliGetOrder(data.out_trade_no, callback_info)
            update_data = makeAliData(order_info, unified_order_info)
            break
        case "APPLE":
            order_info = order_info || (await APPGetOrder(data.receipt_data, unified_order_info.product_id, data.transaction_id, trx, unified_order_info.account_id))
            update_data = makeAPPData(order_info, data.receipt_data)
            break
        default:
            throw "未知的支付平台类型！"
    }
    // console.log(update_data);
    if (update_data) {
        await trx(PAYMENT_ORDERS).update(update_data).where('out_trade_no', data.out_trade_no)
        await insertLog(trx, getLogData(unified_order_info.id, 121, update_data, userInfo, unified_order_info))
        let equity_data = { account_id: unified_order_info.account_id, payment_order_id: unified_order_info.id }
        if (update_data?.pay_status == 2) await operateEquity(equity_data, 'add', userInfo, trx)
        if (update_data?.pay_status == 3) await operateEquity(equity_data, 'refound', userInfo, trx)
    }
    return update_data
}

function makeWxData(order_info = {}) {
    let data = {}
    let keys = ['trade_state', 'openid', 'transaction_id', 'success_time', 'payer_total', 'refund_time']
    // console.log(JSON.stringify(order_info));
    keys.forEach(key => {
        switch (key) {
            case 'trade_state':
                if (order_info[key]) data.pay_status = WXPAY_STATUS_MAPPER[order_info[key]] || 9
                break;
            case 'openid':
                if (order_info?.payer?.[key]) data.open_id = order_info.payer?.[key]
                break;
            case 'transaction_id':
                if (order_info[key]) data.transaction_id = order_info[key]
                break;
            case 'payer_total':
                if (order_info?.amount?.[key]) data.payer_total = order_info?.amount?.[key]
                break;
            case 'success_time':
                if (order_info[key]) {
                    data.pay_time = moment(order_info[key]).format('YYYY-MM-DD HH:mm:ss')
                    data.pay_date = moment(data.pay_time).format('YYYY-MM-DD')
                }
                break;
            case 'refund_time':
                if (order_info[key]) {
                    data.refund_time = moment(order_info[key]).format('YYYY-MM-DD HH:mm:ss')
                    data.refund_date = moment(data.refund_time).format('YYYY-MM-DD')
                }
                break;
            default:
                break;
        }
    })
    if (Object.keys(data)?.length) return data
    return null
}
// const ALIPAY_STATUS_MAPPER = {
//     WAIT_BUYER_PAY: 1,
//     TRADE_CLOSED: 3, // TRADE_CLOSED（未付款交易超时关闭，或支付完成后全额退款）
//     TRADE_SUCCESS: 2,
//     TRADE_FINISHED: 3
// }
function makeAliData(order_info = {}, unified_order_info = {}) {
    let data = {}
    let keys = ['tradeNo', 'buyerLogonId', 'tradeStatus', 'sendPayDate', 'totalAmount', 'refund_time']

    keys.forEach(key => {
        switch (key) {
            case 'tradeStatus':
                if (order_info[key]) data.pay_status = ALIPAY_STATUS_MAPPER[order_info[key]] || 9
                if (data.pay_status == 3 && !order_info.sendPayDate) data.pay_status = 1 //支付宝没有支付时间，视为已退款
                if (unified_order_info?.refund_time) data.pay_status = 3 //数据已经退款了，则不刷新订单状态
                break;
            case 'buyerLogonId':
                if (order_info[key]) data.open_id = order_info[key]
                break;
            case 'tradeNo':
                if (order_info[key]) data.transaction_id = order_info[key]
                break;
            case 'totalAmount':
                if (order_info[key]) data.payer_total = Math.round((order_info[key]) * 100)
                break;
            case 'sendPayDate':
                if (order_info[key]) {
                    data.pay_time = moment(order_info[key]).format('YYYY-MM-DD HH:mm:ss')
                    data.pay_date = moment(data.pay_time).format('YYYY-MM-DD')
                }
                break;
            case 'refund_time':
                if (order_info[key]) {
                    data.refund_time = moment(order_info[key]).format('YYYY-MM-DD HH:mm:ss')
                    data.refund_date = moment(data.refund_time).format('YYYY-MM-DD')
                }
                break;
            default:
                break;
        }
    })
    if (Object.keys(data)?.length) return data
    return null
}
function makeAPPData(order_info = {}, receipt_data = '') {
    let data = {}
    if (receipt_data) data.receipt_data = receipt_data
    let keys = [
        // 'transaction_id', 'in_app_ownership_type', 'purchase_date', 'cancellation_date',
        'revocationDate', 'transactionId', 'purchaseDate', 'inAppOwnershipType', 'environment']
    let pay_info = order_info
    function formatAppleTime(date = '') {
        // date 2023-07-05 11:09:36 Etc/GMT
        return moment(String(date).replace(' Etc/GMT', 'Z').replace(' ', 'T')).format('YYYY-MM-DD HH:mm:ss')
    }
    keys.forEach(key => {
        switch (key) {
            // case 'in_app_ownership_type':
            case 'inAppOwnershipType':
                if (pay_info[key]) data.pay_status = APP_STATUS_MAPPER[pay_info[key]] || 9
                break;
            // case 'transaction_id':
            case 'transactionId':
                if (pay_info[key]) data.transaction_id = pay_info[key]
                break;
            case 'environment':
                if (pay_info[key]) data.environment = String(pay_info[key]).toLowerCase()
                if (data.environment == 'sandbox') data.amount = 0 //沙盒支付将订单金额设置为0
                break;
            // case 'cancellation_date':
            //     if (pay_info[key]) {
            //         data.refund_time = formatAppleTime(pay_info[key])
            //         data.refund_date = moment(data.refund_time).format('YYYY-MM-DD')
            //     }
            //     break;
            case 'revocationDate':
                if (pay_info[key]) {
                    data.refund_time = moment(pay_info[key]).format('YYYY-MM-DD HH:mm:ss')
                    data.refund_date = moment(data.refund_time).format('YYYY-MM-DD')
                }
                break;
            case 'purchaseDate':
                if (pay_info[key]) {
                    data.pay_time = moment(pay_info[key]).format('YYYY-MM-DD HH:mm:ss')
                    data.pay_date = moment(data.pay_time).format('YYYY-MM-DD')
                }
                break;
            default:
                break;
        }
    })
    if (data?.refund_time) data.pay_status = APP_STATUS_MAPPER.REFUND //有退款日期时，将订单状态设置为已退款
    if (Object.keys(data)?.length) return data
    return null
}
async function makeSignWithDX(data = {}) {
    let { pay_platform, pay_account, mobile, id_card, id_card_face_url, id_card_back_url, people_name } = data
    let send_data = {
        name: people_name,
        cardNo: pay_account,
        idCard: id_card,
        mobile,
        authType: pay_platform == 'BANK' ? 3 : 1,
        idCardFace: id_card_face_url,
        idCardNational: id_card_back_url,
        uploadType: 1
    }
    // console.log(send_data);
    return await userMakeSign(send_data)
}

async function serverPayCallback(out_trade_no = '', order_info = null, callback_info = null) {
    // const {verifyPaymentResults} = require("./tools")
    let [system, pay_platform, number] = String(out_trade_no).split('-')
    if ((!pay_platform || !out_trade_no) && !order_info) return Promise.reject('参数异常，请检查参数！')
    return await knexTransaction(async trx => {
        let query_data = { pay_platform, out_trade_no }
        if (order_info) {
            query_data = (await trx(PAYMENT_ORDERS).select('out_trade_no', 'pay_platform').where('transaction_id', order_info.transactionId).limit(1))[0]
            if (!query_data) return Promise.reject('订单不存在！')
        }
        // console.log(order_info);
        await verifyPaymentResults(query_data, { id: system_account_id, oem_id: 1 }, trx, order_info, callback_info)
    })
}
// test()
// console.log();
module.exports = {
    getOrderSn,
    getUnifiedOrder,
    verifyPaymentResults,
    makeSignWithDX,
    serverPayCallback,
    getPayOrderSn,
    getServiceOrderSn
}