const moment = require("moment");
const knex = require("../../../db/knexManager").knexProxy;
const {
  COURSE_TABLE, COURSE_COLLECTCION, ACCOUNT_TABLE, PLATFORM_TABLE,
  COURSE_LIKE, COURSE_FAVORITE, COURSE_SHARE, COURSE_WATCH, CATALOG, COURSE_TAG
} = require("../../../config/setting");
const { getLogData, insertLog } = require("../../public/operationLog");
const { knexTransaction, sleep, selectName, factoryAppListResponse, extractProp, timestampSec, getUrlPath } = require("../../../utils/tools");
const { checkKeys, isEmpty, isArray } = require("../../../utils/check_type");
const { getPermission } = require("../../public/permission");
const { sqlPagination, sqlCount } = require("../../../utils/sqlHelper");
const RedisBucket = require("./redisdb");
const { getCoverUrl } = require("../../public/upload");
// const { app_image_resize } = require("../../../config");


const LikeBucket = new RedisBucket('like');
const ShareBucket = new RedisBucket('share');
const FavoriteBucket = new RedisBucket('favorite');
const WatchBucket = new RedisBucket('watch');


async function hot_list(query, userinfo) {
  const app_res = await factoryAppListResponse(query, COURSE_TABLE);
  const response = app_res.data;

  const course_cols = [
    "id", "name", "url", "cover_url", "collection_id", "describe", "source_type", "menu_id", "platform_id", "pay_type", "preview_duration",
    "share_num", "like_num", "favorite_num", "watch_num", "create_time"
  ]
  const sql = knex(`${COURSE_TABLE} as course`)
    .select(...course_cols.map(v => "course." + v))
    .where({
      "course.oem_id": userinfo.oem_id,
      "course.status": 1,
      is_hot: 1,
      verify_status: 3
    })
    .andWhere(builder => {
      if (response.site && response.page > 1) {
        builder.where("course.id", "<=", response.site);
      }
      handler.search_filter(builder, query, userinfo);
    })

  response.list = await sqlPagination(sql, response)
    .leftJoin(`${CATALOG} as catalog`, "catalog.id", "course.menu_id")
    .select("catalog.catalog_id")
    .select(knex.raw(
      `(SELECT COUNT(l.id) FROM ${COURSE_LIKE} as l where l.status = 1 and l.course_id = course.id and l.create_user_id = ${userinfo.id} LIMIT 1) as is_like`
    ))
    .select(knex.raw(
      `(SELECT COUNT(f.id) FROM ${COURSE_FAVORITE} as f where f.status = 1 and f.course_id = course.id and f.create_user_id = ${userinfo.id} LIMIT 1) as is_favorite`
    ))
    .whereIn("catalog.catalog_id", [1, 2, 3, 4])
    .select(selectName("course", "collection_id", COURSE_COLLECTCION, "name", "collection_name"))
    .select(selectName("catalog", "catalog_id", CATALOG, 'name', 'catalog_name'))
    .orderBy([{ column: "course.order", order: 'desc' }, { column: 'course.id', order: 'desc' }]);

  response.list.forEach(v => {
    const oss_key = getUrlPath(v.url, false);
    v.cover_url = v.cover_url ? getCoverUrl(3, getUrlPath(v.cover_url)) : getCoverUrl(2, getUrlPath(v.url))
    // if(v.cover_url) v.cover_url = `${v.cover_url}${app_image_resize}`
    v.url = getCoverUrl(3, oss_key);
    v.author = "小果学院";
    if (userinfo.vip_status == 2) v.preview_duration = 0;
    // v.source_info = JSON.parse(v.source_info);
  })

  return app_res;
}

async function collect_list(query, userinfo) {
  const { collection_id } = checkKeys(query, ["collection_id"])
  const app_res = await factoryAppListResponse(query, COURSE_TABLE);
  const response = app_res.data;

  if (isEmpty(query.page)) {
    delete response.site;
    delete response.page;
    delete response.pagesize
  }

  const course_cols = [
    "id", "name", "url", "cover_url", "collection_id", "describe", "source_type", "menu_id", "platform_id", "pay_type", "preview_duration",
    "share_num", "like_num", "favorite_num", "watch_num", "create_time"
  ]
  let sql = knex(`${COURSE_TABLE} as course`)
    .where({ "course.oem_id": userinfo.oem_id, collection_id, status: 1, verify_status: 3 })
    .andWhere(builder => {
      if (response.site && response.page > 1) {
        builder.where("course.id", "<=", response.site);
      }
    })
    .select(...course_cols.map(v => "course." + v))
    .select(knex.raw(
      `(SELECT COUNT(l.id) FROM ${COURSE_LIKE} as l where l.status = 1 and l.course_id = course.id and l.create_user_id = ${userinfo.id} LIMIT 1) as is_like`
    ))
    .select(knex.raw(
      `(SELECT COUNT(f.id) FROM ${COURSE_FAVORITE} as f where f.status = 1 and f.course_id = course.id and f.create_user_id = ${userinfo.id} LIMIT 1) as is_favorite`
    ))

  
  if (response.page) {
    sql = sqlPagination(sql, response);
  }
  response.list = await sql.orderBy([{ column: 'id', order: 'desc' }]);

  const collect = await knex(COURSE_COLLECTCION).select("name").where("id", collection_id);
  response.collect_name = collect[0]?.name || "未知合集";
  response.collect_describe = collect[0]?.describe || "";
  let total_watch_num = 0;
  response.list.forEach(v => {
    total_watch_num += (v.watch_num || 0);
    const oss_key = getUrlPath(v.url, false);
    v.cover_url = v.cover_url ? getCoverUrl(3, getUrlPath(v.cover_url)) : getCoverUrl(2, getUrlPath(v.url))
    v.url = getCoverUrl(3, oss_key);
    v.author = "小果学院";
    if (userinfo.vip_status == 2) v.preview_duration = 0;
    // v.source_info = JSON.parse(v.source_info);
  })
  response.collect_watch_num = total_watch_num;

  return app_res;
}

