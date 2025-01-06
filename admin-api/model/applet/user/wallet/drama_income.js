const moment = require("moment");
const knex = require("../../../../db/knexManager").knexProxy;
const {
    APPLET_SETTLE,
    ADVERTISER_TABLE,
    DRAMA_PLAN,
    AMOUNT_PROMOTION,
    APPLET_DATA,
    DATA_SETTLE_TABLE,
    DATA_TABLE,
    KOC_KEYWORD,
    APPLET_EXTERNAL,
    AUTH_ACCOUNT,
    POLICY_SETTLEMENT_TABLE
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

async function dramaIncome(query, userInfo) {
    let { start_date, end_date, platform_id, mount_type, advertiser_type, income_type, page, pagesize } = query;
    query.business_type = 3;
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    let response = {
        code: 0,
        data: {
            total_data: {
                valid_amount: 0,
                order_num: 0,
                income: 0
            },
            today_data: {
                valid_amount: 0,
                order_num: 0,
                income: 0
            },
            list: [],
            page,
            pagesize,
            site: 0
        },
    }
    let { total_data, today_data, list, site } = await appletIncome(page, pagesize, query, userInfo)
    response.data.total_data.valid_amount = total_data.valid_amount || 0;
    response.data.total_data.order_num = total_data.order_num || 0;
    response.data.total_data.income = total_data.income || 0;
    response.data.today_data.valid_amount = today_data.valid_amount || 0;
    response.data.today_data.order_num = today_data.order_num || 0;
    response.data.today_data.income = today_data.income || 0;
    response.data.list = list;
    if (!list.length || list.length < pagesize) site = null;
    response.data.site = site;
    return response
}

async function dramaIncomeDetails(query, userInfo) {
    let { start_date, end_date, platform_id, mount_type, advertiser_type, income_type, page, pagesize, drama_plan_id } = query;
    query.business_type = 3;
    if (!drama_plan_id) return Promise.reject('请传入计划id');
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    // if (!start_date || !end_date) return Promise.reject('请传入查询时间');
    let { list, site } = await appletDetails(page, pagesize, query, userInfo);
    return {
        code: 0,
        data: {
            page,
            pagesize,
            site,
            list
        }
    }

}

async function incomeDetails(query, userInfo, req) {
    let { $version: version, $platform: platform } = req;
    let vtag = (platform == 'ios' && version > 137) || (platform == 'android' && version > 724) || (platform == 'h5' && version >= 100);
    let { date, smt_id, page, pagesize, site, drama_plan_id, id } = query;
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    if (pagesize > 100) return Promise.reject('分页不能大于100');
    let sql = null;
    if (vtag) {
        if (!date || !smt_id || !drama_plan_id) return Promise.reject('请传入date和smt_id,以及drama_plan_id');
        sql = knex(`${APPLET_SETTLE} as settle`)
        .select(knex.raw(`if(ad.self_operated = 0 , '', if(ext.pay_status = 'SUCCESS' and ext.pay_date >= '2024-09-05', ext.pay_time, '--')) as pay_time`))
        .leftJoin(`${APPLET_DATA} as data`, 'data.settle_id', 'settle.id')
        .leftJoin(`${APPLET_EXTERNAL} as ext`, 'ext.id', 'data.external_id')
        .leftJoin(`${ADVERTISER_TABLE} as ad`, 'ext.advertiser_type', 'ad.id')
        .select('data.amount as valid_amount', 'data.cancel_status', 'settle.cps_ratio')
        .select(knex.raw(`ROUND(data.amount * data.cps_ratio / 10000) as income`))
        .where((builder) => {
            if (site && page > 1) {
                builder.where("data.external_id", "<", site);
            }
            builder.where({
                'settle.date': date,
                'settle.drama_plan_id': drama_plan_id,
                'settle.smt_id': smt_id
            })
        });
    } else {
        if (!id) return Promise.reject('请传入id');
        sql = knex(`${APPLET_SETTLE} as settle`)
        .leftJoin(`${APPLET_DATA} as data`, 'data.settle_id', 'settle.id')
        .select('data.amount as valid_amount', 'data.cancel_status')
        .select(knex.raw(`ROUND(data.amount * data.cps_ratio / 10000) as income`))
        .where((builder) => {
            if (site && page > 1) {
                builder.where("data.external_id", "<", site);
            }
            builder.where('settle.id', id)
        });

    }
    if (page == 1) {
        site = await getTableSite(APPLET_DATA, "external_id");
    } else {
        site = Number(query.site) || 0;
    }

    // handler.applet_search_filter(query, sql, userInfo);
    let list = await sqlPagination(sql, { page, pagesize });

    list.forEach(item => {
        item.cancel_status = Number(item.cancel_status);
        if ([2, 3, 4].includes(item.cancel_status)) {
            item.is_refund = '是';
            item.income = 0;
        } else {
            item.is_refund = '否'
        }
    })
    if (!list.length || list.length < pagesize) site = null;
    return {
        code: 0,
        data: {
            page,
            pagesize,
            site,
            list
        }
    }
}

async function novelIncome(query, userInfo) {
    let { start_date, end_date, platform_id, mount_type, advertiser_type, income_type, page, pagesize, site, promotion_type, business_type } = query;
    if (!business_type) return Promise.reject('请传入业务分类！');
    if (!promotion_type) return Promise.reject('请传入推广方式！')
    promotion_type = Number(promotion_type)
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    if (pagesize > 100) return Promise.reject('分页不能大于100')
    let response = {
        code: 0,
        data: {
            total_data: {
                promotion_type,
                keyword_num: 0,
                order_num: 0,
                income: 0,
                valid_amount: 0
            },
            today_data: {
                promotion_type,
                keyword_num: 0,
                order_num: 0,
                income: 0,
                valid_amount: 0
            },
            list: [],
            page,
            pagesize,
            site
        },
    }
    if (promotion_type == 1) {
        let { total_data, today_data, list, site } = await keywordIncome(page, pagesize, query, userInfo)
        response.data.total_data.keyword_num = total_data.keyword_num || 0;
        response.data.total_data.order_num = total_data.order_num || 0;
        response.data.total_data.income = total_data.income || 0;
        response.data.today_data.keyword_num = today_data.keyword_num || 0;
        response.data.today_data.order_num = today_data.order_num || 0;
        response.data.today_data.income = today_data.income || 0;
        response.data.list = list;
        if (!list.length || list.length < pagesize) site = null;
        response.data.site = site;
    } else if (promotion_type == 2) {
        let { total_data, today_data, list, site } = await appletIncome(page, pagesize, query, userInfo)
        response.data.total_data.valid_amount = total_data.valid_amount || 0;
        response.data.total_data.order_num = total_data.order_num || 0;
        response.data.total_data.income = total_data.income || 0;
        response.data.total_data.cpm_income = total_data.cpm_income || 0;

        response.data.today_data.keyword_num = today_data.keyword_num || 0;
        response.data.today_data.order_num = today_data.order_num || 0;
        response.data.today_data.income = today_data.income || 0;
        response.data.today_data.valid_amount = today_data.valid_amount || 0;
        response.data.list = list;
        if (!list.length || list.length < pagesize) site = null;
        response.data.site = site;
    } else {
        return Promise.reject("未知的推广方式，请检查")
    }
    return response;
}

async function novelIncomeDetails(query, userInfo, req) { 
    let { drama_plan_id, business_type, keyword_id, page, pagesize, start_date, end_date, auth_account_id } = query;
    if (!drama_plan_id && !keyword_id && !auth_account_id) return Promise.reject('请传入计划id或者关键词id或者抖音账户id！');
    if (!business_type) return Promise.reject('请传入业务类型');

    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    // if (!start_date || !end_date) return Promise.reject('请传入查询时间');
    let response = {
        code: 0,
        data: {
            page,
            pagesize,
            site: null,
            list: []
        }
    }
    if (keyword_id || auth_account_id) {
        let { list, site } = await keywordDetails(page, pagesize, query, userInfo);
        response.data.list = list;
        response.data.site = site;
    } else if (drama_plan_id) {
        let { list, site } = await appletDetails(page, pagesize, query, userInfo, req);
        response.data.list = list;
        response.data.site = site;

    }
    return response;
}

async function subIncomeDetails(query, userInfo, req) {
    return await incomeDetails(query, userInfo, req)
}

async function keywordIncome(page, pagesize, query, userInfo) {
    let { start_date, end_date, site } = query;
    if (page == 1) {
        site = await getTableSite(DATA_SETTLE_TABLE, "id");
    } else {
        site = Number(query.site) || 0;
    }

    if (pagesize > 100) return Promise.reject('分页不能大于100');
    // if (!start_date || !end_date) return Promise.reject('请传入查询时间');

    let sql = knex(`${DATA_SETTLE_TABLE} as settle`)
        .leftJoin(`${DATA_TABLE} as data`, 'data.id', 'settle.data_id')
        .leftJoin(`${ADVERTISER_TABLE} as ad`, 'ad.id', 'data.advertiser_type')
        // .sum('data.edit_order + data.edit_laxin as order_num')
        .select(knex.raw(`SUM(settle.edit_order + settle.edit_laxin + settle.edit_lahuo) as order_num`)) //拉新量或结算量（订单量)
        .sum('settle.edit_order as edit_order') // 订单量
        .sum('settle.edit_laxin as edit_laxin') // 拉新
        .sum('settle.edit_lahuo as edit_lahuo') // 拉活
        .sum('settle.total_blogger_amount as income')
        .select('data.keyword_id', 'data.advertiser_type', 'data.type', 'data.auth_account_id')
        // .select(knex.raw(`group_concat(distinct p.settlement_id) as settlement_ids`))
        .select('ad.settlement_ids')
        .groupBy('data.keyword_id', 'data.advertiser_type', 'data.type', 'data.auth_account_id')
        .where((builder) => {
            if (site && page > 1) {
                builder.where("settle.id", "<", site);
            }
        });

    handler.keyword_search_filter(query, sql, userInfo);
    sql = sqlPagination(sql, { page, pagesize });

    let total_sql = knex(`${DATA_SETTLE_TABLE} as settle`)
        .leftJoin(`${DATA_TABLE} as data`, 'data.id', 'settle.data_id')
        .leftJoin(`${ADVERTISER_TABLE} as ad`, 'ad.id', 'data.advertiser_type')
        .sum('settle.total_blogger_amount as income')
        .select(knex.raw(`SUM(settle.edit_order + settle.edit_laxin + settle.edit_lahuo) as order_num`)) //拉新量或结算量
    // .countDistinct('data.keyword_id as keyword_num')
    handler.keyword_search_filter(query, total_sql, userInfo);

    let todayQuery = Object.assign({}, query);
    todayQuery.start_date = moment().subtract(1, 'day').format('YYYY-MM-DD');
    todayQuery.end_date = moment().subtract(1, 'day').format('YYYY-MM-DD');
    let today_sql = knex(`${DATA_SETTLE_TABLE} as settle`)
        .leftJoin(`${DATA_TABLE} as data`, 'data.id', 'settle.data_id')
        .leftJoin(`${ADVERTISER_TABLE} as ad`, 'ad.id', 'data.advertiser_type')
        .sum('settle.total_blogger_amount as income')
        .select(knex.raw(`SUM(settle.edit_order + settle.edit_laxin) as order_num`)) //拉新量或结算量
    // .countDistinct('data.keyword_id as keyword_num');
    handler.keyword_search_filter(todayQuery, today_sql, userInfo);

    let [list, today_data, total_data] = await Promise.all([sql, today_sql, total_sql])
    let advertiserMapper = await getAdvertiserMapper(userInfo);
    let keywordIds = list.map(item => item.keyword_id);
    let contentData = await knex(KOC_KEYWORD).select('content_id', 'id', 'keyword').whereIn('id', keywordIds);

    let authAccountIds = list.map(item => item.auth_account_id);
    let authData = await knex(AUTH_ACCOUNT).select('id', 'name', 'content_id').whereIn('id', authAccountIds);
    let authCotentIds = authData.map(item => item.content_id);
    let authMapper = {};
    authData.forEach(item => {
        authMapper[item.id] = item.name;
    })

    let contentIds = contentData.map(item => item.content_id);
    contentIds.push(...authCotentIds)
    let contentMapper = await getContentMapper(contentIds);

    list.forEach(item => {
        item.keyword_num = item.order_num;
        let keyword = contentData.find(i => i.id == item.keyword_id);
        let auth_account = authData.find(i => i.id == item.auth_account_id);
        if (keyword) {
            item.content_id = keyword.content_id;
            item.keyword = keyword.keyword;
            // item.drama_name = contentMapper[item.content_id]?.book_name || '';
            // item.drama_cover_url = contentMapper[item.content_id]?.cover_url || '';
        }
        if (auth_account) {
            item.content_id = auth_account.content_id;
            item.auth_account_name = authMapper[item.auth_account_id];
        }
        item.drama_name = contentMapper[item.content_id]?.book_name || '';
        item.drama_cover_url = contentMapper[item.content_id]?.cover_url || 'https://koc-material.domain.cn/koc_task_dev/d3047a45732d41bd83989fe1e9f18975.png?OSSAccessKeyId=noneKey&Expires=1699932810&Signature=noneKey';
        item.promotion_type = 1;
        item.advertiser_icon = advertiserMapper[item.advertiser_type]?.icon || '';
        item.settlement_ids = JSON.parse(item.settlement_ids);
        if (item.settlement_ids.includes(9)) {
            if (item.settlement_ids.includes(2)) { // 订单
                item.edit_laxin = -1;
            } else { // 拉新
                item.edit_order = -1;
            }
        } else {
            if (item.settlement_ids.includes(2)) { // 订单
                item.edit_laxin = -1;
            } else { // 拉新
                item.edit_order = -1;
            }
            item.edit_lahuo = -1;
        }
    })

    return { today_data: today_data[0], total_data: total_data[0], list, site }
}

async function appletIncome(page, pagesize, query, userInfo) {
    let total_data = {}, today_data = {}, list = [];
    let { start_date, end_date, site } = query;
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    if (page == 1) {
        site = await getTableSite(APPLET_SETTLE, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100')
    // if (!start_date || !end_date) return Promise.reject('请传入查询时间');
    let total_sql = knex(`${APPLET_SETTLE} as settle`)
        // .sum('settle.account_valid_price as valid_amount')
        // .sum('account_valid_order_num as order_num')
        .select(knex.raw(`SUM(IF(settle.smt_id = 3, settle.account_valid_price, 0)) as valid_amount`))
        .select(knex.raw(`SUM(IF(settle.smt_id = 3, settle.account_valid_order_num, 0)) as order_num`))
        .select(knex.raw(`ROUND(SUM(IF(settle.smt_id = 3, settle.account_valid_price * settle.cps_ratio / 10000, 0))) as income`))
        .select(knex.raw(`ROUND(SUM(IF(settle.smt_id = 4, settle.account_valid_price * settle.cps_ratio / 10000, 0))) as cpm_income`));

    handler.applet_search_filter(query, total_sql, userInfo);
    total_data = (await total_sql)[0] || {};

    let sql = knex(`${APPLET_SETTLE} as settle`)
        // .sum('settle.account_valid_price as valid_amount')
        // .sum('account_valid_order_num as order_num')
        .select(knex.raw(`SUM(IF(settle.smt_id = 3, settle.account_valid_price, 0)) as valid_amount`))
        .select(knex.raw(`SUM(IF(settle.smt_id = 3, settle.account_valid_order_num, 0)) as order_num`))
        .select('settle.drama_plan_id', 'settle.drama_id', 'settle.advertiser_type')
        // .select(knex.raw(`ROUND(SUM(settle.account_valid_price * settle.cps_ratio / 10000)) as income`))
        .select(knex.raw(`ROUND(SUM(IF(settle.smt_id = 3, settle.account_valid_price * settle.cps_ratio / 10000, 0))) as income`))
        .select(knex.raw(`ROUND(SUM(IF(settle.smt_id = 4, settle.account_valid_price * settle.cps_ratio / 10000, 0))) as cpm_income`))
        .select(selectName('settle', 'drama_plan_id', DRAMA_PLAN, 'name', 'drama_plan_name'))
        .groupBy('settle.drama_plan_id', 'settle.drama_id', 'settle.advertiser_type')
        .select(knex.raw(`(select ad.settlement_ids from ${ADVERTISER_TABLE} as ad where ad.id = settle.advertiser_type) as settlement_ids`))
        .where((builder) => {
            if (site && page > 1) {
                builder.where("settle.id", "<", site);
            }
        });

    handler.applet_search_filter(query, sql, userInfo);
    list = await sqlPagination(sql, { page, pagesize });
    let advertiserMapper = await getAdvertiserMapper(userInfo);
    let contentIds = list.map(item => item.drama_id);
    let contentMapper = await getContentMapper(contentIds);
    list.forEach(item => {
        item.promotion_type = 2;
        item.advertiser_icon = advertiserMapper[item.advertiser_type]?.icon || '';
        item.drama_name = contentMapper[item.drama_id]?.book_name || '';
        item.drama_cover_url = contentMapper[item.drama_id]?.cover_url || '';
        item.settlement_ids = JSON.parse(item.settlement_ids);
    })

    today_data = await dramaTodayData(userInfo, query);
    return { today_data, total_data, list, site }
}

async function keywordDetails(page, pagesize, query, userInfo) {
    let { site } = query;
    if (page == 1) {
        site = await getTableSite(DATA_SETTLE_TABLE, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100');

    let sql = knex(`${DATA_SETTLE_TABLE} as settle`)
        .leftJoin(`${DATA_TABLE} as data`, 'data.id', 'settle.data_id')
        // .leftJoin(`${POLICY_SETTLEMENT_TABLE} as p`, 'p.policy_id', 'settle.policy_id')
        .leftJoin(`${ADVERTISER_TABLE} as ad`, 'ad.id', 'data.advertiser_type')
        .select('settle.total_blogger_amount as income', 'data.date', 'settle.order_price', 'settle.laxin_price', 'settle.edit_order', 'settle.edit_laxin', 'settle.edit_lahuo', 'settle.id')
        .select('ad.settlement_ids')
        .where((builder) => {
            if (site && page > 1) {
                builder.where("settle.id", "<", site);
            }
        });

    handler.keyword_search_filter(query, sql, userInfo);
    list = await sqlPagination(sql, { page, pagesize });
    list.forEach(item => {
        item.order_price = item.order_price || item.laxin_price;
        item.order_num = lodash.add(item.edit_order, item.edit_laxin);
        item.settlement_ids = JSON.parse(item.settlement_ids);
        if (item.settlement_ids.includes(9)) {
            if (item.settlement_ids.includes(2)) { // 订单
                item.edit_laxin = -1;
            } else { // 拉新
                item.edit_order = -1;
            }
        } else {
            if (item.settlement_ids.includes(2)) { // 订单
                item.edit_laxin = -1;
            } else { // 拉新
                item.edit_order = -1;
            }
            item.edit_lahuo = -1;
        }
    })
    if (!list.length || list.length < pagesize) site = null;
    return { list, site }
}

async function appletDetails(page, pagesize, query, userInfo, req) {
    let { site } = query;
    if (page == 1) {
        site = await getTableSite(APPLET_SETTLE, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100');

    let { $version: version, $platform: platform } = req;
    let vtag = (platform == 'ios' && version > 137) || (platform == 'android' && version > 724) || (platform == 'h5' && version >= 100);
    let sql = null;
    if (vtag) {
        sql = knex(`${APPLET_SETTLE} as settle`)
        // .select('settle.account_valid_price as valid_amount', 'settle.account_valid_order_num as order_num', 'settle.date', 'settle.id')
        // .select(knex.raw(`ROUND(settle.account_valid_price * settle.cps_ratio / 10000) as income`))
        .select('settle.date')
        .select(knex.raw(`SUM(IF(settle.smt_id = 3, settle.account_valid_price, 0)) as valid_amount`))
        .select(knex.raw(`SUM(IF(settle.smt_id = 3, settle.account_valid_order_num, 0)) as order_num`))
        .select(knex.raw(`ROUND(SUM(IF(settle.smt_id = 3, settle.account_valid_price * settle.cps_ratio / 10000, 0))) as income`))
        .select(knex.raw(`ROUND(SUM(IF(settle.smt_id = 4, settle.account_valid_price * settle.cps_ratio / 10000, 0))) as cpm_income`))
        .where((builder) => {
            if (site && page > 1) {
                builder.where("settle.id", "<", site);
            }
        })
        .groupBy('settle.date');
    } else {
        sql = knex(`${APPLET_SETTLE} as settle`)
        .select('settle.account_valid_price as valid_amount', 'settle.account_valid_order_num as order_num', 'settle.date', 'settle.id')
        .select(knex.raw(`ROUND(settle.account_valid_price * settle.cps_ratio / 10000) as income`))
        .where((builder) => {
            if (site && page > 1) {
                builder.where("settle.id", "<", site);
            }
        })
        .andWhere('settle.smt_id', 3);
    }

    handler.applet_search_filter(query, sql, userInfo);
    let list = await sqlPagination(sql, { page, pagesize });
    if (!list.length || list.length < pagesize) site = null;
    return { list, site }
}

async function dramaTodayData(userInfo, query) {
    let today = moment().format('YYYY-MM-DD');
    let sql = knex(`${APPLET_DATA} as data`)
        .leftJoin(`${APPLET_EXTERNAL} as ext`, 'ext.id', 'data.external_id')
        .andWhere("data.drama_plan_id", "!=", 0)
        .andWhere(builder => {
            if (query.advertiser_type) builder.where("data.advertiser_type", query.advertiser_type);
            if (query.business_type) builder.where('data.business_type', query.business_type);
        })
        .where({
            // "data.settle_status": SettleStatus.UnSettle,
            "data.oem_id": userInfo.oem_id,
            "data.account_id": userInfo.id,
            'ext.date': today
        })
        .whereNotIn("data.cancel_status", [CancelStatus.System, CancelStatus.MatchFail, CancelStatus.None])
        .andWhereNot("ext.pay_status", "NOTPAY")
        .select(knex.raw(`SUM(data.amount) as valid_amount`)) // 客户订单充值总金额 排除了系统核销和匹配失败
        .select(knex.raw(`COUNT(ext.order_id) as order_num`)) // 博主有效结算订单数;
        .select(knex.raw(`ROUND(SUM(if(data.cancel_status = ${CancelStatus.Normal}, data.amount * data.cps_ratio / 10000, 0))) as income`))
        .where('ext.smt_id', 3);
    return (await sql)[0] || {};
}

async function keywordSubDetails(query, userInfo) {
    let { id, page, pagesize, site } = query;
    if (!id) return Promise.reject('请传入id');
    page = Number(page) || 1, pagesize = Number(pagesize) || 20;
    if (page == 1) {
        site = await getTableSite(DATA_SETTLE_TABLE, "id");
    } else {
        site = Number(query.site) || 0;
    }
    if (pagesize > 100) return Promise.reject('分页不能大于100');

    let sql = knex(`${DATA_SETTLE_TABLE} as settle`)
        .leftJoin(`${DATA_TABLE} as data`, 'data.id', 'settle.data_id')
        .leftJoin(`${ADVERTISER_TABLE} as ad`, 'ad.id', 'data.advertiser_type')
        .select('settle.order_price', 'settle.edit_order', 'settle.laxin_price', 'settle.edit_laxin', 'settle.edit_lahuo', 'settle.lahuo_price')
        .select('ad.settlement_ids')
        .where((builder) => {
            if (site && page > 1) {
                builder.where("settle.id", "<", site);
            }
        })
        .where('settle.id', id);

    // handler.keyword_search_filter(query, sql, userInfo);
    list = await sqlPagination(sql, { page, pagesize });
    if (!list.length || list.length < pagesize) site = null;
    let data = [];
    let { settlement_ids, edit_laxin, laxin_price, edit_lahuo, lahuo_price, edit_order, order_price } = list[0];
    let total_blogger_laxin_amount = 0, total_blogger_lahuo_amount = 0, total_blogger_order_amount = 0, settle_numm = 0;
    settlement_ids = JSON.parse(settlement_ids);
    if (settlement_ids.includes(1)) {
        total_blogger_laxin_amount = lodash.multiply(edit_laxin, laxin_price);
        settle_numm = edit_laxin;
        data.push({
            settle_type: "拉新",
            settle_num: edit_laxin,
            settle_price: laxin_price,
            income: total_blogger_laxin_amount
        })
    }
    if (settlement_ids.includes(9)) {
        total_blogger_lahuo_amount = lodash.multiply(edit_lahuo, lahuo_price);
        settle_numm = lodash.add(settle_numm, edit_lahuo);
        data.push({
            settle_type: "拉失活",
            settle_num: edit_lahuo,
            settle_price: lahuo_price,
            income: total_blogger_lahuo_amount
        })
    }
    if (settlement_ids.includes(2)) {
        total_blogger_order_amount = lodash.multiply(edit_order, order_price);
        settle_numm = lodash.add(settle_numm, edit_order);
        data.push({
            settle_type: "订单",
            settle_num: edit_order,
            settle_price: order_price,
            income: total_blogger_order_amount
        })
    }
    let income = lodash.add(total_blogger_laxin_amount, lodash.add(total_blogger_lahuo_amount, total_blogger_order_amount));
    return {
        code: 0,
        data: {
            list: data,
            total: { settle_numm, income },
            site
        }
    }
}

const handler = {
    applet_search_filter(query, sql, userInfo) {
        let { start_date, end_date, platform_id, mount_type, advertiser_type, income_type, business_type, drama_plan_id } = query;
        if (income_type) income_type = Number(income_type);
        if (platform_id || mount_type || advertiser_type) {
            sql.leftJoin(`${ADVERTISER_TABLE} as ad`, 'ad.id', 'settle.advertiser_type');
            sql.where(builder => {
                if (platform_id) {
                    builder.where('ad.platform_id', platform_id);
                }
                if (mount_type) {
                    builder.whereRaw(`JSON_CONTAINS(ad.mount_type, JSON_ARRAY(${mount_type}))`)
                }
                if (advertiser_type) {
                    builder.where('ad.id', advertiser_type)
                }
            })
        }

        if ([1, 2, 3].includes(income_type)) {
            if (income_type == 1) {
                sql.where('settle.settle_status', 3)
            } else if (income_type == 2) {
                sql.whereIn('settle.settle_status', [1, 2])
            } else if (income_type == 3) {
                sql.where('settle.refund_order_num', '>', 0).orWhereNull('settle.refund_order_num')
            }
        }

        if ([4, 5].includes(income_type)) {
            sql.leftJoin(`${AMOUNT_PROMOTION} as p`, 'p.order_settle_id', 'settle.id');
            if (income_type == 4) {
                sql.where('p.amount_balance', 0)
            }
            if (income_type == 5) {
                sql.where('p.amount_balance', '>', 0)
            }
        }

        if (drama_plan_id) {
            sql.where('settle.drama_plan_id', drama_plan_id)
        }

        if (start_date && end_date) {
            sql.whereIn('date', getDaysBetweenDate(start_date, end_date));
        }

        sql.where({
            'settle.account_id': userInfo.id,
            'settle.business_type': business_type
        })
    },
    keyword_search_filter(query, sql, userInfo) {
        let { start_date, end_date, platform_id, mount_type, advertiser_type, income_type, business_type, keyword_id, auth_account_id } = query;
        if (income_type) income_type = Number(income_type);
        if (platform_id || mount_type || advertiser_type) {
            sql.where(builder => {
                if (platform_id) {
                    builder.where('ad.platform_id', platform_id);
                }
                if (mount_type) {
                    builder.whereRaw(`JSON_CONTAINS(ad.mount_type, JSON_ARRAY(${mount_type}))`)
                }
                if (advertiser_type) {
                    builder.where('ad.id', advertiser_type)
                }
            })
        }

        // if ([1, 2, 3].includes(income_type)) {
        //     if (income_type == 1) { // 已结算
        //         sql.where('settle.settle_status', 3)
        //     } else if (income_type == 2) { // 未结算
        //         sql.whereIn('settle.settle_status', [1, 2])
        //     }
        // }

        if ([4, 5].includes(income_type)) {
            sql.leftJoin(`${AMOUNT_PROMOTION} as p`, 'p.order_settle_id', 'settle.id');
            if (income_type == 4) { // 已提现
                sql.where('p.amount_balance', 0)
            }
            if (income_type == 5) { // 可提现
                sql.where('p.amount_balance', '>', 0)
            }
        }
        if (keyword_id) {
            sql.where('data.keyword_id', keyword_id)
        }

        if (auth_account_id) {
            sql.where('data.auth_account_id', auth_account_id)
        }

        if (start_date && end_date) {
            sql.whereIn('data.date', getDaysBetweenDate(start_date, end_date));
        }

        sql.where({
            'data.account_id': userInfo.id,
            'data.business_type': business_type,
            'settle.settle_status': 3
        })
    }
}

module.exports = {
    dramaIncome, // 废弃
    dramaIncomeDetails, // 废弃
    novelIncome,
    novelIncomeDetails,
    incomeDetails,
    subIncomeDetails,
    keywordSubDetails
}
