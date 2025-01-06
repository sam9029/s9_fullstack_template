const knex = require("../../../../db/knexManager").knexProxy;
const {
  ACCOUNT_TABLE,
  MESSAGE_TABLE,
  MESSAGE_RELATION,
  CONTENT_RELATION,
  ADVERTISER_TABLE,
  PLATFORM_TABLE,
  CONTENT_TABLE,
} = require("../../../../config/setting");
const {
  knexTransaction,
  selectName,
  getDaysBetweenDate,
} = require("../../../../utils/tools");
const { insertLog, getLogData } = require("../../../public/operationLog");
const moment = require("moment");
const {
  getTableSite,
  sqlPagination,
  sqlCount,
} = require("../../../../utils/sqlHelper");
const {
  MESSAGE_TYPE_MAPPER,
  MESSAGE_SUB_TYPE_MAPPER,
} = require("../../../../utils/mapper");

async function list(query, userInfo) {
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
    site: 0,
  };

  if (retu.pagesize > 100) return Promise.reject("分页上限为100条！");
  if (retu.page == 1) {
    retu.site = await getTableSite(MESSAGE_TABLE, "id");
  } else {
    retu.site = query.site || 0;
  }

  let sql = knex
    .select("message.*")
    .select(
      knex.raw(
        "count(if(message_relation.has_read = 1, message_relation.id, null)) as unread_count"
      )
    )
    .select(
      knex.raw(
        "count(if(message_relation.has_read = 2, message_relation.id, null)) as read_count"
      )
    )
    .from(`${MESSAGE_TABLE} as message`)
    .leftJoin(
      `${MESSAGE_RELATION} as message_relation`,
      "message.id",
      "message_relation.message_id"
    )
    .groupBy("message.id");
  sql = handler.searchFilter(sql, query);

  if (query.query_count) {
    retu.count = await sqlCount(knex, sql);
  } else {
    sql
      .select(
        selectName(
          "message",
          "create_user_id",
          ACCOUNT_TABLE,
          "name",
          "create_user_name"
        )
      )
      .select(
        selectName(
          "message",
          "sender_user_id",
          ACCOUNT_TABLE,
          "name",
          "sender_user_name"
        )
      )
      .orderBy("message.id", "desc")
      .limit(retu.pagesize)
      .offset((retu.page - 1) * retu.pagesize);

    let data = await sql;
    data.forEach((t) => {
      t.message = JSON.parse(t.message || "{}");
      t.show_message = JSON.parse(t.show_message || "[]");
    });
    retu.data = data;
  }
  return retu;
}

