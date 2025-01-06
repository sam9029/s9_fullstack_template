const knex = require("../../../../db/knexManager").knexProxy;
const {
  KEYWORD_FEEDBACK,
  KOC_KEYWORD,
  ACCOUNT_TABLE,
  CATEGORY_TABLE,
  KEYWORD_CONTENT_TABLE,
  ADVERTISER_TABLE,
  CONTENT_TYPE_TABLE,
  PLATFORM_ACCOUNT_TABLE,
  PLATFORM_TABLE,
  BUSINESS_TYPE_TABLE,
} = require("../../../../config/setting");
const {
  selectName,
  knexTransaction,
  getDaysBetweenDate,
  validateUrl,
  getUrl,
} = require("../../../../utils/tools");
const {
  FEEDBACK_TYPE_MAPPER,
  VERIFY_STATUS_MAPPER,
  SERIALIZED_STATUS_MAPPER,
  COPYRIGHT_MAPPER,
} = require("../../../../utils/mapper");
const {
  getTableSite,
  sqlCount,
  sqlPagination,
} = require("../../../../utils/sqlHelper");
const {
  getPermission,
  isIdsCanOperate,
} = require("../../../public/permission");
const moment = require("moment");
const { getLogData, insertLog } = require("../../../public/operationLog");
const {
  get_project_render_props,
  RenderType,
} = require("../../../manage/popularize/keyword/utils");
const { publishOpus } = require("../../../public/qqreader/index");
const { opusCreate, opusUpdate } = require("../../../public/zhihu/index");
const {
  platformAccountId,
  getPlatformMapper,
} = require("../../../../utils/apiMapper");
const { commonVerify } = require("../../../manage/popularize/keyword/publish");
const { createOpus } = require("../../../public/qimao");

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
    response.site = await getTableSite(KEYWORD_FEEDBACK, "id");
  } else {
    response.site = Number(query.site) || 0;
  }

  let sql = knex
    .select("feedback.id")
    .from(`${KEYWORD_FEEDBACK} as feedback`)
    .where({
      "feedback.oem_id": userInfo.oem_id,
      "feedback.status": 1,
      "feedback.create_user_id": userInfo.id,
    });
  sql = handler.searchFilter(sql, query);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    if (response.site && response.page > 1) {
      sql.where("feedback.id", "<=", response.site);
    }
    sql = sql
      .select(
        "feedback.verify_status",
        "feedback.verify_suggest",
        "feedback.opus_url",
        "feedback.create_time"
      )
      .select(
        selectName(
          "feedback",
          "category_id",
          CATEGORY_TABLE,
          "name",
          "category_name"
        )
      )
      .select(
        selectName("feedback", "platform_id", PLATFORM_TABLE, "icon", "icon")
      )
      .select(
        selectName(
          "feedback",
          "platform_primary_id",
          PLATFORM_ACCOUNT_TABLE,
          "platform_account_id",
          "platform_account_id"
        )
      )
      .select(
        selectName(
          "feedback",
          "platform_primary_id",
          PLATFORM_ACCOUNT_TABLE,
          "platform_account_name",
          "platform_account_name"
        )
      );
    let data = await sql
      .orderBy("feedback.id", "desc")
      .limit(response.pagesize)
      .offset((response.page - 1) * response.pagesize);
    data.forEach((t) => {
      t.create_time = moment(t.create_time).format("YYYY-MM-DD hh:mm");
    });
    response.list = data;

    if (!data.length) response.site = null;
  }
  return res;
}

async function config(query, userInfo) {
  if (!query.advertiser_type) return Promise.reject("项目类型不能为空！");
  let config = await get_project_render_props(
    knex,
    query.advertiser_type,
    RenderType.Publish,
    userInfo
  );
  return {
    code: 0,
    data: {
      list: config,
    },
  };
}

