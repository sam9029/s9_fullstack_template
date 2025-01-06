const knex = require('../../db/knexManager').knexProxy;
const { access_user } = require("../../utils/marking")
const { OEM_TABLE, ROLE_TABLE, ACCOUNT_TABLE } = require("../../config/setting")
const { knexTransaction, selectName } = require("../../utils/tools")
const { insertLog, getLogData } = require("../public/operationLog");
const { queryLikeWhere, queryIfWhere } = require('../../utils/sqlHelper');
const { ACCOUNT_ROLE_INTERFACE } = require('../../config/interface_id');
const { getPermission } = require('../public/permission');
const { checkKeys } = require('../../utils/check_type');
const json_keys = ['auth_router', "auth_data", "applet_auth", "applet_router", 'position']
async function tree(query, user) {
  let retu = {
    code: 0,
    data: []
  }
  let oem_id = user.oem_id || 0
  let knexSql = knex.select("c.id", "c.role_name")
    .from(`${ROLE_TABLE} as c`)
    .where({ 'c.status': 1 }) //查询未删除的
    .whereRaw(`(c.oem_id = ${oem_id} or id in (2,3))`)
  //当下拉筛选KOC商务时默认带出投顾和博主
  if (query.koc_role) knexSql.whereRaw(`(c.koc_role = ${query.koc_role} or c.id in (2,3))`)
  if ([1, 2].includes(Number(query.account_type))) knexSql.whereIn('c.id', [2, 3]) //当查询角色为 博主或投顾时，只取投顾和博主角色
  if (!access_user.includes(user.id)) knexSql.whereNotIn('c.id', [1, 2, 3])
  knexSql = handler.searchFilter(knexSql, query)
  retu.data = await knexSql
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
  let oem_id = user.oem_id || 0
  await getPermission({ interface_id: ACCOUNT_ROLE_INTERFACE.list }, user)
  let knexSql = knex.select('c.*').from(`${ROLE_TABLE} as c`)
  //超管不受oem_id控制，返回所有数据，超管拥有一个oem_id的过滤条件
  if (!access_user.includes(user.id)) knexSql.whereNotIn('c.id', [1, 2, 3]).where('c.oem_id', oem_id)
  knexSql = handler.searchFilter(knexSql, query)
  let count = await knexSql.clone().clearSelect().count('id as count')
  retu.count = count[0]?.count || 0;
  retu.data = await knexSql
    .select(selectName('c', 'oem_id', OEM_TABLE, 'company', 'company'))
    .select(selectName('c', 'upper_id', ROLE_TABLE, 'role_name', 'upper_name'))
    .select(selectName('c', 'update_user_id', ACCOUNT_TABLE, 'name', 'update_user_name'))
    .select(selectName('c', 'create_user_id', ACCOUNT_TABLE, 'name', 'create_user_name'))
    .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", 'desc')
  return retu
}

async function add(body, user = {}) {
  let insert_data = checkKeys(body, ['role_name', 'status?', 'auth_router', "auth_data", "data_type", "koc_role", "applet_router", "applet_data_type", "position?", "remark?",
    { key: 'upper_id', type: Number, default: 0 }
  ])
  await getPermission({ interface_id: ACCOUNT_ROLE_INTERFACE.add }, user)
  let { id: account_id, oem_id } = user
  let checkDataBase = (await knex(ROLE_TABLE).select("*").where({ role_name: insert_data.role_name, oem_id }))[0]//校验角色名称重复（同公司主体）
  json_keys.forEach(key => {
    if (insert_data[key]) insert_data[key] = JSON.stringify(insert_data[key])
  });
  await knexTransaction(async (trx) => {
    if (checkDataBase && [1, 2].includes(Number(checkDataBase.status))) return Promise.reject("该角色名已经存在，请勿重复添加")
    if (checkDataBase) {
      let updateObj = { ...insert_data, update_user_id: account_id }
      await trx(ROLE_TABLE).update(updateObj).where('id', checkDataBase.id)
      await insertLog(trx, getLogData(checkDataBase.id, 202, updateObj, user, checkDataBase))
    } else {
      insert_data = { ...insert_data, create_user_id: account_id, oem_id, update_user_id: account_id }
      let [id] = await trx(ROLE_TABLE).insert(insert_data)
      await insertLog(trx, getLogData(id, 201, insert_data, user))
    }
  })

  return { message: "添加角色成功", code: 0, };
}

