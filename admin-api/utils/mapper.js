const message = require("../enum/message");
const public = require("../enum/public");
const status = require("../enum/status");
const types = require("../enum/type");
const popularize = require("../enum/popularize");
const finance = require("../enum/finance");
const advertiser = require("../enum/advertiser");

const knex = require("../db/knexManager").knexProxy;
const { CONTENT_TABLE } = require("../config/setting");
async function getContentMapper(contentIds, comluns = ['id', 'cover_url', 'book_name'], userInfo = { oem_id: 1}) {
  if (!contentIds) return
  let contentData = await knex(CONTENT_TABLE).select(comluns).whereIn('id', contentIds).where('status', 1).andWhere('oem_id', userInfo.oem_id);
  let contentMapper = {};
  contentData.forEach(item => {
    contentMapper[item.id] = item;
  })
  return contentMapper;
}

module.exports = {
  ...message,
  ...public,
  ...status,
  ...types,
  ...popularize,
  ...finance,
  ...advertiser,
  getContentMapper
}