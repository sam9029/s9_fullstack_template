const knex = require("../../db/knexManager").knexProxy;
const { MKT_OPERATE_LOG, DATA_SETTLED, DATA_SPLIT, DATA_TABLE, DATA_SETTLE_TABLE, KEYWORD_FEEDBACK, KOC_KEYWORD, PLATFORM_ACCOUNT_TABLE, PAYMENT_RELATION_TABLE, MESSAGE_TABLE } = require("../../config/setting")
const { system_account_id } = require("../../config/index")
const { getLogData, insertLog } = require("./operationLog")
const { analysisSheet } = require("./upload")
const { knexTransaction, getImportDate } = require('../../utils/tools')
const moment = require('moment')
// const { dealSettledData } = require('../manage/finance/settlement/inProcessSettlement')

//关键词发布回填导入
async function updatePublishDate(body, userInfo) {
    let { url, advertiser_type = 8, option_type } = body || {} //现在更新为番茄畅听
    let { oem_id, id } = userInfo || {}
    if (!url) return Promise.reject('未选择导入文件！')
    if (!option_type) return Promise.reject('未设置操作类型！')
    if (!advertiser_type) return Promise.reject('未设置导入广告主！')
    if (option_type == 'verify') return await updateVerifyDate(body, userInfo)
    //关键词（必填） 媒体平台（下拉选择） 博主平台账户ID（必填） 作品链接（必填） 作品类型（下拉选择） 作品品类（下拉选择）
    const sheet_header = ['关键词（必填）', '博主平台账户ID（必填）', '作品链接（必填）', '发布日期']
    let sheet_data = await analysisSheet(url, sheet_header)
    let { success, fail } = hander.filterData(sheet_data)
    if (!sheet_data.length) return Promise.reject('数据读取异常！')
    let { success: filter_success, fail: filter_fail } = (await hander.getMapper(success, fail, advertiser_type))
    fail = filter_fail
    success = hander.filterImportDate(filter_success)
    // console.log(fail, success);
    let data = await knexTransaction(async (trx) => {
        let logs = []
        let all_data = success.map(async i => {
            let { keyword_old_data, keyword, kfb_old_data, kfb } = i
            await trx(KOC_KEYWORD).update(keyword).where('id', keyword.id)
            logs.push(getLogData(keyword.id, 5301, keyword, userInfo, keyword_old_data))
            await trx(KEYWORD_FEEDBACK).update(kfb).where('id', kfb.id)
            logs.push(getLogData(kfb.id, 5302, kfb, userInfo, kfb_old_data))
            return 'success'
        })
        await Promise.all(all_data)
        await insertLog(trx, logs)
        return success
    })
    return { code: 0, data, unmatch_data: fail }
}

