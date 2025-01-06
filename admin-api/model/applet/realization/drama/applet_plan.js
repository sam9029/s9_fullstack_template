const moment = require("moment");
const knex = require("../../../../db/knexManager").knexProxy;
const { setCustomCache, getCustomCache } = require("../../../../db/redis");
const {
  CONTENT_TABLE, DRAMA_PLAN, ACCOUNT_TABLE, ADVERTISER_TABLE, CONTENT_RELATION, PLATFORM_TABLE, DRAMA_VIDEO,
  APPLET_PLAN, APPLET_TASK_INFO, CONTENT_LINK, CONTENT_DATA, VIDEO_TABLE, CONTENT_FAVORITE, RELATION_EDIT_DATA, CONTENT_WATCH,
  CONTENT_FAVORITE_V2, CONTENT_WATCH_V2
} = require("../../../../config/setting");
const { getUuid, knexTransaction, selectName, getDaysBetweenDate, factoryAppListResponse, renderPrice, sleep, } = require("../../../../utils/tools");
const { getDyPublishSchemaUrl, getSchemaUrl, getBindLink, APPLET_PLAN_APP_ID, getBindPeople, saveBindRation } = require("../../../oauth/douyin/applet_plan");
const { checkKeys } = require("../../../../utils/check_type");
const { advertiser_mapper, content_sources } = require("../../../../utils/redisCache");
const { getAdvertierSettlements, getTagsData } = require("../../../../utils/apiMapper");
const { sqlPagination } = require("../../../../utils/sqlHelper");
const { app_image_resize } = require("../../../../config");
const { RelationType } = require("../../../../enum/type");
const { FormatSmtFn } = require("./utils");


const QueryBindQueue = [];
QueryBindQueue.runing = false;


const OrderBy = {
  newest: 'content.id',
  popular: 'content.order'
}

const content_cols = ["id as content_id", "book_name", "cover_url", "preview", "describe", "tag", "order"].map(v => 'content.' + v);

async function list(query, userinfo) {
  // user v2 workbench list
  return { code: 0, data: { list: [] } };
}

