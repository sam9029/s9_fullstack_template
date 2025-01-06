const { VIP_SEED, VIP_DATA, ACTINFO_TABLE, INVITE_DATA, PAYMENT_ORDERS } = require("../../../config/setting")
const knex = require("../../../db/knexManager").knexProxy
const { getDaysBetweenDate, knexTransaction, selectName, getUuid, checkSildeCode } = require("../../../utils/tools")
const { insertLog, getLogData } = require("../../public/operationLog")
const { check: checkVipCard } = require("../../manage/business/vipPolicy/vipCard")
const moment = require('moment')
const { getOrderSn, getUnifiedOrder, verifyPaymentResults: verifyPaymentResult } = require("../../../utils/payment/tools")
const validator = require("validator").default
async function makeUnifiedOrder(body = {}, userInfo = {}, req) {
    let { $req_ip: payer_client_ip } = req
    let { vip_card_id, system, pay_platform, order_type } = hander.checkData(body)
    // console.log(body);
    // if (process.env.NODE_ENV != "production") 
    // return Promise.reject('会员体系正在升级中，暂停会员充值服务，敬请关注后续APP动态！')
    if (pay_platform != 'APPLE') return Promise.reject('会员体系正在升级中，暂停会员充值服务，敬请关注后续APP动态！')
    let { id: account_id, oem_id } = userInfo
    if (!account_id || !payer_client_ip) return Promise.reject('用户信息异常！')
    if (account_id != 10010174) return Promise.reject('会员体系正在升级中，暂停会员充值服务，敬请关注后续APP动态！')
    let card_info = await checkVipCard(vip_card_id, system)
    // 获取当前订单的绑定人信息
    let inviter_info = (await knex(`${INVITE_DATA} as ind`).select('ind.inviter_id', 'ind.id as invite_data_id')
        .select(selectName('ind', 'inviter_id', ACTINFO_TABLE, 'vip_status', 'inviter_vip_status', 'account_id'))
        .where({ invite_account_id: account_id }).limit(1))[0]

    // console.log(card_info);
    let data = await knexTransaction(async trx => {
        let seed_info = (await trx(VIP_SEED).select('id as seed_member_id')
            .where({ account_id, vip_card_id, active_status: 1, status: 1, verify_status: 2 }).limit(1))[0]
        let insert_data = {
            description: `${card_info.type_name}(${card_info.level_name})`,
            time_expire: moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
            system,
            pay_platform,
            out_trade_no: await getOrderSn(pay_platform, system),
            vip_card_id,
            amount: card_info.price,
            product_id: card_info.product_id,
            pay_status: 1,
            order_type: card_info.type || order_type,
            status: 1,
            oem_id,
            account_id,
            create_date: moment().format('YYYY-MM-DD'),
            create_user_id: account_id,
            update_user_id: account_id,
            payer_client_ip,
            inviter_id: (inviter_info?.inviter_id) || 0,
            invite_data_id: (inviter_info?.invite_data_id) || 0,
            inviter_vip_status: (inviter_info?.inviter_vip_status) || 1,
            seed_member_id: seed_info?.seed_member_id || 0
        }
        if (insert_data.seed_member_id) {
            insert_data.amount = 1 //种子用户支付金额为1分
            await trx(VIP_SEED).update({ active_status: 2 }).where('id', insert_data.seed_member_id)
        }
        let [relation_id] = await trx(PAYMENT_ORDERS).insert(insert_data)
        if (!relation_id) return Promise.reject('支付系统繁忙，请稍后重试！')
        await insertLog(trx, getLogData(relation_id, 120, insert_data, userInfo))
        let back = await getUnifiedOrder(insert_data, insert_data.seed_member_id)
        // console.log(insert_data);
        return back
    })
    return { code: 0, data }


}
//支付后验证支付结果
async function verifyPaymentResults(body = {}, userInfo = {}) {
    let { out_trade_no, pay_platform, receipt_data } = hander.checkVerifyData(body)
    let { id: account_id } = userInfo
    let order_info = (await knex(PAYMENT_ORDERS).select('id', 'pay_platform', 'transaction_id').where({ out_trade_no, account_id }).limit(1))[0]
    if (!order_info) return Promise.reject('订单不存在或订单信息异常！')
    let { transaction_id } = order_info
    if (transaction_id == '0') transaction_id = null
    let data = await knexTransaction(async trx => {
        let { pay_status } = await verifyPaymentResult({ out_trade_no, pay_platform, receipt_data, transaction_id }, userInfo, trx)
        // if (order_info?.has_payed) return order_info //该订单验证过后，提示已经支付过了
        return { pay_status, out_trade_no }
    })
    return { code: 0, data }
}
// 会员开通记录
async function activationRecord(query = {}, userInfo = {}) {
    let { page_size = 10, pagesize = 10, next_page_site = null } = query
    let { id: account_id } = userInfo
    let clos = ['id', 'start_time', 'expire_time', 'status']
    let knexSql = knex.select(clos.map(i => 'vdt.' + i))
        .select('odr.pay_time', 'odr.pay_status', 'odr.description', 'odr.amount')
        .from(`${VIP_DATA} as vdt`)
        .leftJoin(`${PAYMENT_ORDERS} as odr`, 'vdt.payment_order_id', 'odr.id')
        .where({ 'vdt.account_id': account_id, 'vdt.vip_card_type': 1 })
        .limit(page_size || pagesize).orderBy('vdt.id', 'desc')
    if (next_page_site) knexSql.where('vdt.id', '<', next_page_site)
    let list = await knexSql
    next_page_site = null
    if (list.length) {
        let last = list[list.length - 1]
        next_page_site = last?.id || null
    }
    if (list.length < (page_size || pagesize)) next_page_site = null
    return { code: 0, data: { list, next_page_site } }
}
const hander = {
    checkData(body) {
        let { vip_card_id, system, pay_platform, order_type } = body
        if (!order_type || !system || !pay_platform) throw new Error('参数异常，请检查参数！')
        if (!validator.isIn(String(order_type), [1, 2])) throw new Error('订单类型异常！')
        if (!validator.isIn(pay_platform, ['WXPAY', 'ALIPAY', 'APPLE'])) throw new Error('支付类型异常！')
        if (!validator.isIn(system, ['AND', 'IOS'])) throw new Error('平台类型异常！')
        if (system == 'AND' && !validator.isIn(pay_platform, ['WXPAY', 'ALIPAY'])) throw new Error('安卓仅支持微信、支付宝支付！')
        if (system == 'IOS' && !validator.isIn(pay_platform, ['APPLE'])) throw new Error('苹果仅支持苹果支付！')
        if (order_type == 1 && !vip_card_id) throw new Error('购买会员需要指定会员卡！')
        return { vip_card_id, system, pay_platform, order_type }
    },
    checkVerifyData(body) {
        let { out_trade_no, pay_platform, receipt_data } = body
        if (!out_trade_no || !pay_platform) throw new Error('参数异常，请检查参数！')
        if (!validator.isIn(pay_platform, ['WXPAY', 'ALIPAY', 'APPLE'])) throw new Error('支付类型异常！')
        if (pay_platform == 'APPLE' && !receipt_data) throw new Error('苹果支付！')
        return { out_trade_no, pay_platform, receipt_data }
    }
}
module.exports = {
    makeUnifiedOrder,
    verifyPaymentResults,
    activationRecord
};