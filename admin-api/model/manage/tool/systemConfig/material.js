const knex = require('../../../../db/knexManager').knexProxy;
const { KOC_MATERIAL_CONFIG } = require('../../../../config/setting');
const { GetAccountMapper } = require("../../../../utils/apiMapper");
const { onlyControlInterface } = require("../../../public/permission")
const { knexTransaction } = require("../../../../utils/tools")
const { insertLog, getLogData } = require("../../../public/operationLog")
const { access_user } = require("../../../../utils/marking");
const moment = require("moment");


async function list(query, userInfo) {
  if (query.interface_id) await onlyControlInterface(query, userInfo);
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  }
  let knexSql = knex(KOC_MATERIAL_CONFIG).select('*')
  if (query.status) {
    knexSql.where('status', query.status)
  } else {
    knexSql.whereIn('status', [1, 2])
  }
  // knexSql = handler.searchFilter(knexSql, query);
  let count = await knex.count({ count: "*" }).from(knex.raw(`(${knexSql.toQuery().replace(/`/g, '')}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;
  knexSql.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", "desc");
  let back = await knexSql
  let accountMapper = await GetAccountMapper();
  retu.data = back.map(item => {
    item.create_user_name = accountMapper[item.create_user_id];
    item.update_user_name = accountMapper[item.update_user_id];
    return item
  })
  return retu
}

async function add(body, userInfo) {
  if (!body || !body.type) throw new Error('请传入素材类型！')
  let retu = {
    message: "添加成功",
    code: 0,
    data: null
  }
  let checkData = await knex(KOC_MATERIAL_CONFIG).select('*').where('type', body.type).andWhere('oem_id', userInfo.oem_id);
  if (checkData.length && checkData[0].status == 1) throw new Error(`该素材限制已存在，请勿重复添加！`)
  let { type, size } = body;
  await knexTransaction(async (trx) => {
      let insertObj = {
        type,
        size,
        create_user_id: userInfo.id,
        update_user_id: userInfo.id,
        create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
        oem_id: userInfo.oem_id || 1,
      }
      let id = (await trx(KOC_MATERIAL_CONFIG).insert(insertObj))[0]
      retu.data = id
      await insertLog(trx, getLogData(id, 3471, insertObj, userInfo))
      retu.data = id
  })
  return retu
}

async function edit(body, userInfo) {
  if (!body || !body.id) throw new Error("请传入要修改的配置ID")
  // await handler.checkUser(userInfo, '编辑')
  let retu = {
    message: "修改成功",
    code: 0,
  }
  let oldData = await knex(KOC_MATERIAL_CONFIG).select('*').where('id', body.id)
  if (!oldData.length) throw new Error('未查询到改规则！')
  await knexTransaction(async (trx) => {
    let { type, size } = body
    let updateObj = {
      type,
      size,
      update_user_id: userInfo.id
    }
    await trx(KOC_MATERIAL_CONFIG).update(updateObj).where('id', body.id)
    await insertLog(trx, getLogData(body.id, 3472, updateObj, userInfo, oldData[0]))
  })
  return retu
}

async function updateStatus(body, userInfo) {
  let { status, ids } = body || {}
  if (!ids) return Promise.reject('未设置规则ID')
  if (!Array.isArray(ids)) return Promise.reject('ids为数组')
  if (!status) return Promise.reject('未设置状态status')
  // await handler.checkUser(userInfo, '更新状态')
  let checkData = await knex(KOC_MATERIAL_CONFIG).select("id", 'status', 'update_user_id').whereIn("id", body.ids)
  if (!checkData.length) return Promise.reject("未查询到该条规则");
  await knexTransaction(async (trx) => {
    await trx(KOC_MATERIAL_CONFIG).update({ status: status, update_user_id: userInfo.id }).whereIn('id', checkData.map(item => item.id))
    let log_data = checkData.map(item => {
      return getLogData(item.id, 3472, { status: status, update_user_id: userInfo.id }, userInfo, { status: item.status, update_user_id: item.update_user_id })
    })
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: "更新成功"
  }
}

async function del(body, userInfo) {
  if (!body || !body.ids) throw new Error("未设置要删除的规则ID")
  if (!Array.isArray(body.ids)) throw new Error('ids为数组，请检查参数')
  // await handler.checkUser(userInfo, '删除')
  let checkData = await knex(KOC_MATERIAL_CONFIG).select("id", 'status').whereIn("id", body.ids).where("status", "!=", 3);
  if (!checkData.length) throw new Error("未查询到配置信息");
  await knexTransaction(async (trx) => {
    await trx(KOC_MATERIAL_CONFIG)
      .update({ status: 3 })
      .whereIn(
        "id",
        checkData.map((i) => i.id)
      )
    let log_data = checkData.map(item => {
      return getLogData(item.id, 3473, { status: 3 }, userInfo, { status: item.status })
    })
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: "删除成功",
  };
}

async function def(query, userInfo) {
  if (!query || !query.id) throw new Error("请传入要查询的品类ID")
  let retu = {
    code: 0,
    data: {}
  }
  let knexSql = knex(KOC_MATERIAL_CONFIG).select('*').where('id', query.id)
  let back = await knexSql
  if (!back.length) throw new Error('暂未查询到配置信息')
  let accountMapper = await GetAccountMapper();
  back = back.map(item => {
    item.create_user_name = accountMapper[item.create_user_id];
    item.update_user_name = accountMapper[item.update_user_id];
    return item
  })
  retu.data = back[0]
  return retu
}

let handler = {
  searchFilter(knexSql, query) {
    if (query.keyword) {
      knexSql.whereRaw(`name like '${query.keyword}' or id = ${query.keyword}`)
    }
    return knexSql;
  },
  //校验是否是超管/access_user
  checkUser(userInfo, type = "新增") {
    // let flag = userInfo.role_ids.split(',').includes('1') || access_user.includes(userInfo.id)
    // if (!flag) throw new Error(`暂无${type}品类权限`)
  }
}

async function config(query, userInfo) {
  let type = query.type || 1;
  let data = await knex(KOC_MATERIAL_CONFIG).select('size', 'type').where({
    status: 1,
    oem_id: userInfo.oem_id,
    type
  })
  return {
    code: 0,
    data: data.length ? data[0].size : null,
    type
  }
}

module.exports = {
  list,
  add,
  edit,
  del,
  def,
  updateStatus,
  config
}