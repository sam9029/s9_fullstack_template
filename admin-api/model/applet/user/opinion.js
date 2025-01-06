const knex = require("../../../db/knexManager").knexProxy;
const { OPINION, ACCOUNT_TABLE } = require("../../../config/setting");
const { bucket } = require("../../../config/index");
const UAParser = require("ua-parser-js");
const {
  getDaysBetweenDate,
  knexTransaction,
  getRequestIP,
} = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const {
  getTableSite,
  sqlCount,
  sqlPagination,
} = require("../../../utils/sqlHelper");
const moment = require("moment");

async function list(query, userInfo) {
  const res = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page) || 1,
      pagesize: Number(query.pagesize) || 20,
      count: 0,
    },
  };
  let response = res.data;

  if (response.page == 1) {
    response.site = await getTableSite(OPINION, "id");
  } else {
    response.site = query.site || 0;
  }
  let sql = knex.select("opinion.id").from(`${OPINION} as opinion`).where({
    "opinion.oem_id": userInfo.oem_id,
    "opinion.status": 1,
  });
  sql = handler.searchFilter(sql, query, userInfo);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    sql = sqlPagination(sql, response).select(
      "opinion.phone",
      "opinion.create_time",
      "opinion.describe",
      "opinion.reply_status"
    );

    let data = await sql.orderBy("opinion.id", "desc");
    data.forEach((t) => {
      t.images = JSON.parse(t.images || "[]");
      t.images.forEach((k) => {
        k = `${bucket.publicHost}${k}?x-oss-process=image/resize,h_90/quality,q_90`;
      });
    });
    response.list = data;
  }
  return res;
}

async function add(req, query = {}, userInfo = {}) {
  if (!query.describe) return Promise.reject("未填写问题描述！");
  let ip = getRequestIP(req);
  let ua_info = UAParser(req.headers["user-agent"] || "");

  let insert_data = {
    account_id: userInfo.id,
    type: query.type,
    ip,
    describe: query.describe,
    images: JSON.stringify(query.images),
    phone: query.phone || userInfo.telephone,
    ua: JSON.stringify(ua_info),
    platform: query.platform,
    status: 1,
    create_date: moment().format("YYYY-MM-DD"),
    oem_id: userInfo.oem_id,
    create_user_id: userInfo.id,
    update_user_id: userInfo.id,
  };
  let data = await knexTransaction(async (trx) => {
    let back = await trx(OPINION).insert(insert_data);
    await insertLog(trx, getLogData(back[0], 3031, insert_data, userInfo));
    return back;
  });
  return { code: 0, data: null };
}

async function def(query, userInfo = {}) {
  let sql = knex
    .select("type", "create_time", "describe", "reply", "images", "update_time")
    .from(OPINION)
    .where("id", query.id);
  let list = await sql;
  list.forEach((t) => {
    t.images = JSON.parse(t.images || "[]");
    t.images.forEach((k) => {
      k = `${bucket.publicHost}${k}?x-oss-process=image/resize,h_90/quality,q_90`;
    });
  });
  return {
    code: 0,
    data: {
      list,
    },
  };
}

let handler = {
  searchFilter(sql, query, userInfo) {
    if (query.account_id) {
      sql.where(`opinion.account_id`, query.account_id);
    } else {
      sql.where(`opinion.account_id`, userInfo.id);
    }
    return sql;
  },
};

module.exports = {
  list,
  add,
  def,
};
