const knex = require('../../db/knexManager').knexProxy;
const { access_user } = require("../../utils/marking")
const { ACCOUNT_TABLE, OEM_TABLE } = require("../../config/setting")
const crypto = require('crypto');
const { knexTransaction } = require("../../utils/tools")
const { insertLog, getLogData } = require("../public/operationLog")
const config = require('../../config');

async function list(query, user = {}) {
  let retu = {
    code: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 10),
    count: 0
  }
  let oem_id = user.oem_id || 0
  if (!access_user.includes(user.id) || oem_id != 1) throw new Error('当前用户无操作权限!')
  let knexSql = knex.select('c.id', 'c.name', 'c.company', 'c.remark', 'c.create_user_id', 'c.update_time', 'c.status', 'c.auth_router', 'c.applet_router', 'a.name as create_user_name', 'c.platform_setting as platform_setting').from(`${OEM_TABLE} as c`)
    .leftJoin(`${ACCOUNT_TABLE} as a`, 'a.id', 'c.create_user_id')
  if (query.status) {
    knexSql.where('c.status', query.status)
  } else {
    knexSql.where('c.status', '!=', 3)
  }
  query.params = JSON.parse(query.params || '{}')
  knexSql = handler.searchFilter(knexSql, query)
  let count = await knex.count({ count: '*' }).from(knex.raw(`(${knexSql.toString()}) as t`))
  retu.count = count.length && count[0]['count'] || 0;
  retu.data = await knexSql.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", 'desc')
  return retu
}

async function downList(query, user = {}) {
  let retu = {
    code: 0,
    data: [],
  }
  if (!access_user.includes(user.id)) throw new Error('当前用户无操作权限!')
  let knexSql = knex.select('c.id', 'c.company as name')
    .from(`${OEM_TABLE} as c`)
    .where('c.status', 1)
  retu.data = await knexSql
  return retu
}

async function add(body, user = {}) {
  let password = body.password
  body.status = 1
  let insert_data = handler.checkData(body, user)
  if (!password) throw new Error('未设置超管密码')
  let info = await knex(OEM_TABLE).select('id').where('company', insert_data.company).whereIn('status', [1, 2])
  if (info.length) throw new Error('公司全称重复，请检查！')
  await knexTransaction(async (trx) => {
    let id = await trx(OEM_TABLE).insert(insert_data)
    if (!id.length) throw new Error('添加异常')
    let oem_id = id[0]
    let account_data = {
      name: body.name,
      email: body.company,
      telephone: body.company,
      password: crypto.createHash('md5').update(password + config.deviation).digest('hex'),
      oem_id,
      status: 1,
      phone_verification: 1
    }
    let root_user_id = (await trx('account').insert(account_data))[0]
    if (!root_user_id) throw new Error('添加超管账户异常')
    await trx(OEM_TABLE).update({ root_user_id }).where('id', oem_id)
    await insertLog(trx, getLogData(id[0], 401, insert_data, user))
  })

  return {
    message: "添加成功",
    code: 0,
  };
}
async function def(query, user = {}) {
  if (!access_user.includes(user.id)) throw new Error('当前用户无操作权限')
  if (!query.id) throw new Error('未设置查询的公司信息')
  let data = await knex(OEM_TABLE).select("id", "company", "status", "name", "auth_router", "remark", "platform_setting", "applet_router")
    .where({ id: query.id }).where('status', '!=', 3)
  if (!data.length) throw new Error('未查询到该公司信息')
  let item = data[0]
  item.auth_router = JSON.parse(item.auth_router)
  item.applet_router = JSON.parse(item.applet_router)
  item.menuCheckStrictly = true
  return {
    code: 0,
    data: item
  }
}
async function edit(body, user = {}) {
  let update_data = handler.checkData(body, user, 'edit')
  if (!body.id) throw new Error('未设置修改的公司')
  let data = await knex(OEM_TABLE).select().where({ id: body.id }).where('status', '!=', 3)
  if (!data.length) throw new Error('未查询到该公司')
  await knexTransaction(async (trx) => {
    await trx(OEM_TABLE).update(update_data).where('id', body.id)
    await insertLog(trx, getLogData(body.id, 402, update_data, user, data[0]))
  })
  return {
    code: 0,
    data: '修改公司成功！'
  }
}
async function del(body, user = {}) {
  if (!access_user.includes(user.id)) throw new Error('当前用户无操作权限')
  if (!(body.ids && body.ids.length)) throw new Error('未设置查询的公司信息')
  let data = await knex(OEM_TABLE).select('*').whereIn('id', body.ids).where('status', '!=', 3)
  if (!data.length) throw new Error('未查询到该公司信息')
  await knexTransaction(async (trx) => {
    await trx(OEM_TABLE).update({ status: 3 }).whereIn('id', data.map(i => i.id))
    let log_data = data.map(item => {
      return getLogData(item.id, 403, { status: 3 }, user, item)
    })
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: '删除该公司成功'
  }
}
let handler = {
  searchFilter(sqlKnex, query) {
    if (query.name) {
      sqlKnex.where('c.name', 'like', `%${query.name}%`)
    }
    if (query.company) {
      sqlKnex.where('c.company', 'like', `%${query.company}%`)
    }
    if (query.params && query.params.beginTime && query.params.endTime) {
      sqlKnex.where('c.create_time', '>=', parseInt(new Date(query.params.beginTime + ' 00:00:00') / 1000)).where('c.create_time', '<=', parseInt(new Date(query.params.endTime + ' 23:59:59') / 1000))
    }
    return sqlKnex
  },
  checkData(body, user, type = "add") {
    if (!access_user.includes(user.id)) throw new Error('当前用户无操作权限!')
    const check_keys = ['name', 'company', 'status', 'auth_router', 'applet_router']
    let insert_data = {
      create_user_id: user.id,
      update_user_id: user.id,
      remark: body.remark || null,
      platform_setting: body.platform_setting ? JSON.stringify(body.platform_setting) : null
    }
    check_keys.forEach(key => {
      if (!body[key] && type == "add") throw new Error(`参数异常，请检查${key}参数！`)
      if (key == 'auth_router' || key == 'applet_router') insert_data[key] = JSON.stringify(body[key])
      else insert_data[key] = body[key]
    });
    if (type != "add") {
      delete insert_data.create_user_id
      if (!Object.hasOwnProperty.call(body, 'remark')) delete insert_data.remark
    }
    return insert_data
  }
}
module.exports = {
  list,
  add,
  def,
  edit,
  del,
  downList
};
