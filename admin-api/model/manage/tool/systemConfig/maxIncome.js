const knex = require('../../../../db/knexManager').knexProxy;
const { MAX_INCOME, ADVERTISER_TABLE, ACCOUNT_TABLE } = require('../../../../config/setting');
const { onlyControlInterface } = require("../../../public/permission")
const { knexTransaction } = require("../../../../utils/tools")
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
  let knexSql = knex.select('maxi.id', 'maxi.advertiser_type', 'maxi.show_type', 'maxi.update_user_id', 'pro.name as advertiser_name')
    .select(knex.raw(`IFNULL(maxi.real_income/100, 0) as real_income, IFNULL(maxi.edit_income/100, 0) as edit_income`))
    .from(`${MAX_INCOME} as maxi`)
    .leftJoin(`${ADVERTISER_TABLE} as pro`, 'pro.id', 'maxi.advertiser_type')
    .where('maxi.oem_id', userInfo.oem_id || 0)
  knexSql = handler.searchFilter(knexSql, query);
  let count = await knex.count({ count: "t.id" }).from(knex.raw(`(${knexSql.toQuery().replace(/`/g, '')}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;
  retu.data = await knexSql
    .select(handler.selectName('maxi', ACCOUNT_TABLE, "update_user_id", "name", "update_user_name"))
    .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("advertiser_type", "asc");
  return retu
}


async function edit(body, userInfo) {
  if (!body || !body.id) throw new Error("请传入要修改的ID")
  let retu = {
    data: "编辑成功!",
    code: 0,
  }
  let oldData = (await knex(MAX_INCOME).select('*').where('id', body.id))[0]
  if (!oldData) throw new Error('未查询到要修改的信息')
  await knexTransaction(async (trx) => {
    let { edit_income, show_type } = body
    let updateObj = {
      update_user_id: userInfo.id
    }
    if (show_type) updateObj.show_type = show_type
    if (edit_income || edit_income == 0) updateObj.edit_income = Number(edit_income) * 100
    await trx(MAX_INCOME).update(updateObj).where('id', body.id)
    await insertLog(trx, getLogData(body.id, 3451, updateObj, userInfo, oldData))
  })
  return retu
}


let handler = {
  selectName(idTable, nameTable, idFiled, nameFiled = "name", asFiled) {
    return knex.raw(`(SELECT p.${nameFiled} FROM ${nameTable} p where ${idTable}.${idFiled} = p.id  LIMIT 0, 1 ) as ${asFiled}`)
  },
  searchFilter(knexSql, query) {
    if (query.keyword) {
      let keyword = String(query.keyword).trim()
      knexSql.whereRaw(`(pro.id like '%${keyword}%' or pro.name like '%${keyword}%')`)
    }
    if (query.advertiser_type) knexSql.where('maxi.advertiser_type', advertiser_type)
    return knexSql;
  }
}

module.exports = {
  list,
  edit
}