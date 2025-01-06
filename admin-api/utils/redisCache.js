const moment = require("moment");
const knex = require("../db/knexManager").knexProxy;
const { setCustomCache, getCustomCache } = require("../db/redis");
const {
  CONTENT_TABLE,
  DRAMA_PLAN,
  ACCOUNT_TABLE,
  ADVERTISER_TABLE,
  CONTENT_RELATION,
  PLATFORM_TABLE,
  DRAMA_VIDEO,
  APPLET_PLAN,
  APPLET_TASK_INFO,
  CONTENT_LINK,
  CONTENT_DATA,
  DUOLAI_SETTLE_POLICY,
} = require("../config/setting");
const {
  getUuid,
  knexTransaction,
  selectName,
  getDaysBetweenDate,
} = require("./tools");
const { checkKeys } = require("./check_type");
const {
  RK_ADVERTISER_MAPPER,
  RK_CONTENT_LINK_WITH,
  RK_DUOLAI_SETTLE_POLICY,
} = require("../config/redis_key");

exports.advertiser_mapper = async function advertiser_mapper(userinfo) {
  const key = RK_ADVERTISER_MAPPER;
  const cache = await getCustomCache(key);
  if (cache) return cache;

  const data = await knex(`${ADVERTISER_TABLE} as adv`)
    .leftJoin(`${PLATFORM_TABLE} as plat`, "plat.id", "adv.platform_id")
    .select(
      "adv.id as advertiser_type",
      "adv.name as advertiser_type_name",
      "adv.icon as advertiser_icon",
      "adv.settlement_ids",
      "adv.business_type",
      "adv.promotion_type",
      "adv.promotion_plan",
      "adv.mount_type",
      "adv.app_id",
      "adv.describe as advertiser_describe",
      "plat.id as platform_id",
      "plat.name as platform_name",
      "plat.icon as platform_icon"
    )
    .where("adv.oem_id", userinfo?.oem_id || 1);

  const mapper = {};
  data.forEach((v) => {
    v.settlement_ids = JSON.parse(v.settlement_ids || "[]");
    v.mount_type = JSON.parse(v.mount_type || "[]");
    mapper[v.advertiser_type] = v;
  });
  await setCustomCache(mapper, key, 60 * 3);
  return mapper;
};

exports.content_sources = async function content_sources(query, userinfo) {
  let { relation_id, content_id } = checkKeys(query, [
    "relation_id?",
    "content_id?",
  ]);
  if (!relation_id && !content_id) throw "请传入剧集或任务ID";

  if (!content_id) {
    content_id = (
      await knex(CONTENT_RELATION).select("content_id").where("id", relation_id)
    )[0]?.content_id;
  }
  if (!content_id) throw "任务不存在或已下架";

  const key = `${RK_CONTENT_LINK_WITH}:${content_id}`;
  const cache = await getCustomCache(key);
  if (cache) return cache;

  // 短剧链接
  const links = await knex(`${CONTENT_LINK}`)
    .select("download_url", "name")
    .where("content_id", content_id)
    .andWhere("status", 1);

  await setCustomCache(links, key, 60 * 30);

  return links;
};

exports.settle_policy = async function settle_policy(query, trx = knex) {
  let { collection_id, app_id, date } = checkKeys(query, [
    "collection_id?",
    { key: "app_id", type: String, required: true },
    { key: "date", type: String, required: true },
  ]);

  collection_id = collection_id || 0;
  const key = `${RK_DUOLAI_SETTLE_POLICY}:${collection_id}:${app_id}:${date}`;
  const cache = await getCustomCache(key);
  if (cache) return cache;
  let sql = trx
    .select(
      "id as policy_id",
      "account_ratio",
      "authorize_ratio",
      "agent_ratio"
    )
    .from(DUOLAI_SETTLE_POLICY)
    .where("status", 1)
    .whereIn("verify_status", [3, 6])
    .where((builder) => {
      builder
        .where({
          video_collection_id: collection_id,
          type: 2,
        })
        .orWhere("type", 1)
        .where("app_id", app_id);
    })
    .whereRaw(`'${date}' >= start_date and  '${date}'<= end_date`)
    .orderBy("type", "desc")
    .limit(1);
  let data = await sql;
  let result = data.length
    ? data[0]
    : {
        policy_id: 0,
        account_ratio: 0,
        authorize_ratio: 0,
        agent_ratio: 0,
      };
  await setCustomCache(result, key, 60 * 60);
  return result;
};
