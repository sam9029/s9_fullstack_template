const knex = require("../../../../db/knexManager").knexProxy;
const { VIP_LEVEL, ACCOUNT_TABLE } = require("../../../../config/setting");
const { knexTransaction, selectName } = require("../../../../utils/tools");
const { insertLog, getLogData } = require("../../../public/operationLog");
const moment = require("moment");

async function list(query, userInfo) {
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  };
  let sql = knex.select("vip_level.*").from(`${VIP_LEVEL} as vip_level`);
  sql = handler.searchFilter(sql, query);

  let count = await knex
    .count({ count: "t.id" })
    .from(knex.raw(`(${sql.toString()}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;

  sql.select(
    selectName(
      "vip_level",
      "create_user_id",
      ACCOUNT_TABLE,
      "name",
      "create_user_name"
    )
  );

  let data = await sql
    .limit(retu.pagesize)
    .offset((retu.page - 1) * retu.pagesize)
    .orderBy("vip_level.id", "desc");

  data.forEach((t) => {});

  retu.data = data;
  return retu;
}

async function add(query, userInfo) {
  if (!query.name) throw new Error("请传入会员等级名称");

  let id = query.id || null;
  await knexTransaction(async (trx) => {
    let field = ["name", "day", "type"];
    let obj = {};
    field.forEach((t) => {
      obj[t] = query[t] || "";
    });
    obj.update_user_id = userInfo.id;

    if (id) {
      let data = (
        await trx
          .select("vip_level.*")
          .from(`${VIP_LEVEL} as vip_level`)
          .where("vip_level.id", id)
      )[0];

      await trx(VIP_LEVEL).update(obj).where("id", data.id);
      await insertLog(trx, getLogData(data.id, 6032, obj, userInfo, data));
    } else {
      obj.oem_id = userInfo.oem_id;
      obj.create_user_id = userInfo.id;
      id = (await trx(VIP_LEVEL).insert(obj))[0];
      await insertLog(trx, getLogData(id, 6031, obj, userInfo, {}));
    }
  });
  return {
    msg: "保存成功",
    code: 0,
    data: id,
  };
}

async function def(query, userInfo) {
  let sql = knex
    .select("vip_level.*")
    .from(`${VIP_LEVEL} as vip_level`)
    .where({ "vip_level.id": query.id });
  let data = (await sql)[0];
  return {
    code: 0,
    data,
  };
}

async function del(query, userInfo) {
  if (!query.ids || !query.ids.length) throw new Error("请传入删除值");
  await knexTransaction(async (trx) => {
    let obj = {
      status: query.status,
      update_user_id: userInfo.id,
    };
    let data = await trx.select("*").from(VIP_LEVEL).whereIn("id", query.ids);
    await trx(VIP_LEVEL).update(obj).whereIn("id", query.ids);

    let logList = [];
    query.ids.forEach((t) => {
      let insert = getLogData(
        t,
        6033,
        obj,
        userInfo,
        data.find((k) => k.id == t)
      );
      logList.push(insert);
    });
    await insertLog(trx, logList);
  });
  return {
    msg: "保存成功",
    code: 0,
  };
}

let handler = {
  searchFilter(sql, query) {
    if (query.keyword) {
      sql.where((builder) => {
        builder
          .where(`vip_level.id`, "like", `%${query.keyword}%`)
          .orWhere(`vip_level.name`, "like", `%${query.keyword}%`);
      });
    }
    if (query.status) {
      sql.where("vip_level.status", query.status);
    }
    return sql;
  },
};
module.exports = {
  list,
  add,
  def,
  del,
};
