const knex = require("../../../db/knexManager").knexProxy;
const { MESSAGE_TABLE, MESSAGE_RELATION } = require("../../../config/setting");
const { h5_production_host } = require("../../../config/index");
const { bucket } = require("../../../config/index");
const { knexTransaction, getDaysBetweenDate } = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const {
  getTableSite,
  sqlCount,
  sqlPagination,
} = require("../../../utils/sqlHelper");
const moment = require("moment");
const { useCustomCache, delCustomCache } = require("../../../db/redis");
const { RK_USER_MESSAGE_CACHE } = require("../../../config/redis_key");

async function list(req, userInfo) {
  let { query } = req;
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
    response.site = await getTableSite(MESSAGE_RELATION, "id");
  } else {
    response.site = query.site || 0;
  }
  let sql = knex
    .select(
      "message_relation.id",
      "message_relation.has_read",
      "message_relation.create_time",
      "message_relation.parma",
      "message.id as message_id",
      "message.message_type",
      "message.message_title",
      "message.message",
      "message.show_message"
    )
    .from(`${MESSAGE_RELATION} as message_relation`)
    .leftJoin(`${MESSAGE_TABLE} as message`, "message_relation.message_id", "message.id")
    .where({
      // "message_relation.oem_id": userInfo.oem_id,
      "message_relation.status": 1,
      // "message_relation.receiver_user_id": userInfo.id,
      "message.send_status": 2,
    })
    .whereIn('message_relation.receiver_user_id', [userInfo.id, 1]) //1为公共消息
  sql = handler.searchFilter(sql, query);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    if (response.site && response.page > 1) {
      sql.where("message_relation.id", "<=", response.site);
    }

    sql = sqlPagination(sql, response).orderBy(
      "message_relation.create_time",
      "desc"
    );

    let data = await sql;
    let message_ids = [];
    data.forEach((t) => {
      t.message = JSON.parse(t.message);
      t.show_message = JSON.parse(t.show_message);
      t.parma = JSON.parse(t.parma);
      if (t.message.describe)
        t.message_url = `${h5_production_host}/parseurl?message_id=${t.message_id}&token=${userInfo.token}`;
      message_ids.push(t.message_id);
      delete t.message_id;
    });
    if (message_ids.length) {
      read_message(message_ids, userInfo.id).catch(err => {
        console.log('消息已读失败！', err);
      })
    }
    if (!data.length) response.site = null;
    response.list = data;
  }

  return res;
}
async function read_message(message_ids = [], receiver_user_id) {
  if (!message_ids?.length || !receiver_user_id) return
  let insert_datas = message_ids.map(message_id => {
    return { message_id, receiver_user_id, has_read: 2, update_user_id: receiver_user_id }
  })
  const redis_key = `${RK_USER_MESSAGE_CACHE}${receiver_user_id}`
  await delCustomCache([redis_key])
  await knex(MESSAGE_RELATION).insert(insert_datas).onConflict(['receiver_user_id', 'message_id']).merge()
}
async function def(query, userInfo) {
  let sql = knex
    .select(
      "message_relation.has_read",
      "message.message_title",
      "message.message",
      "message.show_message",
      "message.id as message_id"
    )
    .from(`${MESSAGE_RELATION} as message_relation`)
    .leftJoin(`${MESSAGE_TABLE} as message`, "message_relation.message_id", "message.id")
    .where({
      "message_relation.id": query.id,
      "message_relation.status": 1,
      "message.send_status": 2,
    })
    .whereIn('message_relation.receiver_user_id', [userInfo.id, 1]) //1为公共消息
  let data = (await sql)[0];
  if (!data) return Promise.reject('消息不存在！')
  data.message = JSON.parse(data.message);
  data.show_message = JSON.parse(data.show_message);

  if (data.has_read == 1) {
    read_message([data.message_id], userInfo.id).catch(err => {
      console.log('消息已读失败！', err);
    })
    delete data.has_read;
  }
  return {
    code: 0,
    data,
  };
}

async function typeList(req, userInfo) {
  let { query } = req;
  const { id: account_id } = userInfo
  const redis_key = `${RK_USER_MESSAGE_CACHE}${account_id}`
  let data = await useCustomCache(redis_key, async () => {

    let whereSql = knex.max("message_relation.id as id")
      .select('message.type')
      .from(`${MESSAGE_RELATION} as message_relation`)
      .leftJoin(`${MESSAGE_TABLE} as message`, "message_relation.message_id", "message.id")
      .leftJoin(`${MESSAGE_RELATION} as read_relation`, builder => {
        builder.on('message.id', '=', 'read_relation.message_id').andOn('read_relation.receiver_user_id', '=', account_id)
      })
      .where({ "message_relation.status": 1, "message.send_status": 2, })
      .whereIn('message_relation.receiver_user_id', [account_id, 1]) //-1为公共消息
      .whereIn(`message_relation.create_date`, getDaysBetweenDate(moment().subtract(30, "day").format("YYYY-MM-DD"), moment().format("YYYY-MM-DD")))
      .whereRaw(`(read_relation.has_read IS NULL OR read_relation.has_read = 1)`)
      .groupBy('message.type')
    // console.log(whereSql.toQuery());


    let message_ids = (await whereSql).map(i => i.id)
    // 将未读的消息ID查询出来
    if (!message_ids?.length) return [] // 没有未读消息

    let sql = knex
      .select("message.type", "message.message_title", "message_relation.has_read", "message_relation.create_time")
      .from(`${MESSAGE_RELATION} as message_relation`)
      .leftJoin(`${MESSAGE_TABLE} as message`, "message_relation.message_id", "message.id")
      .whereIn('message_relation.id', message_ids)

    sql = handler.searchFilter(sql, query);
    return await sql;
  }, 2 * 3600)
  return {
    code: 0,
    data,
  };
}

let handler = {
  searchFilter(sql, query) {
    if (query.type) {
      sql.where("message.type", query.type);
    }
    sql.whereIn(
      `message_relation.create_date`,
      getDaysBetweenDate(
        moment().subtract(30, "day").format("YYYY-MM-DD"),
        moment().format("YYYY-MM-DD")
      )
    );
    return sql;
  },
  commonFilter(sql, req) {
    // let { $version: version, $platform: platform } = req;
    // let rewardMessage =
    //   (platform == "ios" && version > 122) ||
    //   (platform == "android" && version > 721);
    // if (!rewardMessage) sql.whereNot("message.message_type", 210);
    return sql;
  },
};
// list({ query: {} }, { id: 10000001 })
module.exports = {
  list,
  def,
  typeList,
};
