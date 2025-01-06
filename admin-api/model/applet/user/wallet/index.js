const moment = require("moment");
const knex = require("../../../../db/knexManager").knexProxy;
const {
    INVITE_DATA, APPLET_DATA, AMOUNT_PROMOTION, AMOUNT_REBATE, VIP_REBATE, PAYMENT_ORDERS, AMOUNT_VIP_REBATE,
    BUSINESS_TYPE_TABLE, BANK_TABLE, WITHDRAW_DETAILS, WIDTHDRAW_SETTLE_RELATION, WITHDRAW_SERVICE_ORDER, PROMOTION_DATA, PROMOTION_SETTLE, WITHDRAW_CHANGE_LOG
} = require("../../../../config/setting");
const { knexTransaction, sleep, selectName, factoryAppListResponse, checkSildeCode } = require("../../../../utils/tools");
const { checkKeys, isEmpty, isArrayHas } = require("../../../../utils/check_type");
const { app_image_resize } = require("../../../../config/index")
const { sqlPagination, sqlCount } = require("../../../../utils/sqlHelper");
const { getPlatformMapper, getAdvertiserMapper } = require("../../../../utils/apiMapper");
const { getLogData, insertLog } = require("../../../public/operationLog");
const { formatUserInfo } = require("../../../public/bank");
const lodash = require('lodash');
// const { get_now_date } = require("../../../manage/finance/publishRebate/compound/utils");
const { WITHDRAW_TYPE_MAPPER } = require('../../../../utils/mapper')
const { list: publishRebate } = require("../publishRebate");
const { list: vipRebate } = require("../vipRebate");
const { queryChannelAuth } = require('../../../public/permission');
const { getAccountRecord } = require("../../../../utils/apiMapper");
const { userMakeSign } = require("../../../../utils/payment/aicaipay/api")

const {
    RK_CASHOUT_LOCK,
    RK_RESUBMIT_LOCK,
    RK_WITHDRAW_TASK_LOCK
} = require("../../../../config/redis_key");
const { getLock, getCustomCache } = require("../../../../db/redis");

function fillZero(obj = {}) {
    let keys = ['being_amount', 'total_amount', 'limit_amount']
    keys.forEach(key => {
        if (Object.hasOwnProperty.call(obj, key)) obj[key] = obj[key] || 0
    });
    return obj
}
//发布推广的数据 app端是将小程序推广计划的收益排除，单独查询，H5端直接以业务分类聚合
async function publish_income(account_id = '', business_types = [], business_type = null, count_plan = false) {
    let be_income_sql = knex(`${APPLET_DATA} as apd`)
        .select('business_type')
        .sum('cps_amount as being_amount') //博主自己待入账的发布收益
        // .sum('rebate_amount as rebate_amount')
        .select(knex.raw(`2 as no_income`))
        .whereIn('cancel_status', [1])
        .whereIn('settle_status', [1, 2])
        .where({ status: 1, account_id })
        .groupBy('business_type')

    let income_sql = knex(`${AMOUNT_PROMOTION} as amp`)
        .select(knex.raw(`2 as no_income`))
        .select('business_type')
        .sum('amount as total_amount') //总收益
        .sum('amount_balance as limit_amount') //可提现金额
        .where({ status: 1, account_id })
        .whereNot('type', 5)
        .groupBy('business_type')

    if (!count_plan) income_sql.whereNot('type', 3)

    if (business_type) {
        be_income_sql.where({ business_type })
        income_sql.where({ business_type })
    }
    // console.log(be_income_sql.toString(), income_sql.toString())
    let [be_income, income] = await Promise.all([be_income_sql, income_sql])
    // console.log(be_income, income);
    if (business_type) {
        let item = { being_amount: 0, total_amount: 0, limit_amount: 0, no_income: 1 }
        item = fillZero({ ...item, ...(be_income[0] || {}), ...(income[0] || {}) })
        item.total_amount += item.being_amount
        return item
    }
    return business_types.map(({ label, id, icon }) => {
        let item = { label, business_type: id, being_amount: 0, total_amount: 0, limit_amount: 0, no_income: 1, icon }
        let be_income_item = be_income.find(i => i.business_type == id)
        let income_item = income.find(i => i.business_type == id)
        item = fillZero({ ...item, ...(be_income_item || {}), ...(income_item || {}) })
        item.total_amount += item.being_amount
        return item
    })
}
async function getIncomeByBusType(params = {}, userInfo = {}) {
    let { business_type } = checkKeys(params, ["business_type"])
    let { id: account_id } = userInfo
    let data = await publish_income(account_id, [], business_type)
    return { code: 0, data }
}

// 小程序推广计划收益
async function getPlanIncome(params = {}, userInfo = {}) {
    let { id: account_id } = userInfo
    let data = await plan_income(account_id)
    return { code: 0, data }
}

