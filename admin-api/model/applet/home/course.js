
const moment = require("moment");
const knex = require("../../../db/knexManager").knexProxy;
const {
  COURSE_TABLE, COURSE_COLLECTCION, CATALOG, COURSE_LIKE, COURSE_FAVORITE
} = require("../../../config/setting");
const { knexTransaction, sleep, selectName, factoryAppListResponse, getUrlPath } = require("../../../utils/tools");
const { checkKeys, isEmpty, isArray, isArrayHas } = require("../../../utils/check_type");
// const { getPermission } = require("../../public/permission");
const { sqlPagination, sqlCount } = require("../../../utils/sqlHelper");
const { getCoverUrl } = require("../../public/upload");



async function list(query, userinfo) {
  const { catalog_id } = checkKeys(query, [
    { key: "catalog_id", required: true, type: Number, validator: val => isArrayHas([2, 3, 4, 5], val) }
  ]);
  const app_res = await factoryAppListResponse(query, COURSE_TABLE);
  const response = app_res.data;

  const course_cols = [
    "id", "name", "url", "cover_url", "collection_id", "describe", "pay_type", "preview_duration",
    "share_num", "like_num", "favorite_num", "watch_num", "create_time", "menu_id"
  ]
  const sql = knex(`${COURSE_TABLE} as course`)
    .leftJoin(`${CATALOG} as catlog`, 'catlog.id', 'course.menu_id')
    .select(...course_cols.map(v => "course." + v))
    .select("catlog.pid")
    .where({
      "course.oem_id": userinfo.oem_id,
      "course.status": 1,
      "course.verify_status": 3,
      "catlog.catalog_id": catalog_id
    })
    .andWhere(builder => {
      if (response.site && response.page > 1) {
        builder.where("course.id", "<=", response.site);
      }
    })

  handler.search_filter(sql, query, userinfo);

  response.list = await sqlPagination(sql, response)
    .select(selectName("course", "collection_id", COURSE_COLLECTCION, "name", "collection_name"))
    .select(knex.raw(
      `(SELECT COUNT(l.id) FROM ${COURSE_LIKE} as l where l.status = 1 and l.course_id = course.id and l.create_user_id = ${userinfo.id} LIMIT 1) as is_like`
    ))
    .select(knex.raw(
      `(SELECT COUNT(f.id) FROM ${COURSE_FAVORITE} as f where f.status = 1 and f.course_id = course.id and f.create_user_id = ${userinfo.id} LIMIT 1) as is_favorite`
    ))
    .select(knex.raw("'小果学院' as author"));

  response.list.forEach(v => {
    const oss_key = getUrlPath(v.url, false);
    v.cover_url = v.cover_url ? getCoverUrl(3, getUrlPath(v.cover_url)) : getCoverUrl(2, getUrlPath(v.url))
    // if(v.cover_url) v.cover_url = `${v.cover_url}${app_image_resize}`
    v.url = getCoverUrl(3, oss_key);
    if (userinfo.vip_status == 2) v.preview_duration = 0;
  })

  return app_res;
}

async function tutorial_list(query, userinfo) {
  const app_res = {
    code: 0,
    data: {
      list: [],
      // page: Number(query.page || 1),
      // pagesize: Number(query.pagesize || 20),
      // site: 0,
    }
  };
  const response = app_res.data;

  const course_cols = [
    "id", "name", "url", "cover_url", "menu_id", "collection_id", "describe", "pay_type", "preview_duration",
    "share_num", "like_num", "favorite_num", "watch_num", "create_time"
  ]

  // 新手入门固定二级 
  const menus = await knex(CATALOG)
    .select("id as menu_id", "name as menu_name", "business_type")
    .where({ status: 1, catalog_id: 1, pid: 1 })
    .orderBy("order", "desc");
  const menu_ids = menus.map(v => {
    v.list = [];
    return v.menu_id
  });
  const sql = knex(`${COURSE_TABLE} as course`)
    .select(...course_cols.map(v => "course." + v))
    .where({ "course.oem_id": userinfo.oem_id, status: 1, verify_status: 3 })
    .andWhere(builder => {
      builder.whereIn("menu_id", menu_ids)
    })

  const raws = await sql
    .select(selectName("course", "collection_id", COURSE_COLLECTCION, "name", "collection_name"))
    .select(knex.raw(
      `(SELECT COUNT(l.id) FROM ${COURSE_LIKE} as l where l.status = 1 and l.course_id = course.id and l.create_user_id = ${userinfo.id} LIMIT 1) as is_like`
    ))
    .select(knex.raw(
      `(SELECT COUNT(f.id) FROM ${COURSE_FAVORITE} as f where f.status = 1 and f.course_id = course.id and f.create_user_id = ${userinfo.id} LIMIT 1) as is_favorite`
    ));

  raws.forEach(v => {
    v.author = "小果学院"
    const oss_key = getUrlPath(v.url, false);
    v.cover_url = v.cover_url ? getCoverUrl(3, getUrlPath(v.cover_url)) : getCoverUrl(2, getUrlPath(v.url))
    v.url = getCoverUrl(3, oss_key);
    if (userinfo.vip_status == 2) v.preview_duration = 0;
    const menu = menus.find(m => m.menu_id == v.menu_id);
    if (menu) menu.list.push(v);
  })
  response.list = menus;

  return app_res;
}

