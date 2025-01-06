const moment = require("moment");
const knex = require("../../../../db/knexManager").knexProxy;
const {
    APPLET_TASK_INFO,
    AMOUNT_PROMOTION,
    PROMOTION_DATA,
    PROMOTION_SETTLE,
    IMPORT_LOG_TABLE,
    APPLET_PLAN_DATA,
    APPLET_PLAN,
    ADVERTISER_TABLE
} = require("../../../../config/setting");
const { knexTransaction, sleep, selectName, factoryAppListResponse, checkSildeCode, getDaysBetweenDate } = require("../../../../utils/tools");
const { checkKeys, isEmpty, isArrayHas } = require("../../../../utils/check_type");
const { app_image_resize } = require("../../../../config/index")
const { sqlPagination, sqlCount, getTableSite } = require("../../../../utils/sqlHelper");
const { getPlatformMapper, getAdvertiserMapper } = require("../../../../utils/apiMapper");
const { getLogData, insertLog } = require("../../../public/operationLog");
const { formatUserInfo } = require("../../../public/bank");
const lodash = require('lodash');
const { get_now_date } = require("../../../manage/finance/publishRebate/compound/utils");
const { WITHDRAW_TYPE_MAPPER, getContentMapper } = require('../../../../utils/mapper')
const { CancelStatus, SettleStatus } = require("../../../manage/finance/appletSettlement/enum");
const { handler: settleHander } = require("../../../manage/finance/settlement/importLog")
const { RK_APPLET_PLAN_ESTIMATE_DATA, RK_APPLET_PLAN_ESTIMATE_DATA_2023 } = require("../../../../config/redis_key")
const { getCustomCache, setCustomCache } = require("../../../../db/redis")

async function planIncome(query, userInfo) {
    let { start_date, end_date, platform_id, mount_type, advertiser_type, income_type, page, pagesize } = query;
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    let response = {
        code: 0,
        data: {
            total_data: {
                task_num: 0,
                douyin_income: 0,
                income: 0,
                ad_income: 0,
                platform_income: 0
            },
            list: [],
            page,
            pagesize,
            site: 0
        },
    }
    let { total_data, list, site } = await plan_Income(page, pagesize, query, userInfo)
    response.data.total_data.task_num = total_data.task_num || 0;
    response.data.total_data.douyin_income = total_data.douyin_income || 0;
    response.data.total_data.income = total_data.income || 0;
    response.data.total_data.ad_income = total_data.ad_income || 0;
    response.data.total_data.platform_income = lodash.add(total_data.income, total_data.ad_income); // 平台总收益 = 补贴收益 + 广告收益
    response.data.list = list;
    if (!list.length || list.length < pagesize) site = null;
    response.data.site = site;
    return response
}