//发布佣金
async function publish_rebate(userInfo = {}) {
    let total = await publishRebate({}, userInfo, true)
    let result = {
        being_amount: total.un_amount,
        limit_amount: total.withdrawal_amount,
        total_amount: total.amount,
        no_income: total.amount ? 2 : 1,
        label: '发布佣金',
        icon: 'https://koc-img.domain.cn/xgfx-h5/wallet/realization.png'
    };
    return result
    // let be_income_sql = knex(`${APPLET_DATA} as apd`)
    //     // .select('business_type')
    //     .sum('rebate_amount as being_amount') //博主自己待入账的发布收益
    //     // .sum('rebate_amount as rebate_amount')
    //     .select(knex.raw(`2 as no_income`))
    //     .whereIn('cancel_status', [1])
    //     .whereIn('settle_status', [1, 2])
    //     .where({ status: 1, account_id })
    // // .groupBy('business_type')

    // let income_sql = knex(`${AMOUNT_REBATE} as amp`)
    //     .select(knex.raw(`2 as no_income`))
    //     // .select('business_type')
    //     .sum('amount as total_amount') //总收益
    //     .sum('amount_balance as limit_amount') //可提现金额
    //     .where({ status: 1, account_id })
    // // .groupBy('business_type')
    // let [be_income, income] = await Promise.all([be_income_sql, income_sql])
    // // console.log(be_income, income);
    // let item = { being_amount: 0, total_amount: 0, limit_amount: 0, no_income: 1 }
    // item = fillZero({ ...item, ...(be_income[0] || {}), ...(income[0] || {}) })
    // item.total_amount += item.being_amount
    // return item

}

async function plan_income(account_id) {
    let be_income_sql = knex(`${PROMOTION_DATA} as data`)
        .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id')
        // .sum('settle.total_blogger_amount as being_amount') //博主自己待入账的发布收益
        .select(knex.raw(`2 as no_income`))
        .where({ 'data.data_type': 2, 'settle.verify_status': 3 })
        // .whereIn('settle_status', [1, 2])
        .where({ status: 1, account_id })

    let income_sql = knex(`${AMOUNT_PROMOTION} as amp`)
        .select(knex.raw(`2 as no_income`))
        .sum('amount as total_amount') //总收益
        .sum('amount_balance as limit_amount') //可提现金额
        .where({ status: 1, account_id })
        .where('type', 3)
    let [be_income, income] = await Promise.all([be_income_sql, income_sql])
    // console.log(be_income, income);
    let item = { label: '推广计划', being_amount: 0, total_amount: 0, limit_amount: 0, no_income: 1, icon: 'https://koc-img.domain.cn/xgfx-h5/wallet/plan.png' }
    item = fillZero({ ...item, ...(be_income[0] || {}), ...(income[0] || {}) })
    // item.total_amount += item.being_amount
    if (item.being_amount == 0 && item.limit_amount == 0 && item.total_amount == 0) item.no_income = 1;
    return item
}

async function reward_income(account_id) {
    let income_sql = knex(`${AMOUNT_PROMOTION} as amp`)
        .select(knex.raw(`2 as no_income`))
        .sum('amount as total_amount') //总收益
        .sum('amount_balance as limit_amount') //可提现金额
        .where({ status: 1, account_id })
        .where('type', 5)
    let [income] = await Promise.all([income_sql])
    // console.log(be_income, income);
    let item = { label: '活动奖励', total_amount: 0, limit_amount: 0, no_income: 1, icon: 'https://koc-img.domain.cn/xgfx-h5/wallet/reward.png' }
    item = fillZero({ ...item, ...(income[0] || {}) })
    if (item.limit_amount == 0 && item.total_amount == 0) item.no_income = 1;
    return item
}
//查询会员返利
async function vip_rebate(userInfo = {}) {
    let total = await vipRebate({}, userInfo, true)
    let result = {
        being_amount: total.un_amount,
        limit_amount: total.withdrawal_amount,
        total_amount: total.amount,
        no_income: total.amount ? 2 : 1,
        label: '会员佣金',
        icon: 'https://koc-img.domain.cn/xgfx-h5/wallet/commission.png'
    };
    return result
    // let be_income_sql = knex(`${VIP_REBATE} as vpd`)
    //     .leftJoin(`${PAYMENT_ORDERS} as pay`, 'pay.id', 'vpd.payment_order_id')
    //     // .select('business_type')
    //     .sum('vpd.amount as being_amount') //博主自己待入账的发布收益
    //     // .sum('rebate_amount as rebate_amount')
    //     .select(knex.raw(`2 as no_income`))
    //     // .whereIn('cancel_status', [1])
    //     .whereIn('vpd.rebate_date', [1, 2])
    //     .where({ 'vpd.status': 1, 'vpd.account_id': account_id, 'pay.pay_status': 2 })
    // // .groupBy('business_type')

    // let income_sql = knex(`${AMOUNT_VIP_REBATE} as amp`)
    //     .select(knex.raw(`2 as no_income`))
    //     // .select('business_type')
    //     .sum('amount as total_amount') //总收益
    //     .sum('amount_balance as limit_amount') //可提现金额
    //     .where({ status: 1, account_id })
    // // .groupBy('business_type')
    // let [be_income, income] = await Promise.all([be_income_sql, income_sql])
    // // console.log(be_income, income);
    // let item = { being_amount: 0, total_amount: 0, limit_amount: 0, no_income: 1 }
    // item = fillZero({ ...item, ...(be_income[0] || {}), ...(income[0] || {}) })
    // item.total_amount += item.being_amount
    // return item
}
//关键词推广的数据 关键词没有待入账数据，汇总数据已在小程序数据里计算，该函数废弃