async function edit(body, user = {}) {
  let update_data = checkKeys(body, [{ key: 'id', type: Number, required: true },
    'role_name?', 'status?', 'auth_router?', "auth_data?", "data_type?", "koc_role?", "applet_router?", "applet_data_type?", "position?", "remark?", "upper_id?", "status?"
  ])
  let { id: account_id, oem_id } = user
  if ([1, 2, 3].includes(update_data.id) && !access_user.includes(account_id)) return Promise.reject('你没有修改此角色的权限!')
  await getPermission({ interface_id: ACCOUNT_ROLE_INTERFACE.edit }, user)
  json_keys.forEach(key => {
    if (update_data[key]) update_data[key] = JSON.stringify(update_data[key])
  });
  update_data.update_user_id = account_id
  await knexTransaction(async (trx) => {
    let data = (await trx(ROLE_TABLE).select().where({ id: update_data.id, oem_id }))[0]
    if (!data) return Promise.reject('未查询到该角色!')
    if (update_data.role_name) {
      let checkDataBase = (await trx(ROLE_TABLE).select('*').where({ role_name: update_data.role_name, oem_id }))[0]
      if (checkDataBase && checkDataBase.id != update_data.id) return Promise.reject(`${update_data.role_name}已经存在，请勿修改为已存在角色名`)
    }
    await trx(ROLE_TABLE).update(update_data).where('id', update_data.id)
    await insertLog(trx, getLogData(update_data.id, 202, update_data, user, data))
  })
  return { code: 0, message: '修改角色成功！' }
}

async function def(query, user = {}) {
  if (!query.id) return Promise.reject('未设置查询的角色信息')
  await getPermission({ interface_id: ACCOUNT_ROLE_INTERFACE.list }, user)
  let data = (await knex(ROLE_TABLE).select("*").where('id', query.id).where('status', '!=', 3))[0]
  if (!data) return Promise.reject('未查询到该角色信息')
  json_keys.forEach(key => {
    if (data[key]) data[key] = JSON.parse(data[key])
  });
  // item.menuCheckStrictly = true
  // item.dataCheckStrictly = true
  return {
    code: 0,
    data
  }
}

//上级角色下拉(仅排除自身)
async function upper(query, user = {}) {
  await getPermission({ interface_id: ACCOUNT_ROLE_INTERFACE.list }, user)
  let data = await knex(ROLE_TABLE).select("id", "role_name").whereIn('status', [1, 2]).where('oem_id', user.oem_id)
    .where(builder => {
      if (query.id) builder.whereNot('id', query.id)
    })
  return {
    code: 0,
    data
  }
}

async function del(body, user = {}) {
  let { ids } = checkKeys(body, [{ key: 'ids', type: Array, required: true }])
  ids = ids?.filter(item => ![1, 2, 3].includes(item))
  if (!ids?.length) return Promise.reject('未查询到该角色信息')
  let { id: update_user_id, oem_id } = user
  let data = await knex(ROLE_TABLE).select('*').whereIn('id', ids).where('status', '!=', 3).where({ oem_id })
  if (!data.length) return Promise.reject('未查询到该角色信息')
  await getPermission({ interface_id: ACCOUNT_ROLE_INTERFACE.del }, user)
  await knexTransaction(async (trx) => {
    let update_data = { status: 3, update_user_id }
    await trx(ROLE_TABLE).update(update_data).whereIn('id', data.map(i => i.id))
    let log_data = data.map(item => {
      return getLogData(item.id, 203, update_data, user, item)
    })
    await insertLog(trx, log_data)
  })

  return {
    code: 0,
    message: '删除该角色成功'
  }
}

let handler = {
  //搜索条件
  searchFilter(sqlKnex, query) {
    if (query.oem_id) sqlKnex.whereRaw(`(c.oem_id = ${query.oem_id} or c.id in (2, 3, 4, 5, 6))`)
    if (query.status) sqlKnex.where('c.status', query.status)
    else sqlKnex.whereIn('c.status', [1, 2])
    queryIfWhere(sqlKnex, 'c.koc_role', query.koc_role)
    queryIfWhere(sqlKnex, 'c.creator_role', query.creator_role)
    queryLikeWhere(sqlKnex, ["c.role_name", "c.id"], query.keyword)
    if (query?.role_ids?.length) sqlKnex.whereIn('c.id', query.role_ids)
    return sqlKnex
  }
}

module.exports = {
  list,
  add,
  def,
  edit,
  del,
  upper,
  tree,
};