async function plan_Income(page, pagesize, query, userInfo) {
    let total_data = {}, today_data = {}, list = [];
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    if (page == 1) {
        site = await getTableSite(PROMOTION_DATA, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100')
    let total_sql = knex(`${PROMOTION_DATA} as data`)
        .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id')
        .select(knex.raw(`SUM(data.talent_profit_1d) as douyin_income`))  // 抖音分佣
        .countDistinct('data.content_relation_id as task_num') // 任务总数
        // .select(knex.raw(`ROUND(SUM(data.talent_profit_1d / data.blogger_payment_allocate_ratio*settle.recharge_ratio)) as income`)) // 补贴收益
        .sum('settle.total_blogger_recharge_amount as income')// 补贴收益
        .sum('settle.total_blogger_ad_amount as ad_income') // 广告收益

    handler.search_filter_2023(query, total_sql, userInfo);
    total_data = (await total_sql)[0] || {};

    let sql = knex(`${PROMOTION_DATA} as data`)
        .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id')
        .select(knex.raw(`SUM(data.talent_profit_1d) as douyin_income`))  // 抖音分佣
        .select('data.advertiser_type', 'data.task_id', 'data.content_id', 'settle.recharge_ratio') // 平台补贴
        // .select(knex.raw(`ROUND(SUM(data.talent_profit_1d / data.blogger_payment_allocate_ratio*settle.recharge_ratio)) as income`)) // 补贴收益
        .select(selectName('data', 'task_id', APPLET_TASK_INFO, 'task_name', 'task_name'))
        .groupBy('data.advertiser_type', 'data.task_id', 'data.content_id', 'settle.recharge_ratio')
        .sum('settle.total_blogger_ad_amount as ad_income') // 广告收益
        .sum('settle.total_blogger_recharge_amount as income')// 补贴收益
        .where((builder) => {
            if (site && page > 1) {
                builder.where("data.id", "<", site);
            }
        });

    handler.search_filter_2023(query, sql, userInfo);
    list = await sqlPagination(sql, { page, pagesize });
    let advertiserMapper = await getAdvertiserMapper(userInfo);
    let contentIds = list.map(item => item.content_id);
    let contentMapper = await getContentMapper(contentIds);
    list.forEach(item => {
        item.advertiser_icon = advertiserMapper[item.advertiser_type]?.icon || '';
        item.advertiser_type = advertiserMapper[item.advertiser_type]?.name || '';
        // item.drama_name = contentMapper[item.content_id]?.book_name || '';
        item.drama_cover_url = contentMapper[item.content_id]?.cover_url || '';
    })
    return { total_data, list, site }
}

async function planIncomeDetails(query, userInfo) {
    let { page, pagesize, task_id } = query;
    if (!task_id) return Promise.reject('请传入任务id');
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    // if (!start_date || !end_date) return Promise.reject('请传入查询时间');
    let { list, site } = await planDetails(page, pagesize, query, userInfo);
    return {
        code: 0,
        data: {
            page,
            pagesize,
            site,
            list,
            formula: '(抖音分佣/抖音分成比例) *平台补贴比例'
        }
    }

}

async function planDetails(page, pagesize, query, userInfo) {
    let { site } = query;
    if (page == 1) {
        site = await getTableSite(PROMOTION_DATA, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100');
    let sql = knex(`${PROMOTION_DATA} as data`)
        .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id')
        .select('data.talent_profit_1d as douyin_income', 'settle.recharge_ratio', 'data.date', 'data.id', 'data.blogger_payment_allocate_ratio')
        // .select(knex.raw(`ROUND((data.talent_profit_1d / data.blogger_payment_allocate_ratio)*(settle.recharge_ratio)) as income`)) // 补贴收益
        .select('settle.total_blogger_recharge_amount as income') // 补贴收益
        .select('settle.total_blogger_ad_amount as ad_income') // 广告收益
        .where((builder) => {
            if (site && page > 1) {
                builder.where("data.id", "<", site);
            }
        });

    handler.search_filter_2023(query, sql, userInfo);
    let list = await sqlPagination(sql, { page, pagesize });
    if (!list.length || list.length < pagesize) site = null;
    list.forEach(item => {
        item.platform_income = lodash.add(item.ad_income, item.income)
    })
    return { list, site }
}

const handler = {
    search_filter_2023(query, sql, userInfo) {
        let { start_date, end_date, advertiser_type, income_type, task_id, business_type } = query;
        if (income_type) income_type = Number(income_type);
        if (advertiser_type) {
            sql.where('data.advertiser_type', advertiser_type)
        }

        if ([4, 5].includes(income_type)) {
            sql.leftJoin(`${AMOUNT_PROMOTION} as p`, 'p.order_relation_id', 'data.id');
            if (income_type == 4) { // 已提现
                sql.where('p.amount_balance', 0)
            }
            if (income_type == 5) { // 可提现
                sql.where('p.amount_balance', '>', 0)
            }
        }

        if (start_date && end_date) {
            sql.whereIn('data.date', getDaysBetweenDate(start_date, end_date));
        }

        if (task_id) {
            sql.where('data.task_id', task_id)
        }

        if (business_type) {
            sql.where('data.business_type', business_type)
        }

        sql.where({
            'data.account_id': userInfo.id,
            'settle.verify_status': 3,
            'data_type': 2,
            'data.version': 1
        })
    },

    search_filter(query, sql, userInfo) {
        let { start_date, end_date, advertiser_type, income_type, task_id, business_type, type, video_id } = query;
        if (advertiser_type) {
            sql.where('data.advertiser_type', advertiser_type)
        }

        if (income_type == 1) { // 已结算
            sql.where('settle.verify_status', 3)
        }
        if (income_type == 2) { // 预估收益
            sql.whereNot('settle.verify_status', 3)
        }


        if (start_date && end_date) {
            sql.whereIn('data.date', getDaysBetweenDate(start_date, end_date));
        }

        if (task_id) {
            sql.where('data.task_id', task_id)
        }

        if (business_type) {
            sql.where('data.business_type', business_type)
        }

        if (type) {
            if (type == 'daily') {
                let date = moment().subtract(1, 'day').format('YYYY-MM-DD');
                sql.whereNot('settle.verify_status', 3).andWhere('data.date', date);
            } else if (type == 'summary') {
                sql.where('settle.verify_status', 3)
            }
        }

        if (video_id) {
            sql.where('plan_data.video_id', video_id)
        }

        sql.where({
            'data.account_id': userInfo.id,
            // 'data.account_id': 10014794,
            'data.data_type': 2,
            'data.version': 2,
            'data.status': 1,
            'data.import_status': 1
        })
    }
}

// 首页汇总-2024
async function planIncomeTotal(query, userInfo) {
    if (!query.type) return Promise.reject("请传入汇总类型！")
    // 日览表示未结算的，总览表示已结算的，列表全都展示（待结算和已结算都展示）
    let date = moment().subtract(3, 'day').format('YYYY-MM-DD')
    let response = {
        code: 0,
        data: {
            total_data: {
                cps_estimate: 0,  // cps_预估
                cps_estimate_subsidy: 0, // cps_预估补贴
                cpm_estimate: 0,   // cpm_收益
                recharge_amount: 0, // 充值金额
                refund_amount: 0  // 退款金额
            },
            last_year_income: false,
            date: moment(date).format('MM月DD日') + '数据',
            update_time: moment().format('MM月DD日') + ' 08:00更新数据'
        },
    }
    let total_data = {}
    if (query.type == 'daily') {
        total_data = await dailyPlanIncomeTotal(query, userInfo, date)
    } else {
        let total_sql = knex(`${PROMOTION_DATA} as data`)
            .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id')
            .leftJoin(`${APPLET_PLAN_DATA} as plan_data`, 'plan_data.id', 'data.applet_plan_data_id')
            .sum('data.estimate_cps_amount as cps_estimate') // cps预估（收益）
            .sum('settle.total_blogger_recharge_amount as cps_estimate_subsidy')// cps预估补贴
            .sum('settle.total_blogger_ad_amount as cpm_estimate') // cpm_收益
            .sum('plan_data.billing_gmv_1d as recharge_amount') // 充值金额
            .sum('plan_data.billing_refund_gmv_1d as refund_amount') // 退款金额

        handler.search_filter(query, total_sql, userInfo);
        total_data = (await total_sql)[0] || {};
    }
    response.data.total_data.cps_estimate = total_data.cps_estimate || 0;
    response.data.total_data.cps_estimate_subsidy = total_data.cps_estimate_subsidy || 0;
    response.data.total_data.cpm_estimate = total_data.cpm_estimate || 0;
    response.data.total_data.recharge_amount = total_data.recharge_amount || 0;
    response.data.total_data.refund_amount = total_data.refund_amount || 0;


    const cache_key_2023 = `${RK_APPLET_PLAN_ESTIMATE_DATA_2023}:${userInfo.id}`
    let cache_data_2023 = await getCustomCache(cache_key_2023);
    if (cache_data_2023) {
        response.data.last_year_income = cache_data_2023;
    } else {
        let data = await knex(`${PROMOTION_DATA} as data`)
            .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id').select('settle.id').where({
                'data.account_id': userInfo.id,
                'settle.verify_status': 3,
                'data_type': 2,
                'data.version': 1,
                'data.status': 1
            }).limit(1);
        if (data.length) {
            response.data.last_year_income = true;
            await setCustomCache(true, cache_key_2023, 3600 * 24 * 3)
        } else {
            await setCustomCache(false, cache_key_2023, 3600 * 24 * 3)
        }
    }


    return response
}

async function dailyPlanIncomeTotal(query, userInfo, date) {
    let total_data = {
        cps_estimate: 0,  // cps_预估
        cps_estimate_subsidy: 0, // cps_预估补贴
        cpm_estimate: 0,   // cpm_收益
        recharge_amount: 0, // 充值金额
        refund_amount: 0  // 退款金额
    }
    const { id: account_id, channel_id } = userInfo
    const cache_key = `${RK_APPLET_PLAN_ESTIMATE_DATA}:${date}:${account_id}`
    let cache_data = await getCustomCache(cache_key)
    if (cache_data) return cache_data
    // 首先获取达人的绑定关系
    let bind_douyin_ids = (await knex(APPLET_PLAN).select('douyin_id').where({ status: 1, bind_status: 1, account_id })).map(i => i.douyin_id)
    if (!bind_douyin_ids?.length) return total_data

    let advertiser_ids = (await knex(ADVERTISER_TABLE).select('id').where(builder => {
        if (query.advertiser_type) builder.where('id', query.advertiser_type)
        if (query.business_type) builder.where('business_type', query.business_type)
    })).map(i => i.id)
    if (!advertiser_ids?.length) return total_data
    let total_datas = await knex(`${APPLET_PLAN_DATA} as plan_data`)
        .select(knex.raw(`(plan_data.billing_gmv_1d - plan_data.billing_refund_gmv_1d) * blogger_payment_allocate_ratio/10000 as cps_estimate`))
        .select(knex.raw(`ad_share_cost_1d * 0.4 as cpm_estimate`))
        .select('plan_data.billing_gmv_1d as recharge_amount', 'advertiser_type', 'blogger_payment_allocate_ratio') // 充值金额
        .select('plan_data.billing_refund_gmv_1d as refund_amount') // 退款金额
        .whereRaw('(plan_data.billing_gmv_1d - plan_data.billing_refund_gmv_1d) > 0')
        .whereIn('plan_data.douyin_id', bind_douyin_ids)
        .whereIn('plan_data.advertiser_type', advertiser_ids)
        .where('plan_data.date', date)
    for (let index = 0; index < total_datas.length; index++) {
        const item = total_datas[index];
        let policyData = await settleHander.policyCommon({
            advertiser_type: item.advertiser_type, date,
            data_type: 2, promotion_type: 4, channel_id
        });
        await settleHander.voluationCommon(item, policyData)
        let cps_estimate_ratio = ((Number(item.recharge_ratio) || 0) - item.blogger_payment_allocate_ratio) < 0 ? 0 : ((Number(item.recharge_ratio) || 0) - item.blogger_payment_allocate_ratio)
        item.cps_estimate_subsidy = Math.round((cps_estimate_ratio * (item.recharge_amount - item.refund_amount) / 10000) || 0)
        item.cpm_estimate = Math.round((Number(item.ad_ratio) || 0) / 10000 * (item.cpm_estimate || 0))
        // console.log(item);
        // console.log(date, policyData);
        total_data.cps_estimate += Math.round(item.cps_estimate || 0);
        total_data.cps_estimate_subsidy += item.cps_estimate_subsidy || 0;
        total_data.cpm_estimate += item.cpm_estimate || 0;
        total_data.recharge_amount += item.recharge_amount || 0;
        total_data.refund_amount += item.refund_amount || 0;

    }
    await setCustomCache(total_data, cache_key, 3600)
    return total_data
}
// 首页列表
async function planIncomeList(query, userInfo) {
    let { page, pagesize } = query;
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    let response = {
        code: 0,
        data: {
            list: [],
            page,
            pagesize,
            site: 0
        },
    }
    let list = [];
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    if (page == 1) {
        site = await getTableSite(PROMOTION_DATA, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100')
    let sql = knex(`${PROMOTION_DATA} as data`)
        .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id')
        .leftJoin(`${APPLET_PLAN_DATA} as plan_data`, 'plan_data.id', 'data.applet_plan_data_id')
        .select('data.advertiser_type', 'data.task_id', 'data.content_id')
        .select(selectName('data', 'task_id', APPLET_TASK_INFO, 'task_name', 'task_name'))
        .groupBy('data.advertiser_type', 'data.task_id', 'data.content_id')
        .countDistinct('plan_data.video_id as video_num')
        .sum('data.estimate_cps_amount as cps_estimate') // cps预估（收益）
        .sum('settle.total_blogger_recharge_amount as cps_estimate_subsidy')// cps预估补贴
        .sum('settle.total_blogger_ad_amount as cpm_estimate') // cpm_收益
        .sum('plan_data.billing_gmv_1d as recharge_amount') // 充值金额
        .sum('plan_data.billing_refund_gmv_1d as refund_amount') // 退款金额
        .where((builder) => {
            if (site && page > 1) {
                builder.where("data.id", "<", site);
            }
        });
    handler.search_filter(query, sql, userInfo);
    list = await sqlPagination(sql, { page, pagesize });
    let advertiserMapper = await getAdvertiserMapper(userInfo);
    let contentIds = list.map(item => item.content_id);
    let contentMapper = await getContentMapper(contentIds);
    list.forEach(item => {
        item.advertiser_icon = advertiserMapper[item.advertiser_type]?.icon || '';
        item.advertiser_type = advertiserMapper[item.advertiser_type]?.name || '';
        // item.drama_name = contentMapper[item.content_id]?.book_name || '';
        item.drama_cover_url = contentMapper[item.content_id]?.cover_url || '';
    })
    response.data.list = list;
    if (!list.length || list.length < pagesize) site = null;
    response.data.site = site;
    return response
}

// 详情
async function planIncomeDetailsNew(query, userInfo) {
    let { page, pagesize,video_id } = query;
    // if (!video_id) return Promise.reject('请传入视频id');
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    // if (!start_date || !end_date) return Promise.reject('请传入查询时间');
    let { site } = query;
    if (page == 1) {
        site = await getTableSite(PROMOTION_DATA, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100');
    let sql = knex(`${PROMOTION_DATA} as data`)
        .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id')
        .leftJoin(`${APPLET_PLAN_DATA} as plan_data`, 'plan_data.id', 'data.applet_plan_data_id')
        .select('data.date', 'data.id', 'settle.verify_status', 'plan_data.video_id', 'plan_data.douyin_id', 'plan_data.video_title', 'plan_data.publish_time')
        .select('plan_data.billing_gmv_1d as recharge_amount') // 充值金额
        .select('plan_data.billing_refund_gmv_1d as refund_amount') // 退款金额

        .select('data.blogger_payment_allocate_ratio as cps_estimate_ratio') // cps预估（收益）
        .select('data.estimate_cps_amount as cps_estimate') // cps预估（收益）比例

        .select('settle.total_blogger_recharge_amount as cps_estimate_subsidy')// cps预估补贴
        .select('settle.recharge_ratio as cps_estimate_subsidy_ratio')// cps预估补贴比例

        .select('settle.edit_ad as cpm_amount') // 广告金额
        .select('settle.total_blogger_ad_amount as cpm_estimate') // cpm_收益
        .select('settle.ad_ratio as cpm_estimate_ratio') // cpm_收益比例
        .where((builder) => {
            if (site && page > 1) {
                builder.where("data.id", "<", site);
            }
        })
        .orderBy('data.date', 'desc');

    handler.search_filter(query, sql, userInfo);
    let list = await sqlPagination(sql, { page, pagesize });
    if (!list.length || list.length < pagesize) site = null;
    return {
        code: 0,
        data: {
            page,
            pagesize,
            site,
            list,
        }
    }
}

// 视频详情
async function planVideo(query, userInfo) {
    let { page, pagesize } = query;
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    let response = {
        code: 0,
        data: {
            list: [],
            page,
            pagesize,
            site: 0
        },
    }
    let list = [];
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    if (page == 1) {
        site = await getTableSite(PROMOTION_DATA, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100')
    let sql = knex(`${PROMOTION_DATA} as data`)
        .leftJoin(`${PROMOTION_SETTLE} as settle`, 'settle.data_id', 'data.id')
        .leftJoin(`${APPLET_PLAN_DATA} as plan_data`, 'plan_data.id', 'data.applet_plan_data_id')
        .select('data.advertiser_type', 'data.task_id', 'data.content_id', 'plan_data.video_id', 'plan_data.douyin_id', 'plan_data.video_title', 'plan_data.publish_time')
        .select(selectName('data', 'task_id', APPLET_TASK_INFO, 'task_name', 'task_name'))
        .groupBy('data.advertiser_type', 'data.task_id', 'data.content_id', 'plan_data.video_id', 'plan_data.douyin_id', 'plan_data.video_title', 'plan_data.publish_time')
        .sum('data.estimate_cps_amount as cps_estimate') // cps预估（收益）
        .sum('settle.total_blogger_recharge_amount as cps_estimate_subsidy')// cps预估补贴
        .sum('settle.total_blogger_ad_amount as cpm_estimate') // cpm_收益
        .sum('plan_data.billing_gmv_1d as recharge_amount') // 充值金额
        .sum('plan_data.billing_refund_gmv_1d as refund_amount') // 退款金额
        .where((builder) => {
            if (site && page > 1) {
                builder.where("data.id", "<", site);
            }
        });
    handler.search_filter(query, sql, userInfo);
    list = await sqlPagination(sql, { page, pagesize });
    let advertiserMapper = await getAdvertiserMapper(userInfo);
    let contentIds = list.map(item => item.content_id);
    let contentMapper = await getContentMapper(contentIds);
    list.forEach(item => {
        item.advertiser_icon = advertiserMapper[item.advertiser_type]?.icon || '';
        item.advertiser_type = advertiserMapper[item.advertiser_type]?.name || '';
        // item.drama_name = contentMapper[item.content_id]?.book_name || '';
        item.drama_cover_url = contentMapper[item.content_id]?.cover_url || '';
    })
    response.data.list = list;
    if (!list.length || list.length < pagesize) site = null;
    response.data.site = site;
    return response
}


module.exports = {
    planIncomeDetails,
    planIncome,

    planIncomeTotal,
    planIncomeList,
    planIncomeDetailsNew,
    planVideo
}