async function add(query, userInfo) {
  if (!query.advertiser_type) return Promise.reject("项目类型不能为空！");
  if (!query.keyword_id) return Promise.reject("关键词不能为空！");
  if (!query.details || !query.details.length)
    return Promise.reject("发布不能为空！");

  let keywordData = (
    await knex
      .select("*")
      .from(KOC_KEYWORD)
      .where({ verify_status: 2, id: query.keyword_id, status: 1 })
  )[0];
  if (!keywordData) return Promise.reject("请检查关键词状态！");

  let ids = [];
  let fail = [];
  let data = await knexTransaction(async (trx) => {
    let field = (
      await get_project_render_props(
        trx,
        query.advertiser_type,
        RenderType.Publish,
        userInfo,
        null
      )
    ).map((t) => t.prop);

    let PLATFORMMAPPER = await getPlatformMapper(userInfo);
    let logList = [];
    let verifyData = [];
    for (let i = 0; i < query.details.length; i++) {
      let t = query.details[i];

      let requireField = [
        "opus_type",
        "opus_url",
        "platform_primary_id",
        "platform_id",
      ];
      let fieldMapper= {
        opus_type: "作品类型",
        opus_url: "作品链接",
        platform_primary_id: "平台账号",
        platform_id: "发布平台",
      }
      let isBool = false;
      for (let j = 0; j < requireField.length; j++) {
        if (!t[requireField[j]]) {
          fail.push({ ...t, reason: `${fieldMapper[requireField[j]]}必填！` });
          isBool = true;
          break;
        }
      }
      if (!isBool) {
        if (field.every((k) => Object.keys(t).includes(k))) {
          t.index = i;
          t.opus_url = getUrl(t.opus_url)
          if (field.includes("opus_url") && validateUrl(t.opus_url)) {
            fail.push({ ...t, reason: "作品链接格式错误！" });
          } else if (
            t.publish_date &&
            t.publish_date <
              moment(keywordData.verify_feedback_time).format("YYYY-MM-DD")
          ) {
            fail.push({ ...t, reason: "作品发布时间不能早于关键词审核时间！" });
          } else {
            let insert = {};
            field.forEach((k) => {
              insert[k] = t[k] || null;
            });
            insert.keyword_id = query.keyword_id;
            insert.advertiser_type = query.advertiser_type;
            insert.create_user_id = userInfo.id;
            insert.update_user_id = userInfo.id;
            insert.oem_id = userInfo.oem_id;
            insert.create_date = moment().format("YYYY-MM-DD");

            let param = {};
            // 关键词第三方计划id
            if (keywordData.plan_id) {
              // 知乎
              if (query.advertiser_type == 1003) {
                let PLATFORMACCOUNTMAPPER = await platformAccountId(userInfo, {
                  id: t.platform_primary_id,
                });
                param = {
                  plan_id: keywordData.plan_id,
                  media_type: `KOC${PLATFORMMAPPER[t.platform_id].name}`,
                  media_account: String(
                    PLATFORMACCOUNTMAPPER[t.platform_primary_id]
                  ),
                  composition_type: t.opus_type,
                  composition_url: t.opus_url,
                };
                param.release_time = parseInt(Date.now() / 1000);
                let result = await opusCreate(param).catch((err) => {
                  let message = err
                    ? err.error.message
                    : "知乎接口原因，修改失败！";
                  fail.push({ ...t, reason: message });
                });
                if (!result || !result.composition_id) continue;

                insert.tripartite_id = result.composition_id;
                insert.verify_time = moment().format("YYYY-MM-DD HH:mm:ss");
              }
              // QQ阅读
              else if (query.advertiser_type == 1002) {
                param = [
                  {
                    platform_id: t.platform_id,
                    opus_url: t.opus_url,
                  },
                ];
                let result = await publishOpus(
                  keywordData.plan_id,
                  param
                ).catch((err) => {
                  let message = err || "QQ接口原因，修改失败！";
                  fail.push({ ...t, reason: message });
                });
                if (!result) continue;

                insert.tripartite_id = "QQ阅读作品发布成功无返回ID";
                insert.verify_time = moment().format("YYYY-MM-DD HH:mm:ss");
              }
              // 七猫
              else if (query.advertiser_type == 1016) {
                param = [
                  {
                    search_keyword: keywordData.keyword,
                    video_url: t.opus_url,
                  },
                ];
                let result = await createOpus(param).catch((err) => {
                  let message = err || "七猫接口原因，修改失败！";
                  fail.push({ ...t, reason: message });
                });
                if (result != "success") continue;

                insert.tripartite_id = "七猫作品发布成功无返回ID";
                insert.verify_time = moment().format("YYYY-MM-DD HH:mm:ss");
              }
            }

            let id = (
              await trx(KEYWORD_FEEDBACK)
                .insert(insert)
                .catch((err) => {
                  fail.push({ ...t, reason: "该词下存在相同作品链接，请勿重复回传作品链接！" });
                })
            )?.[0];

            if (id) {
              ids.push(id);
              let log = getLogData(id, 6183, insert, userInfo);
              logList.push(log);

              // 书旗是自动批量送审
              let advertiserType = [1011, 1012]
              if (keywordData.plan_id && !advertiserType.includes(Number(query.advertiser_type))) {
                verifyData.push({
                  verify_status: 2,
                  id: id,
                  opus_url: t.opus_url,
                });
              }
            }
          }
        } else {
          t.index = i;
          fail.push({ ...t, reason: "请检查作品字段必填！" });
        }
      }
    }
    if (ids.length && [1, 4].includes(keywordData.publish_status))
      await trx
        .update({ publish_status: 2 })
        .from(KOC_KEYWORD)
        .where("id", query.keyword_id);

    if (verifyData.length) await commonVerify(trx, verifyData, [], userInfo);

    if (logList.length) await insertLog(trx, logList);
  });

  return {
    code: 0,
    data: {
      ids,
      unmatch_data: fail,
    },
    message: fail.length ? "部分成功" : "保存成功",
  };
}

