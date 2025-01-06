const lodash = require("lodash");
const knex = require('../../../db/knexManager').knexProxy;
const { CONTENT_TABLE, DATA_TABLE, DATA_SETTLE_TABLE, DATA_SPLIT, WX_PUBLISH_URL, PLATFORM_ACCOUNT_TABLE, DRAMA_PLAN, AMOUNT_PROMOTION, APPLET_SETTLE, APPLET_EXTERNAL, APPLET_DATA } = require('../../../config/setting');
const { getUuid, knexTransaction, mergeParams, queryToJson } = require("../../../utils/tools");
const { insertLog, getLogData, getExpireDay } = require("../operationLog")
const moment = require("moment");
const { draftPublish } = require("../../wechat/officialAccount")
const { getCustomCache, setCustomCache } = require("../../../db/redis")
const { dispatch_advertiser_plan } = require("./create_plan");
// const { liveBroadcastAdd } = require("../../manage/kocManage/externalAccount")
const { RK_DRAMA_PLAN_INCOME } = require('../../../config/redis_key');
// const { SmtType } = require("../../manage/finance/appletSettlement/enum");
const { getAdvertierSettlements } = require("../../../utils/apiMapper");

async function getDramaPlanData(plan_ids = []) {
    const data = await knex(`${AMOUNT_PROMOTION} as prt`)
        .leftJoin(`${APPLET_SETTLE} as settle`, 'settle.id', "prt.order_relation_id")
        .select("prt.plan_id")
        .sum("prt.amount as charge_price")
        .sum("settle.account_valid_order_num as order_num")
        .sum("settle.account_valid_user_num as people_num")
        .sum("settle.account_valid_price as total_price")
        .whereIn("prt.plan_id", plan_ids)
        .andWhere("prt.type", 2)
        .groupBy("prt.plan_id");

    let mapper = {}
    data.forEach(v => {
        mapper[v.plan_id] = v;
    })
    return mapper
}
async function getDramaPlanCharge(plan_ids = []) {
    const mapper = {};
    // 查cache
    const cache_arr = await Promise.all(plan_ids.map(async v => {
        const key = `${RK_DRAMA_PLAN_INCOME}:${v}`;
        const cahce = await getCustomCache(key);
        if (cahce) {
            mapper[cahce.plan_id] = cahce;
            return null;
        }
        return v;
    }));
    const query_arr = cache_arr.filter(v => !!v);
    if (!query_arr.length) return mapper;

    // 查没有cache的
    const data = await knex(`${APPLET_DATA} as data`)
        .leftJoin(`${APPLET_EXTERNAL} as ext`, 'ext.id', "data.external_id")
        .count("ext.order_id as order_num")
        .countDistinct("ext.user_id as people_num")
        .sum("ext.pay_money as charge_price") // 总充值
        .select(knex.raw(`ROUND(SUM(data.amount * data.cps_ratio / 10000)) as smt_price`)) // 预计收入
        .select("data.drama_plan_id as plan_id", "ext.smt_id")
        .whereIn("data.drama_plan_id", query_arr)
        .whereIn("ext.pay_status", ["SUCCESS", "REFUND"])
        .whereNot("data.cancel_status", 4) // 系统核销
        .groupBy("data.drama_plan_id", "ext.smt_id");

    // 无收益时不能获取到对应项目
    const adver_raws = await knex(DRAMA_PLAN).select("id", "advertiser_type")
        .whereIn("id", query_arr);

    const plan_query_map = lodash.groupBy(data, 'plan_id');
    const plan_adver_map = lodash.keyBy(adver_raws, "id");
    const settle_map = await getAdvertierSettlements();
    await Promise.all(query_arr.map(async v => {
        const charge_data = {
            order_num: 0,
            people_num: 0,
            charge_price: 0,
            total_price: 0,
        };
        const cpm_data = {
            charge_price: 0,
            total_price: 0,
        }
        const arr = plan_query_map[v] || [];
        let advertiser_type = plan_adver_map[v]?.advertiser_type || 0;
        arr.forEach(v => {
            if (v.smt_id == SmtType.CPS) {
                charge_data.order_num += v.order_num;
                charge_data.people_num += v.people_num;
                charge_data.charge_price += v.charge_price;
                charge_data.total_price += v.smt_price;
            } else {
                cpm_data.charge_price += v.charge_price;
                cpm_data.total_price += v.smt_price;
            }
        })

        charge_data.total_price = Math.floor(charge_data.total_price || 0) //单位分，向下取整
        const new_cache = { plan_id: Number(v), charge_data, cpm_data }
        const adver_policys = settle_map[advertiser_type] || [];
        if (!adver_policys.some(a => a.id == SmtType.CPM)) {
            new_cache.cpm_data = null;
        }
        if (!adver_policys.some(a => a.id == SmtType.CPS)) {
            new_cache.charge_data = null;
        }
        if (new_cache.charge_data === null && new_cache.cpm_data === null) {
            new_cache.charge_data = charge_data;
        }
        mapper[v] = new_cache;
        const key = `${RK_DRAMA_PLAN_INCOME}:${v}`;
        await setCustomCache(new_cache, key, 600);
    }))

    return mapper
}

