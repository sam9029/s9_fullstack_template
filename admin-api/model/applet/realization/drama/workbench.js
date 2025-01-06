const moment = require("moment");
const lodash = require("lodash");
const knex = require("../../../../db/knexManager").knexProxy;
const {
  CONTENT_TABLE, CONTENT_RELATION, CONTENT_FAVORITE, DRAMA_PLAN, KOC_KEYWORD, CONTENT_WATCH,
  ADVERTISER_TABLE, PLATFORM_TABLE, PLATFORM_ACCOUNT_TABLE, VIDEO_TABLE, AMOUNT_PROMOTION, WX_PUBLISH_URL, CONTENT_LINK, RELATION_EDIT_DATA, AUTH_ACCOUNT, CHANNEL_TABLE,
  CONTENT_FAVORITE_V2, CONTENT_WATCH_V2,
  DUOLAI_SEARCH_CODE,
  CONTENT_RELATION_TARGET
} = require("../../../../config/setting");
const { app_image_resize } = require("../../../../config/index")
const { knexTransaction, sleep, selectName, factoryAppListResponse, renderPrice, timestampSec, mergeParams, channel_advertisers } = require("../../../../utils/tools");
const { checkKeys, isEmpty, isArrayHas } = require("../../../../utils/check_type");
// const { getPermission } = require("../../public/permission");
const { sqlPagination, sqlCount } = require("../../../../utils/sqlHelper");
const { settlementMethodList, getAdvertierSettlements, getAdvertierMounts, getTagsData } = require("../../../../utils/apiMapper");
const { getDramaPlanData, getDramaReferralId, getPublishInfo, getOAPublishUrl, getWXClickUrl, getDramaPlanCharge } = require("../../../public/drama/index");
const { getLogData, insertLog } = require("../../../public/operationLog");
const { getCustomCache, setCustomCache } = require("../../../../db/redis");
//
const {
  get_bookid_from_link, get_project_dyn_columns, DynListType, translate_dyn_dict, translate_dyn_prop_name, get_bookid_prefix
} = require("../../../manage/popularize/keyword/utils")
const { RK_CONTENT_PLATFROM } = require("../../../../config/redis_key");
const { MOUNT_TYPE, TIKTOK_STORY } = require("../../../../enum/advertiser");
const { RelationType } = require("../../../../enum/type");
const { makeShareToken } = require("../../../../db/token");
const { content_sources } = require("../../../../utils/redisCache");
const { FormatSmtFn } = require("./utils");


const CONT_COL = ["cont.book_name", "cont.cover_url", "cont.tag", "cont.book_id", "cont.title", "cont.content_summary",
  "cont.book_author", "cont.describe", "cont.copyright", "cont.serialized_status", "cont.link", "cont.tag_ids"];

const Mount = {
  Publish: 1, // 作品挂载
  Living: 2, // 直播
  SearchCode: 3, // 搜索口令
  PrivateLink: 4, // Private
  WxShare: 5, // 微信视频号,
  QrCode: 6, // 二维码推广
}

// 任务列表 共用
async function task_list(query, userinfo, $platform, $version) {
  const app_res = await factoryAppListResponse(query, CONTENT_RELATION);
  query = checkKeys(query, [
    "business_type", "promotion_type", "relat_type?", "keyword?", "advertiser_type?", "platform_id?", "tag?", "has_video?",
    { key: "advertiser_types", type: Array }
  ])
  const response = app_res.data;

  query.status = 1;
  const advertiser_ids = await handler.advertisers_limit(query, userinfo);
  if (!advertiser_ids.length) return app_res;

  const channel_advers = await channel_advertisers(userinfo);

  const cols = ["id as relation_id", "content_id", "advertiser_type", "platform_id", "create_time"].map(v => 'r.' + v);
  const knex_sql = knex(`${CONTENT_RELATION} as r`)
    .leftJoin(`${CONTENT_TABLE} as cont`, "r.content_id", "cont.id",)
    .leftJoin(`${RELATION_EDIT_DATA} as re`, 're.relation_id', 'r.id')
    .leftJoin(`${ADVERTISER_TABLE} as adv`, "r.advertiser_type", 'adv.id')
    .select(...cols)
    .select(...CONT_COL)
    .select("r.relat_type as promotion_type")
    .select("adv.name as advertiser_type_name", "adv.icon as advertiser_type_icon",)
    .select(knex.raw(`GREATEST(re.max_income, re.edit_max_income) as max_income`))
    .select(knex.raw(`GREATEST(re.join_people_num, re.edit_join_people_num) as join_people_num`))
    .where({
      "cont.invalid_status": 0,
      "cont.status": 1,
      "r.status": 1,
      "r.oem_id": userinfo.oem_id,
    })
    .whereRaw(`(r.target_status = 2 or exists (select t.id from ${CONTENT_RELATION_TARGET} t where t.relation_id = r.id and t.account_id = ?))`, userinfo.id)
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("r.is_test", 1)
      }
    })
    .andWhere(builder => {
      builder.where("cont.verify_status", 3)
      // .orWhere("cont.create_user_id", userinfo.id)
    })
    .andWhere(builder => {
      if (advertiser_ids.length) builder.whereIn("r.advertiser_type", advertiser_ids);
      if (response.page > 1 && response.site) {
        builder.where("r.id", "<=", response.site);
      }
      if (query.platform_id) builder.where("r.platform_id", query.platform_id);
      if (query.advertiser_type) builder.where("r.advertiser_type", query.advertiser_type);
    })
    .andWhere(builder => {
      if (channel_advers.length) {
        builder.whereIn("r.advertiser_type", channel_advers)
      }
    });

  handler.search_filter(knex_sql, query, userinfo);

  response.list = await sqlPagination(knex_sql, response)
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"))
    .orderBy("r.id", "desc");

  const settle_map = await getAdvertierSettlements();
  // relation_type : 1原有任务 2抖音故事
  response.list = await Promise.all(response.list.map(async i => {
    i.relation_type = 1;
    if (i.advertiser_type == TIKTOK_STORY) {
      i.relation_type = 2;
    }
    if (i.cover_url) i.cover_url = `${i.cover_url}${app_image_resize}`

    const format = FormatSmtFn.compat_format($platform, $version);
    format(settle_map[i.advertiser_type], i.promotion_type, userinfo, i);

    i.tag_ids = JSON.parse(i.tag_ids || '[]')
    i.tag = (await getTagsData(i.tag_ids)).map(t => t.label)
    return i
  }))

  return app_res;
}

