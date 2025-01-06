const knex = require("../../../../db/knexManager").knexProxy;
const {
  SOURCE_MATERIAL,
  KOC_KEYWORD,
  CONTENT_TABLE
} = require("../../../../config/setting");
const { analysisSheet, getDownloadUrl } = require("../../../public/upload");
const moment = require("moment");
const { getChildrenByPermission } = require("../../../public/permission");
const { getTableSite, sqlPagination, sqlCount } = require("../../../../utils/sqlHelper");
const { get_project_render_props, RenderType } = require('../../../manage/popularize/keyword/utils');
const { knexTransaction, selectName, factoryListResponse, getDaysBetweenDate, getUrlPath } = require("../../../../utils/tools");
const { getCoverUrl } = require("../../../public/upload")
const lodash = require('lodash');
const {
  getLogData,
  insertLog,
} = require("../../../public/operationLog");

async function list(query, userInfo) {
  let { advertiser_type, content_id } = query;
  if (!advertiser_type) return Promise.reject('请传入项目产品！');
  if (!content_id) return Promise.reject('请传入内容ID！');
  const response = {
    code: 0,
    data: {}
  }

  let data = await knex(`${SOURCE_MATERIAL} as source`)
    .select('source.id', "source.url", 'source.text', 'source.menu_type', 'source.name')
    .where({
      advertiser_type,
      oem_id: userInfo.oem_id,
      status: 2
    })

  let keywords = await knex(`${KOC_KEYWORD} as k`).select('k.id', 'k.keyword')
    .where({ 'content_id': content_id, oem_id: userInfo.oem_id, create_user_id: userInfo.id, verify_status: 2, status: 1 });

  let preview = (await knex(CONTENT_TABLE).select('preview').where({ id: content_id, oem_id: userInfo.oem_id }))[0];

  let text = [], image = [];
  data.forEach(v => {
    if (v.menu_type == 1) {
      let oss_key = getUrlPath(v.url)
      v.url = getCoverUrl(3, oss_key, 'koc-material')
      v.download_url = getDownloadUrl(oss_key, v.name);
      delete v.text
      image.push(v)
    } else {
      text.push(v)
    }
  })


  response.data = {
    text,
    image,
    keywords,
    preview: preview?.preview || ''
  };
  return response;
}

async function updateTimes(body, userInfo) {
  let { id } = body;
  if (!id) return Promise.reject('请传入素材ID');
  let oldData = (await knex(SOURCE_MATERIAL).select('use_times', 'id').where({
    id,
    oem_id: userInfo.oem_id,
    status: 2
  }))[0];
  let times = 0;
  if (oldData) {
    id = oldData.id;
    times = oldData.use_times;
  }
  await knexTransaction(async (trx) => {
    await trx(SOURCE_MATERIAL).update("use_times", lodash.add(times, 1)).where("id", id);
    let logData = getLogData(
      id,
      6275,
      { use_times: lodash.add(times, 1) },
      userInfo,
      oldData
    );
    await insertLog(trx, logData);
  });
  return {
    code: 0,
    data: {
      id
    }
  }
}

module.exports = {
  list,
  updateTimes
};
