const knex = require("../../../../db/knexManager").knexProxy;
const {
  COMMISSION_POLICY,
  ACCOUNT_TABLE,
} = require("../../../../config/setting");
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
  let sql = knex
    .select("commission_policy.*")
    .from(`${COMMISSION_POLICY} as commission_policy`);
  sql = handler.searchFilter(sql, query);

  let count = await knex
    .count({ count: "t.id" })
    .from(knex.raw(`(${sql.toString()}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;

  sql.select(
    selectName(
      "commission_policy",
      "create_user_id",
      ACCOUNT_TABLE,
      "name",
      "create_user_name"
    )
  );

  let data = await sql
    .limit(retu.pagesize)
    .offset((retu.page - 1) * retu.pagesize)
    .orderBy("commission_policy.id", "desc");

  data.forEach((t) => {
    t.commission_policy = JSON.parse(t.commission_policy);
    t.commission_policy.forEach((k) => {
      k.ratio /= 100;
    });
  });

  retu.data = data;
  return retu;
}

async function add(query, userInfo) {
  if (!query.commission_type) throw new Error("请传入佣金类型");

  let id = query.id || null;
  await knexTransaction(async (trx) => {
    let result = trx
      .select("*")
      .from(COMMISSION_POLICY)
      .where("commission_type", query.commission_type);
    if (result.length) throw new Error("该佣金类型已存在政策");

    let commission_policy = [];
    query.commission_policy.forEach((t) => {
      let obj = {
        order: t.order,
        type: t.type,
        radix: t.radix,
        ratio: Number(t.ratio) * 100,
        cycle: t.cycle,
      };
      commission_policy.push(obj);
    });

    if (commission_policy.length) {
      let insert = {
        commission_type: query.commission_type,
        commission_policy: JSON.stringify(commission_policy),
        update_user_id: userInfo.id,
      };

      if (id) {
        let data = (
          await trx
            .select("commission_policy.*")
            .from(`${COMMISSION_POLICY} as commission_policy`)
            .where("commission_policy.id", id)
        )[0];

        await trx(COMMISSION_POLICY).update(insert).where("id", id);
        await insertLog(trx, getLogData(id, 6102, insert, userInfo, data));
      } else {
        insert.oem_id = userInfo.oem_id;
        insert.create_user_id = userInfo.id;
        id = (await trx(COMMISSION_POLICY).insert(insert))[0];
        await insertLog(trx, getLogData(id, 6101, insert, userInfo, {}));
      }
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
    .select("commission_policy.*")
    .from(`${COMMISSION_POLICY} as commission_policy`)
    .where({ "commission_policy.id": query.id });
  let data = (await sql)[0];

  data.commission_policy = JSON.parse(data.commission_policy);
  data.commission_policy.forEach((t) => {
    t.ratio /= 100;
  });
  data.commission_frequency = data.commission_policy.length;
  return {
    code: 0,
    data,
  };
}

async function del(query, userInfo) {
  if (!query.ids || !query.ids.length) throw new Error("请传入删除值");
  await knexTransaction(async (trx) => {
    let obj = {
      // status: query.status,
      update_user_id: userInfo.id,
    };
    let data = await trx
      .select("*")
      .from(COMMISSION_POLICY)
      .whereIn("id", query.ids);
    // await trx(COMMISSION_POLICY).update(obj).whereIn("id", query.ids);
    await trx(COMMISSION_POLICY).del().whereIn("id", query.ids);

    let logList = [];
    query.ids.forEach((t) => {
      let insert = getLogData(
        t,
        6103,
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
        builder.where(`commission_policy.id`, "like", `%${query.keyword}%`);
      });
    }
    if (query.status) {
      sql.where("commission_policy.status", query.status);
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
