const { BLOGGER_TABLE, ACCOUNT_TABLE, TABLE_CONSULTANT,
    PLATFORM_TABLE, DATA_TABLE, DATA_SETTLE_TABLE, KOC_KEYWORD,
    DATA_SETTLED, DATA_SPLIT, WITHDRAW_DETAILS
} = require("../../../config/setting")
const knex = require("../../../db/knexManager").knexProxy
const { STATUS_MAPPER } = require("../../../utils/mapper")
const { getDaysBetweenDate } = require("../../../utils/tools")
const { getAccountType } = require("../../public/operationLog")
const { getChildrenByPermission } = require("../../public/permission");

async function total(query = {}, userInfo = {}) {
    let { advertiser_type } = query || {}
    let { id: account_id, oem_id } = userInfo || {}
    if (!account_id) return Promise.reject('非法账号！')
    let account_type = await getAccountType(account_id)
    let dataSql = knex.from(`${DATA_SPLIT} as dsp`)
        .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dsp.data_id')
        .where('dat.status', 1)
        .where('dsp.advertiser_type', advertiser_type)
        .where('dsp.oem_id', oem_id)
    if (account_type == 1) {
        dataSql.select(knex.raw(`SUM(IF(dsp.payment_date IS NOT NULL, dsp.total_price, 0)) as paid_income`)) //已付款收益
            .select(knex.raw(`SUM(IF(dsp.payment_date IS NULL, dsp.total_price, 0)) as unpaid_income`)) //未付款收益
            .select(knex.raw(`SUM(dsp.total_price) as total_income`)) //总收益
            .where('dsp.account_id', account_id)
        if (advertiser_type == 7) {
            dataSql.select(knex.raw(`(SELECT SUM(total_price) FROM ${DATA_SPLIT} WHERE import_log_id = MAX(dsp.import_log_id) AND account_id = ${account_id} AND advertiser_type = ${advertiser_type}) as new_income`)) //最新收益
                .select(knex.raw(`(SELECT CONCAT_WS('~', MIN(date), MAX(date)) FROM ${DATA_SPLIT} where import_log_id = MAX(dsp.import_log_id) AND account_id = ${account_id} AND advertiser_type = ${advertiser_type}) as new_income_date`))
        } else {
            dataSql.select(knex.raw(`(SELECT SUM(total_price) FROM ${DATA_SPLIT} WHERE  date = MAX(dsp.date) AND account_id = ${account_id} AND advertiser_type = ${advertiser_type}) as new_income`)) //最新收益
                .select(knex.raw(`MAX(dsp.date) as new_income_date`)) //最新收益结算日
        }
    } else if (account_type == 2) { //投顾时
        dataSql.select(knex.raw(`SUM(IF(dsp.settle_type = 2, dsp.total_price, 0)) as total_service_income`)) //总服务费
            .select(knex.raw(`SUM(dsp.total_price) as total_income`)) //总收益
            .select(knex.raw(`SUM(IF(dsp.payment_date IS NOT NULL, dsp.total_price, 0)) as paid_income`)) //已付款收益
            .select(knex.raw(`SUM(IF(dsp.payment_date IS NULL, dsp.total_price, 0)) as unpaid_income`)) //未付款收益
            .where('dsp.account_id', account_id)
        if (advertiser_type == 7) {
            dataSql.select(knex.raw(`(SELECT SUM(total_price) FROM ${DATA_SPLIT} WHERE import_log_id = MAX(dsp.import_log_id) AND account_id = ${account_id} AND advertiser_type = ${advertiser_type} AND settle_type = 1) as new_publish_income`)) //最新发布收益
                .select(knex.raw(`(SELECT SUM(total_price) FROM ${DATA_SPLIT} WHERE import_log_id = MAX(dsp.import_log_id) AND account_id = ${account_id} AND advertiser_type = ${advertiser_type} AND settle_type = 2) as new_service_income`)) //最新服务费
                .select(knex.raw(`(SELECT CONCAT_WS('~', MIN(date), MAX(date)) FROM ${DATA_SPLIT} where import_log_id = MAX(dsp.import_log_id) AND account_id = ${account_id} AND advertiser_type = ${advertiser_type}) as new_income_date`))
        } else {
            dataSql.select(knex.raw(`(SELECT SUM(total_price) FROM ${DATA_SPLIT} WHERE  date = MAX(dsp.date) AND account_id = ${account_id} AND advertiser_type = ${advertiser_type} AND settle_type = 1) as new_publish_income`)) //最新发布收益
                .select(knex.raw(`(SELECT SUM(total_price) FROM ${DATA_SPLIT} WHERE  date = MAX(dsp.date) AND account_id = ${account_id} AND advertiser_type = ${advertiser_type} AND settle_type = 2) as new_service_income`)) //最新服务费
                .select(knex.raw(`MAX(dsp.date) as new_income_date`)) //最新收益结算日
        }
    } else if (account_type == 3) {
        let account_ids = await getChildrenByPermission(userInfo, [], false) //获取当前查询者的成员
        dataSql.leftJoin(`${KOC_KEYWORD} as kwd`, 'kwd.id', 'dsp.keyword_id')
            .leftJoin(`${ACCOUNT_TABLE} as cstn`, 'cstn.id', 'dsp.account_id')
            .leftJoin(`${TABLE_CONSULTANT} as cst`, 'cst.account_id', 'dsp.account_id')
            .leftJoin(`${BLOGGER_TABLE} as blo`, 'blo.account_id', 'dsp.account_id')
            .countDistinct('dsp.keyword_id as total_keyword_num') //关键词总数
            .countDistinct('blo.account_id as total_blogger_num') //博主总人数
            .countDistinct('cst.account_id as total_consultant_num') //投顾总人数
            .select(knex.raw(`SUM(IF(dsp.settle_type = 1, dsp.settle_num, 0)) as total_settle_num`)) //结算总量
            .select(knex.raw(`SUM(IF(dsp.settle_type = 2, dsp.total_price, 0)) as total_service_income`)) //投顾总服务费
            .select(knex.raw(`SUM(IF(dsp.settle_type = 1, dsp.total_price, 0)) as total_blogger_income`)) //博主总收益
            .where('dsp.advertiser_type', advertiser_type)
        if (account_ids) dataSql.whereIn('dsp.account_id', account_ids)
        dataSql = searchTotalFilter(query, dataSql, account_type)
    } else {
        return Promise.reject('未知的账户类型！')
    }
    let data = (await dataSql)[0]
    if (data) Object.keys(data).forEach(key => {
        data[key] = data[key] || 0
    })
    // console.log(dataSql.toString());
    return { code: 0, data, account_type }
}
async function settle_list(query = {}, userInfo = {}) {
    let { advertiser_type } = query || {}
    if (advertiser_type == 7) return await dateRangeList(query, userInfo)
    let retu = {
        code: 0,
        count: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
        account_type: null
    }
    let { id: account_id, oem_id } = userInfo || {}
    if (!account_id) return Promise.reject('非法账号！')
    let account_type = await getAccountType(account_id)
    retu.account_type = account_type
    let dataSql = knex.from(`${DATA_SPLIT} as dstd`)
        .leftJoin(`${KOC_KEYWORD} as kwd`, 'kwd.id', 'dstd.keyword_id')
        .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dstd.data_id')
        .where('dat.status', 1)
        .where('dstd.advertiser_type', advertiser_type)
        .where('dstd.oem_id', oem_id)
    if (account_type == 1) {
        dataSql.select('dstd.id', 'dstd.date', 'dstd.begin_date', 'dstd.settle_num', 'dstd.publish_num', 'dstd.publish_pre_price', 'dstd.settle_pre_price')
            .select('kwd.keyword', 'kwd.content', 'kwd.content_type', 'kwd.book_name', 'kwd.book_id', 'kwd.content_title')
            .select(knex.raw(`(dstd.total_price) as income`)) //我的收益
            .select(knex.raw(`(dstd.settle_num) as total_num`)) //结算量
            .where('dstd.account_id', account_id)
        // .select(knex.raw(`IF(publish_pre_price > 0, publish_num, 0) as publish_num`))
        // .select(knex.raw(`IF(publish_pre_price > 0, settle_num + publish_num, settle_num) as total_num`))
    } else if (account_type == 2) { //投顾时
        dataSql.select('dstd.id', 'dstd.date', 'dstd.begin_date', 'dstd.settle_num', 'dstd.publish_num', 'dstd.publish_pre_price', 'dstd.settle_pre_price', 'dstd.service_pre_price')
            .select('kwd.keyword', 'kwd.content', 'kwd.content_type', 'kwd.book_name', 'kwd.book_id', 'kwd.content_title')
            .select(knex.raw(`dstd.total_price as income`)) //我的收益
            .select(knex.raw(`IF(dstd.settle_type = 1, 1, 0) as consultant_publish`)) //是否是投顾自己发布
            .select(knex.raw(`dstd.settle_num as total_num`)) //结算量
            .select(knex.raw(`(dstd.settle_num * dstd.settle_pre_price) as blogger_income`)) //博主收益
            .select(selectName('dat', ACCOUNT_TABLE, "owner_user_id", "name", "blogger_name"))
            .where('dstd.account_id', account_id)
    } else if (account_type == 3) {
        let account_ids = await getChildrenByPermission(userInfo, [], false) //获取当前查询者的成员
        query.type = query.type || 'total'
        dataSql = knex.from(`${DATA_SETTLED} as dstd`)
            .leftJoin(`${KOC_KEYWORD} as kwd`, 'kwd.id', 'dstd.keyword_id')
            .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dstd.data_id')
            .where('dat.status', 1)
            .where('dstd.advertiser_type', advertiser_type)
            .where('dstd.oem_id', oem_id)
        if (query.type == 'total') {//累计统计
            dataSql.select('dstd.keyword_id as id')
                .min('dstd.begin_date as begin_date')
                .sum('dstd.settle_num as settle_num')
                .sum('dstd.publish_num as total_publish_num')
                .select(knex.raw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, 0, dstd.total_service_price)) as consultant_income`)) //投顾服务费
                .sum('dstd.total_publish_price as total_publish_price')
                .sum('dstd.total_settle_price as total_settle_price')
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, 1, 0) as consultant_publish`)) //是否是投顾自己发布
                .select(knex.raw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, dstd.settle_num,dstd.settle_num)) as total_num`)) //结算量
                .select(knex.raw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, dstd.total_price, dstd.total_publish_price + dstd.total_settle_price)) as blogger_income`)) //博主收益
                .groupBy('dstd.keyword_id', 'dstd.blogger_id', 'dstd.consultant_id')

        } else {
            dataSql.select('dstd.id', 'dstd.date', 'dstd.begin_date', 'dstd.settle_num', 'dstd.publish_num', 'dstd.publish_pre_price', 'dstd.settle_pre_price', 'dstd.service_pre_price')
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, 0, dstd.total_service_price) as consultant_income`)) //投顾服务费
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, 1, 0) as consultant_publish`)) //是否是投顾自己发布
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, dstd.settle_num,dstd.settle_num) as total_num`)) //结算量
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, dstd.total_price, dstd.total_publish_price + dstd.total_settle_price) as blogger_income`)) //博主收益

        }
        dataSql.select('kwd.keyword', 'kwd.content', 'kwd.content_type', 'kwd.book_name', 'kwd.book_id', 'kwd.content_title')
            .leftJoin(`${ACCOUNT_TABLE} as cstn`, 'cstn.id', 'dstd.consultant_id')
            .leftJoin(`${ACCOUNT_TABLE} as blon`, 'blon.id', 'dstd.blogger_id')
            .select(selectName('dstd', ACCOUNT_TABLE, "blogger_id", "name", "blogger_name"))
            .select(selectName('dstd', ACCOUNT_TABLE, "consultant_id", "name", "consultant_name"))
            .where(builder => {
                if (account_ids) builder.whereIn('dstd.blogger_id', account_ids).orWhereIn('dstd.consultant_id', account_ids)
            })
    } else {
        return Promise.reject('未知的账户类型！')
    }
    dataSql = searchListFilter(query, dataSql, account_type)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${dataSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    dataSql = searchListSort(query, dataSql, advertiser_type, account_type, account_id)
    retu.data = await dataSql.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize)
    // console.log(dataSql.toString());
    return retu
}
function selectName(idTable, nameTable, idFiled, nameFiled = "name", asFiled) {
    return knex.raw(`(SELECT p.${nameFiled} FROM ${nameTable} p where ${idTable}.${idFiled} = p.id  LIMIT 0, 1 ) as ${asFiled}`)
}
async function dateRangeList(query = {}, userInfo = {}) {
    let retu = {
        code: 0,
        count: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
        account_type: null
    }
    let { advertiser_type } = query || {}
    let { id: account_id, oem_id } = userInfo || {}
    if (!account_id) return Promise.reject('非法账号！')
    let account_type = await getAccountType(account_id)
    retu.account_type = account_type
    let dataSql = knex.from(`${DATA_SETTLE_TABLE} as dstd`)
        .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dstd.data_id')
        .leftJoin(`${KOC_KEYWORD} as kwd`, 'kwd.id', 'dat.keyword_id')
        .where({ 'dstd.settle_status': 3, 'dstd.verify_status': 3 })
        .where('dat.advertiser_type', advertiser_type)
        .where('dat.status', 1)
        .where('dat.oem_id', oem_id)
    if (account_type == 1) {
        dataSql.select(knex.raw(`CONCAT_WS('~', dat.date, dat.import_date) as date`))
            .select('dstd.id', 'dstd.begin_date', 'dstd.edit_settle as settle_num', 'dstd.edit_publish as publish_num', 'dstd.distribute_price as publish_pre_price', 'dstd.publish_price as settle_pre_price')
            .select('kwd.keyword', 'kwd.content', 'kwd.content_type', 'kwd.book_name', 'kwd.book_id', 'kwd.content_title')
            .select(knex.raw(`(dstd.edit_settle * dstd.publish_price + dstd.edit_publish * dstd.distribute_price) as income`)) //我的收益
            .select(knex.raw(`(dstd.edit_settle) as total_num`)) //结算量
            .where('dat.owner_user_id', account_id)
        dataSql = searchListFQFilter(query, dataSql)
    } else if (account_type == 2) { //投顾时
        dataSql.select(knex.raw(`CONCAT_WS('~', dat.date, dat.import_date) as date`))
            .select('dstd.id', 'dstd.begin_date', 'dstd.edit_settle as settle_num', 'dstd.edit_publish as publish_num',
                'dstd.distribute_price as publish_pre_price', 'dstd.publish_price as settle_pre_price', 'dstd.service_price as service_pre_price')
            .select('kwd.keyword', 'kwd.content', 'kwd.content_type', 'kwd.book_name', 'kwd.book_id', 'kwd.content_title')
            .select(knex.raw(`IF(dat.owner_user_id = ${account_id}, IF(dat.consultant_id = ${account_id} OR dat.consultant_id IS NULL, (dstd.edit_settle * dstd.publish_price + dstd.edit_publish * dstd.distribute_price + dstd.edit_settle * dstd.service_price), (dstd.edit_settle * dstd.publish_price + dstd.edit_publish * dstd.distribute_price)), dstd.edit_settle * dstd.service_price) as income`)) //我的收益
            .select(knex.raw(`IF(dat.owner_user_id = ${account_id}, 1, 0) as consultant_publish`)) //是否是投顾自己发布
            .select(knex.raw(`IF(dat.owner_user_id = ${account_id}, dstd.edit_settle, dstd.edit_settle) as total_num`)) //结算量
            .select(knex.raw(`IF(dat.owner_user_id = ${account_id}, IF(dat.consultant_id = ${account_id} OR dat.consultant_id IS NULL, (dstd.edit_settle * dstd.publish_price + dstd.edit_publish * dstd.distribute_price + dstd.edit_settle * dstd.service_price), (dstd.edit_settle * dstd.publish_price + dstd.edit_publish * dstd.distribute_price)), (dstd.edit_settle * dstd.publish_price + dstd.edit_publish * dstd.distribute_price)) as blogger_income`)) //博主收益
            .select(selectName('dat', ACCOUNT_TABLE, "owner_user_id", "name", "blogger_name"))
            .where(builder => {
                builder.where('dat.owner_user_id', account_id).orWhere('dat.consultant_id', account_id)
            })
        dataSql = searchListFQFilter(query, dataSql)
    } else if (account_type == 3) {
        dataSql = knex.from(`${DATA_SETTLED} as dstd`)
            .leftJoin(`${KOC_KEYWORD} as kwd`, 'kwd.id', 'dstd.keyword_id')
            .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dstd.data_id')
            .where('dat.status', 1)
            .where('dstd.advertiser_type', advertiser_type)
        let account_ids = await getChildrenByPermission(userInfo, [], false) //获取当前查询者的成员
        query.type = query.type || 'total'
        if (query.type == 'total') {//累计统计
            dataSql.select('dstd.keyword_id as id')
                .min('dstd.begin_date as begin_date')
                .sum('dstd.settle_num as settle_num')
                .sum('dstd.publish_num as total_publish_num')
                .sum('dstd.total_publish_price as total_publish_price')
                .sum('dstd.total_settle_price as total_settle_price')
                .select(knex.raw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, 0, dstd.total_service_price)) as consultant_income`)) //投顾服务费
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, 1, 0) as consultant_publish`)) //是否是投顾自己发布
                .select(knex.raw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, dstd.settle_num ,dstd.settle_num)) as total_num`)) //结算量
                .select(knex.raw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, dstd.total_price, dstd.total_publish_price + dstd.total_settle_price)) as blogger_income`)) //博主收益
                .groupBy('dstd.keyword_id', 'dstd.blogger_id', 'dstd.consultant_id')

        } else {
            dataSql.select('dstd.id', 'dstd.date', 'dstd.begin_date', 'dstd.settle_num', 'dstd.publish_num', 'dstd.publish_pre_price', 'dstd.settle_pre_price', 'dstd.service_pre_price')
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, 0, dstd.total_service_price) as consultant_income`)) //投顾服务费
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, 1, 0) as consultant_publish`)) //是否是投顾自己发布
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, dstd.settle_num,dstd.settle_num) as total_num`)) //结算量
                .select(knex.raw(`IF(dstd.blogger_id = dstd.consultant_id, dstd.total_price, dstd.total_publish_price + dstd.total_settle_price) as blogger_income`)) //博主收益

        }
        dataSql.select(selectName('dstd', ACCOUNT_TABLE, "blogger_id", "name", "blogger_name"))
            .leftJoin(`${ACCOUNT_TABLE} as cstn`, 'cstn.id', 'dstd.consultant_id')
            .leftJoin(`${ACCOUNT_TABLE} as blon`, 'blon.id', 'dstd.blogger_id')
            .select('kwd.keyword', 'kwd.content', 'kwd.content_type', 'kwd.book_name', 'kwd.book_id', 'kwd.content_title')
            .select(selectName('dstd', ACCOUNT_TABLE, "consultant_id", "name", "consultant_name"))
            .where(builder => {
                if (account_ids) builder.whereIn('dstd.blogger_id', account_ids).orWhereIn('dstd.consultant_id', account_ids)
            })
        dataSql = searchListFilter(query, dataSql, account_type)
    } else {
        return Promise.reject('未知的账户类型！')
    }
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${dataSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    dataSql = searchListSort(query, dataSql, advertiser_type, account_type, account_id)
    retu.data = await dataSql.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize)
    // console.log(dataSql.toString());
    return retu
}
function searchListSort(query, dataSql, advertiser_type = 1, account_type = 1, account_id) {
    let orgin_sort = 'dstd.date'
    if (advertiser_type == 7) orgin_sort = 'dat.date'
    if (query.sorter && query.sorter.indexOf('*') != -1) {
        let [cloum, sort] = query.sorter.split('*')
        if (advertiser_type != 7) {
            switch (cloum) {
                case "total_num":
                    switch (Number(account_type)) {
                        case 1:
                            dataSql.orderByRaw(`(dstd.settle_num + dstd.publish_num) ${sort}`)
                            break;
                        case 2:
                            dataSql.orderByRaw(`IF(dstd.blogger_id = ${account_id}, dstd.settle_num,dstd.settle_num) ${sort}`)
                            break;
                        case 3:
                            if (query.type == 'total') {
                                dataSql.orderByRaw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, dstd.settle_num ,dstd.settle_num)) ${sort}`)
                            } else {
                                dataSql.orderByRaw(`IF(dstd.blogger_id = dstd.consultant_id, dstd.settle_num ,dstd.settle_num) ${sort}`)
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case "income":
                    switch (Number(account_type)) {
                        case 1:
                            dataSql.orderByRaw(`(dstd.total_publish_price + dstd.total_settle_price) ${sort}`)
                            break;
                        case 2:
                            dataSql.orderByRaw(`IF(dstd.blogger_id = ${account_id}, dstd.total_price, dstd.total_service_price) ${sort}`)
                            break;
                        default:
                            break;
                    }
                    break;
                case "blogger_income":
                    if (query.type == 'total') {
                        dataSql.orderByRaw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, dstd.total_price, dstd.total_publish_price + dstd.total_settle_price)) ${sort}`)
                    } else {
                        dataSql.orderByRaw(`IF(dstd.blogger_id = dstd.consultant_id, dstd.total_price, dstd.total_publish_price + dstd.total_settle_price) ${sort}`)
                    }
                    break;
                case "consultant_income":
                    if (query.type == 'total') {
                        dataSql.orderByRaw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, 0, dstd.total_service_price)) ${sort}`)
                    } else {
                        dataSql.orderByRaw(`IF(dstd.blogger_id = dstd.consultant_id, 0, dstd.total_service_price) ${sort}`)
                    }
                    break;
                default:
                    break;
            }
        } else {
            switch (cloum) {
                case "total_num":
                    switch (Number(account_type)) {
                        case 1:
                            dataSql.orderByRaw(`(dstd.edit_settle + dstd.edit_publish) ${sort}`)
                            break;
                        case 2:
                            dataSql.orderByRaw(`IF(dat.owner_user_id = ${account_id}, dstd.edit_settle, dstd.edit_settle) ${sort}`)
                            break;
                        case 3:
                            if (query.type == 'total') {
                                dataSql.orderByRaw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, dstd.settle_num ,dstd.settle_num)) ${sort}`)
                            } else {
                                dataSql.orderByRaw(`IF(dstd.blogger_id = dstd.consultant_id, dstd.settle_num,dstd.settle_num) ${sort}`)
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case "income":
                    switch (Number(account_type)) {
                        case 1:
                            dataSql.orderByRaw(`(dstd.edit_settle * dstd.publish_price + dstd.edit_publish * dstd.distribute_price) ${sort}`)
                            break;
                        case 2:
                            dataSql.orderByRaw(`IF(dat.owner_user_id = ${account_id}, (dstd.edit_settle * dstd.publish_price + dstd.edit_publish * dstd.distribute_price + dstd.edit_settle * dstd.service_price), dstd.edit_settle * dstd.service_price) ${sort}`)
                            break;
                        default:
                            break;
                    }
                    break;
                case "blogger_income":
                    if (query.type == 'total') {
                        dataSql.orderByRaw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, dstd.total_price, dstd.total_publish_price + dstd.total_settle_price)) ${sort}`)
                    } else {
                        dataSql.orderByRaw(`IF(dstd.blogger_id = dstd.consultant_id, dstd.total_price, dstd.total_publish_price + dstd.total_settle_price) ${sort}`)
                    }
                    break;
                case "consultant_income":
                    if (query.type == 'total') {
                        dataSql.orderByRaw(`SUM(IF(dstd.blogger_id = dstd.consultant_id, 0, dstd.total_service_price)) ${sort}`)
                    } else {
                        dataSql.orderByRaw(`IF(dstd.blogger_id = dstd.consultant_id, 0, dstd.total_service_price) ${sort}`)
                    }
                    break;
                default:
                    break;
            }
        }
    } else {
        if (query.type != 'total') dataSql.orderBy(orgin_sort, 'desc')
    }
    return dataSql
}
function searchListFQFilter(query, dataSql, account_type = 1) {
    if (query.start_date && query.end_date) {
        dataSql.whereIn('dat.date', getDaysBetweenDate(query.start_date, query.end_date))
    }
    if (query.keyword) {
        let keyword = query.keyword.trim()
        dataSql.where(builder => {
            builder.where('kwd.id', 'like', `%${keyword}%`).orWhere('kwd.keyword', 'like', `%${keyword}%`)
        })
    }
    if (query.blogger_id) dataSql.where('dat.owner_user_id', query.blogger_id)
    if (query.content_type) dataSql.where('kwd.content_type', query.content_type)
    if (query.settle_type) {
        if (query.settle_type == 1) dataSql.where('dstd.publish_price', '>', 0) //发布效果
        if (query.settle_type == 2) dataSql.where('dstd.distribute_price', '>', 0) //一口价结算
    }
    return dataSql
}
function searchListFilter(query, dataSql, account_type = 1) {
    if (query.start_date && query.end_date) { //日期范围
        dataSql.whereIn('dstd.date', getDaysBetweenDate(query.start_date, query.end_date))
    }
    if (query.keyword) { //关键词搜索
        let keyword = query.keyword.trim()
        dataSql.where(builder => {
            builder.where('kwd.id', 'like', `%${keyword}%`).orWhere('kwd.keyword', 'like', `%${keyword}%`)
            if (account_type == 3) builder.orWhere('dstd.blogger_id', 'like', `%${keyword}%`)
                .orWhere('cstn.name', 'like', `%${keyword}%`)
        })
    }
    if (query.blogger_id) dataSql.where('dstd.blogger_id', query.blogger_id) //博主查询
    if (query.content_type) dataSql.where('kwd.content_type', query.content_type) //内容类型
    if (query.settle_type) {
        if (query.settle_type == 1) dataSql.where('dstd.settle_pre_price', '>', 0) //发布效果
        if (query.settle_type == 2) dataSql.where('dstd.publish_pre_price', '>', 0) //一口价结算
    }
    if (query.payment_type) {
        if (query.payment_type == 'paid') dataSql.whereNotNull('dstd.payment_date')
        if (query.payment_type == 'unpaid') dataSql.whereNull('dstd.payment_date')
    }
    return dataSql
}
function searchTotalFilter(query, dataSql, account_type = 1) {
    if (query.start_date && query.end_date) { //日期范围
        dataSql.whereIn('dsp.date', getDaysBetweenDate(query.start_date, query.end_date))
    }
    if (query.keyword) { //关键词搜索
        let keyword = query.keyword.trim()
        dataSql.where(builder => {
            builder.where('kwd.id', 'like', `%${keyword}%`).orWhere('kwd.keyword', 'like', `%${keyword}%`)
            if (account_type == 3) builder.orWhere('dsp.account_id', 'like', `%${keyword}%`)
                .orWhere('cstn.name', 'like', `%${keyword}%`)
        })
    }
    if (query.blogger_id) dataSql.where('dsp.account_id', query.blogger_id) //博主查询
    if (query.content_type) dataSql.where('kwd.content_type', query.content_type) //内容类型
    if (query.settle_type) {
        if (query.settle_type == 1) dataSql.where('dsp.settle_pre_price', '>', 0) //发布效果
        if (query.settle_type == 2) dataSql.where('dsp.publish_pre_price', '>', 0) //一口价结算
    }
    return dataSql
}
module.exports = {
    total,
    settle_list
}