// 提现数据
async function getWithdrawData(account_id = '', type = '', pay_status = '') {
    if (type) type = Number(type);
    if (!account_id) return Promise.reject('请传入用户id');
    let data = (await knex(WITHDRAW_DETAILS)
        .sum('ask_for_amount as withdraw_amt')
        .where({ create_user_id: account_id })
        .where(builder => {
            if (type && [1, 2, 3, 4].includes(type)) {
                builder.where('type', type)
            }
            if (pay_status && pay_status == 6) {
                builder.where('pay_status', pay_status)
            }
        }))[0];
    return data?.withdraw_amt || 0;
}
async function getOtherInfo(account_id = '') {
    let has_invite = 1 //是否邀请过好友 1 未邀请过 2 已邀请过
    let has_bank = 1 //是否绑定提现方式 1 未绑定 2 已绑定
    let invite_data = knex(INVITE_DATA).select('id').where({ inviter_id: account_id }).limit(1)
    let bank_data = knex(BANK_TABLE).select('id').where({ account_id }).limit(1)
    let [ivt, bank] = await Promise.all([invite_data, bank_data])
    if (ivt[0]) has_invite = 2
    if (bank[0]) has_bank = 2
    return { has_invite, has_bank }
}
async function total(req, userInfo = {}) {
    let { $version: version, $platform: platform } = req;
    let vtag = (platform == 'ios' && version > 83) || (platform == 'android' && version > 629);
    let rtag = (platform == 'ios' && version > 122) || (platform == 'android' && version > 721);
    let vip_vtag = (platform == 'ios' && version <= 153) || (platform == 'android' && version <= 729); // 此版本号以下，或者有会员购买记录的，才显示会员佣金
    // let vtag = false;
    let { id: account_id } = userInfo
    if (!account_id) return Promise.reject('参数异常！')
    let business_types = await knex(BUSINESS_TYPE_TABLE).select('id', 'name as label', 'icon')
        .whereIn('id', [1, 2, 3])
        .where({ status: 1 }).orderBy('id', 'desc')
    let [publish_amt, publish_rebate_amt, vip_rebate_amt, plan_amt, reward_amt] = await Promise.all([
        publish_income(account_id, business_types),
        publish_rebate(userInfo),
        vip_rebate(userInfo),
        plan_income(account_id),
        reward_income(account_id)
    ])
    let { has_bank, has_invite } = await getOtherInfo(account_id)
    let total = { limit_amount: 0, being_amount: 0, total_amount: 0 }
    // publish_rebate_amt.label = '发布佣金'
    // vip_rebate_amt.label = '会员佣金'
    let datas = [...publish_amt, publish_rebate_amt];
    if (vtag) {
        datas.push(plan_amt)
    }
    if (rtag) {
        datas.push(reward_amt)
    }

    let pay_record = await getAccountRecord(account_id);
    if (vip_vtag || pay_record?.has_vip_record) { // 此版本号以下，或者有会员购买记录的，才显示会员佣金
        datas.push(vip_rebate_amt)
    }
    datas.forEach(item => {
        total.being_amount += item.being_amount || 0
        total.total_amount += item.total_amount || 0
        total.limit_amount += item.limit_amount || 0
    })
    let back = {
        has_bank, has_invite,
        total,
        task_realization: [...publish_amt],
        invite_realization: [publish_rebate_amt],
        reward_realization: [reward_amt]
    }

    if (vtag) {
        back.task_realization.push(plan_amt)
    }

    if (vip_vtag || pay_record?.has_vip_record) {
        back.invite_realization.push(vip_rebate_amt) // 此版本号以下，或者有会员购买记录的，才显示会员佣金
    }
    return { code: 0, data: back }
}
// 提现
async function withDraw(req, body, userInfo) {
    let lockKey = await getCustomCache(RK_WITHDRAW_TASK_LOCK);
    if (lockKey) return Promise.reject('系统维护中，请20分钟后重试');
    let { ask_for_amount, bank_info_id, code, type } = body;
    let withdraw_id = null, account_id = userInfo.id;
    ask_for_amount = Number(ask_for_amount)
    if (!ask_for_amount) return Promise.reject('提现金额必填');
    if (ask_for_amount == 'NaN') return Promise.reject('请填写正确的金额！');
    if (ask_for_amount < 1000) return Promise.reject('提现金额不能少于10元');
    if (!bank_info_id) return Promise.reject('支付账号id必填');
    if (!code) return Promise.reject('请填写图形验证码');
    if (!type) return Promise.reject('请传入提现类型');
    if (!await checkSildeCode(req, code)) return Promise.reject('验证码错误或不存在！');
    // let bankInfo = {};
    // 爱才重新签约
    if (body.need_sign && body.need_sign === true) {
        await handler.resign(bank_info_id, account_id);
    }

    let bankInfo = (await knex(BANK_TABLE).select('id', 'id_card', 'pay_account', 'pay_platform', 'people_name', 'mobile', 'uid').where({ id: bank_info_id, status: 1, account_id }))[0];
    if (!bankInfo) return Promise.reject('该支付方式不可用或不存在，请检查');
    if (!bankInfo.uid) return Promise.reject('您的签约已失效，请更新至最新版本进行重新签约！');

    let data = await knex.select("*").from(WITHDRAW_DETAILS).where({ create_user_id: account_id, status: 1})
        .whereRaw(`DATE_FORMAT(ask_for_amount_date, '%Y-%m-%d') = '${moment().format("YYYY-MM-DD")}'`)
        .whereNot("id_card_number", bankInfo.id_card).whereNotIn("pay_status", [7, 8])
    if(data.length) return Promise.reject('当日提现不支持更换持卡人，如需更换持卡人，请改日进行提现申请！');

    const lock_key = `${RK_CASHOUT_LOCK}:${account_id}`;

    // 查询可提现余额
    let table = null;
    if (type == 1 || type == 4) {
        table = AMOUNT_PROMOTION;
    } else if (type == 2) {
        table = AMOUNT_REBATE;
    } else if (type == 3) {
        table = AMOUNT_VIP_REBATE
    } else {
        return Promise.reject('提现类型错误，请检查')
    }
    let remain_amount = (await knex(table).sum('amount_balance as amount_balance').where('account_id', userInfo.id))[0];
    if (remain_amount?.amount_balance) {
        if (remain_amount.amount_balance < ask_for_amount) return Promise.reject("余额不足，请检查！")
        else remain_amount = remain_amount.amount_balance;
    } else {
        return Promise.reject("余额不足，请检查！")
    }

    return await getLock(lock_key, async () => {
        await knexTransaction(async trx => {
            // 更新结算表
            let settleData = await trx(table).select('amount_balance', 'id', 'amount', 'cashing_out').where('amount_balance', '>', 0).where('account_id', userInfo.id).where(builder => {
                if (type == 1) {
                    builder.whereIn('type', [1, 2, 3, 4])
                } else if (type == 4) {
                    builder.where('type', 5)
                }
            });
            let today = moment().format('YYYY-MM-DD HH:mm:ss');
            let successItem = [], total = 0, last_item = null;
            for (let i = 0; i < settleData.length; i++) {
                let item = settleData[i];
                total += item.amount_balance;
                if (total >= ask_for_amount) {
                    last_item = item;
                    break;
                } else {
                    successItem.push(item);
                }
            }
            if (total == ask_for_amount) {
                successItem.push(last_item)
            } else {
                let cost = lodash.subtract(total, ask_for_amount);
                let remain = lodash.subtract(last_item.amount_balance, cost);
                let current_cashing_out = lodash.add(remain, last_item.cashing_out);
                await trx(table).update({ cashing_out: current_cashing_out, amount_balance: cost }).where('id', last_item.id);
                last_item = { id: last_item.id, amount_balance: remain };
            }
            let successIds = successItem.map(item => item.id);
            await trx(table).update({ cashing_out: trx.raw("amount - amount_cash_out"), amount_balance: 0 }).whereIn('id', successIds);

            if (total != ask_for_amount) successItem.push(last_item);
            // 提现表插入一条提现记录
            let insertData = {
                ask_for_amount,
                bank_info_id,
                create_user_id: userInfo.id,
                remain_amount,
                bank_info: JSON.stringify(bankInfo),
                id_card_number: bankInfo.id_card,
                ask_for_amount_date: today,
                pay_platform: bankInfo.pay_platform,
                oem_id: userInfo.oem_id,
                create_time: today,
                type,
                pay_process_info: JSON.stringify([{ label: '提现申请', create_time: today, pay_status: 1, message: '' }])
            }
            withdraw_id = (await trx(WITHDRAW_DETAILS).insert(insertData))[0];
            await insertLog(trx, getLogData(withdraw_id, 5105, insertData, userInfo, {}));

            // relation 表写入更新日志
            let relation_insert = []
            successItem.forEach(item => {
                relation_insert.push({
                    type,
                    amount_relation_id: item.id,
                    withdraw_relation_id: withdraw_id,
                    account_id: userInfo.id,
                    amount: item.amount_balance,
                    create_date: moment().format('YYYY-MM-DD'),
                    create_user_id: userInfo.id,
                    update_user_id: userInfo.id
                })
            })
            await trx(WIDTHDRAW_SETTLE_RELATION).insert(relation_insert);

            // 日志记录
            // let changedIds = successItem.map(item => item.id);
            // let changedData = await trx(table).select('cashing_out', 'amount_balance').whereIn('id', changedIds);
            // for (let i = 0; i < changedData.length; i++) {
            //     let item = changedData[i];
            //     let target = settleData.find(ele => ele.id == item.id);
            //     if (target) {
            //         await trx(WITHDRAW_CHANGE_LOG).insert({
            //             relation_id: item.id,
            //             type,
            //             cashing_out_before: target.cashing_out,
            //             balance_before: target.amount_balance,
            //             cashing_out_after: item.cashing_out,
            //             balance_after: item.amount_balance,
            //             create_user_id: userInfo.id,
            //             create_time: moment().format('YYYY-MM-DD HH:mm:ss')
            //         })
            //     }
            // }
        })
        return {
            code: 0,
            data: {
                date: '预计到账时间：发起提现后7个工作日内可到账',
                id: withdraw_id
            },
            message: '操作成功'
        }

    })

}

