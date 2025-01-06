const knex = require('../../../../db/knexManager').knexProxy;
const { PLATFORM_TABLE,ACCOUNT_TABLE, CONTENT_RELATION } = require('../../../../config/setting');
const { knexTransaction, selectName } = require("../../../../utils/tools")
const { insertLog, getLogData } = require("../../../public/operationLog")
const { access_user } = require("../../../../utils/marking");

async function list(query, userInfo) {
  // if (query.interface_id) await onlyControlInterface(query, userInfo);
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 100),
  }
  if (retu.pagesize > 100) return Promise.reject('分页最大为100，请修改后重试！')
  let knexSql = knex(`${PLATFORM_TABLE} as platform`).select('platform.id', 'platform.id as value', 'platform.name as label', 'platform.status', 'platform.create_user_id', 'platform.create_time', 'platform.remark', 'platform.promotion_type')
  if (query.status) {
    knexSql.where('platform.status', query.status)
  } else {
    knexSql.whereIn('platform.status', [1])
  }
  knexSql = handler.searchFilter(knexSql, query);
  let count = await knex.count({ count: "value" }).from(knex.raw(`(${knexSql.toQuery().replace(/`/g, '')}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;
  knexSql.select(selectName("platform", "create_user_id", ACCOUNT_TABLE, "name", "create_user_name"))
  .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("platform.id", "desc");
  let back = await knexSql
  back.forEach(t=>{
    t.promotion_type = JSON.parse(t.promotion_type)
  })
  retu.data = back;
  return retu
}

async function add(body, userInfo) {
  if (!body || !body.name) throw new Error('请传入平台名称name')
  // await handler.checkUser(userInfo, '新增')
  let retu = {
    message: "添加平台成功",
    code: 0,
    data: null
  }
  let checkData = await knex(PLATFORM_TABLE).select('*').where('name', body.name)
  if (checkData.length && checkData[0].status == 1) throw new Error(`平台[${body.name}]已经存在，请勿重复添加`)
  let { name, icon, remark, promotion_type } = body
  await knexTransaction(async (trx) => {
    if (!checkData.length) {
      let max_id = (await trx.max('id as max_id').from(PLATFORM_TABLE).where('id', '<', 99999))[0]
      let insertObj = {
        id: max_id ? max_id.max_id + 1 : null,
        name: name,
        promotion_type: JSON.stringify(promotion_type),
        icon: icon || null,
        remark: remark || null,
        create_user_id: userInfo.id,
        update_user_id: userInfo.id,
        oem_id: userInfo.oem_id || 1
      }
      let id = (await trx(PLATFORM_TABLE).insert(insertObj))[0]
      retu.data = id
      await insertLog(trx, getLogData(id, 3001, insertObj, userInfo))
    } else {
      let updateObj = {
        update_user_id: userInfo.id,
        status: 1
      }
      if (name) updateObj.name = name
      if (icon) updateObj.icon = icon
      if (remark) updateObj.remark = remark
      if (promotion_type) updateObj.promotion_type = JSON.stringify(promotion_type)
      await trx(PLATFORM_TABLE).update(updateObj).where('id', checkData[0].id)
      await insertLog(trx, getLogData(body.id, 3002, updateObj, userInfo, checkData[0]))
      retu.data = checkData[0].id
    }
  })
  return retu
}

async function edit(body, userInfo) {
  if (!body || !body.id) throw new Error("请传入要修改的平台ID")
  // await handler.checkUser(userInfo, '编辑')
  let retu = {
    message: "编辑平台成功",
    code: 0,
  }
  if (body.name) {
    let checkData = await knex(PLATFORM_TABLE).select('*').where('name', body.name).whereIn('status', [1, 2])
    if (checkData.length && checkData[0].id != body.id) throw new Error(`平台[${body.name}]已经存在，请勿修改为已存在的平台名`)
  }
  let oldData = await knex(PLATFORM_TABLE).select('*').where('id', body.id)
  if (!oldData.length) throw new Error('未查询到要修改的平台信息')
  await knexTransaction(async (trx) => {
    let { name, icon, remark, promotion_type } = body
    let updateObj = {
      update_user_id: userInfo.id
    }
    if (name) updateObj.name = name
    if (icon) updateObj.icon = icon
    if (remark) updateObj.remark = remark
    if (promotion_type) updateObj.promotion_type = JSON.stringify(promotion_type)
    await trx(PLATFORM_TABLE).update(updateObj).where('id', body.id)
    await insertLog(trx, getLogData(body.id, 3002, updateObj, userInfo, oldData[0]))
  })
  return retu
}

async function updateStatus(body, userInfo) {
  let { status, ids } = body || {}
  if (!ids) return Promise.reject('未设置关键词ids')
  if (!Array.isArray(ids)) return Promise.reject('ids为数组')
  if (!status) return Promise.reject('未设置状态status')
  // await handler.checkUser(userInfo, '更新状态')
  let checkData = await knex(PLATFORM_TABLE).select("id", 'status', 'update_user_id').whereIn("id", body.ids)
  if (!checkData.length) return Promise.reject("未查询到平台信息");
  await knexTransaction(async (trx) => {
    await trx(PLATFORM_TABLE).update({ status: status, update_user_id: userInfo.id }).whereIn('id', checkData.map(item => item.id))
    let log_data = checkData.map(item => {
      return getLogData(item.id, 3002, { status: status, update_user_id: userInfo.id }, userInfo, { status: item.status, update_user_id: item.update_user_id })
    })
    if (status != 1) {
      await trx(CONTENT_RELATION).update({ status: 2 }).whereIn("platform_id", ids);
    }
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: "更新状态成功"
  }
}

async function del(body, userInfo) {
  if (!body || !body.ids) throw new Error("未设置要删除的平台ID(ids)")
  if (!Array.isArray(body.ids)) throw new Error('ids为数组，请检查参数')
  // await handler.checkUser(userInfo, '删除')
  let checkData = await knex(PLATFORM_TABLE).select("id", 'status').whereIn("id", body.ids).where("status", "!=", 3);
  if (!checkData.length) throw new Error("未查询到平台信息");
  await knexTransaction(async (trx) => {
    await trx(PLATFORM_TABLE)
      .update({ status: 3 })
      .whereIn(
        "id",
        checkData.map((i) => i.id)
      )
    let log_data = checkData.map(item => {
      return getLogData(item.id, 3003, { status: 3 }, userInfo, { status: item.status })
    })
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: "删除该平台成功",
  };
}

async function def(query, userInfo) {
  if (!query || !query.id) throw new Error("请传入要查询的平台ID")
  let retu = {
    code: 0,
    data: {}
  }
  let knexSql = knex(`${PLATFORM_TABLE} as plat`).select('plat.*').where('id', query.id)
  let back = await knexSql
  if (!back.length) throw new Error('暂未查询到平台信息')
  back = back.map(item => {
    item.promotion_type = JSON.parse(item.promotion_type)
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
    let flag = userInfo.role_ids.split(',').includes('1') || access_user.includes(userInfo.id)
    if (!flag) throw new Error(`暂无${type}平台权限`)
  }
}

module.exports = {
  list,
  add,
  edit,
  del,
  def,
  updateStatus
}