// 任务详情
async function task_define(query, userinfo, $platform, $version) {
  const params = checkKeys(query, [
    { key: "content_id", type: Number, required: false },
    { key: "relat_type", type: Number, required: false },
    { key: "platform_id", type: Number, required: false },
    { key: "advertiser_type", type: Number, required: false },
    { key: "relation_id", type: Number, required: false },
  ]);

  if (!params.relation_id && !params.content_id) return Promise.reject("请选择任务或内容!");
  

  const plan_num_sql = knex(`${DRAMA_PLAN} as plan`)
    .count("plan.id")
    .whereRaw("plan.relation_id = r.id")
    .andWhere("plan.account_id", userinfo.id)
    .andWhere("plan.status", 1);
  const plan_query = plan_num_sql.toQuery().replace(/`/g, "");

  const kwd_num_sql = knex(`${KOC_KEYWORD} as plan`)
    .count("plan.id")
    .whereRaw("plan.content_relation_id = r.id")
    .andWhere("plan.create_user_id", userinfo.id)
    .andWhere("plan.status", 1);

  const kwd_num_query = kwd_num_sql.toQuery().replace(/`/g, "");

  const knex_sql = knex(`${CONTENT_RELATION} as r`)
    .leftJoin(`${CONTENT_TABLE} as cont`, 'r.content_id', "cont.id")
    .leftJoin(`${ADVERTISER_TABLE} as adv`, "adv.id", "r.advertiser_type")
    .select(...CONT_COL, "cont.preview")
    .select("r.id as relation_id", "r.content_id", "r.advertiser_type", "r.relat_type", "r.publish_url", "r.app_id", "r.platform_id")
    .select(
      "adv.name as advertiser_type_name", "adv.icon as advertiser_type_icon", "adv.describe as advertiser_describe", 
      "adv.creative_source", "adv.self_operated"
    )
    .select(knex.raw(`(${plan_query}) as plan_num`))
    .select(knex.raw(`(${kwd_num_query}) as keyword_num`))
    .select(
      knex.raw(
        `(SELECT COUNT(p.id) FROM ${CONTENT_FAVORITE_V2} as p
        WHERE p.create_user_id = ${userinfo.id} AND p.content_relation_id = r.id AND p.status = 1 LIMIT 1) as is_favorite`
      )
    )
    .where({
      // "cont.invalid_status": 0,
      // "cont.status": 1,
      // "r.status": 1,
      "r.oem_id": userinfo.oem_id,
    })
    .whereIn("r.relat_type", [RelationType.Alias, RelationType.Mount]) // #TEMP 移动端兼容
    .whereRaw(`(r.target_status = 2 or exists (select t.id from ${CONTENT_RELATION_TARGET} t where t.relation_id = r.id and t.account_id = ?))`, userinfo.id)
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("r.is_test", 1)
      }
    })
    .andWhere(builder => {
      builder.where("cont.verify_status", 3)
        .orWhere("cont.create_user_id", userinfo.id)
    })
    .andWhere(builder => {
      if (params.relat_type) builder.where("r.relat_type", params.relat_type);
      if (params.relation_id) {
        builder.where("r.id", params.relation_id);
      } else {
        builder.where("cont.id", params.content_id);
        if (params.platform_id) builder.where("r.platform_id", params.platform_id);
        if (params.advertiser_type) builder.where("r.advertiser_type", params.advertiser_type);
      }
    })
    .limit(1);
  // console.log(knex_sql.toString());
  const data = (await knex_sql)[0];
  if (!data) {
    throw "该剧集不存在或已下架！";
  }

  // 收益
  data.promotion_type = data.relat_type;
  data.income = 0;
  if (data.relat_type == RelationType.Alias) {
    const income = (
      await knex(`${KOC_KEYWORD} as plan`)
        .leftJoin(`${AMOUNT_PROMOTION} as prt`, 'prt.plan_id', "plan.id")
        .sum("prt.amount as income")
        .where({
          "plan.content_relation_id": data.relation_id,
          // "plan.create_user_id": userinfo.id,
          "prt.type": 1,
          "prt.account_id": userinfo.id,
        })
    )[0]?.income;
    data.income = income;
  } else if (data.relat_type == RelationType.Mount) {
    const income = (
      await knex(`${DRAMA_PLAN} as plan`)
        .leftJoin(`${AMOUNT_PROMOTION} as prt`, 'prt.plan_id', "plan.id")
        .sum("prt.amount as income")
        .where({
          "plan.relation_id": data.relation_id,
          "plan.account_id": userinfo.id,
          "prt.type": 2,
          // "prt.account_id": userinfo.id,
        })
    )[0]?.income;
    data.income = income;
  }

  // 结算方式
  const settle_policys = await getAdvertierSettlements(data.advertiser_type);
  const format = FormatSmtFn.compat_format($platform, $version);
  format(settle_policys, data.relat_type, userinfo, data);

  data.tag_ids = JSON.parse(data.tag_ids || '[]')
  data.tag = (await getTagsData(data.tag_ids)).map(t => t.label)
  if (data.cover_url) data.cover_url = `${data.cover_url}${app_image_resize}`
  data.preview = data.preview || data.describe || ""
  // 试看链接 小程序推广才有试看链接
  if (data.promotion_type == RelationType.Mount && data.advertiser_type != TIKTOK_STORY) {
    // data.referral_id = '1';
    // data.status = 1;
    // const { micro_app_info, schema_url } = getPublishInfo(data)
    // data.microAppInfo = micro_app_info;
    // data.schema_url = schema_url;
    // delete data.referral_id;
    // delete data.status;

    data.microAppInfo = null;
    data.schema_url = null;
  }

  // 挂载方式
  const mount_list = await getAdvertierMounts(data.advertiser_type);
  data.mount_list = mount_list.map(v => {
    return { id: v, name: handler.format_mount(v) }
  });


  // 抖音故事 授权账号
  data.auth_account_num = 0;
  data.total_account_num = 0;
  if (data.advertiser_type == TIKTOK_STORY) {
    const { auth_account_num, total_account_num } = await handler.tiktok_account(knex, userinfo);
    data.auth_account_num = auth_account_num;
    data.total_account_num = total_account_num;
  }

  data.sources = [];
  if (data.creative_source != 'preview') {
    data.preview = "";
    // 网盘资源
    data.sources = await content_sources(data, userinfo);
  }

  let insert = {
    content_id: data.content_id,
    content_relation_id: data.relation_id,
    create_user_id: userinfo.id,
  }
  await knex(CONTENT_WATCH_V2).insert(insert).onConflict(["create_user_id", "content_relation_id"]).merge().catch(err => { console.log(err); });

  return { code: 0, data }
}


