const knex = require("../../db/knexManager").knexProxy;
const { AUTOMATIC_RULE, ACCOUNT_TABLE } = require("../../config/setting")
const { STATUS_MAPPER } = require('../../utils/mapper')
const { getLogData, insertLog } = require("./operationLog")
const { knexTransaction } = require('../../utils/tools')
const jsonKeys = ['rules', 'operation_time']

//规则列表
exports.list = async (query, userInfo) => {
    let retu = {
        code: 0,
        count: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
    }
    let { oem_id } = userInfo || {}
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('amr.*').from(`${AUTOMATIC_RULE} as amr`).where({ 'amr.oem_id': oem_id })
    handler.searchFilter(knexSql, query)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        .select(handler.selectName('amr', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
        .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", 'desc')
    retu.data = retu.data.map(item => {
        jsonKeys.forEach(key => {
            item[key] = JSON.parse(item[key])
        })
        return item
    })
    return retu

}
//自动规则新增
exports.add = async (body, userInfo = {}) => {
    let newData = handler.checkData(body, userInfo)
    let { oem_id, advertiser_id, operation_object } = newData
    let beforeData = (await knex(AUTOMATIC_RULE).select('id', 'advertiser_id', 'status', 'name')
        .where({ oem_id, advertiser_id, operation_object }).limit(1))[0]
    if (beforeData) return Promise.reject(`存在状态【${STATUS_MAPPER[beforeData.status]}】的相同规则【${beforeData.name}】，请勿重复操作，重新启用修改即可`)
    let data = await knexTransaction(async (trx) => {
        let back_id = (await trx(AUTOMATIC_RULE).insert(newData))[0]
        await insertLog(trx, getLogData(back_id, 2054, newData, userInfo))
        return back_id
    })
    return { code: 0, data }
};

//自动规则修改
exports.save = async (body, userInfo = {}) => {
    let id = body.id || body.ids || null
    if (!id) return Promise.reject('未设置修改数据')
    let newData = handler.checkData(body, userInfo, "edit")
    let rules_data = await knex(AUTOMATIC_RULE).select('*').where(builder => {
        if (id.constructor === Array) builder.whereIn('id', id)
        else builder.where({ id })
    })
    let data = await knexTransaction(async (trx) => {
        let ids = rules_data.map(i => i.id)
        await trx(AUTOMATIC_RULE).update(newData).whereIn('id', ids)
        let log_data = rules_data.map(item => {
            return getLogData(item.id, 2055, newData, userInfo, item)
        })
        await insertLog(trx, log_data)
        return ids
    })
    return { code: 0, data }
};

let handler = {
    selectName(idTable, nameTable, idFiled, nameFiled = "name", asFiled) {
        return knex.raw(`(SELECT p.${nameFiled} FROM ${nameTable} p where ${idTable}.${idFiled} = p.id  LIMIT 0, 1 ) as ${asFiled}`)
    },
    searchFilter(knexSql, query = {}) {
        if (!query.status) knexSql.whereIn('amr.status', [1, 2])
        if (query.status) knexSql.where('amr.status', query.status)
        if (query.advertiser_id) knexSql.where('amr.advertiser_id', query.advertiser_id)
        if (query.advertiser_ids && query.advertiser_ids.length) knexSql.whereIn('amr.advertiser_id', query.advertiser_ids)
        if (query.operation_object) knexSql.where('amr.operation_object', query.operation_object)
        if (query.operation) knexSql.where('amr.operation', query.operation)
        if (query.id) knexSql.where('amr.id', query.id)
        if (query.keyword) {
            let keyword = query.keyword.trim()
            knexSql.where(builder => {
                builder.where('amr.id', 'like', `${keyword}%`).orWhere('amr.name', 'like', `${keyword}%`)
            })
        }
        return knexSql
    },
    checkRule(rules = []) {
        let checkKeys = ['days', 'condition', 'type']
        let back = rules.map(rlue => {
            let data_item = {}
            checkKeys.forEach(key => {
                if (!rlue[key]) throw new Error(`字段${key}参数不合法！请检查参数`)
                if (key == 'days' && rlue[key] < 1) throw new Error(`字段${key}参数不合法！请检查参数`)
                if (key == 'condition' && !['>', '>='].includes(rlue[key])) throw new Error(`字段${key}参数不合法！请检查参数`)
                if (key == 'type' && !['APPROVED_UNDISTRIBUTE', 'DISTRIBUTED_UNPUBLISH', 'EXPIRED_UNREPUBLISHED', 'VERIFYED_BEPUBLISHED'].includes(rlue[key])) throw new Error(`字段${key}参数不合法！请检查参数`)
                data_item[key] = rlue[key]
            })
            return data_item
        })
        return back
    },
    checkData(body = {}, userInfo = {}, type = "add") {
        let { id, oem_id } = userInfo || {}
        let checkKeys = ['name', 'advertiser_id', 'operation_object', 'operation', 'operation_time', 'send_message', 'send_repeat', 'rules']
        let dataKeys = ['rules', 'status']
        let data = {}
        if (type == "add") {
            data = {
                create_user_id: id,
                update_user_id: id,
                oem_id
            }
            checkKeys.forEach(key => {
                if (!body[key]) throw new Error(`字段${key}参数不合法！请检查参数`)
                data[key] = body[key]
            })
        } else if (type == "edit") {
            data = { update_user_id: id }
        }
        if (body.rules) body.rules = this.checkRule(body.rules)
        checkKeys.concat(dataKeys).forEach(key => {
            if (Object.hasOwnProperty.call(body, key)) {
                if (jsonKeys.includes(key)) data[key] = JSON.stringify(body[key])
                else data[key] = body[key]
            }
        })
        return data
    }
}