async function course_def(query, userinfo) {
  const { course_id } = checkKeys(query, ["course_id"])
  const app_res = {
    code: 0,
    data: {}
  };

  const course_cols = [
    "id", "name", "url", "cover_url", "menu_id", "collection_id", "describe", "pay_type", "preview_duration",
    "share_num", "like_num", "favorite_num", "watch_num", "create_time"
  ]

  // 新手入门固定二级 
  const menus = await knex(CATALOG)
    .select("id as menu_id", "name as menu_name")
    .where({ status: 1, catalog_id: 1, pid: 1 })
    .orderBy("order", "asc");
  const menu_ids = menus.map(v => {
    v.list = [];
    return v.menu_id
  });
  const sql = knex(`${COURSE_TABLE} as course`)
    .select(...course_cols.map(v => "course." + v))
    .where({ "course.oem_id": userinfo.oem_id, status: 1, verify_status: 3 })
    .where("course.id", course_id)

  const raws = await sql
    .select(selectName("course", "collection_id", COURSE_COLLECTCION, "name", "collection_name"))
    .select(selectName("course", "menu_id", CATALOG, "catalog_id", "catalog_id"))
    .select(knex.raw(
      `(SELECT COUNT(l.id) FROM ${COURSE_LIKE} as l where l.status = 1 and l.course_id = course.id and l.create_user_id = ${userinfo.id} LIMIT 1) as is_like`
    ))
    .select(knex.raw(
      `(SELECT COUNT(f.id) FROM ${COURSE_FAVORITE} as f where f.status = 1 and f.course_id = course.id and f.create_user_id = ${userinfo.id} LIMIT 1) as is_favorite`
    ));

  raws.forEach(v => {
    v.author = "小果学院"
    const oss_key = getUrlPath(v.url, false);
    v.cover_url = v.cover_url ? getCoverUrl(3, getUrlPath(v.cover_url)) : getCoverUrl(2, getUrlPath(v.url))
    v.url = getCoverUrl(3, oss_key);
    if (userinfo.vip_status == 2) v.preview_duration = 0;
    const menu = menus.find(m => m.menu_id == v.menu_id);
    if (menu) menu.list.push(v);
  })

  app_res.data = raws[0];

  return app_res;
}



async function menu_tree(query, userinfo) {
  const { catalog_id } = checkKeys(query, [
    { key: 'catalog_id', required: true, type: Number, validator: val => [1, 3, 4].includes(val) }
  ]);
  const cache_key = 'home_catalog_cache_' + catalog_id;
  if (MemoryCache.has(cache_key)) {
    return { code: 0, data: MemoryCache.get(cache_key) };
  }
  const raws = await knex(CATALOG).where({ catalog_id, status: 1 });
  const parents = new Map();
  const child = new Map();

  // 新手入门固定二级 视频领取固定一级 爆款模型、学习课程固定三级
  let layer = 2;
  if ([3, 4].includes(catalog_id)) layer = 3;

  raws.forEach(raw => {
    const item = { menu_id: raw.id, label: raw.name, order: raw.order };
    if (raw.pid == catalog_id) {
      item.pid = raw.pid;
      if (layer > 2) {
        item.children = [];
      }
      parents.set(raw.id, item);
    } else {
      item.pid = raw.pid;
      if (layer > 2) {
        child.set(raw.id, item);
      }
    }
  })

  child.forEach(v => {
    const parent = parents.get(v.pid);
    if (!parent) return;
    parent.children.push(v);
  })
  const data = {
    menus: []
  };
  for (const menu of parents.values()) {
    if (layer > 2 && !menu.children?.length) continue; // 固定3级又不满足3级的忽略
    menu.children?.sort?.((a, b) => a.order - b.order);
    data.menus.push(menu);
  }


  MemoryCache.set(cache_key, data, 'EX', 180)
  return { code: 0, data }
}



const handler = {
  search_filter(builder, query, userinfo) {
    if (query.menu_id) {
      builder.where("course.menu_id", query.menu_id);
    }
    if (query.pid) {
      builder.where("catlog.pid", query.pid);
    }

    if (query.order_by) {
      const order = query.sort || 'desc'
      if (['watch_num', 'create_time'].includes(query.order_by)) {
        if (query.order_by == 'create_time') query.order_by = 'id';
        builder.orderBy(query.order_by, order);
      } else {
        builder.orderBy("score", order);
      }
    } else {
      builder.orderBy([{ column: "course.order", order: 'desc' }, { column: 'course.id', order: 'desc' }])
    }

    if (query.platform_id) {
      builder.where("course.platform_id", query.platform_id)
    }
  }
}


async function course(query) {
  const catalog_id = 5
  const response = { code: 0, data: {} }

  const course_cols = [
    "id", "name", "url", "cover_url", "describe", "create_time", "menu_id"
  ]
  const sql = knex(`${COURSE_TABLE} as course`)
    .leftJoin(`${CATALOG} as catlog`, 'catlog.id', 'course.menu_id')
    .select(...course_cols.map(v => "course." + v))
    .select("catlog.name as menu_name")
    .where({
      "course.oem_id": 1,
      "course.status": 1,
      "course.verify_status": 3,
      "catlog.catalog_id": catalog_id
    })
    .whereNot('course.menu_id', 138)
    .andWhere(builder => {
      handler.search_filter(builder, query);
    })
    .orderBy('course.id', 'desc')
  let course = {}
  let name_map = {}
  let list = (await sql).forEach(v => {
    const oss_key = getUrlPath(v.url, false);
    v.cover_url = v.cover_url ? getCoverUrl(3, getUrlPath(v.cover_url)) : getCoverUrl(2, getUrlPath(v.url))
    v.url = getCoverUrl(3, oss_key);
    if (!course[v.menu_id]) course[v.menu_id] = course[v.menu_id] = v
    // else course[v.menu_id] = [v]
    name_map[v.menu_id] = v.menu_name
  })

  response.data = {
    name_map,
    course
  }

  return response;
}
module.exports = {
  list,
  course,
  tutorial_list,
  course_def,
  menu_tree
}