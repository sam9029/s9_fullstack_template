const moment = require("moment")
const lodash = require("lodash")
const knex = require("../../../db/knexManager").knexProxy;
const { onlyControlInterface } = require("../../public/permission");
const { sleep, knexTransaction, getImportDate, selectName, getDaysBetweenDate, factoryListResponse, renderPrice, extractProp, getUuid, factoryAppListResponse, } = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const { SOURCE_TYPE, SOURCE_CREATIVE, SOURCE_FROM, ACCOUNT_TABLE, SOURCE_CREATIVE_RELATION, SOURCE_DUB } = require("../../../config/setting");
const { getTableSite, sqlPagination, sqlCount, } = require("../../../utils/sqlHelper");
const { checkKeys, isArrayHas, isEmpty } = require("../../../utils/check_type");
const { exportLog } = require("../../public/export");
const { analysisSheet, sheetJsonToData } = require("../../public/upload");
const errorFormat = require("../../../utils/errorFormat");
const { query_material } = require("../../../utils/create/jieziyun");
const { getMoYinMp3 } = require("../../../utils/create/moyin");


async function type_list(query, userinfo) {
  const app_res = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page || 1),
      pagesize: Number(query.pagesize || 20),
      next_page_site: Number(query.next_page_site) || 0,
    }
  }
  const response = app_res.data;

  const knex_sql = knex(`${SOURCE_TYPE} as t`)
    .select("id", "name", "cover_url")
    .where({ status: 1, oem_id: userinfo.oem_id })
    .andWhere(builder => {
      if (response.next_page_site) builder.where("t.id", "<", response.next_page_site)
      if (query.keyword) {
        builder.where("t.name", "like", `${query.keyword}%`)
      }
    })
    .orderBy("id", "desc")

  response.list = await sqlPagination(knex_sql, response);
  response.next_page_site = lodash.last(response.list)?.id ?? null;

  return app_res
}


async function dub_list(query, userinfo) {
  const app_res = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page || 1),
      pagesize: Number(query.pagesize || 20),
      next_page_site: Number(query.next_page_site) || 0,
    }
  }
  const response = app_res.data;

  const knex_sql = knex(`${SOURCE_DUB}`)
    .select("id", "gender", "age", "region", "style", "style_call", "lang", "remark", "thumbnail_url")
    .select(knex.raw(`IFNULL(alias, dubber) as dubber`))
    .where({ status: 1, oem_id: userinfo.oem_id })
    .andWhere(builder => {
      if (response.next_page_site) builder.where("id", "<", response.next_page_site)
      if (query.keyword) {
        builder.where("dubber", "like", `${query.keyword}%`)
          .orWhere("style", "like", `${query.keyword}%`)
      }
    })
    .orderBy("id", "desc")

  response.list = await sqlPagination(knex_sql, response);
  response.list.forEach(v => {
    if (v.region) v.region = JSON.parse(v.region);
  })
  response.next_page_site = lodash.last(response.list)?.id ?? null;

  return app_res
}

async function dub_generate(query, userinfo) {
  const { id } = checkKeys(query, ["id"]);
  const raw = (
    await knex(SOURCE_DUB).where("id", id)
  )[0];
  if (!raw) throw "配音ID不存在！";

  const thumbnail_url = await getMoYinMp3("男朋友出轨了对方是追了他五年的学妹今天和他的学妹见面时我看见学妹手上戴了一块手表我记得他也有。那块表，他戴了三四年而我们在一起的时间也就五年。", raw.style_call);
  await knex(SOURCE_DUB).update({ thumbnail_url }).where("id", id);

  return { code: 0, data: { id, thumbnail_url } }
}

async function audio_list(query, userinfo) {
  const app_res = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page || 1),
      pagesize: Number(query.pagesize || 20),
      next_page_site: Number(query.next_page_site) || 0,
    }
  }
  const response = app_res.data;

  const knex_sql = knex(`${SOURCE_CREATIVE}`)
    .select("source_id as id", "source_id", "name", "url", "format")
    .where({ status: 1, from: 1, format: "mp3", oem_id: userinfo.oem_id })
    .andWhere(builder => {
      if (response.next_page_site) builder.where("id", "<", response.next_page_site)
      if (query.keyword) {
        builder.where("name", "like", `${query.keyword}%`)
      }
    })
    .orderBy("id", "desc")

  response.list = await sqlPagination(knex_sql, response);
  response.next_page_site = lodash.last(response.list)?.id ?? null;

  return app_res
}


module.exports = {
  type_list,
  dub_list,
  dub_generate,
  audio_list,
}