// 详情
async function content_def(query, userinfo, $platform, $version) {
  const { relation_id, content_id, advertiser_type, platform_id } = checkKeys(query, ["relation_id?", "content_id?", "advertiser_type?", "platform_id?"]);

  if (!relation_id && !content_id) throw "请传入内容ID或任务ID！";
  const use_relation = !!relation_id;
  if (!use_relation) {
    if (!advertiser_type && !platform_id) throw "请传入项目产品或媒体平台！";
  }

  const knex_sql = knex(`${CONTENT_RELATION} as relat`)
    .leftJoin(`${CONTENT_TABLE} as content`, 'content.id', 'relat.content_id')
    .select("relat.advertiser_type", "relat.platform_id", "relat.task_id", "relat.id as content_relation_id")
    .select(...content_cols)
    .select(
      knex.raw(`(SELECT COUNT(id) FROM ${APPLET_PLAN} WHERE account_id = ${userinfo.id} AND status = 1 AND bind_status = 1 LIMIT 1) as is_bind_task`)
    )
    .select(
      knex.raw(
        `(SELECT COUNT(p.id) FROM ${CONTENT_FAVORITE_V2} as p
        WHERE p.create_user_id = ${userinfo.id} AND p.content_relation_id = relat.id AND p.status = 1 LIMIT 1) as is_favorite`
      )
    )
    .select(selectName('relat', 'task_id', APPLET_TASK_INFO, 'start_page', 'start_page'))
    .select(selectName('relat', 'task_id', APPLET_TASK_INFO, 'app_id', 'app_id'))
    .select(selectName('relat', 'advertiser_type', ADVERTISER_TABLE, 'creative_source', 'creative_source'))
    .select(selectName('relat', 'advertiser_type', ADVERTISER_TABLE, 'business_type', 'business_type'))
    .where({
      // "content.id": content_id,
      "content.status": 1,
      "content.oem_id": userinfo.oem_id
    })
    .andWhere("relat.task_id", "!=", '0')
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("relat.is_test", 1)
      }
    })
    .andWhere(builder => {
      if (use_relation) {
        builder.where("relat.id", relation_id)
      } else {
        builder.where({
          "relat.content_id": content_id,
          "relat.relat_type": RelationType.AppletPlan,
        })
        if (advertiser_type) builder.andWhere("relat.advertiser_type", advertiser_type);
        if (platform_id) builder.andWhere("relat.platform_id", platform_id);
      }
    });
  const relation = (await knex_sql)[0];
  if (!relation) throw "任务已下架或不存在！";
  relation.tag = JSON.parse(relation.tag || '[]');

  const adver_mapper = await advertiser_mapper(userinfo);
  if (adver_mapper[relation.advertiser_type]) {
    const { advertiser_type_name, advertiser_icon, advertiser_describe } = adver_mapper[relation.advertiser_type]
    relation.advertiser_type_name = advertiser_type_name;
    relation.advertiser_icon = advertiser_icon;
    relation.advertiser_describe = advertiser_describe
  }

  // 结算方式
  const settle_policys = await getAdvertierSettlements(relation.advertiser_type);
  const format = FormatSmtFn.compat_format($platform, $version);
  format(settle_policys, 4, userinfo, relation);

  // relation.publish_url = getDyPublishSchemaUrl(relation.task_id, null, null);
  // if (!relation.is_bind_task) {
  const bind_info = await getBindLink(relation.app_id, relation.task_id, userinfo.id);
  // console.log(bind_info);
  relation.publish_url = getSchemaUrl(bind_info.app_link, APPLET_PLAN_APP_ID);
  // }
  relation.schema_url = getSchemaUrl(relation.start_page, relation.app_id);
  // 换绑地址
  relation.change_bind_url = getSchemaUrl('subPackage/subAgency/myAgent/index', APPLET_PLAN_APP_ID)

  // 小程序计划政策
  const policys = await relation_policy({
    advertiser_type: relation.advertiser_type,
    promotion_type: RelationType.AppletPlan,
  }, userinfo)
  const task_info = (
    await knex(APPLET_TASK_INFO).select("blogger_payment_allocate_ratio")
      .where("id", relation.task_id)
  )[0];
  if (!task_info) throw "暂无抖音任务信息！";

  const applet_policy = {
    task_ratio: 0,
    extra_ratio: 0
  };
  policys.forEach(v => {
    if (v.settlement_id == 3) {
      const publish_ratio = v.publish || 0;
      applet_policy.task_ratio = task_info.blogger_payment_allocate_ratio || 0;
      applet_policy.extra_ratio = Math.max(publish_ratio - applet_policy.task_ratio, 0);
    }
    if (v.settlement_id == 4) {
      applet_policy.ad_ratio = v.publish || 0;
    }
  })
  relation.applet_policy = applet_policy;

  // 短剧链接
  relation.sources = []

  if (relation.creative_source != 'preview') {
    relation.preview = null;
    relation.sources = await content_sources({ content_id, relation_id }, userinfo);
  }

  push_to_query_bind_queue(userinfo);
  run_quey_user_bind();

  delete relation.start_page;
  delete relation.app_id;
  delete relation.task_id;

  let insert = {
    content_id: relation.content_id,
    content_relation_id: relation.content_relation_id,
    create_user_id: userinfo.id,
  }
  await knex(CONTENT_WATCH_V2).insert(insert).onConflict(["create_user_id", "content_relation_id"]).merge().catch(err => { console.log(err); });

  return { code: 0, data: relation }
}