async function totalIncome(req, userInfo) {
    let { $version: version, $platform: platform } = req;
    let rtag = (platform == 'ios' && version > 122) || (platform == 'android' && version > 721);
    let { id: account_id } = userInfo
    if (!account_id) return Promise.reject('参数异常！')
    let business_types = await knex(BUSINESS_TYPE_TABLE).select('id', 'name as label').where({ status: 1 }).whereIn('id', [1, 2, 3])
    let [publish_amt, publish_rebate_amt, vip_rebate_amt, withdraw1, withdraw2, withdraw3, reward_amt, withdraw4] = await Promise.all([
        publish_income(account_id, business_types, null, true),
        publish_rebate(userInfo),
        vip_rebate(userInfo),
        getWithdrawData(account_id, 1),
        getWithdrawData(account_id, 2),
        getWithdrawData(account_id, 3),
        reward_income(account_id),
        getWithdrawData(account_id, 4),
        // plan_income(account_id)
    ])
    let total = { limit_amount: 0, being_amount: 0, total_amount: 0 }
    publish_rebate_amt.type = 2;
    publish_rebate_amt.label = WITHDRAW_TYPE_MAPPER[publish_rebate_amt.type];
    publish_rebate_amt.withdrawed_amount = withdraw2;
    vip_rebate_amt.type = 3;
    vip_rebate_amt.label = WITHDRAW_TYPE_MAPPER[vip_rebate_amt.type];
    vip_rebate_amt.withdrawed_amount = withdraw3;
    let datas = [...publish_amt, publish_rebate_amt, vip_rebate_amt]
    if (rtag) {
        reward_amt.type = 4;
        reward_amt.label = WITHDRAW_TYPE_MAPPER[reward_amt.type];
        reward_amt.withdrawed_amount = withdraw4;
        datas.push(reward_amt)
    }
    datas.forEach(item => {
        total.being_amount += item.being_amount || 0  // 待入账
        total.total_amount += item.total_amount || 0  // 总收益
        total.limit_amount += item.limit_amount || 0  // 可提现
    })
    let promotion_amt = { limit_amount: 0, being_amount: 0, total_amount: 0, type: 1, withdrawed_amount: withdraw1 };
    promotion_amt.label = WITHDRAW_TYPE_MAPPER[promotion_amt.type];
    // publish_amt.push(plan_amt);
    publish_amt.forEach(item => {
        promotion_amt.being_amount += item.being_amount || 0  // 待入账
        promotion_amt.total_amount += item.total_amount || 0  // 总收益
        promotion_amt.limit_amount += item.limit_amount || 0  // 可提现
    })
    let withdrawed_amount = await getWithdrawData(userInfo.id);
    total.withdrawed_amount = withdrawed_amount;
    let details = [promotion_amt, publish_rebate_amt, vip_rebate_amt]
    if (rtag) {
        details.push(reward_amt)
    }
    let back = {
        total,
        details
    }
    return { code: 0, data: back }
}
async function withdrawLog(query, userInfo) {
    let response = {
        code: 0,
        data: {
            paid_amount: 0,
            withdraw_data: 0,
            list: []
        },
    }
    let { page, pagesize, site, tab_type } = query
    if (!tab_type) return Promise.reject('请传入页面类型');
    tab_type = Number(tab_type);
    if (![1, 2, 3, 4].includes(tab_type)) return Promise.reject('页面类型错误，请检查！');
    page = Number(page) || 1, pagesize = Number(pagesize) || 20, site = Number(site) || 0;
    let paidData = await getWithdrawData(userInfo.id, '', 6);
    let withdrawData = await getWithdrawData(userInfo.id);
    let data = await knex(WITHDRAW_DETAILS)
        .select('id', 'type', 'ask_for_amount', 'pay_status', 'verify_suggest', 'remark', 'create_time')
        .where({ create_user_id: userInfo.id })
        .where(builder => {
            if (query.tab_type == 2) {
                builder.whereIn('pay_status', [1, 2, 3, 4, 5])
            } else if (query.tab_type == 3) {
                builder.where('pay_status', 6)
            } else if (query.tab_type == 4) {
                builder.whereIn('pay_status', [7, 8])
            }
            if (site) {
                builder.where('id', '<', site);
            }
        })
        .orderBy('id', 'desc')
        .limit(pagesize);

    data.forEach(item => {
        if (item.pay_status < 6) {
            item.tab_type = 2
        } else if (item.pay_status == 6) {
            item.tab_type = 3
        } else {
            item.tab_type = 4
        }
    })
    response.data = {
        paid_amount: paidData,
        withdraw_data: withdrawData,
        list: data,
        page,
        pagesize,
        site: 0
    }
    if (data.length) {
        response.data.site = data[data.length - 1].id;
    } else {
        response.data.site = null;
    }

    return response;
}