async function update(query, userInfo) {
  if (!query.id) return Promise.reject("发布不能为空！");

  let result = (
    await knex
      .select(
        "feedback.*",
        "keyword.plan_id",
        "keyword.verify_feedback_time as keyword_verify_time"
      )
      .from(`${KEYWORD_FEEDBACK} as feedback`)
      .leftJoin(
        `${KOC_KEYWORD} as keyword`,
        "feedback.keyword_id",
        "keyword.id"
      )
      .where({
        "feedback.id": query.id,
        "feedback.status": 1,
        "keyword.status": 1,
      })
      .whereIn("feedback.verify_status", [3, 4])
  )[0];
  if (!result) return Promise.reject("请检查发布状态！");

  let data = await knexTransaction(async (trx) => {
    let field = [
      "opus_url",
      "opus_type",
      "category_id",
      "pulish_date",
      "platform_id",
      "platform_primary_id",
    ];

    let update = {};
    field.forEach((t) => {
      if (query[t]) update[t] = query[t] || null;
    });
    update.update_user_id = userInfo.id;

    tquery.opus_url = getUrl(query.opus_url)
    if (validateUrl(query.opus_url))
      return Promise.reject("作品链接格式错误！");

    if (
      query.publish_date &&
      query.publish_date <
        moment(result.keyword_verify_time).format("YYYY-MM-DD")
    )
      return Promise.reject("作品发布时间不能早于关键词审核时间！");

    let verifyData = [];
    let PLATFORMMAPPER = await getPlatformMapper(userInfo);
    if (result.plan_id) {
      // 知乎
      if (result.advertiser_type == 1003) {
        let PLATFORMACCOUNTMAPPER = await platformAccountId(userInfo, {
          id: query.platform_primary_id,
        });
        let param = {
          plan_id: result.plan_id,
          media_type: PLATFORMMAPPER[query.platform_id].name,
          media_account: String(
            PLATFORMACCOUNTMAPPER[query.platform_primary_id]
          ),
          composition_type: query.opus_type,
          composition_url: query.opus_url,
        };
        param.release_time = parseInt(new Date(result.create_time) / 1000);
        param.composition_id = result.tripartite_id;

        let result = await opusUpdate(param).catch((err) => {
          let message = err ? err.error.message : "知乎接口原因，修改失败！";
          return Promise.reject(message);
        });
      }
      // QQ阅读
      else if (result.advertiser_type == 1002) {
        let param = [
          {
            platform_id: query.platform_id,
            opus_url: query.opus_url,
          },
        ];
        let result = await publishOpus(result.plan_id, param).catch((err) => {
          let message = err || "QQ接口原因，修改失败！";
          return Promise.reject(message);
        });
      }
      // 七猫
      else if (result.advertiser_type == 1016) {
        let param = [
          {
            search_keyword: result.keyword,
            video_url: query.opus_url,
          },
        ];
        let result = await createOpus(param).catch((err) => {
          let message = err || "七猫接口原因，修改失败！";
          return Promise.reject(message);
        });
      }

      verifyData.push({
        verify_status: 2,
        id: query.id,
      });
    }

    await trx(KEYWORD_FEEDBACK)
      .update(update)
      .catch((err) => {
        return Promise.reject("作品链接重复！");
      });
    if(verifyData.length) await commonVerify(trx, verifyData, [], userInfo);

    let log = getLogData(query.id, 6184, update, userInfo, result);
    await insertLog(trx, log);
  });

  return { code: 0, data: { id: query.id }, message: "保存成功" };
}