async function recommend_list(query, userinfo) {
  const { course_id, pagesize = 20 } = checkKeys(query, ["course_id", { key: "pagesize", type: Number }]);

  // const app_res = await factoryAppListResponse(query, COURSE_TABLE);
  const app_res = {
    code: 0,
    data: {
      list: []
    }
  }
  const response = app_res.data;

  const course_tags = (
    await knex(COURSE_TAG).select("tag_id").where({ course_id, status: 1 })
  ).map(v => v.tag_id);
  if (!course_tags) return app_res;

  let relation_course_ids = (
    await knex(COURSE_TAG).select("course_id")
      .whereIn("tag_id", course_tags).andWhere("status", 1)
      .andWhereNot({ course_id }).groupBy("course_id").limit(pagesize)
      .orderBy("course_id", "desc")
  ).map(v => v.course_id);
  if (!relation_course_ids.length) {
    relation_course_ids = await random_recommand(course_id, pagesize);
  }
  if (!relation_course_ids.length) return app_res;
  
  const course_cols = [
    "id", "name", "url", "cover_url", "collection_id", "describe", "source_type", "menu_id", "platform_id", "pay_type", "preview_duration",
    "share_num", "like_num", "favorite_num", "watch_num", "create_time"
  ]
  const sql = knex(`${COURSE_TABLE} as course`)
    .select(...course_cols.map(v => "course." + v))
    .where({
      "course.oem_id": userinfo.oem_id,
      "course.status": 1,
      verify_status: 3,
    })
    .andWhere(builder => {
      builder.whereIn("course.id", relation_course_ids)
    });

  response.list = await sql
    .leftJoin(`${CATALOG} as catalog`, "catalog.id", "course.menu_id")
    .select("catalog.catalog_id")
    .select(knex.raw(
      `(SELECT COUNT(l.id) FROM ${COURSE_LIKE} as l where l.status = 1 and l.course_id = course.id and l.create_user_id = ${userinfo.id} LIMIT 1) as is_like`
    ))
    .select(knex.raw(
      `(SELECT COUNT(f.id) FROM ${COURSE_FAVORITE} as f where f.status = 1 and f.course_id = course.id and f.create_user_id = ${userinfo.id} LIMIT 1) as is_favorite`
    ))
    .orderBy([{ column: "course.order", order: 'desc' }, { column: 'course.id', order: 'desc' }]);

  response.list.forEach(v => {
    const oss_key = getUrlPath(v.url, false);
    v.cover_url = v.cover_url ? getCoverUrl(3, getUrlPath(v.cover_url)) : getCoverUrl(2, getUrlPath(v.url))
    v.url = getCoverUrl(3, oss_key);
    v.author = "小果学院";
    if (userinfo.vip_status == 2) v.preview_duration = 0;
  })

  return app_res;
}
async function random_recommand(course_id, limit) {
  const round = Math.round(Math.random() * 10)

  const catalog_id = (
    await knex(`${COURSE_TABLE} as course`)
      .select(selectName("course", "menu_id", CATALOG, "catalog_id", "catalog_id", "id"))
      .where("course.id", course_id)
  )[0]?.catalog_id;

  const knex_sql = knex(`${COURSE_TABLE} as course`)
    .leftJoin(`${CATALOG} as catlog`, 'catlog.id', 'course.menu_id')
    .where("catlog.catalog_id", catalog_id)
    .select("course.id")
    .whereRaw(`course.id % ${round} = ${timestampSec()} % ${round}`)
    .where("course.id", "<>", course_id)
    .limit(limit);

  const ids = (
    await knex_sql
  ).map(v => v.id);

  return ids;
}

async function course_like(body, userinfo) {
  const data = checkKeys(body, ["course_id", "status"]);
  data.update_time = moment().format("YYYY-MM-DD HH:mm:ss");
  data.create_user_id = userinfo.id;
  await LikeBucket.write(data, true);

  return { code: 0, data: null };
}

async function course_favorite(body, userinfo) {
  const data = checkKeys(body, ["course_id", "status"]);
  data.update_time = moment().format("YYYY-MM-DD HH:mm:ss");
  data.create_user_id = userinfo.id;
  await FavoriteBucket.write(data, true);
  return { code: 0, data: null };
}

async function course_share(body, userinfo) {
  const data = checkKeys(body, ["course_id", "platform_id"]);
  data.update_time = moment().format("YYYY-MM-DD HH:mm:ss");
  data.create_user_id = userinfo.id;
  data.status = 1;
  await ShareBucket.write(data, false);
  return { code: 0, data: null };
}

async function course_watch(body, userinfo) {
  const data = checkKeys(body, ["course_id"]);
  data.update_time = moment().format("YYYY-MM-DD HH:mm:ss");
  data.create_user_id = userinfo.id;
  data.status = 1;
  await WatchBucket.write(data, true)
  return { code: 0, data: null };
}

const handler = {
  search_filter(builder, query, userinfo) {
    //
  },
}


module.exports = {
  hot_list,
  collect_list,
  recommend_list,
  course_like,
  course_favorite,
  course_share,
  course_watch
}