async function withDrawDetails(query, userInfo) {
    let { id } = query;
    if (!id) return Promise.reject('请传入提现id');
    let data = await knex(WITHDRAW_DETAILS)
        .select('id', 'type', 'ask_for_amount', 'pay_status', 'pay_platform', 'bank_info', 'pay_process_info')
        .where({ create_user_id: userInfo.id, id }).limit(1);

    data = data[0];
    if (!data) return Promise.reject('未查询到该数据！')
    data.bank_info = JSON.parse(data.bank_info);
    let { people_name, id_card, pay_account, mobile } = formatUserInfo(data.bank_info);
    data.people_name = people_name;
    data.pay_account = pay_account;
    delete data.bank_info;
    data.process = JSON.parse(data.pay_process_info)
    delete data.pay_process_info;
    return {
        code: 0,
        data
    }
}

async function withdrawLogDetails(query, userInfo) {
    let { id, type } = query, data = [];
    if (!id) return Promise.reject("请传入id！");
    if (!type) return Promise.reject("请传入提现类型！");
    let table = null;

    if (type == 1 || type == 4) {
        table = AMOUNT_PROMOTION;
        data = await knex(`${WIDTHDRAW_SETTLE_RELATION} as main`)
            .leftJoin(`${table} as t`, 'main.amount_relation_id', 't.id')
            .select('t.advertiser_type')
            .select(knex.raw(`SUM(main.amount) as amount`))
            .where({ 'main.withdraw_relation_id': id, 'main.type': type })
            .groupBy('t.advertiser_type')

        const advertiserMapper = await getAdvertiserMapper(userInfo);
        data.forEach(item => {
            item.label = advertiserMapper[item.advertiser_type]?.name;
            delete item.advertiser_type
        })
    } else if (type == 2) {
        table = AMOUNT_REBATE;
        // let quarter = get_now_date('QUARTER'), month = get_now_date(), year = get_now_date("YEAR");
        let result = (await knex(`${WIDTHDRAW_SETTLE_RELATION} as main`)
            .leftJoin(`${table} as t`, 'main.amount_relation_id', 't.id')
            .select(knex.raw(`SUM(IF(t.type in (1, 2), main.amount, 0)) as base_amount`))
            .select(knex.raw(`SUM(IF(t.type = 3, main.amount, 0)) as month_amount`))
            .select(knex.raw(`SUM(IF(t.type = 4, main.amount, 0)) as quarter_amount`))
            .select(knex.raw(`SUM(IF(t.type = 5, main.amount, 0)) as year_amount`))
            .where({ 'main.withdraw_relation_id': id, 'main.type': type }))[0];
        if (result) {
            if (result.base_amount) {
                data.push({
                    label: `基础发布佣金`,
                    amount: result.base_amount
                })
            }
            if (result.month_amount) {
                data.push({
                    label: `月返发布佣金`,
                    amount: result.month_amount
                })
            }
            if (result.quarter_amount) {
                data.push({
                    label: `季返发布佣金`,
                    amount: result.quarter_amount
                })
            }
            if (result.year_amount) {
                data.push({
                    label: `年返发布佣金`,
                    amount: result.year_amount
                })
            }
        }
    } else if (type == 3) {
        table = AMOUNT_VIP_REBATE;
        let result = (await knex(`${WIDTHDRAW_SETTLE_RELATION} as main`)
            .leftJoin(`${table} as t`, 'main.amount_relation_id', 't.id')
            .select(knex.raw(`SUM(IF(t.settle_type = 'date', main.amount, 0)) as base_amount`))
            .select(knex.raw(`SUM(IF(t.settle_type = 'month', main.amount, 0)) as month_amount`))
            .select(knex.raw(`SUM(IF(t.settle_type = 'quarter', main.amount, 0)) as quarter_amount`))
            .select(knex.raw(`SUM(IF(t.settle_type = 'year', main.amount, 0)) as year_amount`))
            .where({ 'main.withdraw_relation_id': id, 'main.type': type }))[0];
        if (result) {
            if (result.base_amount) {
                data.push({
                    label: `基础会员佣金`,
                    amount: result.base_amount
                })
            }
            if (result.month_amount) {
                data.push({
                    label: `月返会员佣金`,
                    amount: result.month_amount
                })
            }
            if (result.quarter_amount) {
                data.push({
                    label: `季返会员佣金`,
                    amount: result.quarter_amount
                })
            }
            if (result.year_amount) {
                data.push({
                    label: `年返会员佣金`,
                    amount: result.year_amount
                })
            }
        }
    }
    else {
        return Promise.reject('提现类型错误，请检查')
    }
    return {
        code: 0,
        data: {
            list: data
        }
    }
}