async function def(query, userInfo) {
  if (!query.id) return Promise.reject("未设置作品！");
  let sql = knex
    .select(
      "feedback.id",
      "feedback.opus_url",
      "feedback.category_id",
      "feedback.opus_type",
      "feedback.platform_primary_id",
      "feedback.platform_id",
      "feedback.verify_status"
    )
    .select(
      selectName(
        "feedback",
        "category_id",
        CATEGORY_TABLE,
        "name",
        "category_name"
      )
    )
    .select(
      selectName(
        "feedback",
        "platform_id",
        PLATFORM_TABLE,
        "name",
        "platform_name"
      )
    )
    .select(
      selectName(
        "feedback",
        "platform_primary_id",
        PLATFORM_ACCOUNT_TABLE,
        "platform_account_id",
        "platform_account_id"
      )
    )
    .select(
      selectName(
        "feedback",
        "platform_primary_id",
        PLATFORM_ACCOUNT_TABLE,
        "platform_account_name",
        "platform_account_name"
      )
    )
    .from(`${KEYWORD_FEEDBACK} as feedback`)
    .where("feedback.id", query.id);

  let data = (await sql)[0];

  return {
    code: 0,
    data,
  };
}

async function del(query, userInfo) {
  let data = await knexTransaction(async (trx) => {
    // let field = ["status"];
    // let insert_data = {};
    // field.forEach((t) => {
    //   if (query[t]) {
    //     insert_data[t] = query[t];
    //   }
    // });

    let sql = trx
      .select("feedback.id", "feedback.status")
      .from(`${KEYWORD_FEEDBACK} as feedback`)
      .whereIn("feedback.id", query.ids)
      .whereNot("feedback.verify_status", 2);
    let result = await sql;
    if (!result.length) return Promise.reject("未查到作品！");
    let insert_data = { status: 3 };
    await trx(KEYWORD_FEEDBACK)
      .update(insert_data)
      .whereIn(
        "id",
        result.map((t) => t.id)
      );

    //创建的数据写入日志
    let logList = [];
    result.forEach((t) => {
      let logData = getLogData(t.id, 6185, insert_data, userInfo, t);
      logList.push(logData);
    });
    if (logList.length) await insertLog(trx, logList);
  });
  return {
    code: 0,
    data: null,
    message: "保存成功",
  };
}

const handler = {
  searchFilter(sql, query) {
    if (query.keyword_id) {
      sql.where(`feedback.keyword_id`, query.keyword_id);
    }
    return sql;
  },
};
module.exports = {
  list,
  config,
  add,
  update,
  def,
  del,
};
