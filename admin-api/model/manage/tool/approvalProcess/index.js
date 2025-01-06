const knex = require('../../../../db/knexManager').knexProxy;
const { APPROVAL_TABLE, ACCOUNT_TABLE } = require('../../../../config/setting');
const { knexTransaction, selectName } = require("../../../../utils/tools")
const { onlyControlInterface } = require("../../../public/permission")
const { GetAccountMapper,projectList } = require("../../../../utils/apiMapper")
const { insertLog, getLogData } = require("../../../public/operationLog")
const { access_user } = require("../../../../utils/marking");

async function list(query, userInfo) {
  if (query.interface_id) await onlyControlInterface(query, userInfo);
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  }
  let knexSql = knex(APPROVAL_TABLE).select('*').where('oem_id', userInfo.oem_id || 0)
  if (query.status) {
    knexSql.where('status', query.status)
  } else {
    knexSql.whereIn('status', [1, 2])
  }
  knexSql.select(
    selectName(
      APPROVAL_TABLE,
      "create_user_id",
      ACCOUNT_TABLE,
      "name",
      "create_user_name"
    )
  ).select(
    selectName(
      APPROVAL_TABLE,
      "update_user_id",
      ACCOUNT_TABLE,
      "name",
      "update_user_name"
    )
  );
  knexSql = handler.searchFilter(knexSql, query);
  let count = await knex.count({ count: "*" }).from(knex.raw(`(${knexSql.toQuery().replace(/`/g, '')}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;
  knexSql.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", "desc");
  let back = await knexSql
  retu.data = back.map(item => {
    item.config = JSON.parse(item.config || '[]')
    return item
  })
  return retu
}

async function add(body, userInfo) {
  let { business_category, type, config, remark, advertiser_type } = body
  if (!config) return Promise.reject('未设置审批流配置config')
  if (!Array.isArray(config)) return Promise.reject('审批流配置config应为数组')
  if (!business_category) return Promise.reject('未设置业务类别business_category')
  // if (![1, 2].includes(Number(business_category))) return Promise.reject('业务类别business_category设置错误')
  if (!type) return Promise.reject('未设置审批流类目type')
  // if (!advertiser_type) return Promise.reject('未设置审批流推广项目advertiser_type')
  await handler.checkType(business_category, type)
  await handler.checkExistData(business_category, type, advertiser_type, userInfo)

  let retu = {
    msg: "添加审批流成功",
    code: 0,
    data: null
  }
  await knexTransaction(async (trx) => {
    let insertObj = {
      // advertiser_type,
      business_category,
      type,
      config: JSON.stringify(config || []),
      remark,
      create_user_id: userInfo.id,
      update_user_id: userInfo.id,
      oem_id: userInfo.oem_id || 1,
    }
    let id = (await trx(APPROVAL_TABLE).insert(insertObj))[0]
    retu.data = id
    await insertLog(trx, getLogData(id, 3201, insertObj, userInfo))
  })
  return retu
}

async function edit(body, userInfo) {
  let { id, business_category, type, config, remark, advertiser_type } = body
  if (!id) return Promise.reject('未设置要编辑的审批流ID')
  let checkData = await knex(APPROVAL_TABLE).select('*').where({ id: id }).where("status", "!=", 3)
  if(!checkData.length) return Promise.reject('未查询到要编辑的审批流')
  let retu = {
    msg: "编辑审批流成功",
    code: 0,
  }
  business_category = business_category || checkData[0].business_category
  type = type || checkData[0].type
  advertiser_type = advertiser_type || checkData[0].advertiser_type
  await handler.checkType(business_category, type)
  await handler.checkExistData(business_category, type, advertiser_type, userInfo, id)
  
  await knexTransaction(async (trx) => {
    let oldData = checkData[0]
    let updateObj = {
      update_user_id: userInfo.id,
      business_category: business_category,
      type: type,
      // advertiser_type: advertiser_type
    }
    if(config) updateObj.config = JSON.stringify(config)
    if('remark' in body) updateObj.remark = remark
    await trx(APPROVAL_TABLE).update(updateObj).where('id', id)
    await insertLog(trx, getLogData(body.id, 3202, updateObj, userInfo, oldData))
  })
  return retu
}