async function withdrawTypeCount(query, userInfo) {
    let data = await knex
        .select(knex.raw(`(select count(id) from ${WITHDRAW_DETAILS} as main where main.create_user_id = ${userInfo.id}) as total_num`))
        .select(knex.raw(`(select count(id) from ${WITHDRAW_DETAILS} as main where main.create_user_id = ${userInfo.id} and main.pay_status < 6) as review_num`))
        .select(knex.raw(`(select count(id) from ${WITHDRAW_DETAILS} as main where main.create_user_id = ${userInfo.id} and main.pay_status = 6) as paid_num`))
        .select(knex.raw(`(select count(id) from ${WITHDRAW_DETAILS} as main where main.create_user_id = ${userInfo.id} and main.pay_status > 6) as failed_num`))
    return {
        code: 0,
        data: data[0]
    }
}

// 重新提交提现申请
async function rewithdraw(body, userInfo, req) {
    let lockKey = await getCustomCache(RK_WITHDRAW_TASK_LOCK);
    if (lockKey) return Promise.reject('系统维护中，请20分钟后重试');
    let { id, bank_info_id, code } = checkKeys(body, [{ key: "id", required: true, type: Number, }, "bank_info_id", "code",]);
    if (!(await checkSildeCode(req, code))) return Promise.reject("验证码错误或不存在！");
    let { id: account_id } = userInfo;
    const lock_key = `${RK_RESUBMIT_LOCK}:${account_id}`;

    if (body.need_sign && body.need_sign === true) {
        await handler.resign(bank_info_id, account_id);
    }

    return await getLock(lock_key, async () => {
        let oldValue = (
            await knex(WITHDRAW_DETAILS).select("id", "pay_status", "verify_status", "ask_for_times", "pay_process_info", "service_order_num")
                .where({ id, create_user_id: account_id, status: 1 })
                .whereIn("pay_status", [7, 8])
                .limit(1)
        )[0];
        let bankInfo = (
            await knex(BANK_TABLE).select("id", "pay_platform", "pay_account", "id_card", "mobile", "people_name", 'uid')
                .where({ id: bank_info_id, account_id, status: 1 })
                .limit(1)
        )[0];
        if (!oldValue || !bankInfo)
            return Promise.reject("该记录无法重新提交，请检查状态是否正确！");

        if (!bankInfo.uid) return Promise.reject('未查询到爱才uid，请检查！')

        let result = await knex.select("*").from(WITHDRAW_DETAILS).where({ create_user_id: account_id, status: 1})
            .whereRaw(`DATE_FORMAT(ask_for_amount_date, '%Y-%m-%d') = '${moment().format("YYYY-MM-DD")}'`)
            .whereNot("id_card_number", bankInfo.id_card).whereNotIn("pay_status", [7, 8])
        if(result.length) return Promise.reject('当日提现不支持更换持卡人，如需更换持卡人，请改日进行提现申请！');

        let pay_process_info = JSON.parse(oldValue.pay_process_info) || [],
            today = moment().format("YYYY-MM-DD HH:mm:ss");
        pay_process_info.push({
            label: "提现申请",
            create_time: today,
            pay_status: 1,
            message: "",
        });
        await knexTransaction(async (trx) => {
            // 付款失败 不需要走审批流
            let updateData = {
                pay_status: 1,
                update_user_id: account_id,
                ask_for_amount_date: today,
                ask_for_times: oldValue.ask_for_times + 1,
                pay_process_info: JSON.stringify(pay_process_info),
                bank_info_id,
                bank_info: JSON.stringify(bankInfo),
                id_card_number: bankInfo.id_card,
                pay_platform: bankInfo.pay_platform,
            };
            // 审核拒绝
            if (oldValue.pay_status == 8) {
                updateData.verify_status = 1;
                updateData.ask_for_payment_id = null;
            }

            let data = await trx(WITHDRAW_DETAILS).update(updateData).where("id", id);
            if (data)
                await insertLog(trx, getLogData(id, 5108, updateData, userInfo, oldValue));

            let serviceData = (await trx(WITHDRAW_SERVICE_ORDER).select("id", "blogger_pay_status", "subimit_times").where("service_order_num", oldValue.service_order_num).limit(1))[0];
            if (serviceData) {
                let updateData = {
                    // subimit_times: serviceData.subimit_times + 1,
                    blogger_pay_status: 1,
                    update_user_id: account_id,
                };
                await trx(WITHDRAW_SERVICE_ORDER).update(updateData).where("service_order_num", oldValue.service_order_num);
                await insertLog(trx, getLogData(serviceData.id, 5108, updateData, userInfo, serviceData));
            }
        });
        return {
            code: 0,
            data: { id, date: "预计到账时间：发起提现后7个工作日内可到账" },
            message: "提交成功！",
        };
    });
}
// h5主页，显示我的收益
async function h5Total(req, userInfo = {}) {
    let { business_type } = req.query
    let { id: account_id } = userInfo
    if (!account_id) return Promise.reject('参数异常！')
    let business_types = await knex(BUSINESS_TYPE_TABLE).select('id', 'name as label', 'icon').where({ status: 1 })
        .whereIn('id', [1, 2, 3])
        .orderBy('id', 'desc')
    let [publish_amt] = await Promise.all([publish_income(account_id, business_types, business_type, true)])
    // console.log(publish_amt);
    // let total = { limit_amount: 0, being_amount: 0, total_amount: 0 }
    // // publish_rebate_amt.label = '发布佣金'
    // // vip_rebate_amt.label = '会员佣金'
    // let datas = [publish_amt]
    // datas.forEach(item => {
    //     total.being_amount += item.being_amount || 0
    //     total.total_amount += item.total_amount || 0
    //     total.limit_amount += item.limit_amount || 0
    // })
    // let back = {
    //     total,
    // }
    return { code: 0, data: publish_amt }
}

