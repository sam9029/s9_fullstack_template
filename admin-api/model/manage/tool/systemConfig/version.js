const knex = require("../../../../db/knexManager").knexProxy;
const { VERSION, ACCOUNT_TABLE } = require("../../../../config/setting");
const {
  getUuid,
  knexTransaction,
  selectName,
  getTableSite,
} = require("../../../../utils/tools");
const { insertLog, getLogData } = require("../../../public/operationLog");
const {
  GetPlatformMapper,
  projectList,
} = require("../../../../utils/apiMapper");
const moment = require("moment");
const { getPermission } = require("../../../public/permission");
const { checkKeys } = require("../../../../utils/check_type");
const { isArray } = require("lodash");
async function list(query, userInfo) {
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  };
  let sql = knex.select("version.*").from(`${VERSION} as version`);
  sql = handler.searchFilter(sql, query);

  let count = await knex.count({ count: "t.id" }).from(knex.raw(`(${sql.toString()}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;

  sql.select(selectName("version", "create_user_id", ACCOUNT_TABLE, "name", "create_user_name"));

  let data = await sql.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("version.id", "desc");


  retu.data = data;
  return retu;
}

async function add(query, userInfo) {
  let obj = checkKeys(query, [
    "apple_url?",
    "url?",
    { key: "type", type: String, required: true },
    { key: "force_update", required: true },
    "name?", "status?", "version", "version_code", "file_name?", "size?", "remark?",
    'xiaomi?', 'huawei?', 'oppo?', 'vivo?', 'yingyongbao?', 'honor?', 'tuixiaoguo?', 'ios?', 'verify_status?'
  ], true)
  Object.keys(obj).forEach(key => {
    if (isArray(obj[key])) obj[key] = JSON.stringify(obj[key])
  })
  let id = query.id || null;
  if (Object.hasOwnProperty.call(obj, 'size')) obj.size = obj.size || 0
  await knexTransaction(async (trx) => {
    obj.update_user_id = userInfo.id;
    if (id) {
      let data = (await trx.select("version.*").from(`${VERSION} as version`).where("version.id", id))[0];
      await trx(VERSION).update(obj).where("id", data.id);
      await insertLog(trx, getLogData(data.id, 6402, obj, userInfo, data));
    } else {
      obj.create_user_id = userInfo.id;
      id = (await trx(VERSION).insert(obj))[0];
      await insertLog(trx, getLogData(id, 6401, obj, userInfo, {}));
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
    .select("version.*")
    .from(`${VERSION} as version`)
    .where({ "version.id": query.id });
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
    let data = await trx.select("*").from(VERSION).whereIn("id", query.ids);
    await trx(VERSION).update(obj).whereIn("id", query.ids);

    let logList = [];
    query.ids.forEach((t) => {
      let insert = getLogData(
        t,
        6403,
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
          .where(`version.id`, "like", `%${query.keyword}%`)
          .orWhere(`version.name`, "like", `%${query.keyword}%`);
      });
    }
    if (query.status) {
      sql.where("version.status", query.status);
    }
    // if (query.type) {
    //   sql.where("version.type", query.type);
    // }
    return sql;
  },
};
module.exports = {
  list,
  add,
  def,
  del,
};
