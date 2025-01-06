const knex = require('../../../../db/knexManager').knexProxy;
const { ACCOUNT_TABLE, KOC_KEYWORD, KEYWORD_FEEDBACK, SUBJECT_TABLE, BUSINESS_TYPE_TABLE, ADVERTISER_TABLE } = require('../../../../config/setting');
const { getUuid, knexTransaction, getImportDate } = require("../../../../utils/tools");
const { insertLog, getLogData } = require("../../../public/operationLog")
const moment = require("moment");
const { getPermission } = require("../../../public/permission")
const { analysisSheet } = require('../../../public/upload');

async function list(query, userInfo) {
    let { oem_id } = userInfo || {}
    let retu = {
        code: 0,
        count: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let select_cloums = ['bus.*']
    let knexSql = knex.select(select_cloums)
        .from(`${BUSINESS_TYPE_TABLE} as bus`)
        .where({ "bus.oem_id": oem_id, status: 1 }) //

    // let accountIds = await getPermission(query, userInfo);
    // if (accountIds.length) knexSql.whereIn('bus.create_user_id', accountIds).orWhereIn('bus.update_user_id', accountIds)
    knexSql = handler.searchFilter(knexSql, query)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        .select(handler.selectName('bus', ADVERTISER_TABLE, "advertiser_type", "name", "advertiser_name"))
        .select(handler.selectName('bus', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
        .select(handler.selectName('bus', ACCOUNT_TABLE, "update_user_id", "name", "update_user_name"))
        .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", 'desc')

    return retu
}
async function importBusiness(body, userInfo) {
    let { url, advertiser_type } = body || {}
    if (!url) return Promise.reject('未设置导入文件！')
    if (!advertiser_type) return Promise.reject("未设置广告主类型advertiser_type！");
    let data = await analysisSheet(url, ['作品名', '禁投起始日期'])
    if (!data || !data.length) return Promise.reject('导入数据为空！')
    data = data.map(i => {
        let start_date = i['禁投起始日期'] || null
        let end_date = i['禁投截止日期'] || null
        if (start_date) start_date = getImportDate(start_date)
        if (end_date) end_date = getImportDate(end_date)
        return {
            book_name: i['作品名'] || null,
            start_date,
            end_date,
        }
    })
    return await add({ data, advertiser_type }, userInfo)
}
async function add(body = {}, userInfo) {
    let data = handler.checkData(body, userInfo, 'add')
    let { name, advertiser_type } = data || {}
    const { oem_id } = userInfo || {}
    let before_data = (await knex(BUSINESS_TYPE_TABLE).select('id').where({ advertiser_type, oem_id, name }))[0]
    if (before_data) return Promise.reject(`业务品类「${name}」已存在，请勿重复添加！`);
    let back = await knexTransaction(async (trx) => {
        let id = (await trx(BUSINESS_TYPE_TABLE).insert(data))[0]
        await insertLog(trx, getLogData(id, 3311, data, userInfo))
        return id
    })
    return {
        code: 0,
        data: back
    }
}
async function check(book_name = '', advertiser_type = 1, oem_id = '', back_error = true) {
    if (!book_name || !advertiser_type || !oem_id) return Promise.reject('缺少查询信息！')
    let data = (await knex(BUSINESS_TYPE_TABLE).select('id')
        .where({ book_name, advertiser_type, oem_id })
        .whereRaw(`start_date <= curdate()`).where(builder => {
            builder.whereRaw(`end_date >= curdate()`).orWhereNull('end_date')
        })
    )[0]
    if (data && back_error) return Promise.reject(`该作品「${book_name}」已被禁投`)
    if (data && !back_error) return `该作品：「${book_name}」已被禁投`
    return null
}
async function checkBookName(body = {}, userInfo = {}) {
    const { book_name, advertiser_type } = body || {}
    const { oem_id } = userInfo || {}
    let data = await check(book_name, advertiser_type, oem_id, false)
    return {
        code: 0,
        data
    }
}
async function edit(body, userInfo) {
    let data = handler.checkData(body, userInfo, 'edit')
    const { ids } = body || {}
    if (!ids || !ids.length) return Promise.reject('未设置待修改的业务品类！')
    const { oem_id } = userInfo || {}
    let before_data = await knex(BUSINESS_TYPE_TABLE).select('*').where({ oem_id }).whereIn('id', ids)
    let mapper = {}
    before_data.forEach(element => {
        mapper[element.id] = element
    });
    let back = await knexTransaction(async (trx) => {
        let log_data = await Promise.all(ids.map(async id => {
            await trx(BUSINESS_TYPE_TABLE).update(data).where({ id })
            return getLogData(id, 3312, data, userInfo, mapper[id] || {})
        }))
        await insertLog(trx, log_data.filter(i => i.relation_id))
        return ids
    })
    return {
        code: 0,
        data: back
    }
}

let handler = {
    checkData(body = {}, userInfo = {}, type = "add") {
        let user_id = userInfo.id
        let checkKeys = ['name', 'advertiser_type', 'template']
        let dataKeys = ['status']
        let data = {}
        if (type == "add") {
            data = {
                create_user_id: user_id,
                update_user_id: user_id,
                oem_id: userInfo.oem_id || 1
            }
            checkKeys.forEach(key => {
                if (!body[key]) throw new Error(`字段${key}参数不合法！请检查参数`)
                data[key] = body[key]
            })
        } else if (type == "edit") {
            data = { update_user_id: user_id }
        }
        checkKeys.concat(dataKeys).forEach(key => {
            if (Object.hasOwnProperty.call(body, key)) data[key] = body[key]
        })
        return data
    },
    selectName(idTable, nameTable, idFiled, nameFiled = "name", asFiled) {
        return knex.raw(`(SELECT p.${nameFiled} FROM ${nameTable} p where ${idTable}.${idFiled} = p.id  LIMIT 0, 1 ) as ${asFiled}`)
    },
    searchFilter(knexSql, query = {}) {
        if (!query.status) knexSql.whereIn('bus.status', [1, 2])
        if (query.status) knexSql.where('bus.status', query.status)
        if (query.advertiser_type) knexSql.where('bus.advertiser_type', query.advertiser_type)
        if (query.name) {
            let name = query.name.trim()
            knexSql.where('bus.name', 'like', `%${name}%`)
        }

        if (query.create_user_id) knexSql.where('bus.create_user_id', query.create_user_id)
        if (query.create_user_ids && query.create_user_ids.length) knexSql.whereIn('bus.create_user_id', query.create_user_ids)

        if (query.update_user_id) knexSql.where('bus.update_user_id', query.update_user_id)
        if (query.update_user_ids && query.update_user_ids.length) knexSql.whereIn('bus.update_user_id', query.update_user_ids)
        return knexSql
    },
}
module.exports = {
    list,
    edit,
    add
}