//#region 关键词
// 我的任务 -- 关键词
async function my_kwd_task(query, userinfo) {
  checkKeys(query, ["advertiser_type", "business_type?", "keyword?", "tag?", { key: "advertiser_types", type: Array }])
  const app_res = await factoryAppListResponse(query, KOC_KEYWORD);
  const response = app_res.data;

  const advertiser_ids = await handler.advertisers_limit(query, userinfo);
  if (!advertiser_ids.length) return app_res;

  const cols = ["id as relation_id", "content_id", "advertiser_type", "platform_id", "status"].map(v => 'r.' + v);
  const knex_sql = knex(`${KOC_KEYWORD} as plan`)
    .leftJoin(`${CONTENT_RELATION} as r`, "plan.content_relation_id", "r.id")
    .leftJoin(knex.raw(`${AMOUNT_PROMOTION} as prt ON prt.plan_id = plan.id AND prt.type = 1`))
    .leftJoin(`${CONTENT_TABLE} as cont`, "r.content_id", "cont.id")
    .groupBy("plan.content_relation_id")
    .select(...cols)
    .select(...CONT_COL)
    .select("r.relat_type as promotion_type")
    .select(knex.raw(`SUM(prt.amount) as income`))
    .select(knex.raw(`COUNT(plan.id) as plan_num`))
    .where({
      // "cont.invalid_status": 0,
      // "cont.status": 1,
      // "r.status": 1,
      "plan.status": 1,
      "plan.oem_id": userinfo.oem_id,
      "plan.create_user_id": userinfo.id,
      "plan.advertiser_type": query.advertiser_type
    })
    .andWhere(builder => {
      builder.where("cont.verify_status", 3)
        .orWhere("cont.create_user_id", userinfo.id)
    })
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("r.is_test", 1)
      }
    })
    .andWhere(builder => {
      if (response.page > 1 && response.site) {
        builder.where("plan.id", "<=", response.site);
      }
      if (advertiser_ids.length) builder.whereIn("r.advertiser_type", advertiser_ids);
    });

  handler.search_filter(knex_sql, query, userinfo);
  handler.my_task_order_by(knex_sql, query);

  response.list = await sqlPagination(knex_sql, response)
    .select(selectName("r", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
    .select(selectName("r", "advertiser_type", ADVERTISER_TABLE, "icon", "advertiser_type_icon"))
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"))
    .orderBy("r.id", "desc");

  response.list = await Promise.all(response.list.map(async i => {
    i.tag_ids = JSON.parse(i.tag_ids || '[]')
    i.tag = (await getTagsData(i.tag_ids)).map(t => t.label)
    return i
  }))

  return app_res;
}

async function analysis_link(query, userinfo) {
  const { link, advertiser_type } = checkKeys(query, ["link", "advertiser_type"]);
  const { book_id, is_match } = get_bookid_from_link(link, advertiser_type);
  const prefix = await get_bookid_prefix(advertiser_type);

  let dyn_cols = [];
  try {
    const cols = await get_project_dyn_columns(knex, advertiser_type, DynListType.Content, userinfo);
    dyn_cols = cols.map(v => "c." + v.prop)
  } catch {
    dyn_cols = ["c.book_author", "c.link", "c.describe"]
  }

  const raw = (
    await knex(`${CONTENT_RELATION} as r`)
      .leftJoin(`${CONTENT_TABLE} as c`, 'c.id', 'r.content_id')
      .select("r.id", 'r.content_id', 'r.advertiser_type', 'r.platform_id', 'c.book_id', 'c.book_name', 'c.cover_url', ...dyn_cols)
      .where({
        // "c.book_id": prefix_bookid,
        "c.invalid_status": 0,
        "c.status": 1,
        "c.verify_status": 3,
        "r.status": 1,
        "r.oem_id": userinfo.oem_id
      })
      .andWhere(builder => {
        if (userinfo.account_type != 3) {
          builder.where("r.is_test", 1)
        }
      })
      .andWhere(builder => {
        builder.where({"c.book_id": book_id, prefix: prefix })
          .orWhere("c.link", link)
      })
      .andWhere(builder => {
        builder.where("c.verify_status", 3)
          .orWhere("c.create_user_id", userinfo.id)
      })
      .limit(1)
  )[0];

  if (!raw && !is_match) {
    throw "未找到相关内容！"
  }

  let data = { book_id: book_id, link: link };
  if (raw) {
    if (!raw.link) raw.link = link;
    data = raw;
  }

  return { code: 0, data }
}

// 书库
async function book_list(query, userinfo) {
  checkKeys(query, ["keyword?", "advertiser_type"])
  const app_res = await factoryAppListResponse(query, CONTENT_RELATION);
  const response = app_res.data;

  const dyn_config = await get_project_dyn_columns(knex, query.advertiser_type, DynListType.Content, userinfo);
  response.dyn_cols = dyn_config.map(v => {
    if (v.comp_type == 2) return { label: v.label, prop: translate_dyn_prop_name(v.prop) }
    return { label: v.label, prop: v.prop };
  })
  // const dyn_cols = dyn_config.map(v => 'cont.' + v.prop);
  const cols = ["id as relation_id", "content_id", "advertiser_type", "platform_id", "create_time"].map(v => 'r.' + v);
  const knex_sql = knex(`${CONTENT_RELATION} as r`)
    .leftJoin(`${CONTENT_TABLE} as cont`, "r.content_id", "cont.id",)
    .select(...cols)
    .select(...CONT_COL)
    .select("r.relat_type as promotion_type")
    .where({
      "cont.invalid_status": 0,
      "cont.status": 1,
      "r.status": 1,
      "r.oem_id": userinfo.oem_id,
    })
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("r.is_test", 1)
      }
    })
    .andWhere(builder => {
      if (response.page > 1 && response.site) {
        builder.where("r.id", "<=", response.site);
      }
      // if (query.platform_id) builder.where("r.platform_id", "=", query.platform_id);
      if (query.advertiser_type) builder.where("r.advertiser_type", query.advertiser_type);
    })
    .andWhere(builder => {
      builder.where("cont.verify_status", 3).orWhere("cont.create_user_id", userinfo.id)
    });

  handler.search_filter(knex_sql, query, userinfo);

  response.list = await sqlPagination(knex_sql, response).orderBy("r.id", "desc");

  await translate_dyn_dict(response.list);
  response.list = await Promise.all(response.list.map(async i => {
    if (i.cover_url) i.cover_url = `${i.cover_url}${app_image_resize}`
    i.tag_ids = JSON.parse(i.tag_ids || '[]')
    i.tag = (await getTagsData(i.tag_ids)).map(t => t.label)
    return i
  }))

  return app_res;
}