// 收益汇总
async function h5TotalIncome(req, userInfo = {}) {
    let { id: account_id } = userInfo
    if (!account_id) return Promise.reject('参数异常！');
    const { applet_router } = await queryChannelAuth(userInfo, 'applet');
    let business_types = await knex(BUSINESS_TYPE_TABLE).select('id', 'name as label', 'icon').where({ status: 1 })
        .whereIn('id', [1, 2, 3])
        .orderBy('id', 'desc')
    let publish_amt = await publish_income(account_id, business_types, null, true);
    let total = { limit_amount: 0, being_amount: 0, total_amount: 0 }
    publish_amt.forEach(item => {
        total.being_amount += item.being_amount || 0
        total.total_amount += item.total_amount || 0
        total.limit_amount += item.limit_amount || 0
    })
    let { has_bank, has_invite } = await getOtherInfo(account_id);
    let interface_mapper = {
        2751: '影视短剧',
        2752: '小说推文',
        2753: '漫画动漫'
    }
    let task_realization = [];
    for (let i in interface_mapper) {
        if (applet_router.includes(+i)) {
            let target = publish_amt.find(item => item.label == interface_mapper[i]);
            task_realization.push(target)
        }
    }
    let back = {
        total,
        task_realization,
        has_bank,
        has_invite
    }
    return { code: 0, data: back }
}