// 短剧详情页推荐相关短剧
async function recommend(query, userinfo, $platform, $version) {
  const { content_id } = checkKeys(query, [{ key: "content_id", type: Number, required: true }]);

  const round = Math.round(Math.random() * 10)
  const tag_ids = JSON.parse((await knex(CONTENT_TABLE).select('tag_ids').limit(1).where({ id: content_id }))[0]?.tag_ids || '[]')

  const advertiser_ids = await copy_handler.advertisers_limit(query, userinfo);

  const knex_sql = knex(`${CONTENT_RELATION} as r`)
    .leftJoin(`${CONTENT_TABLE} as cont`, "r.content_id", "cont.id",)
    .leftJoin(`${ADVERTISER_TABLE} as adv`, "r.advertiser_type", 'adv.id')
    .select("cont.book_name", "cont.cover_url", "cont.id as content_id", "r.id as relation_id", "r.advertiser_type")
    .select("adv.name as advertiser_type_name", "adv.icon as advertiser_type_icon",)
    .where({
      "cont.invalid_status": 0,
      "cont.status": 1,
      "r.status": 1,
      "r.relat_type": RelationType.AppletPlan,
      "r.oem_id": userinfo.oem_id,
    })
    .andWhere("cont.id", "!=", content_id)
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("r.is_test", 1)
      }
    })
    // .andWhere(builder => {
    //   if (query.page_enum != ADVER_TYPE_ENUM[TIKTOK_STORY]) {
    //     builder.where("r.relat_type", RelationType.AppletPlan)
    //   }
    // })
    .andWhere(builder => {
      builder.where("cont.verify_status", 3)
      // .orWhere("cont.create_user_id", userinfo.id)
    })
    .andWhere(builder => {
      if (advertiser_ids.length) builder.whereIn("r.advertiser_type", advertiser_ids);
      if (query.platform_id) builder.where("r.platform_id", query.platform_id);
      if (query.advertiser_type) builder.where("r.advertiser_type", query.advertiser_type);
    })
    .where(builder => {
      if (tag_ids?.length) {
        tag_ids.forEach(element => {
          builder.orWhereRaw(`json_contains(cont.tag_ids, JSON_ARRAY('${element}'))`)
        });
      }
    })
    .whereRaw(`cont.id % ${round} = CURRENT_TIMESTAMP % ${round}`);


  const data = await knex_sql
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"))
    .limit(18);

  const settle_map = await getAdvertierSettlements();
  const list = await Promise.all(data.map(async i => {
    const format = FormatSmtFn.compat_format($platform, $version);
    format(settle_map[i.advertiser_type], 4, userinfo, i);
    if (i.cover_url) i.cover_url = `${i.cover_url}${app_image_resize}`
    i.tag_ids = JSON.parse(i.tag_ids || '[]');
    i.tag = (await getTagsData((i.tag_ids||[]))).map(t => t.label)
    return i
  }))

  return { code: 0, data: { list } }
}


const CONT_COL = ["cont.book_name", "cont.cover_url", "cont.tag", "cont.book_id", "cont.title", "cont.content_summary",
  "cont.book_author", "cont.describe", "cont.copyright", "cont.serialized_status", "cont.promotion_type", "cont.link", "cont.tag_ids"];
