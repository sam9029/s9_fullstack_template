const knex = require("../../../db/knexManager").knexProxy;
const multer = require('multer');
const uploadSingle = multer().single('file');
const crypto = require('crypto');
const { uploadFile } = require('../../public/upload')
const { selectName, knexTransaction } = require('../../../utils/tools')
const { ACCOUNT_TABLE, ACTINFO_TABLE, INVITE_DATA, VIP_DATA, PAYMENT_ORDERS } = require("../../../config/setting")
const { getAccountVipLelve } = require('../../../utils/apiMapper')
const { invite_images, h5_production_host } = require("../../../config/index")
async function info(query, userInfo) {
    const account_id = userInfo.id || null
    if (!account_id) return Promise.reject('未设置分享人ID！')
    let search = (await knex.select('acc.name as name', 'acc.uid as invite_code', 'info.avatar as avatar')
        // .select(knex.raw(`CONCAT_WS(' ',preg.name,reg.name) as region_name`))
        .from(`${ACCOUNT_TABLE} as acc`)
        .leftJoin(`${ACTINFO_TABLE} as info`, 'info.account_id', 'acc.id')
        // .leftJoin(`${KOC_REGION} as reg`, 'info.region', 'reg.code')
        // .leftJoin(`${KOC_REGION} as preg`, 'reg.pid', 'preg.code')
        .where({ 'acc.id': account_id }).limit(1))[0]
    if (!search) return Promise.reject('未查询到该用户信息！')
    search.qr_link = `${h5_production_host}/share_bind?share_code=${search.invite_code}`
    search.invite_images = invite_images || []
    return { code: 0, data: search }
}

async function total(query, userInfo = {}) {
    let { id: account_id } = userInfo
    let dataSql = (await knex(`${INVITE_DATA} as ivd`)
        .count('ivd.id as invite_total')
        .select(knex.raw(`COUNT(IF(acf.vip_status = 2, ivd.id, NULL)) as invite_vip_total`))
        .select(knex.raw(`COUNT(IF(ivd.create_date = CURDATE(), ivd.id, NULL)) as today_invite_total`))
        .select(knex.raw(`COUNT(IF(acf.vip_status = 2 AND ivd.create_date = CURDATE(), ivd.id, NULL)) as today_invite_vip`))
        .leftJoin(`${ACTINFO_TABLE} as acf`, 'acf.account_id', 'ivd.invite_account_id')
        .where({ 'ivd.inviter_id': account_id }))[0]
    let data = {
        invite_total: 0,
        invite_vip_total: 0,
        today_invite_total: 0,
        today_invite_vip: 0,
        ...(dataSql || {})
    }
    return { code: 0, data }

}
async function list(query, userInfo = {}) {
    const SORT_MAPPER = {
        asc: ">",
        desc: "<"
    }
    let { next_page_site, vip_status, time_sort = 'asc', page_size = 20, pagesize = 20 } = query
    let { id: account_id } = userInfo
    if (!SORT_MAPPER[time_sort]) return Promise.reject('参数异常，请检查参数！')
    let recordSql = knex(PAYMENT_ORDERS).select('id')
        .whereRaw(`inviter_id = ivd.inviter_id AND account_id = ivd.invite_account_id`)
        .limit(1)
        .toString()
    let dataSql = knex(`${INVITE_DATA} as ivd`)
        .select('ivd.id as invite_id')
        .select('acf.avatar', 'acf.account_id', 'ivd.create_time as invite_time', 'acf.vip_expire_time', 'acf.vip_join_time', 'acf.vip_status')
        .select(selectName('ivd', 'invite_account_id', ACCOUNT_TABLE, 'name', 'account_name'))
        .select(knex.raw(`(${recordSql}) as has_recharge_record`))
        // .select(selectName('ivd', 'inviter_id', PAYMENT_ORDERS, 'id', 'has_recharge_record', 'inviter_id'))
        .leftJoin(`${ACTINFO_TABLE} as acf`, 'acf.account_id', 'ivd.invite_account_id')
        .where({ 'ivd.inviter_id': account_id })
    if (vip_status) dataSql.where('acf.vip_status', vip_status)
    if (next_page_site) dataSql.where('ivd.id', SORT_MAPPER[time_sort], next_page_site)
    let list = await dataSql.orderBy('ivd.id', time_sort).limit(page_size || pagesize)
    next_page_site = null
    if (list.length) {
        let last = list[list.length - 1]
        next_page_site = last?.invite_id || null
    }
    if (list.length < (page_size || pagesize)) next_page_site = null
    list = list.map(async i => {
        let vip_info = await getAccountVipLelve(i.account_id)
        //1 没有充值记录 2、有充值记录
        i.has_recharge_record = i.has_recharge_record ? 2 : 1
        return { ...i, ...vip_info }
    })
    return { code: 0, data: { list: await Promise.all(list), next_page_site } }

}

async function activation_record(query, userInfo = {}) {
    let { account_id, page_size = 10, pagesize = 10, next_page_site = null } = query
    let { id: inviter_id } = userInfo
    if (!account_id) return Promise.reject('参数异常，请检查参数！')
    let clos = ['id', 'start_time', 'expire_time']
    let knexSql = knex.select(clos.map(i => 'vdt.' + i))
        .select(knex.raw(`IF(odr.pay_status = 3, 4, vdt.status) as status`))
        .select('odr.pay_time', 'odr.pay_status', 'odr.description', 'odr.amount')
        .from(`${VIP_DATA} as vdt`)
        .leftJoin(`${PAYMENT_ORDERS} as odr`, 'vdt.payment_order_id', 'odr.id')
        .where({ 'vdt.account_id': account_id, 'vdt.vip_card_type': 1, "odr.inviter_id": inviter_id })
    if (next_page_site) knexSql.where('vdt.id', '<', next_page_site)
    let list = await knexSql.limit(page_size || pagesize).orderBy('vdt.id', 'desc')
    next_page_site = null
    if (list.length) {
        let last = list[list.length - 1]
        next_page_site = last?.id || null
    }
    if (list.length < (page_size || pagesize)) next_page_site = null
    return { code: 0, data: { list, next_page_site } }

}
module.exports = {
    info,
    total,
    list,
    activation_record
}