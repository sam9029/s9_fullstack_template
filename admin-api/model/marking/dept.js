const knex = require('../../db/knexManager').knexProxy;
let { access_user } = require("../../utils/marking")
const { knexTransaction, selectName } = require("../../utils/tools")
const { insertLog, getLogData } = require("../public/operationLog")
const { ACCOUNT_TABLE, OEM_TABLE, DEPT_TABLE } = require("../../config/setting");
const { ACCOUNT_DEPT_INTERFACE } = require('../../config/interface_id');
const { getPermission } = require('../public/permission');
const { checkKeys } = require('../../utils/check_type');
const { queryLikeWhere, queryIfWhere } = require('../../utils/sqlHelper');
async function tree(query, user) {
  /* {
    id:xxx,
    lable:xxx,
    children:[]
  } */
  let retu = {
    code: 0,
    data: []
  }
  let oem_id = user.oem_id || 0
  let sql = knex.select("id as id", "dept_name as label")
    .from(DEPT_TABLE)
    .where('status', '!=', 3) //查询未删除的
    .where('oem_id', oem_id)
    .orderBy(['id'])//菜单顺序
  retu.data = await sql
  return retu
}
async function list(query, user = {}) {
  let retu = {
    code: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 10),
    count: 0
  }
  await getPermission({ interface_id: ACCOUNT_DEPT_INTERFACE.list }, user)
  let oem_id = user.oem_id || 0
  let knexSql = knex.select('c.id', 'c.dept_name', 'c.remark', 'c.update_time', 'c.status')
    .from(`${DEPT_TABLE} as c`)
    .select(selectName('c', 'update_user_id', ACCOUNT_TABLE, 'name', 'update_user_name'))
    .select(selectName('c', 'oem_id', OEM_TABLE, 'company', 'company'))
  if (!access_user.includes(user.id)) knexSql.where('c.oem_id', oem_id)
  knexSql = handler.searchFilter(knexSql, query)
  let count = await knexSql.clone().clearSelect().count('id as count')
  retu.count = count[0]?.count || 0;
  retu.data = await knexSql.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", 'desc')
  return retu
}

async function add(body, user = {}) {
  let insert_data = checkKeys(body, ['dept_name', 'remark?'])
  let { id: account_id, oem_id } = user
  await getPermission({ interface_id: ACCOUNT_DEPT_INTERFACE.add }, user)
  let before_data = (await knex(DEPT_TABLE).select("status", "id", "dept_name").where({ dept_name: insert_data.dept_name, oem_id }))[0]
  await knexTransaction(async (trx) => {
    insert_data = { ...insert_data, update_user_id: account_id, oem_id }
    if (before_data) {
      if ([1, 2].includes(before_data.status)) return Promise.reject("该部门已经存在，请勿重复添加")
      await trx(DEPT_TABLE).update('status', 1).where('id', before_data.id)
      await insertLog(trx, getLogData(before_data.id, 302, insert_data, user, before_data))
    } else {
      insert_data.create_user_id = account_id
      let id = (await trx(DEPT_TABLE).insert(insert_data))[0]
      await insertLog(trx, getLogData(id, 301, insert_data, user))
    }
  })
  return { message: "添加部门成功!", code: 0 };
}

async function edit(body, user = {}) {
  let update_data = checkKeys(body, ['dept_name?', 'remark?', 'status?', 'id'])
  let { id: account_id, oem_id } = user
  await getPermission({ interface_id: ACCOUNT_DEPT_INTERFACE.edit }, user)
  let data = (await knex(DEPT_TABLE).select('*').where({ id: update_data.id, oem_id }))[0]
  if (!data) throw new Error('未查询到该部门')
  if (update_data.dept_name) {
    let checkDataBase = (await knex(DEPT_TABLE).select('*').where({ dept_name: update_data.dept_name, oem_id }).limit(1))[0]
    if (checkDataBase && checkDataBase?.id != update_data.id) throw new Error(`${body.dept_name}已经存在，请勿修改为已存在部门名`)
  }
  await knexTransaction(async (trx) => {
    update_data.update_user_id = account_id
    await trx(DEPT_TABLE).update(update_data).where('id', update_data.id)
    await insertLog(trx, getLogData(body.id, 302, update_data, user, data))
  })
  return { code: 0, message: '修改部门成功！' }
}

async function del(body, user = {}) {
  let { ids } = checkKeys(body, [{
    key: 'ids', type: Array, required: true
  }])
  let { id: update_user_id, oem_id } = user
  if (!ids?.length) throw new Error('未设置查询的部门信息')
  await getPermission({ interface_id: ACCOUNT_DEPT_INTERFACE.edit }, user)
  let data = await knex(DEPT_TABLE).select('id', 'status').whereIn('id', body.ids).where({ oem_id })
  if (!data?.length) throw new Error('未查询到该部门信息')
  await knexTransaction(async (trx) => {
    let update_data = { status: 3, update_user_id }
    await trx(DEPT_TABLE).update(update_data).whereIn('id', data.map(i => i.id))
    await insertLog(trx, data.map(item => {
      return getLogData(item.id, 303, update_data, user, item)
    }))
  })
  return { code: 0, message: '删除该部门成功' }
}

async function def(query, user = {}) {
  let { id } = checkKeys(query, ['id'])
  let { oem_id } = user
  await getPermission({ interface_id: ACCOUNT_DEPT_INTERFACE.list }, user)
  let data = (await knex(DEPT_TABLE).select("id", "status", "dept_name", "remark")
    .where({ id, oem_id }).where('status', '!=', 3))[0]
  if (!data) throw new Error('未查询到该部门信息')
  return {
    code: 0,
    data: data
  }
}
let handler = {
  searchFilter(sqlKnex, query) {
    queryLikeWhere(sqlKnex, ['c.dept_name', 'c.id'], query.keyword)
    queryIfWhere(sqlKnex, 'c.oem_id', query.oem_id)
    if (query.status) sqlKnex.where('c.status', query.status)
    else sqlKnex.whereIn('c.status', [1, 2])
    return sqlKnex
  }
}
module.exports = {
  list,
  add,
  def,
  edit,
  del,
  tree
};
