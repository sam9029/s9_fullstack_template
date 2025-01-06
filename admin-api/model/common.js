const config = require('../config');
const { TITLE_TABLE, MATERIAL_TABLE, SETTLEMENT_METHOD_TABLE, PLATFORM_TABLE,
    ADVERTISER_TABLE, TASK_TABLE, TITLE_CONTENT_TABLE, TASK_RELATION, TASK_FEEDBACK, PROMOTION_TABLE } = require('../config/setting')
const { selectName } = require('../utils/tools')
const { getLogData, insertLog } = require("./public/operationLog");
const knex = require('../db/knexManager').knexProxy
const tokenModel = require("../db/token")

const cloums = ['tsk.id', 'tsk.name', 'tsk.download_start_time', 'tsk.download_end_time', 'tsk.feedback_end_time', 'tsk.cover_url']
async function taskHall(req) {
    let user = await tokenModel.getUserInfo(req)
    let { query } = req || {}
    let retu = {
        code: 0,
        count: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    // console.log(user);
    let knexSql = knex.select(cloums)
        .select(knex.raw(`IF((tsk.general_budget_price = 0 AND tsk.remainder_budget_type = 1),NULL,(tsk.remainder_budget_price*100/tsk.general_budget_price) ) as remainder_budget_percent`))
        .from(`${TASK_TABLE} as tsk`)
        .where({ 'tsk.status': 1, 'tsk.publish_status': 2 })
    getTargetSql(user, knexSql)
    searchFilter(query, knexSql)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        .select(selectName('tsk', "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
        .select(selectName('tsk', "settle_type", SETTLEMENT_METHOD_TABLE, "name", "settle_type_name"))
        .select(knex.raw(`(SELECT GROUP_CONCAT(pat.name) as platform_names FROM ${PLATFORM_TABLE} as pat WHERE JSON_CONTAINS(tsk.platform_ids->'$[*]',JSON_ARRAY(pat.id))) as platform_names`))
        .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", 'desc')
    retu.data = retu.data.map(item => {
        item.platform_names = (item.platform_names || '').split(',')
        return item
    })
    return retu
}
async function taskDetial(req) {
    let user = await tokenModel.getUserInfo(req)
    let { query } = req || {}
    let retu = {
        code: 0,
        data: {},
    }
    if (!query.id) return Promise.reject('未设置任务详情ID！')
    let task_id = query.id
    let material_num_sql = knex(MATERIAL_TABLE).count('id as material_num').where({ task_id, status: 1 }).toString()
    let title_num_sql = knex(TITLE_TABLE).count('id as title_num').where({ task_id, status: 1 }).toString()
    let content_num_sql = knex(TITLE_CONTENT_TABLE).count('id as title_content_num').where({ task_id, status: 1 }).toString()
    let knexSql = knex.select(cloums)
        .select(knex.raw(`IF((tsk.general_budget_price = 0 AND tsk.remainder_budget_type = 1),NULL,(tsk.remainder_budget_price*100/tsk.general_budget_price) ) as remainder_budget_percent`))
        .select('tsk.describe', 'tsk.settle_rule')
        .select(knex.raw(`(${material_num_sql}) as material_num`))
        .select(knex.raw(`(${title_num_sql}) as title_num`))
        .select(knex.raw(`(${content_num_sql}) as title_content_num`))
        .from(`${TASK_TABLE} as tsk`)
        .where({ 'tsk.status': 1, 'tsk.publish_status': 2 })
        .where('tsk.id', query.id)
    getTargetSql(user, knexSql)
    // knexSql = handler.searchFilter(knexSql, query)
    retu.data = (await knexSql
        .select(selectName('tsk', "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
        .select(selectName('tsk', "settle_type", SETTLEMENT_METHOD_TABLE, "name", "settle_type_name"))
        .select(knex.raw(`(SELECT COUNT(tfb.id) FROM ${TASK_FEEDBACK} as tfb WHERE tfb.status = 1 AND tfb.task_id = tsk.id) as join_people_nums`))
        .select(knex.raw(`(SELECT GROUP_CONCAT(pat.name) as platform_names FROM ${PLATFORM_TABLE} as pat WHERE JSON_CONTAINS(tsk.platform_ids->'$[*]',JSON_ARRAY(pat.id))) as platform_names`))
        .select(selectName('tsk', "promotion_category", PROMOTION_TABLE, "name", "promotion_category_name"))
        .limit(1))[0]
    if (!retu.data) return Promise.reject('该任务不存在或已被删除！')
    let task_relation = await knex(TASK_RELATION).select('*').where({ task_id, status: 1 })
    retu.data.task_relation = task_relation
    retu.data.platform_names = (retu.data.platform_names || '').split(',')
    // retu.data = retu.data.map(item => {
    //     item.platform_ids = JSON.parse(item.platform_ids || '[]')
    //     item.platform_names = (item.platform_names||'').split(',')
    //     return item
    // })
    return retu
}
function searchFilter(query, knexSql) {
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('tsk.id', 'like', `%${keyword}%`).orWhere('tsk.name', 'like', `%${keyword}%`) //请输入任务关键字
        })
    }
    if (query.advertiser_type) knexSql.where('tsk.advertiser_type', query.advertiser_type) //广告主
    if (query.platform_id) knexSql.whereRaw(`JSON_CONTAINS( tsk.platform_ids, '${query.platform_id}')`) //发布平台
}
function getTargetSql(user, knexSql) {
    knexSql.where(builder => {
        if (user) { //登录时，根据用户定向拿
            const { gender, role_ids, platform_ids, platform_primary_ids } = user
            if (role_ids && (role_ids.includes(2) || role_ids.includes(3))) { //当角色为博主或投顾时，开始进行人员定向
                builder.where(builder1 => {
                    builder1.where({ 'tsk.target_type': 1 }).orWhere(builder2 => {
                        builder2.where({ 'tsk.target_type': 2 })
                            // .whereRaw(`(JSON_CONTAINS( tsk.gender_target, '${gender}', '$.allowed' ) = 1 OR JSON_CONTAINS( tsk.gender_target, '${gender}', '$.forbidden' ) = 0)`)
                            .where(builder3 => {
                                builder3.where(builder4 => {
                                    builder4.orWhereRaw(`JSON_LENGTH(tsk.platform_target,'$.allowed') <= 0`)
                                    platform_ids && platform_ids.forEach(i => {
                                        builder4.orWhereRaw(`JSON_CONTAINS( tsk.platform_target, '${i}', '$.allowed' ) = 1`)
                                    })
                                }).where(builder4 => {
                                    // builder4.whereRaw(`JSON_LENGTH(tsk.platform_target,'$.forbidden') > 0`)
                                    platform_ids && platform_ids.forEach(i => {
                                        builder4.whereRaw(`JSON_CONTAINS( tsk.platform_target, '${i}', '$.forbidden' ) = 0`)
                                    })
                                })
                            })
                            .where(builder3 => {
                                builder3.where(builder4 => {
                                    builder4.orWhereRaw(`JSON_LENGTH(tsk.platform_account_target,'$.allowed') <= 0`)
                                    platform_primary_ids && platform_primary_ids.forEach(i => {
                                        builder4.orWhereRaw(`JSON_CONTAINS( tsk.platform_account_target, '${i}', '$.allowed' ) = 1`)
                                    })
                                }).where(builder4 => {
                                    // builder4.whereRaw(`JSON_LENGTH(tsk.platform_account_target,'$.forbidden') > 0`)
                                    platform_primary_ids && platform_primary_ids.forEach(i => {
                                        builder4.whereRaw(`JSON_CONTAINS( tsk.platform_account_target, '${i}', '$.forbidden' ) = 0`)
                                    })
                                })
                            })
                    })
                })
            }
        } else {
            builder.where({ 'tsk.target_type': 1 }) //未登录时，拿开放的任务
        }
    })
}
module.exports = {
    taskHall,
    taskDetial
}