async function add(query, userInfo) {
  if (!query.type) return Promise.reject("请传入消息类型");

  let id = query.id || null;
  let subType = MESSAGE_SUB_TYPE_MAPPER[query.message_type];
  await knexTransaction(async (trx) => {
    let insert = {
      type: query.type,
      message_type: query.message_type,
      message_title: query.message_title || subType?.title,
      message: JSON.stringify(query.message || {}),
      show_message: JSON.stringify(query.show_message || []),
      update_user_id: userInfo.id,
    };

    if (id) {
      let data = (
        await trx
          .select("message.*")
          .from(`${MESSAGE_TABLE} as message`)
          .where("message.id", id)
      )[0];
      if (data.status != 1 || data.send_status != 1)
        return Promise.reject("消息状态错误");

      await trx(MESSAGE_TABLE).update(insert).where("id", id);
      await insertLog(trx, getLogData(id, 6452, insert, userInfo, data));
    } else {
      insert.oem_id = userInfo.oem_id;
      insert.create_user_id = userInfo.id;
      insert.create_date = moment().format("YYYY-MM-DD");
      id = (await trx(MESSAGE_TABLE).insert(insert))[0];
      await insertLog(trx, getLogData(id, 6451, insert, userInfo, {}));
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
    .select("message.*")
    .from(`${MESSAGE_TABLE} as message`)
    .where({ "message.id": query.id });
  let data = (await sql)[0];

  data.message = JSON.parse(data.message || "{}");
  data.show_message = JSON.parse(data.show_message || "[]");
  return {
    code: 0,
    data,
  };
}

async function del(query, userInfo) {
  if (!query.ids || !query.ids.length) return Promise.reject("请传入删除值");
  await knexTransaction(async (trx) => {
    let obj = {
      status: query.status,
      update_user_id: userInfo.id,
    };
    let data = await trx
      .select("*")
      .from(MESSAGE_TABLE)
      .whereIn("id", query.ids)
      .where("send_status", 1);
    let ids = data.map((t) => t.id);

    if (ids) {
      await trx(MESSAGE_TABLE).update(obj).whereIn("id", ids);

      let logList = [];
      ids.forEach((t) => {
        let insert = getLogData(
          t,
          6453,
          obj,
          userInfo,
          data.find((k) => k.id == t)
        );
        logList.push(insert);
      });
      await insertLog(trx, logList);
    }
  });
  return {
    msg: "保存成功",
    code: 0,
  };
}

async function update(query, userInfo) {
  if (!query.ids || !query.ids.length) return Promise.reject("请传入操作值");
  await knexTransaction(async (trx) => {
    // 发送
    if (query.send_status == 2) {
      let data = await trx
        .select("*")
        .from(MESSAGE_TABLE)
        .whereIn("id", query.ids)
        .where("status", 1)
        .whereNot("send_status", 2);
      let ids = data.map((t) => t.id);
      if (ids.length) {
        // 更新消息表状态发送
        let update = {
          sender_user_id: userInfo.id,
          send_time: moment().format("YYYY-MM-DD HH:mm:ss"),
          send_status: query.send_status,
          update_user_id: userInfo.id,
        };
        await trx.update(update).from(MESSAGE_TABLE).whereIn("id", ids);

        // // 插入消息关联表
        // let accountIds = await trx
        //   .select("id")
        //   .from(ACCOUNT_TABLE)
        //   .where({ status: 1, oem_id: userInfo.oem_id });

        let logList = [];
        for (let i = 0; i < ids.length; i++) {
          let item = data.find((t) => t.id == ids[i]);
          // 爆款任务携带参数
          let parma = await handler.getParma(item);

          let obj = {
            message_id: ids[i],
            create_date: moment().format("YYYY-MM-DD"),
            parma: JSON.stringify(parma),
            create_user_id: userInfo.id,
            update_user_id: userInfo.id,
            oem_id: userInfo.oem_id,
          };
          // for (let j = 0; j < accountIds.length; j++) {
          //   obj.receiver_user_id = accountIds[j].id;
          //   let id = (await trx.insert(obj).from(MESSAGE_RELATION))[0];
          //   let log = getLogData(id, 6454, obj, userInfo);
          //   logList.push(log);
          // }
          obj.receiver_user_id = 1;
          let id = (await trx.insert(obj).from(MESSAGE_RELATION))[0];
          let log = getLogData(id, 6454, obj, userInfo);
          logList.push(log);
        }
        await Promise.all(logList);
      }
    }
    // 撤回
    else if (query.send_status == 3) {
      let data = await trx
        .select("message.id as message_id")
        .select(
          knex.raw("group_concat(message_relation.id) as message_relation_id")
        )
        .from(`${MESSAGE_TABLE} as message`)
        .leftJoin(
          `${MESSAGE_RELATION} as message_relation`,
          "message.id",
          "message_relation.message_id"
        )
        .whereIn("message.id", query.ids)
        .where({
          "message.status": 1,
          "message.send_status": 2,
          "message_relation.has_read": 1,
        })
        .groupBy("message.id");

      let ids = [];
      let relationIds = [];
      data.forEach((t) => {
        ids.push(t.message_id);
        t.message_relation_id = t.message_relation_id.split(",");
        relationIds.push(...t.message_relation_id);
      });
      if (ids.length) {
        // 更新消息表状态撤回
        let update = {
          send_status: query.send_status,
          update_user_id: userInfo.id,
        };
        await trx.update(update).from(MESSAGE_TABLE).whereIn("id", ids);

        let logList = [];
        ids.forEach((t) => {
          let log = getLogData(
            t,
            6455,
            update,
            userInfo,
            data.find((k) => k.id == t)
          );
          logList.push(log);
        });
        await Promise.all(logList);
      }
      if (relationIds.length) {
        // 更新消息表状态撤回
        let update = {
          status: 3,
          update_user_id: userInfo.id,
        };
        await trx
          .update(update)
          .from(MESSAGE_RELATION)
          .whereIn("id", relationIds);
      }
    }
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
        builder.where(`message.id`, "like", `%${query.keyword}%`);
      });
    }
    if (query.type) {
      sql.where("message.type", query.type);
    }
    if (query.message_type) {
      sql.where("message.message_type", query.message_type);
    }
    if (query.send_status) {
      if (query.send_status == 4) sql.where("message.status", 3);
      else sql.where("message.send_status", query.send_status);
    } else {
      sql.where("message.status", 1);
    }

    sql.whereIn(
      `message.create_date`,
      getDaysBetweenDate(
        moment().subtract(30, "day").format("YYYY-MM-DD"),
        moment().format("YYYY-MM-DD")
      )
    );
    return sql;
  },
  async getParma(data, trx = knex) {
    let result = {};
    if (data.message_type == 403) {
      let task_id = JSON.parse(data.message || "{}").task_name;

      result = (
        await trx
          .select(
            "content_relation.id as relation_id",
            "content.promotion_type",
            "content.id as content_id",
            "advertiser.business_type",

            "content_relation.platform_id",
            "platform.name as platform_name",
            "platform.icon as platform_icon",

            "content_relation.advertiser_type",
            "advertiser.name as advertiser_type_name",
            "advertiser.icon as advertiser_type icon"
          )
          .select(
            knex.raw(
              "if(content_relation.advertiser_type = 1019, 1, 0) as dy_story"
            )
          )
          .from(`${CONTENT_RELATION} as content_relation`)
          .leftJoin(
            `${CONTENT_TABLE} as content`,
            "content_relation.content_id",
            "content.id"
          )
          .leftJoin(
            `${ADVERTISER_TABLE} as advertiser`,
            "content_relation.advertiser_type",
            "advertiser.id"
          )
          .leftJoin(
            `${PLATFORM_TABLE} as platform`,
            "content_relation.platform_id",
            "platform.id"
          )
          .where("content_relation.id", task_id)
      )[0];
    }
    if (result) result.dy_story = result.dy_story == 1;
    return result || { dy_story: false };
  },
};
module.exports = {
  list,
  add,
  def,
  del,
  update,
};