//#region 短剧
// 我的任务 -- 短剧
async function my_drama_task(query, userinfo) {
  checkKeys(query, ["business_type", "keyword?", "advertiser_type?", "platform_id?", "tag?", { key: "advertiser_types", type: Array }])
  const app_res = await factoryAppListResponse(query, DRAMA_PLAN);
  const response = app_res.data;

  const adver_sql = knex(ADVERTISER_TABLE).select("id")
    .where({ business_type: query.business_type, status: 1 })
    .andWhere(builder => {
      if (userinfo.account_type != 3) builder.where("is_test", 1)
    });
  if (query.platform_id) {
    adver_sql.andWhere({ platform_id: query.platform_id })
  }
  const advertiser_ids = await handler.advertisers_limit(query, userinfo);
  if (!advertiser_ids.length) return app_res;


  const cols = ["content_id", "advertiser_type", "platform_id", "status"].map(i => 'r.' + i);
  const knex_sql = knex(`${DRAMA_PLAN} as plan`)
    .leftJoin(`${CONTENT_RELATION} as r`, 'plan.relation_id', 'r.id')
    .leftJoin(knex.raw(`${AMOUNT_PROMOTION} as prt ON prt.plan_id = plan.id AND prt.type = 2`))
    .leftJoin(`${CONTENT_TABLE} as cont`, "r.content_id", "cont.id")
    .groupBy("plan.relation_id")
    .select("plan.relation_id", ...cols)
    .select(...CONT_COL)
    .select("r.relat_type as promotion_type")
    .select(knex.raw(`SUM(prt.amount) as income`))
    .select(knex.raw(`COUNT(plan.id) as plan_num`))
    .where({
      // "cont.invalid_status": 0,
      // "cont.status": 1,
      // "r.status": 1,
      "plan.status": 1,
      "plan.oem_id": userinfo.oem_id,
      "plan.account_id": userinfo.id
    })
    .andWhere(builder => {
      builder.where("cont.verify_status", 3)
        .orWhere("cont.create_user_id", userinfo.id)
    })
    .andWhere(builder => {
      if (advertiser_ids.length) builder.whereIn("r.advertiser_type", advertiser_ids);
      if (response.page > 1 && response.site) {
        builder.where("plan.id", "<=", response.site);
      }
      if (query.platform_id) builder.where("r.platform_id", "=", query.platform_id);
      if (query.advertiser_type) builder.where("r.advertiser_type", query.advertiser_type);
    });

  handler.search_filter(knex_sql, query, userinfo);
  handler.my_task_order_by(knex_sql, query);

  response.list = await sqlPagination(knex_sql, response)
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"))
    .select(selectName("r", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
    .select(selectName("r", "advertiser_type", ADVERTISER_TABLE, "icon", "advertiser_type_icon"))
    .orderBy("r.id", "desc");

  const settlement_mapper = await settlementMethodList(userinfo);
  response.list = await Promise.all(response.list.map(async i => {
    if (i.settlement_ids) {
      i.settlement_ids = JSON.parse(i.settlement_ids) || [];
      i.settlement_ids_names = i.settlement_ids.map(i => settlement_mapper[i]);
    }
    if (i.cover_url) i.cover_url = `${i.cover_url}${app_image_resize}`
    i.tag_ids = JSON.parse(i.tag_ids || '[]')
    i.tag = (await getTagsData(i.tag_ids)).map(t => t.label)
    return i
  }))

  return app_res;
}

// 我的计划 = 短剧
async function my_plan(query, userinfo) {
  checkKeys(query, ["keyword?", "business_type?", "advertiser_type?", "platform_id?", "tag?", "plan_type?", "relation_id?", { key: "advertiser_types", type: Array }]);
  // 小程序计划没有"我的任务"
  query.relat_type = RelationType.Mount;

  const app_res = await factoryAppListResponse(query, DRAMA_PLAN);
  const response = app_res.data;

  const advertiser_ids = await handler.advertisers_limit(query, userinfo);
  if (!advertiser_ids.length) return app_res;

  const plan_cols = ["id", "name", "type", "drama_id as content_id", "relation_id", "advertiser_type", "platform_id", "create_time", "status", "referral_id", "search_code", "extra_params"];
  const knex_sql = knex(knex.raw(`${DRAMA_PLAN} as plan force index(account_id)`))
    .leftJoin(`${CONTENT_RELATION} as r`, "plan.relation_id", "r.id")
    .leftJoin(`${CONTENT_TABLE} as cont`, "r.content_id", "cont.id")
    .select(...plan_cols.map(v => 'plan.' + v))
    .select("r.publish_url", "r.app_id")
    .select(...CONT_COL)
    .select("r.relat_type as promotion_type")
    .where({
      // "cont.invalid_status": 0,
      // "cont.status": 1,
      // "r.status": 1,
      "plan.status": 1,
      "plan.oem_id": userinfo.oem_id,
      "plan.account_id": userinfo.id
    })
    .andWhere(builder => {
      if (response.page > 1 && response.site) {
        builder.where("plan.id", "<=", response.site);
      }
      if (query.platform_id) builder.where("plan.platform_id", "=", query.platform_id);
      if (query.advertiser_type) builder.where("plan.advertiser_type", query.advertiser_type);
      if (advertiser_ids.length) builder.whereIn("r.advertiser_type", advertiser_ids);
    })
  handler.search_filter(knex_sql, query, userinfo);
  // console.log(knex_sql.toString());

  response.list = await sqlPagination(knex_sql, response)
    .select(selectName("plan", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
    .select(selectName("plan", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"))
    .select(selectName("plan", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
    .select(selectName("plan", "advertiser_type", ADVERTISER_TABLE, "icon", "advertiser_type_icon"))
    .select(selectName("plan", "advertiser_type", ADVERTISER_TABLE, "self_operated", "self_operated"))
    .select(selectName("plan", "id", WX_PUBLISH_URL, "article_url", "article_url", "drama_plan_id"))
    .select(selectName("plan", "id", WX_PUBLISH_URL, "publish_status", "wx_publish_status", "drama_plan_id"))
    .orderBy("plan.id", "desc");

  // console.log(response.list.toString());

  await handler.join_search_code_status(response.list);

  const income_data_map = await getDramaPlanCharge(response.list.map(i => i.id));
  let share_token = await makeShareToken(userinfo.id)

  response.list.forEach(item => {
    if (!item.referral_id) item.status = 2 //没有自定义参数，状态为2
    item.type_name = MOUNT_TYPE[item.type] || '';
    const income_data = income_data_map[item.id];
    delete income_data.plan_id;
    Object.assign(item, income_data);
    if (item.cover_url) item.cover_url = `${item.cover_url}${app_image_resize}`

    handler.format_mount_info(item, share_token)
  })

  return app_res;
}

// 创建计划 短剧
async function create_plan(body, userInfo) {
  const data = checkKeys(body, ["relation_id", "name", "type", "platform_account_primary_id?"]);

  const { type, platform_account_primary_id } = data;
  // if (type == Mount.PrivateLink) return Promise.reject('暂不支持私域推广！')
  if (type == Mount.Living && !platform_account_primary_id) return Promise.reject('直播挂载请选择平台账号！');

  const new_id = await knexTransaction(async trx => {
    const relation_info = (
      await trx(`${CONTENT_RELATION} as rat`)
        .leftJoin(`${ADVERTISER_TABLE} as adv`, 'adv.id', 'rat.advertiser_type')
        .leftJoin(`${CONTENT_TABLE} as cont`, 'rat.content_id', 'cont.id')
        .select(
          'rat.advertiser_type', "rat.app_id", 'rat.content_id', 'rat.platform_id', //#CONT PLAN  + app_id
          'adv.status as advertiser_status', 'adv.mount_type', "adv.self_operated",
          'cont.status as drama_status',
        )
        .where({
          'rat.status': 1,
          'rat.id': data.relation_id,
          'cont.invalid_status': 0,
          'cont.verify_status': 3,
        })
    )[0];
    
    if (!relation_info) return Promise.reject('任务不存在或已下架！')
    if (relation_info.advertiser_status != 1) return Promise.reject('项目不存在或已关闭，已停止推广！')
    if (relation_info.drama_status != 1) return Promise.reject('该内容已下线，停止推广！')

    if (!relation_info.mount_type) return Promise.reject('该平台暂不支持创建计划！')
    relation_info.mount_type = JSON.parse(relation_info.mount_type) || [];
    if (!relation_info.mount_type.includes(type)) return Promise.reject('该平台暂不支持该类型挂载！')
    const { advertiser_type, platform_id, content_id: drama_id, app_id } = relation_info

    const drama_params = { advertiser_type, drama_id, name: data.name, plan_type: data.type, app_id } //#CONT PLAN  + app_id;
    const is_self_code = type == Mount.SearchCode && relation_info.self_operated == 1;
    if (is_self_code) {
      const { keyword } = checkKeys(body, [{ key: "keyword", type: String }]);
      let kwd = keyword?.trim() ?? "";
      if (kwd) drama_params.payload = { keyword: kwd };
    }
    const { referral_id, search_code, extra_params } = await getDramaReferralId(drama_params);
    // 记录自运营口令
    let self_code_id = null;
    if (is_self_code && extra_params?.tid) {
      self_code_id = extra_params.tid;
      delete extra_params.tid;
    }

    Object.assign(data, {
      account_id: userInfo.id, create_user_id: userInfo.id, advertiser_type, platform_id, drama_id, referral_id, search_code,
      channel_id: userInfo.channel_id || 0,
      extra_params: extra_params ? JSON.stringify(extra_params) : null,
      create_date: moment().format("YYYY-MM-DD"),
    })

    if (type == Mount.Living) {
      const platform_acc_info = (await trx(PLATFORM_ACCOUNT_TABLE).where({ id: platform_account_primary_id, status: 1 }))[0];
      if (!platform_acc_info) throw "媒体账号不存在！";
      if (platform_acc_info.platform_id != platform_id) throw "媒体账号与媒体平台不匹配！"
    }

    const id = (await trx(DRAMA_PLAN).insert(data))[0];
    await insertLog(trx, getLogData(id, 20001, data, userInfo));
    if (self_code_id) {
      // 更新自运营口令
      await trx(DUOLAI_SEARCH_CODE).update("plan_id", id).where("id", self_code_id);
    }
    return id
  })
  return { code: 0, data: { id: new_id } }
}
// 计划状态 短剧
async function plan_status(body, userinfo) {
  const { ids, status } = checkKeys(body, [
    { key: "ids", type: Array, required: true },
    { key: "status", type: Number, required: true, validator: val => isArrayHas([1, 3], val) }
  ]);

  if (!ids.length) throw "请选择需要删除的计划！";

  await knexTransaction(async trx => {
    const old_raws = await trx(`${DRAMA_PLAN}`)
      .whereIn("id", ids)
      .where({ account_id: userinfo.id })
      .andWhereNot({ status });

    if (!old_raws.length) return;

    const change_ids = [];
    const log_data = old_raws.map(v => {
      change_ids.push(v.id);
      return getLogData(v.id, 20002, { status }, userinfo, v);
    })
    await trx(DRAMA_PLAN).update({ status }).whereIn("id", change_ids);
    await insertLog(trx, log_data);
  })

  return { code: 0, data: null }
}

// 创建微信视频号链接
async function create_wx_publish(body = {}, userinfo) {
  const data = checkKeys(body, ["drama_plan_id"]);
  Object.assign(data, {
    account_id: body.account_id || userinfo.id,
    create_user_id: userinfo.id,
    update_user_id: userinfo.id,
    oem_id: userinfo.oem_id,
  })
  let { drama_plan_id, account_id } = data
  let drama_plan_info = (await knex.select('plan.platform_id', 'plan.referral_id', 'rat.publish_url', 'plan.advertiser_type', 'rat.app_id', 'plan.extra_params')
    .select(selectName("plan", "drama_id", CONTENT_TABLE, "book_name", "drama_name"))
    .from(`${DRAMA_PLAN} as plan`)
    .leftJoin(`${CONTENT_RELATION} as rat`, 'rat.id', 'plan.relation_id')
    .where({ 'plan.id': drama_plan_id, 'plan.account_id': account_id }))[0]
  if (!drama_plan_info) return Promise.reject('推广计划无效或已关闭！')
  let url_num = (await knex(WX_PUBLISH_URL).count('id as url_num').where('drama_plan_id', drama_plan_id).whereNot('publish_status', 3))[0]?.url_num
  if (url_num >= 1) return Promise.reject('推广计划创建转链链接已达上限！')
  let { publish_url, platform_id, referral_id, drama_name, advertiser_type, app_id, extra_params } = drama_plan_info
  data.title = `《${drama_name}》继续观看`
  let applet_path = mergeParams(publish_url, extra_params)
  let template = 'h5'
  data.click_url = getWXClickUrl(advertiser_type, publish_url, referral_id, extra_params)
  switch (Number(advertiser_type)) {
    case 7:
    case 21:
    case 38:
    case 43:
      template = 'h5'
      break;
    default:
      // data.click_url = mergeParams(publish_url, extra_params)
      break;
  }
  // console.log(data.click_url);
  if (platform_id != 4) return Promise.reject('该推广计划非视频号推广！')
  let publish_info = await getOAPublishUrl({ ...data, app_id, applet_path, template })
  await knexTransaction(async trx => {
    let insert_data = { ...publish_info, ...data }
    let id = (await trx(WX_PUBLISH_URL).insert(insert_data))[0]
    return id
  })

  return { code: 0, data: null } // '创建成功，请稍后查看链接！'
}

// 短剧详情页推荐相关短剧
async function recommend(body, userinfo) {
  const { content_id, relat_type, advertiser_type, platform_id, business_type } = checkKeys(body, [
    { key: "content_id", type: Number, required: true }, "relat_type?",
     "advertiser_type?", "platform_id?", "business_type?"
  ]);
  let round = Math.round(Math.random() * 10);

  let self_cont = (
    await knex(`${CONTENT_TABLE} as cont`)
      .select(knex.raw(
        `(SELECT GROUP_CONCAT(DISTINCT r.relat_type) FROM ${CONTENT_RELATION} r WHERE r.content_id = cont.id AND r.relat_type <> ${RelationType.AppletPlan}) as relat_types`
      ))
      .select('cont.tag_ids')
      .limit(1)
      .where({ id: content_id })
  )[0];

  const response = { code: 0, data: { list: [] } };
  if (!self_cont) return response

  let tag_ids = JSON.parse(self_cont.tag_ids || '[]');
  let relat_types = (self_cont.relat_types || "").split(',');

  let data_sql = knex(`${CONTENT_TABLE} as cont`)
    .select(...CONT_COL, "cont.id as content_id")
    .where(builder => {
      if (tag_ids?.length) {
        tag_ids.forEach(element => {
          builder.orWhereRaw(`json_contains(cont.tag_ids, JSON_ARRAY('${element}'))`)
        });
      }
    }).where({ 'cont.verify_status': 3, "cont.invalid_status": 0 })
    .whereRaw(`cont.id % ${round} = ${timestampSec()} % ${round}`)
  let advertiser_ids = (await knex(ADVERTISER_TABLE).select('id').where({ status: 1 }).where(builder => {
    if (business_type) builder.where({ business_type })
    if (userinfo.account_type != 3) builder.where("is_test", 1)
  })).map(i => i.id)

  let relation_sql = knex(CONTENT_RELATION).select('content_id')
    .whereIn('advertiser_type', advertiser_ids)
    .where({
      status: 1,
      oem_id: userinfo.oem_id,
    })
    .andWhere(builder => {
      if (userinfo.account_type != 3) builder.where("is_test", 1)
      if (relat_types.length) builder.whereIn("relat_type", relat_types) // #TEMP 移动端兼容
    })
    .where(builder => {
      if (advertiser_type) builder.where({ advertiser_type })
      if (platform_id) builder.where({ platform_id })
      if (relat_type) builder.where({ relat_type })
    })
    .whereRaw(`(target_status = 2 or exists (select t.id from ${CONTENT_RELATION_TARGET} t where t.relation_id = ${CONTENT_RELATION}.id and t.account_id = ?))`, userinfo.id)
    .toString()
  data_sql.whereRaw(`cont.id IN (${relation_sql})`).limit(18).orderBy('cont.id', 'desc')
  //
  response.data.list = (await data_sql).map(item => {
    if (item.cover_url) item.cover_url = `${item.cover_url}${app_image_resize}`
    return item
  })
  // console.log(data_sql.toString());
  return response
}


//#endregion
// 获取content_id下可以使用的平台信息
async function get_content_platform(query = {}, userInfo = {}) {
  const { content_id } = checkKeys(query, [{ key: "content_id", required: true },]);
  let cache = await getCustomCache(`${RK_CONTENT_PLATFROM}${content_id}`)
  if (cache) return { code: 0, data: { list: cache } }
  const relation_info = await knex(`${CONTENT_RELATION} as rat`)
    .select('rat.id as relation_id', 'rat.content_id', "rat.relat_type", 'pat.id as platform_id', 'pat.name as platform_name', 'pat.icon as platform_icon')
    .leftJoin(`${PLATFORM_TABLE} as pat`, 'pat.id', 'rat.platform_id')
    .where({ 'rat.content_id': content_id, 'rat.status': 1 })
    .whereIn("rat.relat_type", [RelationType.Alias, RelationType.Mount]) // #TEMP 移动端兼容
    .where(builder => {
      if (query.relat_type) builder.where("rat.relat_type", query.relat_type)
    })
  // console.log(relation_info);
  await setCustomCache(relation_info, `${RK_CONTENT_PLATFROM}${content_id}`, 120)
  return { code: 0, data: { list: relation_info } }
}
// get_content_platform({ content_id: 33279 })


const SETTLE_DESC = {
  1: `每拉新赚`,
  2: `每订单赚`,
  3: `CPS分成比例`,
  4: `CPM分成比例`,
}
const handler = {
  search_filter(builder, query, userinfo) {
    const keyword = query.keyword?.trim?.();
    if (keyword) {
      builder.where("cont.book_name", "like", `%${keyword}%`)
    }

    if (Array.isArray(query.tags) && query.tags.length) {
      builder.andWhere(builder => {
        for (let i = 0; i < query.tags.length; i++) {
          if (i == 0) {
            builder.whereRaw(`json_contains(cont.tag_ids, '${query.tags[i]}')`)
          } else {
            builder.orWhereRaw(`json_contains(cont.tag_ids, '${query.tags[i]}')`)
          }
        }
      })
    }

    if (query.has_video) {
      const condtion = Number(query.has_video) == 1 ? '>' : '<='
      builder.select(knex.raw(
        `(SELECT count( b.id ) FROM ${VIDEO_TABLE} AS b
        WHERE b.content_id = cont.id AND b.publish_status = 2 AND b.status = 1 AND b.receive_status = 1
        ) as video_count`
      ))
        .having("video_count", condtion, 0)
    }
    
    // 兼容以前query
    if (query.promotion_type) {
      if (query.promotion_type == 1) {
        query.relat_type = RelationType.Alias;
      } else {
        query.relat_type = RelationType.Mount; // 小程序计划另起接口
      }
    }

    if (query.relat_type) {
      builder.where("r.relat_type", query.relat_type)
    }


    // plan
    if (query.plan_type) {
      builder.where("plan.type", query.plan_type);
    }
    if (query.relation_id) {
      builder.where("plan.relation_id", query.relation_id)
    }
  },
  async advertisers_limit(query, userinfo) {
    const where_query = checkKeys(query, ["business_type?", "platform_id?", "status?"]);
    const adver_sql = knex(ADVERTISER_TABLE).select("id")
      .where(builder => {
        if (!isEmpty(where_query, true)) {
          builder.where(where_query);
        }
      })
      .andWhere(builder => {
        if (userinfo.account_type != 3) builder.where("is_test", 1)
      });
    let advertiser_ids = (await adver_sql).map(v => v.id);
    if (query.advertiser_types?.length) {
      advertiser_ids = query.advertiser_types.filter(v /*string number*/ => advertiser_ids.includes(Number(v)));
    }
    return advertiser_ids;
  },
  my_task_order_by(builder, query) {
    const order = query.sort || 'desc'
    builder.orderBy('r.id', order);
  },
  format_mount(mount_type) {
    return MOUNT_TYPE[mount_type] || '';
  },
  // 获取发布需要信息
  format_mount_info(item, share_token = '') {
    // button_type 1生成链接 2复制链接 3复制口令 4立即推广 5保存二维码

    // 清除前缀 getpublishinfo 需要
    // mount create add prefix
    // 设之前的推广有前缀
    //  1. 之前先去前缀，拉取订单加上前缀 匹配
    //  2. 之后不去前缀，客户收到带前缀参数，拉取时不加前缀 匹配
    // 可以注释去掉前缀逻辑，如果客户支持带前缀参数
    item.publish_info = null;
    item.wx_share_info = null;
    switch (item.type) {
      case Mount.Publish:
      case Mount.Living: // 直播在客户后台设置 无操作
        handler.format_publish_info(item, share_token);
        item.button_text = "立即推广";
        item.button_type = 4;
        break;
      case Mount.SearchCode:
        item.button_text = '复制口令';
        item.button_type = 3;
        // item.search_code = item.search_code
        break;
      case Mount.WxShare:
        handler.format_wxshare_info(item); // button_type在内部处理
        break
      case Mount.PrivateLink:
        item.private_link = `https://test.domain.cn/h5/share?plan_id=${item.id}`; // 私域链接
        item.button_type = 2
        item.button_text = '复制链接';
        break;
      case Mount.QrCode:
        item.button_text = '复制二维码';
        item.button_type = 5;
        item.qr_link = item.search_code;
        item.search_code = null;
        break;
      default: // Living Publish
        throw "未知的推广方式"
    }

    // 1、2
    delete item.publish_url;
    delete item.app_id;
    delete item.extra_params;
    delete item.referral_id;
    // 5
    delete item.wx_publish_status
    delete item.article_url;
  },
  format_publish_info(item, share_token) {
    const douyin_h5_url = 'https://test.domain.cn/h5/publish_share'
    const { micro_app_info, schema_url } = getPublishInfo(item);
    const publish_info = {
      show_qr: false,
      micro_app_info: micro_app_info,
      schema_url: schema_url,
      qr_url: null
    }
    if ([1, 2].includes(item.platform_id)) {
      publish_info.show_qr = true //目前仅允许抖音、快手进行二维码分享
      publish_info.qr_url = schema_url
      // 目前h5 上传视频发布已经凉凉，只能拍抖音推广，故 qr_url 为 schema_url 唤醒链接
      // if (item.platform_id == 1) publish_info.qr_url = `${douyin_h5_url}?token=${share_token}&plan_id=${item.id}`
    }
    if (item.type == 2) publish_info.show_qr = false //直播计划不允许生成二维码
    item.publish_info = publish_info;
  },
  format_wxshare_info(item) {
    const wx_share_info = {
      publish_status: item.wx_publish_status,
      article_url: item.article_url,
    };
    item.wx_share_info = wx_share_info;
    if (wx_share_info.publish_status == 2) { // 0|null、未生成 1、生成中 2、生成成功 3、生成失败
      item.button_text = '复制链接';
      item.button_type = 2;
    } else {
      item.button_text = '生成链接';
      item.button_type = 1;
    }
  },
  // 抖音故事账号数
  async tiktok_account(trx = knex, userinfo) {
    const auth_sql = trx(AUTH_ACCOUNT)
      .select(knex.raw(
        `COUNT(IF(status = 1 AND verify_status = 'APPROVED' AND auth_status = 1, 1, null)) as auth_account_num`
      ))
      .select(knex.raw(
        `COUNT(id) as total_account_num`
      ))
      .where("account_id", userinfo.id);
    return (await auth_sql)[0];
  },
  /**
   * 多来口令关联审核状态
   * @param {any[]} list 
   */
  async join_search_code_status(list) {
    const is_duolai_applet = item => {
      return item.type == Mount.SearchCode && item.self_operated == 1;
    }
    const generate_key = item => `${item.app_id}#${item.search_code}`;
    let mapper = {};
  
    const duolai_codes = list
      .filter(is_duolai_applet)
      .map(v => v.search_code);
    if (duolai_codes.length) {
      // code : app_id = M : N
      const search_code_verifys = await knex(DUOLAI_SEARCH_CODE)
        .select("verify_status", "verify_suggest", "app_id", "search_code")
        .whereIn("search_code", duolai_codes);
      mapper = lodash.keyBy(search_code_verifys, generate_key);
    }

    list.forEach(v => {
      let verify_status = 3;
      let verify_suggest = null;
      if (is_duolai_applet(v)) {
        const key = generate_key(v);
        verify_status = mapper[key]?.verify_status ?? 2;
        verify_suggest = mapper[key]?.verify_suggest ?? null;
      }
      v.verify_status = verify_status;
      v.verify_suggest = verify_suggest;
    })
  }
}



module.exports = {
  task_list,
  task_define,
  recommend,
  // kwwd
  my_kwd_task,
  analysis_link,
  book_list,
  //drama
  my_drama_task,
  my_plan,
  create_plan,
  create_wx_publish,
  plan_status,
  get_content_platform
}