async function getDramaReferralId({ advertiser_type, drama_id, name, plan_type, payload }) {
    const drama_info = await check_plan_drama(drama_id);

    return dispatch_advertiser_plan({
        advertiser_type,
        drama_info,
        name,
        plan_type,
        custom_prefix: 'XGFX',
        payload,
        // custom_params
    })

}

async function check_plan_drama(drama_id) {
    const drama_info = (await knex(CONTENT_TABLE).select('book_id').where({ id: drama_id }))[0];
    if (!drama_info) return Promise.reject("无效的剧集ID！");
    return drama_info;
}

function getPublishInfo(item = {}) {
    let { app_id, platform_id, publish_url, book_name, referral_id, status, advertiser_type, account_id, extra_params } = item
    let micro_app_info = {};
    let schema_url = "";
    // console.log(item);
    if (status != 1) return { micro_app_info, schema_url }
    if (extra_params && typeof extra_params == 'string') extra_params = JSON.parse(extra_params)
    // 去除固定参数 转移至extra_params
    let path = mergeParams(publish_url, extra_params)
    // let path = `${publish_url}&custom_params=${referral_id}&referral_id=${referral_id}`

    switch (platform_id) {
        case 1: //抖音
            micro_app_info = { //可选，分享内容携带小程序1000001
                appId: app_id,
                appTitle: `《${book_name}》继续观看`,
                appUrl: path,
                description: `《${book_name}》继续观看`
            }
            schema_url = `snssdk1128://microapp?start_page=${encodeURIComponent(path)}&__ad_app_type__=2&version_type=current&app_id=${app_id}&scene=0&version=v2&bdpsum=79357e4`
            break;
        case 2: //快手
            schema_url = `kwai://miniapp?KSMP_source=011012&KSMP_internal_source=011012&kpn=KUAISHOU&appId=${app_id}&path=${encodeURIComponent(path)}`
            break;
        default:
            break;
    }
    return { micro_app_info, schema_url }
}
async function getOAPublishUrl(data = {}) { //获取公众号发布链接
    let { title, click_url, author = '小果繁星', button_text = '点击立即观看', applet_path, app_id, template } = data
    if (!title || !click_url) return Promise.reject('参数异常，请检查参数！')
    // let { url, media_id } = await batchUpload(cover_url)
    let publish_id = await draftPublish({ title, click_url, button_text, author, applet_path, app_id, template })
    let key = `xgsj:wx_share:${publish_id}`
    await setCustomCache(data, key, 60 * 60)
    return { publish_id, title, click_url, author, button_text, cover_url: 'https://koc-img.domain.cn/applet/wx_cover_url.png' }
}
async function getOAPublishStatus(body = {}) {
    let { xml } = body
    // console.log(xml) //;无效消息订
    if (!xml) return console.log('无效消息订阅');
    if (xml.event != 'PUBLISHJOBFINISH' || !xml.publisheventinfo) return console.log('无效消息订阅，可能为关注用户关注事件');
    let { publisheventinfo, tousername } = xml
    let { publish_id, publish_status, article_detail } = publisheventinfo || {}
    // console.log({ publish_id, publish_status, article_detail });
    let key = `xgsj:wx_share:${publish_id}_${tousername}`
    let data = await getCustomCache(key)
    if (!data) return console.log('无效的publish_id', JSON.stringify(xml));
    let update_data = { publish_status: publish_status == 0 ? 2 : 3 }
    if (article_detail && article_detail.item && article_detail.item.article_url) {
        update_data.article_url = article_detail.item.article_url.replace('http', 'https')
    }
    let sql = knex(WX_PUBLISH_URL).update(update_data).where({ publish_id: `${publish_id}_${tousername}` })
    return await sql
}
function getWXClickUrl(advertiser_type, publish_url, referral_id, extra_params) {
    if (extra_params && typeof extra_params == 'string') extra_params = JSON.parse(extra_params)
    let applet_path = mergeParams(publish_url, extra_params)
    switch (Number(advertiser_type)) {
        case 7:
            return `https://routine.wqxsw.com/flames/wechat/video/do?appId=wx756f36579bd00d83&channleId=14035&path=${encodeURIComponent(applet_path)}`
        case 21:
            return `https://xgsj.domain.cn/api/public/short_url/wechat?advertiser_type=${advertiser_type}&path=${encodeURIComponent(applet_path)}`
        case 38:
        case 43:
            return applet_path
        default:
            return applet_path
    }
}
//获取UID的推广数据
async function getAppletUidData(applet_register_ids = []) {
    let data = await knex.select('dat.applet_register_id')
        .sum('dst.edit_order_num as order_num')
        .sum('dst.edit_people_num as people_num')
        .select(knex.raw(`SUM(dsp.charge_price/100) as charge_price`))
        .select(knex.raw(`SUM(dsp.total_price/100) as total_price`))
        .from(`${DATA_SPLIT} as dsp`)
        .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dsp.data_id')
        .leftJoin(`${DATA_SETTLE_TABLE} as dst`, 'dst.id', 'dsp.data_settle_id')
        .where({ 'dat.status': 1, 'dsp.settle_type': 1 })
        .groupBy('dat.applet_register_id')
        .whereIn('dat.applet_register_id', applet_register_ids)
    let origin_data = {
        order_num: 0,
        people_num: 0,
        charge_price: 0,
        total_price: 0
    }
    let mapper = {}
    applet_register_ids.forEach(i => {
        let find_item = data.find(j => j.applet_register_id == i)
        mapper[i] = find_item || origin_data
    })
    return mapper
}

/**@deprecated */
async function addUidOfLiveBroadcast({ account_id, platform_account_primary_id, advertiser_type }, userInfo = {}, trx = knex) {
    let result = (await trx(PLATFORM_ACCOUNT_TABLE).select("platform_account_id", "status").where({
        blogger_id: account_id,
        id: platform_account_primary_id,
        status: 1,
    }).limit(1))[0];
    if (!result) return Promise.reject('平台账号不存在或已删除！')
    let applet_register_id = await liveBroadcastAdd({ account_id, platform_account_primary_id, advertiser_type, applet_uid: result.platform_account_id }, userInfo, trx)
    return applet_register_id
}
module.exports = {
    getDramaPlanData,
    getDramaPlanCharge,
    getDramaReferralId,
    getPublishInfo,
    getOAPublishUrl,
    getOAPublishStatus,
    getAppletUidData,
    addUidOfLiveBroadcast,
    getWXClickUrl
}