const {
  TASK_TABLE,
  TITLE_TABLE,
  TITLE_CONTENT_TABLE,
} = require("../../../config/setting");
const knex = require("../../../db/knexManager").knexProxy;
const { GetAccountMapper } = require("../../../utils/apiMapper");
const {
  getDaysBetweenDate,
  knexTransaction,
  selectName,
} = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const { getGroupAccountId } = require("../../public/permission");
const { getPermission } = require("../../public/permission");
const moment = require("moment");

async function list(query = {}, userInfo = {}) {
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page) || 1,
    pagesize: Number(query.pagesize) || 20,
  };
  let sql = knex
    .select("title_content.*")
    .from(`${TITLE_CONTENT_TABLE} as title_content`)
    .where("title_content.oem_id", userInfo.oem_id)
    .andWhere((builder) => {
      handler.searchFilter(query, builder);
    });

  let count = await knex
    .count({ count: "t.id" })
    .from(knex.raw(`(${sql}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;

  let data = await sql.select(
    selectName("title_content", "task_id", TASK_TABLE, "name", "task_name")
  );
  let accountMapper = await GetAccountMapper();
  data.forEach((t) => {
    t.create_user_name = accountMapper[t.create_user_id];
  });

  retu.data = data;
  return retu;
}

async function add(query = {}, userInfo = {}) {
  let res = await knexTransaction(async (trx) => {
    let advertiser_type = (
      await trx
        .select("advertiser_type")
        .from(`${TASK_TABLE}`)
        .where({ id: query.task_id })
    )[0];

    let insert = {
      task_id: query.task_id,
      advertiser_type: advertiser_type,
      content: query.content,
      oem_id: userInfo.oem_id,
      create_user_id: userInfo.id,
      update_user_id: userInfo.id,
    };

    let result = await trx.insert(insert).from(`${TITLE_CONTENT_TABLE}`);
    let log_data = getLogData(result[0], 5504, insert, userInfo, {});
    await insertLog(trx, log_data);
  });
  return {
    code: 0,
    data: res,
    message: "新增成功",
  };
}

async function def(query = {}, userInfo = {}) {
  let sql = knex
    .select("title_content.*")
    .from(`${TITLE_CONTENT_TABLE} as title_content`)
    .where("title_content.oem_id", userInfo.oem_id)
    .andWhere((builder) => {
      handler.searchFilter(query, builder);
    });

  let data = await sql;

  return {
    code: 0,
    data: data[0],
  };
}

async function update(query = {}, userInfo = {}) {
  let res = await knexTransaction(async (trx) => {
    if (query.task_id) {
      let ad = (
        await trx
          .select("advertiser_type")
          .from(`${TASK_TABLE}`)
          .where({ id: query.task_id })
      )[0];
      query.advertiser_type = ad.advertiser_type;
    }

    let update = {};
    let field = ["task_id", "content", "status", "advertiser_type"];
    let update_field = ["id", "update_user_id"];
    field.forEach((t) => {
      if (query[t]) {
        update[t] = query[t];
        update_field.push(t);
      }
    });
    update.update_user_id = userInfo.id;
    let old_data = await trx
      .select(update_field)
      .from(`${TITLE_CONTENT_TABLE}`)
      .whereIn("id", query.ids);

    await trx
      .update(update)
      .from(`${TITLE_CONTENT_TABLE}`)
      .whereIn("id", query.ids);

    let log_data = [];
    old_data.forEach((t) => {
      let arr = getLogData(t.id, 5502, update, userInfo, t);
      log_data.push(arr);
    });
    await insertLog(trx, log_data);
  });
  return {
    code: 0,
    data: res,
    message: "修改成功",
  };
}

const handler = {
  async searchFilter(query, builder) {
    if (query.keyword) {
      builder.where((builder_copy) => {
        builder_copy
          .where("title_content.id", "like", `%${query.keyword}%`)
          .orWhere("title_content.content", "like", `%${query.keyword}%`);
      });
    }
    if (query.id) {
      builder.where("title_content.id", query.id);
    }
    if (query.status) {
      builder.where("title_content.status", query.status);
    }
    if (query.task_id) {
      builder.where("title_content.task_id", query.task_id);
    }
  },
};

module.exports = {
  list,
  add,
  def,
  update,
};
