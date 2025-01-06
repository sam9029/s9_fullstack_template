const knex = require("../../../db/knexManager").knexProxy;
const {
  COURSE_TABLE,
  COURSE_FAVORITE,
  CATALOG,
  CONTENT_FAVORITE,
  CONTENT_TABLE,
  CONTENT_RELATION,
  ADVERTISER_TABLE,
  PLATFORM_TABLE,
  CONTENT_FAVORITE_V2,
} = require("../../../config/setting");
const { bucket } = require("../../../config/index");
const { knexTransaction, getUrlPath } = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const {
  getTableSite,
  sqlCount,
  sqlPagination,
} = require("../../../utils/sqlHelper");
const moment = require("moment");
const { getCoverUrl } = require("../../public/upload");

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

  if (query.type == 1) {
    if (!query.catalog_type) return Promise.reject("菜单类型不能为空！");
    if (response.page == 1) {
      response.site = await getTableSite(COURSE_FAVORITE, "id");
    } else {
      response.site = query.site || 0;
    }
    let sql = knex
      .select("course.id")
      .from(`${COURSE_FAVORITE} as course_favorite`)
      .leftJoin(
        `${COURSE_TABLE} as course`,
        "course_favorite.course_id",
        "course.id"
      )
      .leftJoin(`${CATALOG} as catalog`, "course.menu_id", "catalog.id")
      .where({
        "course.oem_id": userInfo.oem_id,
        "course.status": 1,
        "course_favorite.status": 1,
        "course_favorite.create_user_id": userInfo.id,
        "catalog.catalog_id": query.catalog_type,
      });
    sql = handler.searchFilter(sql, query);

    if (query.query_count) {
      response.count = await sqlCount(knex, sql);
    } else {
      if (response.site && response.page > 1) {
        sql.where("course_favorite.id", "<=", response.site);
      }
      sql = sqlPagination(sql, response).select(
        "course.name",
        "course.url",
        "course.cover_url",
        "course.describe",
        "course.watch_num",
        "course.source_info",
        "course.source_type"
      );

      let data = await sql.orderBy("course_favorite.id", "desc");
      data.forEach((t) => {
        t.cover_url = t.cover_url
          ? getCoverUrl(3, getUrlPath(t.cover_url))
          : getCoverUrl(2, getUrlPath(t.url));
        t.url = getCoverUrl(3, getUrlPath(t.url, false));
        t.duration = JSON.parse(t.source_info)?.duration;

        delete t.source_info;
      });

      if (!data.length) response.site = null;
      response.list = data;
    }
  } else {
    if (response.page == 1) {
      response.site = await getTableSite(CONTENT_FAVORITE, "id");
    } else {
      response.site = query.site || 0;
    }
    let sql = knex
      .select("content.id")
      .select(
        knex.raw(
          "group_concat(content_relation.advertiser_type) as advertiser_type"
        )
      )
      .select(
        knex.raw("group_concat(content_relation.id) as content_relation_id")
      )
      .select(knex.raw("group_concat(advertiser.name) as advertiser_type_name"))
      .select(
        knex.raw(
          "group_concat(distinct advertiser.icon) as advertiser_type_icon"
        )
      )
      .select(
        knex.raw("group_concat(content_relation.platform_id) as platform_id")
      )
      .select(knex.raw("group_concat(platform.name) as platform_name"))
      .select(knex.raw("group_concat(distinct platform.icon) as platform_icon"))
      .select(
        knex.raw("group_concat( advertiser.business_type) as business_type")
      )
      .from(`${CONTENT_FAVORITE} as content_favorite`)
      .leftJoin(
        `${CONTENT_TABLE} as content`,
        "content_favorite.content_id",
        "content.id"
      )
      .leftJoin(
        `${CONTENT_RELATION} as content_relation`,
        "content.id",
        "content_relation.content_id"
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
      .where({
        "content.oem_id": userInfo.oem_id,
        "content.status": 1,
        "content.invalid_status": 0,
        "content_favorite.status": 1,
        "content_favorite.create_user_id": userInfo.id,
      })
      .groupBy("content_favorite.id");
    sql = handler.searchFilter(sql, query);

    if (query.query_count) {
      response.count = await sqlCount(knex, sql);
    } else {
      if (response.site && response.page > 1) {
        sql.where("content_favorite.id", "<=", response.site);
      }
      sql = sqlPagination(sql, response).select(
        "content.book_name",
        "content.cover_url",
        "content.preview",
        "content.describe",
        "content.promotion_type"
      );

      let data = await sql.orderBy("content_favorite.id", "desc");
      data.forEach((t) => {
        t.platform_icon = (t.platform_icon || "").split(",");
        t.platform_id = Number((t.platform_id || "").split(",")[0]);
        t.platform_name = (t.platform_name || "").split(",")[0];

        t.business_type = Number((t.business_type || "").split(",")[0]);
        t.advertiser_type_name = (t.advertiser_type_name || "").split(",")[0];
        t.advertiser_type = Number((t.advertiser_type || "").split(",")[0]);
        t.advertiser_type_icon = (t.advertiser_type_icon || "").split(",");
        t.content_relation_id = Number(
          (t.content_relation_id || "").split(",")[0]
        );

        t.dy_story = t.advertiser_type == 1019;
      });

      if (!data.length) response.site = null;
      response.list = data;
    }
  }
  return res;
}

async function newList(query, userInfo) {
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
    response.site = await getTableSite(CONTENT_FAVORITE_V2, "id");
  } else {
    response.site = query.site || 0;
  }

  let sql = knex
    .select("content_favorite.content_id")
    .select("content_favorite.content_relation_id")
    .select("content_relation.relat_type as promotion_type")

    .select("content.book_name")
    .select("content.cover_url")
    .select("content.preview")
    .select("content.describe")

    .select("content_relation.advertiser_type")
    .select("advertiser.name as advertiser_type_name")
    .select("advertiser.icon as advertiser_type_icon")
    .select("advertiser.business_type as business_type")

    .select("content_relation.platform_id")
    .select("platform.name as platform_name")
    .select("platform.icon as platform_icon")

    .from(`${CONTENT_FAVORITE_V2} as content_favorite`)
    .leftJoin(
      `${CONTENT_RELATION} as content_relation`,
      "content_favorite.content_relation_id",
      "content_relation.id"
    )
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
    .where({
      "content_relation.oem_id": userInfo.oem_id,
      "content_relation.status": 1,
      "content.status": 1,
      "content.invalid_status": 0,
      "content_favorite.status": 1,
      "content_favorite.create_user_id": userInfo.id,
    })
    .groupBy("content_favorite.id");
  sql = handler.searchFilterNew(sql, query);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    if (response.site && response.page > 1) {
      sql.where("content_favorite.id", "<=", response.site);
    }
    sql = sqlPagination(sql, response);

    let data = await sql.orderBy("content_favorite.id", "desc");
    data.forEach((t) => {
      t.dy_story = t.advertiser_type == 56;
    });

    if (!data.length) response.site = null;
    response.list = data;
  }

  return res;
}

let handler = {
  searchFilter(sql, query) {
    if (query.business_type) {
      sql.where("advertiser.business_type", query.business_type);
    }
    return sql;
  },
  searchFilterNew(sql, query) {
    if (query.business_type) {
      sql.where("advertiser.business_type", query.business_type);
    }
    if (query.promotion_type) {
      sql.where("content_relation.relat_type", query.promotion_type);
    }
    return sql;
  },
};

module.exports = {
  list,
  newList,
};
