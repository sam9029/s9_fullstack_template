const knex = require("../../../../db/knexManager").knexProxy;
const {
  APPROVAL_PROCESS_V2,
  ACCOUNT_TABLE,
} = require("../../../../config/setting");
const { knexTransaction, selectName } = require("../../../../utils/tools");
const { onlyControlInterface } = require("../../../public/permission");
const {
  GetAccountMapper,
  projectList,
} = require("../../../../utils/apiMapper");
const { insertLog, getLogData } = require("../../../public/operationLog");
const { access_user } = require("../../../../utils/marking");

async function list(query, userInfo) {
  if (query.interface_id) await onlyControlInterface(query, userInfo);
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  };
  let knexSql = knex(APPROVAL_PROCESS_V2)
    .select("*")
    .where("oem_id", userInfo.oem_id || 0);
  if (query.status) {
    knexSql.where("status", query.status);
  } else {
    knexSql.whereIn("status", [1, 2]);
  }
  knexSql.select(
    selectName(
      APPROVAL_PROCESS_V2,
      "create_user_id",
      ACCOUNT_TABLE,
      "name",
      "create_user_name"
    )
  ).select(
    selectName(
      APPROVAL_PROCESS_V2,
      "update_user_id",
      ACCOUNT_TABLE,
      "name",
      "update_user_name"
    )
  );
  knexSql = handler.searchFilter(knexSql, query);
  let count = await knex
    .count({ count: "*" })
    .from(knex.raw(`(${knexSql.toQuery().replace(/`/g, "")}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;
  knexSql
    .limit(retu.pagesize)
    .offset((retu.page - 1) * retu.pagesize)
    .orderBy("id", "desc");
  let back = await knexSql;
  retu.data = back.map((item) => {
    item.config = JSON.parse(item.config || "[]");
    return item;
  });
  return retu;
}

async function add(body, userInfo) {
  let { business_category, type, config, remark, id } = body;
  if (!config) return Promise.reject("未设置审批流配置config");
  if (!Array.isArray(config)) return Promise.reject("审批流配置config应为数组");
  if (!business_category)
    return Promise.reject("未设置业务类别business_category");
  if (!type) return Promise.reject("未设置审批流类目type");
  await handler.checkExistData(business_category, type, userInfo, id);

  await knexTransaction(async (trx) => {
    let obj = {
      business_category,
      type,
      config: JSON.stringify(config || []),
      remark,
      update_user_id: userInfo.id,
      oem_id: userInfo.oem_id || 1,
    };

    if (id) {
      let data = (
        await trx.select("*").from(APPROVAL_PROCESS_V2).where("id", id)
      )[0];

      await trx(APPROVAL_PROCESS_V2).update(obj).where("id", id);
      await insertLog(trx, getLogData(id, 3202, obj, userInfo, data));
    } else {
      obj.create_user_id = userInfo.id;
      id = (await trx(APPROVAL_PROCESS_V2).insert(obj))[0];
      await insertLog(trx, getLogData(id, 3201, obj, userInfo));
    }
  });
  return {
    msg: "保存成功",
    code: 0,
    data: id,
  };
}

async function del(body, userInfo) {
  let { id } = body;
  if (!id) throw new Error("未设置要删除的审批流ID");

  await knexTransaction(async (trx) => {
    let obj = { status: 3 };
    await trx(APPROVAL_PROCESS_V2).update(obj).where("id", id);
    await insertLog(trx, getLogData(id, 3203, obj, userInfo));
  });
  return {
    code: 0,
    data: "删除成功",
  };
}

async function def(query, userInfo) {
  if (!query || !query.id) throw new Error("请传入要查询的ID");
  let retu = {
    code: 0,
    data: {},
  };
  let knexSql = knex(APPROVAL_PROCESS_V2).select("*").where({ id: query.id });
  let back = await knexSql;
  back = back.map((item) => {
    item.config = JSON.parse(item.config || "[]");
    return item;
  });
  retu.data = back[0];
  return retu;
}

let handler = {
  searchFilter(knexSql, query) {
    if (query.type) {
      knexSql.where("type", query.type);
    }
    if (query.business_category) {
      knexSql.where("business_category ", query.business_category);
    }
    return knexSql;
  },
  //审批流类目验重
  async checkExistData(business_category, type, userInfo, id) {
    let data = await knex(APPROVAL_PROCESS_V2)
      .select("*")
      .where({
        business_category,
        type,
        oem_id: userInfo.oem_id || 1,
        status: 1,
      });
    if (data.length) {
      if (!(id && id == data[0].id))
        return Promise.reject("该审批流类目已存在");
    }
  },
};

module.exports = {
  list,
  add,
  del,
  def,
};
