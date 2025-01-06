const {
  ACCOUNT_TABLE,
  MATERIAL_TABLE,
  SETTLEMENT_METHOD_TABLE,
  MATERIAL_COLLECTION,
  PLATFORM_TABLE,
  TITLE_TABLE,
  ADVERTISER_TABLE,
  TASK_TABLE,
  TITLE_CONTENT_TABLE,
  TASK_FEEDBACK,
  CATEGORY_TABLE,
  PLATFORM_ACCOUNT_TABLE,
  CONTENT_TYPE_TABLE,
} = require("../../../config/setting");
const knex = require("../../../db/knexManager").knexProxy;
const { STATUS_MAPPER } = require("../../../utils/mapper");
const {
  getDaysBetweenDate,
  knexTransaction,
  selectName,
  validateUrl,
} = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const { getGroupAccountId } = require("../../public/permission");
const { getPermission } = require("../../public/permission");
const moment = require("moment");
const { GetAccountMapper } = require("../../../utils/apiMapper");
const { feedbackRemainderBudget } = require("../../manage/task/index");

async function list(query = {}, userInfo = {}) {
  let { oem_id } = userInfo || {};
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  };
  if (retu.pagesize > 100) return Promise.reject("分页上限为100条！");
  let knexSql = knex
    .select(
      "task_feedback.id",
      "task_feedback.task_id",
      "task_feedback.verify_status",
      "task_feedback.opus_url",
      "task_feedback.verify_time",
      "task_feedback.create_date",
      "task_feedback.verify_feedback_time",
      "task.cover_url"
    )
    .from(`${TASK_FEEDBACK} as task_feedback`)
    .leftJoin(`${TASK_TABLE} as task`, "task_feedback.task_id", "task.id")
    .where({ "task_feedback.oem_id": oem_id });
  // let accountIds = await getPermission(query, userInfo);
  // if (accountIds.length)
  //   knexSql.where((builder) => {
  //     builder.whereIn("task_feedback.create_user_id", accountIds);
  //   });
  knexSql = handler.searchFilter(knexSql, query, userInfo);
  let count = await knex
    .count({ count: "t.id" })
    .from(knex.raw(`(${knexSql.toString()}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;
  retu.data = await knexSql
    .select(
      selectName(
        "task_feedback",
        "advertiser_type",
        ADVERTISER_TABLE,
        "name",
        "advertiser_type_name"
      )
    )
    .select(
      selectName(
        "task_feedback",
        "owner_user_id",
        ACCOUNT_TABLE,
        "name",
        "owner_user_name"
      )
    )
    // .select(
    //   selectName(
    //     "task_feedback",
    //     "category_id",
    //     CATEGORY_TABLE,
    //     "name",
    //     "category_name"
    //   )
    // )
    .select(
      selectName("task_feedback", "task_id", TASK_TABLE, "name", "task_name")
    )
    // .select(
    //   selectName(
    //     "task_feedback",
    //     "platform_id",
    //     PLATFORM_TABLE,
    //     "name",
    //     "platform_name"
    //   )
    // )
    // .select(
    //   selectName(
    //     "task_feedback",
    //     "platform_account_id",
    //     PLATFORM_ACCOUNT_TABLE,
    //     "platform_account_name",
    //     "platform_account_name"
    //   )
    // )
    // .select(
    //   selectName(
    //     "task_feedback",
    //     "content_type",
    //     CONTENT_TYPE_TABLE,
    //     "name",
    //     "content_type_name"
    //   )
    // )
    .limit(retu.pagesize)
    .offset((retu.page - 1) * retu.pagesize)
    .orderBy("id", "desc");

  retu.data = retu.data.map((item) => {
    return item;
  });
  return retu;
}

async function publish(query = {}, userInfo = {}) {
  let { advertiser_type, task_id, collection_id, details } = query || {};
  if (!advertiser_type) return Promise.reject("未选择项目类型！");
  if (!task_id) return Promise.reject("未选择任务ID！");
  if (!collection_id) return Promise.reject("未选择领取记录ID！");
  if (!details || !details.length) return Promise.reject("未填写作品！");

  let fail = [];
  let success = [];
  let data = await knexTransaction(async (trx) => {
    let feedback_log = [];
    let feedback_ids = [];
    let result = (await trx(`${MATERIAL_COLLECTION} as mcl`)
      .select("mcl.video_id", "mcl.image_id", "mcl.audio_id", 'mcl.expire_time')
      .where("mcl.id", collection_id))[0];
    if (!result) return Promise.reject("领取记录不存在！");
    await Promise.all(
      query.details.map(async (item) => {
        let feedback = {
          category_id: item.category_id,
          opus_url: item.opus_url,
          owner_user_id: item.owner_user_id,
          platform_id: item.platform_id,
          platform_primary_id: item.platform_primary_id,

          opus_type: result.video_id ? 1 : (result.image_id ? 2 : 3),
          task_id: query.task_id,
          advertiser_type: query.advertiser_type,
          collection_id: query.collection_id,
          oem_id: userInfo.oem_id,
          create_user_id: userInfo.id,
          update_user_id: userInfo.id,
          create_date: moment().format("YYYY-MM-DD"),
          // owner_user_id: userInfo.id,
        };

        if (validateUrl(feedback.opus_url)) {
          fail.push({ ...item, reason: "作品链接格式错误！" });
        } else if (result.expire_time * 1000 - new Date().getTime() / 1000 < 0) {
          fail.push({ ...item, reason: "领取时间已过期，不能发布作品！" });
        } else {
          let detail_id = await trx(TASK_FEEDBACK)
            .insert(feedback)
            .catch((err) => {
              fail.push({ ...item, reason: "作品链接重复！" });
            });
          if (detail_id) {
            success.push(item)
            feedback_log.push(
              getLogData(detail_id[0], 4156, feedback, userInfo)
            );
            feedback_ids.push(detail_id[0])
          }
        }
      })
    );
    if (feedback_log.length) await insertLog(trx, feedback_log);
    if (feedback_ids.length) await feedbackRemainderBudget(query.task_id, feedback_ids, userInfo.id, trx);
  });
  return {
    code: 0,
    data: success,
    fail: fail,
    message: fail.length ? '作品发布异常，请检查是否重复反馈或链接格式错误！' : '作品发布成功',
  };
}

async function update(query = {}, userInfo = {}) {
  let { id, details } = query || {};
  if (!id) return Promise.reject("未选择作品ID！");
  if (!details || !details.length) return Promise.reject("未填写作品！");
  let fail = [];
  let data = await knexTransaction(async (trx) => {
    let feedback_log = [];
    await Promise.all(
      query.details.map(async (item) => {
        let feedback = {
          ...item,
          update_user_id: userInfo.id,
          owner_user_id: userInfo.id,
        };
        if (validateUrl(feedback.opus_url)) {
          fail.push({ ...item, reason: "作品链接格式错误！" });
        } else {
          let bool = true;
          await trx(TASK_FEEDBACK)
            .update(feedback)
            .where("id", id)
            .catch((err) => {
              bool = false;
              fail.push({ id: id, ...item, reason: "作品链接重复！" });
            });
          if (bool) feedback_log.push(getLogData(id, 4160, feedback, userInfo));
        }
      })
    );
    if (feedback_log.length) await insertLog(trx, feedback_log);
  });
  return {
    code: 0,
    data: {
      result: data,
      unmatch_data: fail,
    },
    message: "修改成功",
  };
}

async function def(query = {}, userInfo = {}) {
  let { id } = query || {};
  let { oem_id } = userInfo || {};
  if (!id) return Promise.reject("未设置查询ID！");
  let retu = {
    code: 0,
    data: {},
  };
  let knexSql = knex
    .select(
      "id",
      "platform_id",
      "platform_primary_id",
      "task_id",
      "status",
      "verify_status",
      "create_date",
      "opus_type",
      "opus_url",
      "category_id",
      "verify_time",
      "verify_feedback_time",
      "owner_user_id"
    )
    .from(`${TASK_FEEDBACK} as task_feedback`)
    .where({ oem_id: oem_id, id: id });
  retu.data = await knexSql
    .select(
      selectName(
        "task_feedback",
        "platform_id",
        PLATFORM_TABLE,
        "name",
        "platform_name"
      )
    )
    .select(
      selectName(
        "task_feedback",
        "platform_primary_id",
        PLATFORM_ACCOUNT_TABLE,
        "platform_account_name",
        "platform_account_name"
      )
    )
    .select(
      selectName(
        "task_feedback",
        "category_id",
        CATEGORY_TABLE,
        "name",
        "category_name"
      )
    )
    .select(
      selectName(
        "task_feedback",
        "owner_user_id",
        ACCOUNT_TABLE,
        "name",
        "owner_user_name"
      )
    );

  retu.data = retu.data.map((item) => {
    return item;
  });
  retu.data = retu.data[0] || {};
  return retu;
}

let handler = {
  searchFilter(knexSql, query = {}, userInfo) {
    if (!query.status) knexSql.whereIn("task_feedback.status", [1, 2]);
    if (query.status) knexSql.where("task_feedback.status", query.status);
    if (query.type == "self")
      knexSql.where("task_feedback.owner_user_id", userInfo.id);
    if (query.verify_status)
      knexSql.where("task_feedback.verify_status", query.verify_status);
    if (query.advertiser_type)
      knexSql.where("task_feedback.advertiser_type", query.advertiser_type);
    if (query.content_type)
      knexSql.where("task_feedback.content_type", query.content_type);
    if (query.create_date_range)
      knexSql.whereIn(
        "task_feedback.create_date",
        getDaysBetweenDate(
          query.create_date_range[0],
          query.create_date_range[1]
        )
      );
    // if (query.platform_ids && query.platform_ids.length) knexSql.whereIn('task_feedback.platform_id', query.platform_ids)
    if (query.keyword) {
      let keyword = query.keyword.trim();
      knexSql.where((builder) => {
        builder
          .where("task_feedback.id", "like", `%${keyword}%`)
          .orWhere("task.id", "like", `%${keyword}%`)
          .orWhere("task.name", "like", `%${keyword}%`);
        //   .orWhere("task_feedback.name", "like", `%${keyword}%`);
      });
    }
    return knexSql;
  },
};
module.exports = {
  list,
  publish,
  update,
  def,
};
