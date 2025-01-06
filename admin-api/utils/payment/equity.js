const knex = require("../../db/knexManager").knexProxy;
const { PAYMENT_ORDERS, VIP_CARD, VIP_DATA, ACTINFO_TABLE, INVITE_DATA, VIP_REBATE } = require("../../config/setting")
const { system_account_id } = require("../../config/index")
// const UAParser = require('ua-parser-js');
const { knexTransaction, selectName, sleep } = require('../tools')
const moment = require("moment")
const { insertLog, getLogData } = require("../../model/public/operationLog")
// const { commissionPolicy: getRebateInfo } = require("../../model/manage/business/rebatePolicy/index")
const { removeVipLelveCache } = require('../apiMapper')

var equity_mapper = {}
//购买时增加权益
async function operateEquity(data = {}, type = '', userInfo, trx = knex) {
    let { account_id } = data
    if (!account_id) return Promise.reject('请检查参数！')
    let unique_key = `${account_id}`
    if (equity_mapper[unique_key]) {
        await sleep(300)
        return await operateEquity(data, type, userInfo, trx)
    }
    equity_mapper[unique_key] = true
    let functionType = null
    switch (type) {
        case 'add':
            functionType = addEquity
            break;
        case 'refound':
            functionType = refundEquity
            break;
        case 'diff':
            functionType = diffEquity
            break;

        default:
            equity_mapper[unique_key] = false
            throw 'error_type'
    }
    return await functionType(data, userInfo, trx).finally(() => {
        equity_mapper[unique_key] = false
    })
}
async function addEquity(data = {}, userInfo = {}, trx = knex) {
    let { account_id, payment_order_id } = data
    let old_info = (await trx(VIP_DATA).select('*').where({ payment_order_id }))[0]
    // if (old_info) payment_order_ids = JSON.parse(old_info.payment_order_ids)
    if (old_info) {
        console.log('该订单已对用户下发权益，无需再次下发！', payment_order_id);
        return
    }
    let order_info = (await trx.select('card.video_equity_type', 'card.day', 'card.tool_equity_type', 'card.type as vip_card_type',
        'odr.id', 'odr.vip_card_id', 'odr.pay_time', 'odr.account_id', 'odr.inviter_id',
        'odr.inviter_vip_status', 'odr.amount', 'odr.invite_data_id', 'odr.system', 'odr.seed_member_id')
        .from(`${PAYMENT_ORDERS} as odr`)
        .select(selectName('odr', 'account_id', ACTINFO_TABLE, 'vip_join_time', 'vip_join_time', 'account_id'))
        .select(selectName('odr', 'account_id', INVITE_DATA, 'bind_status', 'bind_status', 'invite_account_id'))
        .leftJoin(`${VIP_CARD} as card`, 'odr.vip_card_id', 'card.id')
        .where('odr.account_id', account_id)
        .where('odr.id', payment_order_id))[0]

    if (!order_info) {
        console.log('该订单核验不存在，无法下发订单！', payment_order_id);
        return
    }
    // {"day_num": 10, "free_num": 300}
    let equity_num = {}
    order_info?.video_equity_type && (equity_num = JSON.parse(order_info.video_equity_type))
    // order_info?.tool_equity_type && order_info?.vip_card_type == 2 && (equity_num = JSON.parse(order_info.tool_equity_type))
    let insert_data = {
        vip_card_type: order_info.vip_card_type,
        vip_card_id: order_info.vip_card_id,
        payment_order_id: order_info.id,
        account_id: order_info.account_id,
        create_date: moment().format('YYYY-MM-DD'),
        day_num: equity_num?.day_num || 0,
        total_num: equity_num?.free_num || 0,
        start_time: order_info.pay_time,
        amount: order_info.amount || 0,
        // video_equity_type:order_info?.video_equity_type,
        tool_equity_type: order_info?.tool_equity_type,
        expire_time: moment(order_info.pay_time).add(order_info.day, 'days').format('YYYY-MM-DD HH:mm:ss'),
        limit_num: equity_num?.free_num || 0,
        oem_id: 1
    }
    let logs = []
    if (order_info?.vip_card_type == 1) { //当购买的类型为小果繁星会员，判断之前是否购买过会员，且购买时间
        await removeVipLelveCache(order_info.account_id) //权益变更，更新会员缓存
        let { inviter_id, inviter_vip_status, invite_data_id, bind_status, vip_join_time } = order_info
        //判断这个人是否邀约首冲，1、邀请人存在且为会员 2、邀请后首次充值

        let payment_order_data = { vip_expire_time: insert_data.expire_time, inviter_first_pay: 1, basic_rebate_amount: 0, inviter_bind_status: bind_status || 2, rebate_status: 'UNREBATE' }
        if (inviter_id && inviter_vip_status == 2 && bind_status == 1) {
            let before_invite_data = (await trx(PAYMENT_ORDERS).select('id').where({ pay_status: 2, inviter_id, account_id, inviter_first_pay: 2 }).whereNot('id', payment_order_id).limit(1))[0]
            if (!before_invite_data) {
                payment_order_data.inviter_first_pay = 2
                payment_order_data.rebate_status = 'REBATE'
                // 查询会员基础返利率及政策ID
                let { commission_ratio, id: rebate_policy_id } = await getRebateInfo({ commission_type: 1, order: 1 }, trx)
                payment_order_data.basic_rebate_amount = order_info.amount * (commission_ratio / 10000)
                payment_order_data.rebate_policy_id = rebate_policy_id
                payment_order_data.rebate_policy_ratio = commission_ratio
                if (invite_data_id) await trx(INVITE_DATA).update({ payment_order_id }).where({ id: invite_data_id })
                let rebate_data_info = {
                    // type: 3,
                    payment_order_id: payment_order_id,
                    account_id: inviter_id, //邀请人
                    blogger_id: account_id, //被邀请人
                    date: moment(order_info.pay_time).format('YYYY-MM-DD'),
                    rebate_policy_id,
                    // rebate_date: 1,
                    recharge_amount: order_info.amount,
                    amount: payment_order_data.basic_rebate_amount,
                    create_user_id: userInfo?.id || system_account_id,
                    update_user_id: userInfo?.id || system_account_id,
                    oem_id: 1,
                    system: order_info.system
                }
                let amount_rebate_id = (await trx(VIP_REBATE).insert(rebate_data_info))[0]
                logs.push(getLogData(amount_rebate_id, 129, rebate_data_info, { id: system_account_id, oem_id: 1 }))
            }
        }
        let before_record = (await trx(VIP_DATA).select('id', 'vip_card_id', 'vip_card_type', 'expire_time')
            .where({ status: 1, vip_card_type: order_info.vip_card_type, account_id })
            .where('expire_time', '>=', moment().format('YYYY-MM-DD HH:mm:ss'))
            .limit(1)
            .orderBy('id', 'desc'))[0]
        if (before_record?.expire_time) {
            insert_data.expire_time = moment(before_record.expire_time).add(order_info.day, 'days').format('YYYY-MM-DD HH:mm:ss')
            insert_data.start_time = moment(before_record.expire_time).format('YYYY-MM-DD HH:mm:ss')
            payment_order_data.vip_expire_time = insert_data.expire_time
        }
        let update_data = { vip_status: 2, vip_expire_time: insert_data.expire_time }
        if (!vip_join_time) update_data.vip_join_time = order_info.pay_time
        await trx(ACTINFO_TABLE).update(update_data).where({ account_id: order_info.account_id })
        await trx(PAYMENT_ORDERS).update(payment_order_data).where({ id: payment_order_id })
        logs.push(getLogData(payment_order_id, 125, payment_order_data, { id: system_account_id, oem_id: 1 }, order_info))
        // await insertLog(trx, )
    }
    // console.log(insert_data);
    let data_id = (await trx(VIP_DATA).insert(insert_data))[0]
    logs.push(getLogData(data_id, 122, insert_data, { id: system_account_id, oem_id: 1 }))
    await insertLog(trx, logs)
    //拿到订单信息后，可以执行权益增加操作
    return data_id
}
async function refundEquity(data = {}, userInfo = {}, trx = knex) {
    let { account_id, payment_order_id } = data
    let vip_data = (await trx(VIP_DATA).select('id').where({ status: 1, payment_order_id }))[0]
    if (!vip_data) {
        console.log('该订单已对用户回收权益，无需再次回收！', payment_order_id);
        return
    }
    await trx(VIP_DATA).update({ status: 2 }).where({ payment_order_id })
    //在处理退款时，需要更新会员日期
    let order_info = (await trx.select('card.video_equity_type', 'odr.account_id', 'card.tool_equity_type',
        'odr.id', 'odr.vip_card_id', 'card.type as vip_card_type', 'odr.pay_time', 'card.day')
        .select(selectName('odr', 'account_id', ACTINFO_TABLE, 'vip_expire_time', 'vip_expire_time', 'account_id'))
        .select(selectName('odr', 'account_id', ACTINFO_TABLE, 'vip_status', 'vip_status', 'account_id'))
        .from(`${PAYMENT_ORDERS} as odr`)
        .leftJoin(`${VIP_CARD} as card`, 'odr.vip_card_id', 'card.id')
        .where('odr.id', payment_order_id))[0]
    if (!order_info) {
        console.log('该订单核验不存在，扣减订单！', payment_order_id);
        return
    }
    let logs = []
    let { vip_expire_time, vip_status } = order_info
    if (order_info?.vip_card_type == 1) { //当购买的类型为小果繁星会员，判断之前是否购买过会员，且购买时间
        await removeVipLelveCache(order_info.account_id) //权益变更，更新会员缓存
        // 会员权益扣减
        let SQL = `UPDATE ${ACTINFO_TABLE} SET vip_expire_time = DATE_SUB(vip_expire_time, INTERVAL ${order_info.day} DAY),
         vip_status = IF(DATE_SUB(vip_expire_time, INTERVAL ${order_info.day} DAY) > NOW(), 2, 3) WHERE account_id = ${order_info.account_id}`
        await trx.raw(SQL)

        let actinf_new_data = (await trx(ACTINFO_TABLE).select('vip_expire_time', 'vip_status').where('account_id', order_info.account_id))[0]

        logs.push(getLogData(order_info.account_id, 127, actinf_new_data, { id: system_account_id, oem_id: 1 }, { vip_expire_time, vip_status }))

        let after_vip_datas = await trx(VIP_DATA).select('id', 'start_time', 'expire_time')
            .where('id', '>', vip_data.id)
            .where({ vip_card_type: 1, status: 1, account_id: order_info.account_id })

        SQL = `UPDATE ${VIP_DATA} SET start_time = DATE_SUB(start_time, INTERVAL ${order_info.day} DAY), expire_time = DATE_SUB(expire_time, INTERVAL ${order_info.day} DAY)
        WHERE id > ${vip_data.id} AND vip_card_type = 1 AND account_id = ${order_info.account_id}  AND status = 1 AND id IN (${after_vip_datas.map(i => i.id).join(',')})`

        // console.log(SQL);
        if (after_vip_datas?.length) {
            await trx.raw(SQL)
            let after_vip_new_datas = await trx(VIP_DATA).select('id', 'start_time', 'expire_time').whereIn('id', after_vip_datas.map(i => i.id))
            after_vip_datas.forEach(i => {
                logs.push(getLogData(i.id, 127, after_vip_new_datas.find(n => n.id == i.id), { id: system_account_id, oem_id: 1 }, i))
            })
        }
        //  trx(ACTINFO_TABLE).update(knex.raw())
    }
    logs.push(getLogData(payment_order_id, 123, { status: 2 }, { id: system_account_id, oem_id: 1 }))
    await insertLog(trx, logs)
    return
}
// knexTransaction(async trx => {
//     await refundEquity({ account_id: 10010108, payment_order_id: 44 }, trx)

