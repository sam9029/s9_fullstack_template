const moment = require("moment");
const knex = require("../../../../db/knexManager").knexProxy;
const {
  ADVERTISER_TABLE, CONTENT_TABLE, CONTENT_RELATION, CONTENT_FAVORITE, VIDEO_TABLE, CONTENT_WATCH, RELATION_EDIT_DATA, CONTENT_DATA, CONTENT_FAVORITE_V2, CONTENT_WATCH_V2
} = require("../../../../config/setting");
const { knexTransaction, sleep, selectName, factoryAppListResponse } = require("../../../../utils/tools");
const { checkKeys, isEmpty, isArrayHas } = require("../../../../utils/check_type");
const { app_image_resize } = require("../../../../config/index")
const { sqlPagination, sqlCount } = require("../../../../utils/sqlHelper");
const { getPlatformMapper, getAdvertiserMapper, getTagsData } = require("../../../../utils/apiMapper");
const { ADVER_TYPE_ENUM } = require("../../../../enum/advertiser");



async function list(query, userinfo) {
  checkKeys(query, [
    "business_type",
    { key: 'list_type', required: true, validator: val => isArrayHas(["newest", "hottest", "favorite", "all"], val) },
    { key: 'order_by', validator: val => isArrayHas(["create_time", "max_income", "join_people_num", "score"], val) },
    { key: 'sort', validator: val => isArrayHas(["asc", "desc"], val) },
  ])

  const app_res = await factoryAppListResponse(query, CONTENT_TABLE);
  const response = app_res.data;

  const adver_sql = knex(ADVERTISER_TABLE).select("id")
    .where({ business_type: query.business_type, status: 1 })
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("is_test", 1)
      }
    });
  const advertiser_ids = (await adver_sql).map(v => v.id);
  if (!advertiser_ids.length) return app_res;

  const relation_sub_query = knex(`${CONTENT_RELATION} as r`)
    .select("content_id")
    .where({
      "r.status": 1, "r.target_status": 2,
    })
    .andWhere(builder => {
      if (query.platform_id) builder.andWhere({ "r.platform_id": query.platform_id })
      if (query.advertiser_type) builder.andWhere({ "r.advertiser_type": query.advertiser_type })
      builder.whereIn("r.advertiser_type", advertiser_ids)
    })
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("r.is_test", 1)
      }
    })
    .toQuery().replace(/`/g, '');

  const knex_sql = knex(`${CONTENT_TABLE} as cont`)
    .leftJoin(`${CONTENT_DATA} as cdata`, 'cdata.content_id', "cont.id")
    .select("cont.id", "cont.book_name", "cont.title", "cont.promotion_type", "cont.cover_url", "cont.describe", "cont.tag_ids", "cont.order")
    .select(
      process.env.NODE_ENV == "production" ?
        knex.raw(`regexp_replace ( REPLACE ( cont.preview, '<br>', '\\n' ), ?, '' ) as preview`, '<(S*)[^>]*>.*?|<.*? />')
        : "cont.preview"
    )
    .select(knex.raw(`(SELECT GROUP_CONCAT(r.platform_id) FROM ${CONTENT_RELATION} as r WHERE r.content_id = cont.id) as platform_ids`))
    .select(knex.raw(`(SELECT GROUP_CONCAT(r.advertiser_type) FROM ${CONTENT_RELATION} as r WHERE r.content_id = cont.id) as advertiser_types`))
    .where({
      "cont.status": 1,
      "cont.invalid_status": 0,
      "cont.verify_status": 3,
      "cont.oem_id": userinfo.oem_id
    })    
    .andWhere(builder => {
      if (response.site && response.page > 1) {
        builder.where("cont.id", "<=", response.site);
      }
    })
    .andWhereRaw(`cont.id IN (${relation_sub_query})`);
    
  handler.search_filter(knex_sql, query, userinfo)

  // console.log(knex_sql.toString());

  response.list = await sqlPagination(knex_sql, response)
    .select("cdata.max_income", "cdata.join_people_num")

  const platform_mapper = await getPlatformMapper(userinfo);
  const adv_mapper = await getAdvertiserMapper(userinfo);
  response.list = await Promise.all(response.list.map(async v => {
    v.tag = (await getTagsData(JSON.parse(v.tag_ids || '[]'))).map(t => t.label)
    if (v.cover_url) v.cover_url = `${v.cover_url}${app_image_resize}`
    v.preview = v.preview || v.describe || v.book_name || v.title
    v.platform_list = [];
    if (v.platform_ids) {
      v.platform_list = v.platform_ids.split(',').sort().map(plat_id => {
        const p = platform_mapper[plat_id];
        return {
          id: +plat_id,
          name: p?.name || null,
          icon: p?.icon || null,
          status: p?.status || 2,
        }
      });
    }
    delete v.platform_ids
    v.advertiser_list = [];
    if (v.advertiser_types) {
      v.advertiser_list = v.advertiser_types.split(',').sort().map(adv_id => {
        const p = adv_mapper[adv_id];
        return {
          id: +adv_id,
          name: p?.name || null,
          icon: p?.icon || null,
          status: p?.status || 2,
        }
      });
    }
    delete v.advertiser_types
    return v
  }))
  return app_res
}

async function define(query, userinfo) {
  const { id } = checkKeys(query, ["id"]);

  const knex_sql = knex(`${CONTENT_TABLE} as cont`)
    .leftJoin(`${CONTENT_RELATION} as r`, 'cont.id', 'r.content_id')
    .leftJoin(`${RELATION_EDIT_DATA} as re`, 're.relation_id', 'r.id')
    .groupBy("r.content_id")
    .select("cont.id as content_id", "cont.book_name", "cont.title", "cont.promotion_type", "cont.cover_url", "cont.tag_ids", "cont.describe")
    .select(
      process.env.NODE_ENV == "production" ?
        knex.raw(`regexp_replace ( REPLACE ( cont.preview, '<br>', '\\n' ), ?, '' ) as preview`, '<(S*)[^>]*>.*?|<.*? />')
        : "cont.preview"
    )
    .select(knex.raw(`GROUP_CONCAT(DISTINCT r.platform_id) as platform_ids`))
    .select(knex.raw(`GROUP_CONCAT(r.advertiser_type) as advertiser_types`))
    .select(
      knex.raw(
        `(SELECT COUNT(p.id) FROM ${CONTENT_FAVORITE} as p 
        WHERE p.create_user_id = ${userinfo.id} AND p.status = 1) as is_favorite`
      )
    )
    .select(knex.raw(`MAX(GREATEST(re.max_income, re.edit_max_income)) as max_income`))
    .select(knex.raw(`MAX(GREATEST(re.join_people_num, re.edit_join_people_num)) as join_people_num`))
    .where("cont.id", id)
    .andWhere({ "cont.status": 1, "cont.invalid_status": 0, "cont.verify_status": 3, "cont.oem_id": userinfo.oem_id })
    .andWhere({ "r.status": 1, "r.target_status": 2, })
    .andWhere(builder => {
      if (userinfo.account_type != 3) {
        builder.where("r.is_test", 1)
      }
    });

  const data = (await knex_sql)[0];
  if (!data) throw "内容不存在或已下架！";

  if (data.cover_url) data.cover_url = `${data.cover_url}${app_image_resize}`
  data.tag = (await getTagsData(JSON.parse(data.tag_ids || '[]'))).map(t => t.label)
  data.preview = data.preview || data.describe || data.book_name || data.title
  data.platform_list = [];
  data.advertiser_list = [];
  if (data.platform_ids) {
    const platform_mapper = await getPlatformMapper(userinfo);

    data.platform_list = data.platform_ids.split(',').sort().map(v => {
      const p = platform_mapper[v];
      return {
        id: +v,
        name: p?.name || null,
        icon: p?.icon || null,
      }
    });
    delete data.platform_ids
  }
  if (data.advertiser_types) {
    const mapper = await getAdvertiserMapper(userinfo);

    data.advertiser_list = data.advertiser_types.split(',').sort().map(v => {
      const p = mapper[v];
      return {
        id: +v,
        name: p?.name || null,
        icon: p?.icon || null,
        page_enum: ADVER_TYPE_ENUM[p.id] || ADVER_TYPE_ENUM.NORMAL,
      }
    });
    delete data.advertiser_types
  }
  let insert = {
    content_id: id,
    create_user_id: userinfo.id,
  }
  await knex(CONTENT_WATCH_V2).insert(insert).onConflict(["create_user_id", "content_id"]).merge();

  return { code: 0, data }
}

async function favorite(body, userinfo, req) {
  const { $version, $platform } = req;
  const { id: content_id, relation_id, status } = checkKeys(body, [
    "id", "relation_id?", { key: "status", required: true, type: Number, validator: val => isArrayHas([1, 2], val) }
  ]);

  let insert = { content_id, create_user_id: userinfo.id, status }

  if($platform == "ios" && $version > 166 || $platform == 'android' && $version >733)  {
    insert.content_relation_id = relation_id
    await knexTransaction(async trx => {
      await trx(CONTENT_FAVORITE_V2)
        .insert(insert)
        .onConflict(["content_relation_id", "create_user_id"])
        .merge();
    })
  }
  else {
    await knexTransaction(async trx => {
      await trx(CONTENT_FAVORITE)
        .insert(insert)
        .onConflict(["content_id", "create_user_id"])
        .merge();
    })
  }
  return { code: 0, data: null }
}


const handler = {
  search_filter(builder = knex, query, userinfo) {
    if (query.list_type == 'newest') {
      builder.orderBy("cont.id", "desc")
    } else if (query.list_type == 'hottest') {
      builder.orderBy("cont.order", "desc")
    } else if (query.list_type == 'favorite') {
      builder.leftJoin(`${CONTENT_FAVORITE} as favo`, 'cont.id', "favo.content_id")
        .andWhere({ 'favo.create_user_id': userinfo.id, "favo.status": 1 })
        .orderBy("favo.update_time", 'desc')
    } else if (query.list_type == 'all') {
      if (query.order_by) {
        const sort = query.sort || 'desc';
        switch (query.order_by) {
          case 'create_time':
            builder.orderBy("cont.id", sort);
            break;
          case 'score':
            builder.orderBy("cdata.max_income", sort);
            break;
          default:
            if (query.order_by) builder.orderBy(query.order_by, sort);
        }
      }
    }


    if (query.has_video) {
      builder.whereRaw(`cont.id ${Number(query.has_video) == 1 ? 'IN' : 'NOT IN'} (SELECT v.content_id FROM ${VIDEO_TABLE} as v WHERE v.content_id = cont.id AND v.publish_status = 2 AND v.status = 1 AND v.receive_status = 1)`)
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

    if (query.exclude_id) {
      builder.andWhereNot("cont.id", query.exclude_id)
    }
  }
}


module.exports = {
  list,
  define,
  favorite
}