async function updateVerifyDate(body, userInfo) {
    let { url, advertiser_type = 8, option_type } = body || {} //现在更新为番茄畅听
    let { oem_id, id } = userInfo || {}
    if (!url) return Promise.reject('未选择导入文件！')
    if (!option_type) return Promise.reject('未设置操作类型！')
    if (!advertiser_type) return Promise.reject('未设置导入广告主！')
    //关键词（必填） 媒体平台（下拉选择） 博主平台账户ID（必填） 作品链接（必填） 作品类型（下拉选择） 作品品类（下拉选择）
    const sheet_header = ['关键词（必填）', '审核日期']
    let sheet_data = await analysisSheet(url, sheet_header)
    let { success, fail } = hander.filterVerifyData(sheet_data)
    if (!sheet_data.length) return Promise.reject('数据读取异常！')
    let { success: filter_success, fail: filter_fail } = (await hander.getVerifyMapper(success, fail, advertiser_type))
    fail = filter_fail
    success = hander.filterVerifyDate(filter_success)
    // console.log(fail, success);
    let data = await knexTransaction(async (trx) => {
        let logs = []
        let all_data = success.map(async i => {
            let { keyword_old_data, keyword } = i
            await trx(KOC_KEYWORD).update(keyword).where('id', keyword.id)
            logs.push(getLogData(keyword.id, 5303, keyword, userInfo, keyword_old_data))
            return 'success'
        })
        await Promise.all(all_data)
        await insertLog(trx, logs)
        return success
    })
    return { code: 0, data, unmatch_data: fail }
}
// 修改异常通用词数据
// {"keyword_type": 1, "owner_user_id": 10007104, "distribute_time": "2022-04-21 12:23:40"}
async function updateAbnormalKeyword() {
    let data = await knex.select('relation_id as keyword_id', 'before_data').from(MKT_OPERATE_LOG).whereIn('operation_type', [2056, 2057])
    let keyword_ids = data.map(i => i.keyword_id)
    if (!keyword_ids.length) return Promise.reject('无异常数据！')
    let mapper = {}
    data.map(i => {
        mapper[i.keyword_id] = JSON.parse(i.before_data || '{}')
    })
    let keywordSql = knex.select('kwd.id', 'kwd.expire_date')
        .count('kfb.id as feedback_num') //作品反馈数量，包括删除的
        .from(`${KOC_KEYWORD} as kwd`)
        .leftJoin(`${KEYWORD_FEEDBACK} as kfb`, builder => {
            builder.on('kwd.id', '=', 'kfb.keyword_id')
                .andOn('kwd.period', '=', 'kfb.period')
                .andOn('kfb.verify_status', '!=', 3)
        }).where({ keyword_type: 2 })
        .groupBy('kwd.id')
        .havingRaw(`(CURDATE() <= DATE(kwd.expire_date) OR feedback_num > 0 )`)
    // console.log(keywordSql.toString());
    let keyword_data = (await keywordSql).map(i => i.id)
    if (!keyword_data.length) return Promise.reject('无异常数据！')
    for (let index = 0; index < keyword_data.length; index++) {
        const keyword_id = keyword_data[index];
        let old_data = mapper[keyword_id]
        if (old_data) await knex(KOC_KEYWORD).update(old_data).where('id', keyword_id)
    }
    // console.log(mapper, keyword_data);
    return { code: 0, data: "操作成功" }
}
const hander = {
    filterVerifyData(data = []) {
        let filter = data.map(item => {
            return {
                keyword: String(item['关键词（必填）'] || '').trim(),
                verify_feedback_time: item['审核日期'] ? getImportDate(item['审核日期']) : null
            }
        })
        let back = {
            success: [],
            fail: []
        }
        filter.forEach(item => {
            if (!item.keyword) {
                back.fail.push({ ...item, reason: "未填写关键词" })
            } else if (!item.verify_feedback_time) {
                back.fail.push({ ...item, reason: "未填写审核日期" })
            } else {
                back.success.push({ ...item })
            }
        })
        return back
    },
    filterData(data = []) {
        let filter = data.map(item => {
            return {
                keyword: String(item['关键词（必填）'] || '').trim(),
                platform_account_id: String(item['博主平台账户ID（必填）'] || '').trim(),
                opus_url: String(item['作品链接（必填）'] || '').trim(),
                publish_date: item['发布日期'] ? getImportDate(item['发布日期']) : null,
                verify_feedback_time: item['审核日期'] ? getImportDate(item['审核日期']) : null
            }
        })
        let back = {
            success: [],
            fail: []
        }
        filter.forEach(item => {
            if (!item.keyword) {
                back.fail.push({ ...item, reason: "未填写关键词" })
            } else if (!item.platform_account_id) {
                back.fail.push({ ...item, reason: "未填写博主平台账号ID" })
            } else if (!item.opus_url) {
                back.fail.push({ ...item, reason: "未填写作品链接" })
            } else if (!item.publish_date) {
                back.fail.push({ ...item, reason: "未填写发布日期" })
            } else if (!item.verify_feedback_time) {
                back.fail.push({ ...item, reason: "未填写审核日期" })
            } else {
                back.success.push({ ...item })
            }
        })
        return back
    },
    async getMapper(success = [], fail = [], advertiser_type = 2) {
        const ConcurrentNum = 30
        let select_cloums = [
            'kwd.id',
            'kwd.keyword',
            'kwd.content_type',
            'kwd.create_time',
            'kwd.create_date',
            'kwd.verify_time',
            'kwd.verify_feedback_time', //`` 发布状态
            'kwd.expire_date',
            'kwd.distribute_time',
            'kwd.publish_status',
            'kwd.configure_status',

            'kfb.id as kfb_id',
            'kfb.opus_url as opus_url',
            'kfb.create_time as kfb_create_time',
            'kfb.create_date as kfb_create_date',
            'kfb.verify_time as kfb_verify_time',
            'kfb.verify_status as kfb_verify_status',
            'kfb.verify_feedback_time as kfb_verify_feedback_time', //`` 发布状态
            'kfb.expire_date as kfb_expire_date',
            'kfb.publish_date as kfb_publish_date',
            'kfb.configure_status as kfb_configure_status',
            'acc.platform_account_id as platform_account_id',
        ]
        let len = Math.ceil(success.length / ConcurrentNum)
        let mapper = {}
        for (let index = 0; index < len; index++) {
            console.log(`数据一共有${len}组，正在获取数据第${index + 1}组`)
            let be_select = success.slice(index * ConcurrentNum, (index + 1) * ConcurrentNum)
            let word_data = await knex.select(select_cloums)
                .from(`${KOC_KEYWORD} as kwd`)
                .leftJoin(`${KEYWORD_FEEDBACK} as kfb`, builder => {
                    builder.on('kwd.id', '=', 'kfb.keyword_id').andOn('kwd.period', '=', 'kfb.period')
                })
                .leftJoin(`${PLATFORM_ACCOUNT_TABLE} as acc`, 'acc.id', 'kfb.platform_account_id')
                .where(builder => {
                    be_select.forEach(element => {
                        // knex.raw(`(kwd.keyword = '${element.keyword}' AND kfb.opus_url = '${element.opus_url}')`)
                        builder.orWhere(builder2 => {
                            builder2.where({ 'kwd.keyword': element.keyword, 'kfb.opus_url': element.opus_url })
                        })
                    });
                })
                .where('kwd.advertiser_type', advertiser_type)
                .where('kfb.status', 1)
            // console.log(word_data.toString());
            word_data.forEach(element => {
                let unique_key = `${element.opus_url}@${element.keyword}`
                mapper[unique_key] = element
            });

        }
        let back_success = []
        success.forEach(item => {
            let unique_key = `${item.opus_url}@${item.keyword}`
            let mapper_item = mapper[unique_key]
            if (!mapper_item) {
                fail.push({ ...item, reason: "作品链接在发布词库内不存在！" })
            } else if (mapper_item.keyword != item.keyword) {
                fail.push({ ...item, reason: `关键词匹配错误：原【${mapper_item.keyword}】,现【${item.keyword}】` })
            } else if (item.platform_account_id != mapper_item.platform_account_id) {
                fail.push({ ...item, reason: `博主平台账号ID匹配错误：原【${mapper_item.platform_account_id}】,现【${item.platform_account_id}】` })
            } else {
                back_success.push({ ...mapper_item, import_publish_date: item.publish_date, import_verify_feedback_time: item.verify_feedback_time })
            }
        })
        return { success: back_success, fail }
    },
    async getVerifyMapper(success = [], fail = [], advertiser_type = 2) {
        const ConcurrentNum = 30
        let select_cloums = [
            'kwd.id',
            'kwd.keyword',
            'kwd.content_type',
            'kwd.create_time',
            'kwd.create_date',
            'kwd.verify_time',
            'kwd.verify_feedback_time', //`` 发布状态
            'kwd.expire_date',
            'kwd.distribute_time',
        ]
        let len = Math.ceil(success.length / ConcurrentNum)
        let mapper = {}
        for (let index = 0; index < len; index++) {
            console.log(`数据一共有${len}组，正在获取数据第${index + 1}组`)
            let be_select = success.slice(index * ConcurrentNum, (index + 1) * ConcurrentNum)
            let word_data = await knex.select(select_cloums)
                .from(`${KOC_KEYWORD} as kwd`)
                .where(builder => {
                    be_select.forEach(element => {
                        builder.orWhere(builder2 => {
                            builder2.where({ 'kwd.keyword': element.keyword })
                        })
                    });
                })
                .where('kwd.advertiser_type', advertiser_type)
            // console.log(word_data.toString());
            word_data.forEach(element => {
                let unique_key = `${element.keyword}`
                mapper[unique_key] = element
            });

        }
        let back_success = []
        success.forEach(item => {
            let unique_key = `${item.keyword}`
            let mapper_item = mapper[unique_key]
            if (!mapper_item) {
                fail.push({ ...item, reason: "关键词不存在！" })
            } else if (mapper_item.keyword != item.keyword) {
                fail.push({ ...item, reason: `关键词匹配错误：原【${mapper_item.keyword}】,现【${item.keyword}】` })
            } else {
                back_success.push({ ...mapper_item, import_verify_feedback_time: item.verify_feedback_time })
            }
        })
        return { success: back_success, fail }
    },
    filterImportDate(success = []) {
        let time_filterd = success.map(i => {
            let new_date = i.publish_date
            let new_time = `${i.publish_date} 07:00:00`
            let create_or_publish = i.publish_date < i.create_date
            let new_item = {
                keyword_old_data: {
                    id: i.id,
                    create_time: i.create_time,
                    create_date: i.new_date,
                    verify_time: i.verify_time,
                    verify_feedback_time: i.verify_feedback_time,
                    expire_date: i.expire_date,
                    distribute_time: i.distribute_time,
                    configure_status: i.configure_status,
                    publish_status: i.publish_status
                },
                keyword: {
                    id: i.id,
                    create_time: create_or_publish ? new_time : i.create_time,
                    create_date: create_or_publish ? new_date : i.new_date,
                    verify_time: create_or_publish ? moment(new_time).add(1, "hours").format("YYYY-MM-DD HH:mm:ss") : i.verify_time,
                    verify_feedback_time: create_or_publish ? moment(new_time).add(2, "hours").format("YYYY-MM-DD HH:mm:ss") : i.verify_feedback_time,
                    expire_date: moment(i.publish_date).add(13, "days").format("YYYY-MM-DD"),
                    distribute_time: create_or_publish ? moment(new_time).add(3, "hours").format("YYYY-MM-DD HH:mm:ss") : i.distribute_time,
                    configure_status: 2,
                    publish_status: 5
                },
                kfb_old_data: {
                    id: i.kfb_id,
                    create_time: i.kfb_create_time,
                    create_date: i.kfb_create_date,
                    verify_time: i.kfb_verify_time,
                    verify_feedback_time: i.kfb_verify_feedback_time,
                    expire_date: i.kfb_expire_date,
                    publish_date: i.kfb_publish_date,
                    verify_status: i.kfb_verify_status,
                    configure_status: i.kfb_configure_status
                },
                kfb: {
                    id: i.kfb_id,
                    create_time: create_or_publish ? moment(new_time).add(4, "hours").format("YYYY-MM-DD HH:mm:ss") : i.kfb_create_time,
                    create_date: create_or_publish ? new_date : i.kfb_create_date,
                    verify_time: create_or_publish ? moment(new_time).add(5, "hours").format("YYYY-MM-DD HH:mm:ss") : i.kfb_verify_time,
                    verify_feedback_time: create_or_publish ? moment(new_time).add(6, "hours").format("YYYY-MM-DD HH:mm:ss") : i.kfb_verify_feedback_time,
                    expire_date: moment(new_date).add(13, "days").format("YYYY-MM-DD"),
                    publish_date: new_date,
                    verify_status: 2,
                    configure_status: 2
                }
                // kfb: {
                //     id: i.kfb_id,
                //     create_time: moment(new_time).add(4, "hours").format("YYYY-MM-DD HH:mm:ss"),
                //     create_date: new_date,
                //     verify_time: moment(new_time).add(5, "hours").format("YYYY-MM-DD HH:mm:ss"),
                //     verify_feedback_time: moment(new_time).add(6, "hours").format("YYYY-MM-DD HH:mm:ss"),
                //     expire_date: moment(i.import_verify_feedback_time).add(59, "days").format("YYYY-MM-DD"),//moment(new_date).add(13, "days").format("YYYY-MM-DD"),
                //     publish_date: new_date,
                //     verify_status: 2,
                //     configure_status: 2
                // }
            }
            return new_item
        })
        return time_filterd
    },
    filterVerifyDate(success = []) {
        let time_filterd = success.map(i => {
            let new_date = i.import_verify_feedback_time
            let new_time = `${i.import_verify_feedback_time} 07:00:00`
            let create_or_publish = i.import_verify_feedback_time < i.create_date
            let new_item = {
                keyword_old_data: {
                    id: i.id,
                    create_time: i.create_time,
                    create_date: i.new_date,
                    verify_time: i.verify_time,
                    verify_feedback_time: i.verify_feedback_time,
                    expire_date: i.expire_date,
                    distribute_time: i.distribute_time,
                },
                keyword: {
                    id: i.id,
                    create_time: create_or_publish ? new_time : i.create_time,
                    create_date: create_or_publish ? new_date : i.new_date,
                    verify_time: create_or_publish ? moment(new_time).add(1, "hours").format("YYYY-MM-DD HH:mm:ss") : i.verify_time,
                    verify_feedback_time: moment(new_time).add(1, "hours").format("YYYY-MM-DD HH:mm:ss"), //create_or_publish ? moment(new_time).add(2, "hours").format("YYYY-MM-DD HH:mm:ss") : i.verify_feedback_time,
                    expire_date: moment(i.import_verify_feedback_time).add(59, "days").format("YYYY-MM-DD"),
                    distribute_time: create_or_publish ? moment(new_time).add(3, "hours").format("YYYY-MM-DD HH:mm:ss") : i.distribute_time,
                }
            }
            return new_item
        })
        return time_filterd
    }
}
// updateAbnormalKeyword()
// updatePublishDate({ "url": "https://koc-img.domain.cn/E1E6082A38B1430F8A665B961A67A64D.xlsx", "advertiser_type": 2 }, { id: 10000001, oem_id: 1 })
async function addBeforePayLog() {
    let advertiser_type = 2
    const payment_date = '2022-06-20'
    let constant_sql = knex.select('dstd.advertiser_type', 'dstd.consultant_id as account_id', 'dstd.date')
        .select(knex.raw(`dstd.total_service_price as income`))//投顾的服务费
        .select('dstd.data_id', 'dstd.data_settle_id')
        .from(`${DATA_SETTLED} as dstd`)
        .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dstd.data_id')
        .where({ 'dat.advertiser_type': advertiser_type, 'dat.status': 1 })
        .where('dstd.consultant_id', '!=', 'dstd.blogger_id')
        .where('dstd.date', '<=', payment_date)

    let blogger_sql1 = knex.select('dstd.advertiser_type', 'dstd.blogger_id as account_id', 'dstd.date')
        .select(knex.raw(`(dstd.total_publish_price + dstd.total_settle_price) as income`))//博主的发布费
        .select('dstd.data_id', 'dstd.data_settle_id')
        .from(`${DATA_SETTLED} as dstd`)
        .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dstd.data_id')
        .where({ 'dat.advertiser_type': advertiser_type, 'dat.status': 1 })
        .where(builder => {
            builder.where('dstd.consultant_id', '!=', 'dstd.blogger_id').orWhereNull('dstd.consultant_id')
        })
        .where('dstd.date', '<=', payment_date)

    let blogger_sql2 = knex.select('dstd.advertiser_type', 'dstd.blogger_id as account_id', 'dstd.date')
        .select(knex.raw(`dstd.total_price as income`))//博主的发布费
        .select('dstd.data_id', 'dstd.data_settle_id')
        .from(`${DATA_SETTLED} as dstd`)
        .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dstd.data_id')
        .where({ 'dat.advertiser_type': advertiser_type, 'dat.status': 1 })
        .where('dstd.consultant_id', '=', 'dstd.blogger_id')
        .where('dstd.date', '<=', payment_date)

    let data = await knex.select("t.advertiser_type", "t.account_id", 't.data_id', 't.data_settle_id', 't.date')
        .select(knex.raw(`(IFNULL(SUM(t.income), 0)) as income`))
        .from(knex.raw(`(${knex.unionAll([constant_sql, blogger_sql1, blogger_sql2]).toString()}) as t`))
        .groupBy("t.advertiser_type", "t.account_id", 't.data_id', 't.data_settle_id', 't.date')
    await knex(DATA_SETTLED).update({ payment_date }).where('date', '<=', payment_date).whereNull('payment_date')
    await knex(DATA_SETTLE_TABLE).update({ payment_date }).whereIn('data_id', data.map(i => i.data_id)).whereNull('payment_date')
    await knex(PAYMENT_RELATION_TABLE).where({ payment_id: 1 }).del()
    let relation_data = data.map(item => {
        return {
            data_settle_id: item.data_settle_id,
            data_id: item.data_id,
            date: item.date,
            payment_id: 1,
            owner_user_id: item.account_id,
            collection_id: null,
            settle_payment: item.income,
            total_payment: item.income,
            oem_id: 1,
            create_user_id: system_account_id,
            update_user_id: system_account_id
        }
    })
    // console.log(relation_data);
    await knex(PAYMENT_RELATION_TABLE).insert(relation_data)
    return { code: 0, data: 'success' }
}
async function addBeforeSplitData(body) {
    let { dst_id } = body || {}
    if (!dst_id) return Promise.reject('无标识dst_id!')
    await knex(DATA_SPLIT).where('data_settle_id', '<=', dst_id).del()
    let data_settle = await knex(DATA_SETTLED).distinct('data_settle_id', 'payment_date').where('data_settle_id', '<=', dst_id)
    let data_settle_ids = data_settle.map(i => i.data_settle_id)
    if (data_settle_ids.length) await dealSettledData(data_settle_ids, { id: system_account_id, oem_id: 1 }, knex, false)
    data_settle = data_settle.map(async item => {
        return await knex(DATA_SPLIT).update({ payment_date: item.payment_date }).where('data_settle_id', item.data_settle_id)
    })
    await Promise.all(data_settle)
    return { code: 0, data: 'success' }
}
async function editMeaasge() {
    let data = await knex(MESSAGE_TABLE).select('raw_message', 'receiver_user_id', 'id').where({ sub_type: 401, status: 2 })
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        let item = await knex(MESSAGE_TABLE).select('id')
            .where({ sub_type: 401, raw_message: element.raw_message, receiver_user_id: element.receiver_user_id })
            .whereNot('id', element.id)
        console.log(index, item.length);
        if (!item.length) await knex(MESSAGE_TABLE).update({ status: 1 }).where('id', element.id)
    }
}
// editMeaasge()
module.exports = {
    updatePublishDate,
    updateAbnormalKeyword,
    addBeforePayLog,
    addBeforeSplitData
}