//     // addEquity({ account_id: 10010108, payment_order_id: 35 })
//     // diffEquity({ diff_type: 'recept_video', times: 300 }, { id: 10010108, oem_id: 1 })
// })
//消耗用户权益
async function diffEquity(data = {}, userInfo = {}, trx = knex) {
    let { id: account_id } = userInfo || {}
    let { diff_type, times } = data
    if (!account_id || !times) return Promise.reject('参数异常！')
    let vip_card_types = []
    switch (diff_type) {
        case 'recept_video':
            vip_card_types = [1]
            break;
        case 'use_tool':
            vip_card_types = [2]
            break;
        default:
            return Promise.reject('错误的权益类型！')
    }
    // let payment_order_ids = null
    let old_info = (await trx(VIP_DATA).select('*').where({ status: 1, account_id })
        .whereIn('vip_card_type', vip_card_types)
        .where('expire_time', '>=', moment().format("YYYY-MM-DD HH:mm:ss"))
        .where(builder => {
            if (diff_type == 'recept_video') builder.where('start_time', '<=', moment().format("YYYY-MM-DD HH:mm:ss"))
        })
        .limit(1)
    )[0]
    // console.log(old_info);
    if (!old_info || !old_info?.limit_num || old_info.limit_num - times < 0) {
        return Promise.reject('权益不足或已用尽！')
    }
    if (old_info?.tool_equity_type) old_info.tool_equity_type = JSON.parse(old_info.tool_equity_type)
    let { id } = old_info

    let SQL = `UPDATE ${VIP_DATA} SET status = IF((limit_num - ${times}) <= 0, 3, status), limit_num = limit_num - ${times} WHERE id = ${id}`
    await trx.raw(SQL)

    await insertLog(trx, getLogData(id, 124, {
        limit_num: old_info.limit_num - times,
        status: (old_info.limit_num - times) <= 0 ? 3 : old_info.status
    }, userInfo, old_info))
    return { vip_data_id: id, day_num: old_info.day_num, tool_equity_type: old_info.tool_equity_type }
}
async function queryEquity(data = {}, userInfo = {}, trx = knex) {
    let { id: account_id } = userInfo || {}
    let { diff_type } = data
    let vip_card_types = []
    switch (diff_type) {
        case 'recept_video':
        case 'intelligent_creation':
            vip_card_types = [1]
            break;
        case 'use_tool':
            vip_card_types = [2]
            break;
        default:
            return Promise.reject('错误的权益类型！')
    }
    let old_info = null
    if (diff_type == 'use_tool') {
        old_info = (await trx(VIP_DATA).sum('limit_num as limit_num')
            .sum('total_num as total_num')
            .where({ status: 1, account_id })
            .whereIn('vip_card_type', vip_card_types)
            .where('expire_time', '>=', moment().format("YYYY-MM-DD HH:mm:ss"))
            .limit(1)
        )[0]

    } else {
        old_info = (await trx(VIP_DATA).select('*')
            .where({ status: 1, account_id })
            .whereIn('vip_card_type', vip_card_types)
            .where('expire_time', '>=', moment().format("YYYY-MM-DD HH:mm:ss"))
            .where('start_time', '<=', moment().format("YYYY-MM-DD HH:mm:ss"))
            .limit(1)
        )[0]
    }

    // console.log(old_info);
    if (!old_info || !old_info?.limit_num) {
        return { limit_num: 0, vip_data_id: null, day_num: 0, total_num: 0 }
    }
    if (old_info?.tool_equity_type) old_info.tool_equity_type = JSON.parse(old_info.tool_equity_type)
    // limit_num 视频领取剩余次数
    // day_num  视频领取每天可领取的量
    // tool_equity_type 工具使用权益
    // {"link_text": true, "video_text": true, "word_check": true, "mixed_shear": 5, "remove_watermark": false}
    let { limit_num, id: vip_data_id, day_num, tool_equity_type, total_num } = old_info
    return { limit_num, vip_data_id, day_num, tool_equity_type, total_num }
}
module.exports = {
    queryEquity,
    operateEquity
}