async function del(body,userInfo){
  let { ids } = body
  if (!ids) throw new Error("未设置要删除的审批流ID(ids)")
  if (!Array.isArray(ids)) throw new Error('ids为数组，请检查参数')
  let checkData = await knex(APPROVAL_TABLE).select('*').whereIn('id', ids).where("status", "!=", 3)
  if(!checkData.length) return Promise.reject('未查询到要删除的审批流')
  await knexTransaction(async (trx) => {
    await trx(APPROVAL_TABLE).update({ status: 3 })
      .whereIn("id", checkData.map((i) => i.id))
    let log_data = checkData.map(item => {
      return getLogData(item.id, 3203, { status: 3 }, userInfo, { status: item.status })
    })
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: "删除审批流成功",
  };
}

async function def(query, userInfo) {
  if (!query || !query.id) throw new Error("请传入要查询的平台ID")
  let retu = {
    code: 0,
    data: {}
  }
  let knexSql = knex(APPROVAL_TABLE).select('*').where({id: query.id, oem_id: userInfo.oem_id || 0})
  let back = await knexSql
  if (!back.length) throw new Error('暂未查询到审批流信息')
  let [accountMapper,projectMapper] = await Promise.all([GetAccountMapper(), projectList(userInfo)])
  back = back.map(item => {
    item.config = JSON.parse(item.config || '[]')
    item.create_user_name = accountMapper[item.create_user_id];
    item.update_user_name = accountMapper[item.update_user_id];
    item.advertiser_name = projectMapper[item.advertiser_type] || '--'
    return item
  })
  retu.data = back[0]
  return retu
} 

async function updateStatus(body, userInfo) {
  let { status, id } = body || {}
  if (!id) return Promise.reject('未设置审批流id')
  if (!status) return Promise.reject('未设置状态status')
  let checkData = await knex(APPROVAL_TABLE).select("*").where("id", id)
  if (!checkData.length) return Promise.reject("未查询到审批流信息");
  //开启时要校验是否已有此审批流类目
  if(status == 1){
    await handler.checkExistData(checkData[0].business_category, checkData[0].type,checkData[0].advertiser_type, userInfo, id)
  }
  await knexTransaction(async (trx) => {
    await trx(APPROVAL_TABLE).update({ status: status, update_user_id: userInfo.id }).where('id', id)
    await insertLog(trx, getLogData(body.id, 3202, {status: status, update_user_id: userInfo.id}, userInfo, checkData[0]))
  })
  return {
    code: 0,
    data: "更新状态成功"
  }
}

let handler = {
  searchFilter(knexSql, query) {
    if (query.type) {
      knexSql.where('type', query.type)
    }
    if (query.business_category ) {
      knexSql.where('business_category ', query.business_category )
    }
    if(query.advertiser_type){
      knexSql.where('advertiser_type ', query.advertiser_type )
    }
    return knexSql;
  },
  //校验business_category和type对应关系
  checkType(business_category, type) {
    // if (!((business_category == 1 && [1].includes(Number(type))) || (business_category == 2 && [4, 5, 6, 7, 8, 9, 10, 11, 12].includes(Number(type))))) return Promise.reject('审批流类目type设置错误')
  },
  //审批流类目验重
  async checkExistData(business_category, type, advertiser_type, userInfo, id){
    let data = await knex(APPROVAL_TABLE).select('*').where({business_category: business_category, type: type, oem_id: userInfo.oem_id || 1, status: 1})
    if(data.length) {
      if(!(id && id == data[0].id)) return Promise.reject('该审批流类目已存在')
    }
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