async function withDrawNew(req, body, userInfo) {
    let { ask_for_amount, bank_info_id, code, type } = body;
    let withdraw_id = body.withdraw_id,
        account_id = userInfo.id;
    ask_for_amount = Number(ask_for_amount)
    if (!ask_for_amount) return Promise.reject('提现金额必填');
    if (ask_for_amount == 'NaN') return Promise.reject('请填写正确的金额！');
    if (ask_for_amount < 1000) return Promise.reject('提现金额不能少于10元');
    if (!bank_info_id) return Promise.reject('支付账号id必填');
    // if (!code) return Promise.reject('请填写图形验证码');
    if (!type) return Promise.reject('请传入提现类型');
    let bankInfo = (await knex(BANK_TABLE).select('id', 'id_card', 'pay_account', 'pay_platform', 'people_name', 'mobile').where({ id: bank_info_id, account_id }))[0];
    if (!bankInfo) return Promise.reject('该支付方式不可用或不存在，请检查');
    // if (!await checkSildeCode(req, code)) return Promise.reject('验证码错误或不存在！')

    const lock_key = `${RK_CASHOUT_LOCK}:${account_id}`;

    // 查询可提现余额
    let table = null;
    if (type == 1 || type == 4) {
        table = AMOUNT_PROMOTION;
    } else if (type == 2) {
        table = AMOUNT_REBATE;
    } else if (type == 3) {
        table = AMOUNT_VIP_REBATE
    } else {
        return Promise.reject('提现类型错误，请检查')
    }
    let remain_amount = (await knex(table).sum('amount_balance as amount_balance').where('account_id', userInfo.id))[0];
    if (remain_amount?.amount_balance) {
        if (remain_amount.amount_balance < ask_for_amount) return Promise.reject("余额不足，请检查！")
        else remain_amount = remain_amount.amount_balance;
    } else {
        return Promise.reject("余额不足，请检查！")
    }

    return await getLock(lock_key, async () => {
        await knexTransaction(async trx => {
            // 更新结算表
            let settleData = await trx(table).select('amount_balance', 'id', 'amount', 'cashing_out').where('amount_balance', '>', 0).where('account_id', userInfo.id).where(builder => {
                if (type == 1) {
                    builder.whereIn('type', [1, 2, 3, 4])
                } else if (type == 4) {
                    builder.where('type', 5)
                }
            });
            let today = moment().format('YYYY-MM-DD HH:mm:ss');
            let successItem = [], total = 0, last_item = null;
            for (let i = 0; i < settleData.length; i++) {
                let item = settleData[i];
                total += item.amount_balance;
                if (total >= ask_for_amount) {
                    last_item = item;
                    break;
                } else {
                    successItem.push(item);
                }
            }
            if (total == ask_for_amount) {
                successItem.push(last_item)
            } else {
                let cost = lodash.subtract(total, ask_for_amount);
                let remain = lodash.subtract(last_item.amount_balance, cost);
                let current_cashing_out = lodash.add(remain, last_item.cashing_out);
                await trx(table).update({ cashing_out: current_cashing_out, amount_balance: cost }).where('id', last_item.id);
                last_item = { id: last_item.id, amount_balance: remain };
            }
            let successIds = successItem.map(item => item.id);
            await trx(table).update({ cashing_out: trx.raw("amount - amount_cash_out"), amount_balance: 0 }).whereIn('id', successIds);

            if (total != ask_for_amount) successItem.push(last_item);
            // 提现表插入一条提现记录
            let insertData = {
                ask_for_amount,
                bank_info_id,
                create_user_id: userInfo.id,
                remain_amount,
                bank_info: JSON.stringify(bankInfo),
                id_card_number: bankInfo.id_card,
                ask_for_amount_date: today,
                pay_platform: bankInfo.pay_platform,
                oem_id: userInfo.oem_id,
                create_time: today,
                type,
                pay_process_info: JSON.stringify([{ label: '提现申请', create_time: today, pay_status: 1, message: '' }])
            }
            // withdraw_id = (await trx(WITHDRAW_DETAILS).insert(insertData))[0];
            await insertLog(trx, getLogData(withdraw_id, 5105, insertData, userInfo, {}));

            // relation 表写入更新日志
            let relation_insert = []
            successItem.forEach(item => {
                relation_insert.push({
                    type,
                    amount_relation_id: item.id,
                    withdraw_relation_id: withdraw_id,
                    account_id: userInfo.id,
                    amount: item.amount_balance,
                    create_date: moment().format('YYYY-MM-DD'),
                    create_user_id: userInfo.id,
                    update_user_id: userInfo.id,
                    status: 1
                })
            })
            await trx(WIDTHDRAW_SETTLE_RELATION).insert(relation_insert).onConflict(["withdraw_relation_id", "amount_relation_id", "type"]).merge();

        })
        return {
            code: 0,
            data: {
                date: '预计到账时间：发起提现后7个工作日内可到账',
                id: withdraw_id
            },
            message: '操作成功'
        }

    })

}

const handler = {
    async resign(bank_info_id, account_id) {
        let bankInfo = (await knex(BANK_TABLE).select('id_card', 'pay_platform', 'people_name', 'mobile').where({ id: bank_info_id, status: 1, account_id }))[0];
        let signResult = await userMakeSign({
            idNumber: bankInfo.id_card,
            mobile: bankInfo.mobile,
            realName: bankInfo.people_name
        });
        if (signResult?.uid) {
            await knex(BANK_TABLE).update({ uid: signResult.uid }).where({ id_card: bankInfo.id_card, people_name: bankInfo.people_name });
        }
    }
}

module.exports = {
    total,
    getIncomeByBusType,
    withDraw,
    totalIncome,
    withdrawLog,
    withDrawDetails,
    withdrawLogDetails,
    withdrawTypeCount,
    rewithdraw,
    getPlanIncome,
    h5Total,
    h5TotalIncome,
    withDrawNew
}
// vip_rebate(10010108, [1, 2, 3]).then(res => {
//     console.log(res);
// })