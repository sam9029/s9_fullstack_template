const knex = require("../../../../db/knexManager").knexProxy;
const { CATALOG, ACCOUNT_TABLE } = require("../../../../config/setting");
const { knexTransaction, selectName } = require("../../../../utils/tools");
const { insertLog, getLogData } = require("../../../public/operationLog");
const moment = require("moment");

async function list(query, userInfo) {
  let sql = knex
    .select("catalog.*")
    .select(
      selectName(
        "catalog",
        "create_user_id",
        ACCOUNT_TABLE,
        "name",
        "create_user_name"
      )
    )
    .select(
      knex.raw(
        `(select count(catalog_copy.id) from ${CATALOG} as catalog_copy where catalog_copy.pid = catalog.id and catalog_copy.status in (1,2)) as child_num`
      )
    )
    .from(`${CATALOG} as catalog`);
  sql = handler.searchFilter(sql, query);

  let data = await sql.orderBy(["catalog.order", "catalog.id"]);
  data.forEach((t) => {
    t.hasChildren = t.child_num ? true : false;
  });

  return {
    code: 0,
    data: data,
  };
}

async function add(query, userInfo) {
  let id = query.id || null;
  await knexTransaction(async (trx) => {
    let obj = {};
    let field = ["name", "pid", "catalog_id", "order", "business_type"];
    field.forEach((t) => {
      if (query[t]) obj[t] = query[t];
    });
    if (!query.business_type) {
      obj.business_type = null;
    }

    let insert = {
      ...obj,
      update_user_id: userInfo.id,
    };

    if (id) {
      let data = (
        await trx
          .select("catalog.*")
          .from(`${CATALOG} as catalog`)
          .where("catalog.id", id)
      )[0];

      await trx(CATALOG).update(insert).where("id", id);
      await insertLog(trx, getLogData(id, 6202, insert, userInfo, data));
    } else {
      insert.create_user_id = userInfo.id;
      insert.oem_id = userInfo.oem_id;
      id = (await trx(CATALOG).insert(insert))[0];
      await insertLog(trx, getLogData(id, 6201, insert, userInfo, {}));
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
    .select("catalog.*")
    .from(`${CATALOG} as catalog`)
    .where({ "catalog.id": query.id });
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
    let data = await trx.select("*").from(CATALOG).whereIn("id", query.ids);
    await trx(CATALOG).update(obj).whereIn("id", query.ids);

    let logList = [];
    query.ids.forEach((t) => {
      let insert = getLogData(
        t,
        6203,
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
          .where(`catalog.id`, "like", `%${query.keyword}%`)
          .orWhere(`catalog.name`, "like", `%${query.keyword}%`);
      });
    }
    if (query.status) {
      sql.where("catalog.status", query.status);
    } else {
      sql.whereIn("catalog.status", [1, 2]);
    }
    if (query.pid) {
      sql.where("catalog.pid", query.pid);
    } else {
      if (query.type == "all") {
      } else {
        if (query.status != 3) sql.whereNull("catalog.pid");
      }
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