// 任务列表
async function task_list(query, userinfo, $platform, $version) {
  checkKeys(query, [
    "business_type", "keyword?", "advertiser_type?", "platform_id?", "tag?",
    { key: "advertiser_types", type: Array }
  ])
  const app_res = await factoryAppListResponse(query, CONTENT_RELATION);
  const response = app_res.data;

  const advertiser_ids = await copy_handler.advertisers_limit(query, userinfo);
  if (!advertiser_ids.length) return app_res;

  const cols = ["id as relation_id", "content_id", "advertiser_type", "platform_id", "create_time", "relat_type"].map(v => 'r.' + v);
  const knex_sql = knex(`${CONTENT_RELATION} as r`)
    .leftJoin(`${CONTENT_TABLE} as cont`, "r.content_id", "cont.id",)
    .leftJoin(`${CONTENT_DATA} as cdata`, 'r.content_id', 'cdata.content_id')
    .leftJoin(`${ADVERTISER_TABLE} as adv`, "r.advertiser_type", 'adv.id')
    .select(...cols)
    .select(...CONT_COL)
    .select("cdata.join_people_num", "cdata.max_income", "adv.name as advertiser_type_name", "adv.icon as advertiser_type_icon",)
    .where({
      "cont.invalid_status": 0,
      "cont.status": 1,
      "r.status": 1,
      "r.oem_id": userinfo.oem_id,
      "r.relat_type": RelationType.AppletPlan,
      // "r.task_status":  2,
    })
    .andWhere("r.task_id", "!=", '0')
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
    .whereExists(builder => {
      builder.select("t.id").from(`${APPLET_TASK_INFO} as t`).whereRaw("t.id = r.task_id")
    })

  copy_handler.search_filter(knex_sql, query, userinfo);

  response.list = await sqlPagination(knex_sql, response)
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
    .select(selectName("r", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"))
    .orderBy("r.id", "desc");

  const settle_map = await getAdvertierSettlements();
  response.list = await Promise.all(response.list.map(async i => {
    const format = FormatSmtFn.compat_format($platform, $version);
    format(settle_map[i.advertiser_type], 4, userinfo, i);
    if (i.cover_url) i.cover_url = `${i.cover_url}${app_image_resize}`
    i.tag_ids = JSON.parse(i.tag_ids || '[]');
    i.tag = (await getTagsData(i.tag_ids)).map(t => t.label)
    return i
  }))

  return app_res;
}

async function bind_log(query, userInfo) {
  let data = await knex
    .select("record.douyin_id", "record.bind_time", "record.bind_status", "record.unbind_time")
    .from(`${APPLET_PLAN} as record`)
    .where({ "record.account_id": userInfo.id })

  return {
    code: 0,
    data,
  };
}

async function bind_result(query, userinfo) {
  const account_id = userinfo.id;
  if (!account_id) throw "user not find";
  const result = await getBindPeople(account_id, null, null)
  // if (!result) return Promise.reject('该账户未绑定成功或与其他账号进行绑定！')
  if (result) {
    await saveBindRation(result)
  }
  // console.log(result);
  const is_bind_task = result?.some(v => !v.unbind_time) ? 1 : 0;
  return { code: 0, data: is_bind_task }
}


async function relation_policy(query, userinfo) {
  const { advertiser_type, promotion_type } = query;
  const { get_adv_settle_policy } = require("../../../manage/finance/appletSettlement/utils");
  const today = moment().format("YYYY-MM-DD");
  const policys = await get_adv_settle_policy(advertiser_type, today);

  return policys.filter(v => {
    let is_match = v.promotion_type == promotion_type;
    if (userinfo.channel_id) {
      is_match = is_match && (v.channel_id == userinfo.channel_id || v.channel_id == 0);
    }
    return is_match;
  });
}



function push_to_query_bind_queue(userinfo) {
  if (QueryBindQueue.length >= 300) {
    return;
  }

  if (userinfo.count && userinfo.count >= 5) {
    return;
  }

  const exist = QueryBindQueue.find(v => v.id == userinfo.id);
  if (!exist) {
    QueryBindQueue.push({
      id: userinfo.id,
      count: userinfo.count || 0
    })
  }
}

async function run_quey_user_bind() {
  if (!QueryBindQueue.length) return;
  if (QueryBindQueue.runing) return;
  QueryBindQueue.runing = true;

  const user = QueryBindQueue.shift();
  try {
    const data = await bind_result(null, user);
    if (data.data == 0) {
      user.count += 1;
      push_to_query_bind_queue(user);
    }
  } catch (err) {
    console.log("async query user bind task error:\n", err);
    user.count += 1;
    push_to_query_bind_queue(user);
  }
  await sleep(30000);
  QueryBindQueue.runing = false;

  return run_quey_user_bind()
}

const copy_handler = {
  async advertisers_limit(query, userinfo) {
    const adver_sql = knex(ADVERTISER_TABLE).select("id")
      .where({ status: 1 })
      .whereRaw(`JSON_CONTAINS(promotion_type, '${RelationType.AppletPlan}')`)
      .andWhere(builder => {
        if (userinfo.account_type != 3) builder.where("is_test", 1)
      });
    if (query.business_type) {
      adver_sql.andWhere({ business_type: query.business_type })
    }
    if (query.platform_id) {
      adver_sql.andWhere({ platform_id: query.platform_id })
    }
    let advertiser_ids = (await adver_sql).map(v => v.id);
    if (query.advertiser_types?.length) {
      advertiser_ids = query.advertiser_types.filter(v /*string number*/ => advertiser_ids.includes(Number(v)));
    }
    return advertiser_ids;
  },
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


    // plan
    if (query.plan_type) {
      builder.where("plan.type", query.plan_type);
    }
    if (query.relation_id) {
      builder.where("plan.relation_id", query.relation_id)
    }
  },
}

module.exports = {
  list,
  task_list,
  content_def,
  bind_log,
  bind_result,
  recommend,
  relation_policy
}