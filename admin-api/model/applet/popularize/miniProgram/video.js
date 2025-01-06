const knex = require("../../../../db/knexManager").knexProxy;
const {
  VIDEO_TABLE, ACCOUNT_TABLE,
} = require("../../../../config/setting");
const {
  getLogData,
  insertLog,
} = require("../../../public/operationLog");
const { analysisSheet } = require("../../../public/upload");
const { knexTransaction, selectName, getDaysBetweenDate, getUrlPath } = require("../../../../utils/tools");
const moment = require("moment");
const { getChildrenByPermission } = require("../../../public/permission");
const { getTableSite, sqlPagination, sqlCount } = require("../../../../utils/sqlHelper");
const { get_project_render_props, RenderType } = require('../../../manage/popularize/keyword/utils');
const { operateEquity, queryEquity } = require("../../../../utils/payment/equity")
const { getCoverUrl } = require("../../../public/upload");

const lodash = require('lodash')
async function list(query, userInfo) {
  let { promotion_type, content_id, receive_status } = query;
  if (!promotion_type) return Promise.reject('未设置推广类型');
  if (!content_id) return Promise.reject('未设置内容id'); // 内容id 或者 剧集id
  if (!receive_status) return Promise.reject('未设置领取状态');
  const response = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page) || 1,
      pagesize: Number(query.pagesize) || 20,
      site: Number(query.site) || 0,
    },
  }

  const sql = knex(`${VIDEO_TABLE} as video`)
    .select('video.id', "video.url", 'video.publish_date', 'video.receive_time')
    .where(builder => {
      if (Number(response.data.site) && response.data.page > 1) {
        builder.where("video.id", "<", response.data.site);
      }
    })
  handler.searchFilter(sql, query, userInfo);
  let data = await sql.limit(response.data.pagesize).orderBy('video.id', 'desc');
  data.forEach(item => {
    let oss_key = getUrlPath(item.url)
    if (item.receive_status == 1) {
      item.url = getCoverUrl(2, oss_key, 'koc-material')
    } else {
      item.cover_url = getCoverUrl(2, oss_key, 'koc-material')
      item.url = getCoverUrl(3, oss_key, 'koc-material')
    }
  })

  response.data.list = data;
  if (data.length) {
    response.data.site = data[0].id
  } else {
    response.data.site = null;
    response.data.has_next_page = false;
  }
  return response;
}

async function receiveVideo(body, userInfo) {
  let logTag = 6225;
  let { id, business_type } = body;
  if (!id) return Promise.reject("未设置领取的视频ID！");
  if (!business_type) return Promise.reject("未设置业务类型！");
  let oldData = await knex(VIDEO_TABLE).select('id', 'receive_status', 'business_type').where({ oem_id: userInfo.oem_id, receive_status: 1, publish_status: 2, status: 1, id });
  if (!oldData.length) return Promise.reject('该视频不可领取，请检查');
  id = oldData[0].id;
  let success = [];
  await knexTransaction(async (trx) => {
    await handler.checkReceiveAuth(userInfo, trx);
    let updateData = {
      receive_status: 2,
      update_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      update_user_id: userInfo.id,
      receive_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      receive_user_id: userInfo.id,
      receive_date: moment().format('YYYY-MM-DD'),
      business_type
    }
    success = await trx(VIDEO_TABLE).update(updateData).where('id', id);
    await insertLog(trx, getLogData(id, logTag, updateData, userInfo, { receive_status: oldData[0].receive_status }));
  });
  return {
    code: 0,
    data: {
      success,
      message: `领取成功`
    }
  };
}

async function deleteVideo(body, userInfo) {
  let logTag = 6224;
  let ids = body.ids;
  if (!Array.isArray(ids) || !ids.length)
    return Promise.reject("未设置删除的视频D！");
  let success = [], logs = [];
  await knexTransaction(async (trx) => {
    ids = (await trx(VIDEO_TABLE).select('id', 'status').whereIn('id', ids).where({ oem_id: userInfo.oem_id, receive_user_id: userInfo.id })).map(item => item.id);
    if (!ids.length) return Promise.reject('未检测到该组视频，请检查');
    let updateData = {
      status: 4,
      update_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      update_user_id: userInfo.id
    }
    success = await trx(VIDEO_TABLE).update(updateData).whereIn('id', ids).where({ status: 1, receive_status: 2 });
    for (let i = 0; i < ids.length; i++) {
      let item = ids[i];
      logs = getLogData(
        item,
        logTag,
        updateData,
        userInfo,
        { status: 1 }
      );
    }
    await insertLog(trx, logs);
  });
  return {
    code: 0,
    data: {
      success,
      message: `成功删除${success}个视频！`
    }
  };
}

async function getVideoConfig(query, userInfo) {
  // day_num: 原创视频每天领取额度
  // limit_num: 原创视频总的领取额度
  let { limit_num, vip_data_id, day_num, tool_equity_type } = await queryEquity({ diff_type: 'recept_video'}, userInfo);
  let today = moment().format('YYYY-MM-DD');
  let dayNum = (await knex(VIDEO_TABLE).count('id as count').where({ receive_user_id: userInfo.id, receive_date: today, oem_id: userInfo.oem_id }))[0].count;
  let mixed_shear = 0;
  if (tool_equity_type && tool_equity_type.mixed_shear) {
    mixed_shear = tool_equity_type.mixed_shear
  }
  return {
    code: 0,
    data: {
      original_day_total: day_num,
      original_day_used: dayNum,
      original_day_remain: lodash.subtract(day_num, dayNum),
      original_total: limit_num,
      production_day_total: mixed_shear,
      production_day_used: 0,
      production_total: 0,
      production_day_remain: lodash.subtract(mixed_shear, 0),
    }
  }
}

const handler = {
  searchFilter(sql, query, userInfo) {
    let orderProp = 'publish_date';

    if (query.receive_status == 2) {
      orderProp = 'receive_time'
    }
    sql.where(`video.content_id`, Number(query.content_id))
      .orderBy(orderProp, 'desc')

    if (query.receive_status) {
      sql.where("video.receive_status", Number(query.receive_status));
    }

    if (query.start_date && query.end_date) {
      sql.whereIn("video.create_date", getDaysBetweenDate(query.start_date, query.end_date))
    }

    sql.where({
      'video.oem_id': userInfo.oem_id,
      "video.promotion_type": query.promotion_type,
      'video.status': 1,
      "video.publish_status": 2
    })
  },
  async checkReceiveAuth(userInfo, trx) {
    let { day_num } = await operateEquity({ diff_type: 'recept_video', times: 1 }, 'diff', userInfo, trx);  // 领取时使用 diffEquity, 查询时使用queryEquity
    if (!day_num) return Promise.reject('未获取到会员视频领取配置，请联系管理员')
    let today = moment().format('YYYY-MM-DD');
    let dayNum = (await knex(VIDEO_TABLE).count('id as count').where({ receive_user_id: userInfo.id, receive_date: today, oem_id: userInfo.oem_id }))[0].count;
    if (dayNum >= day_num) return Promise.reject('今日视频领取个数已到上限，明日再来！')
  }
};

module.exports = {
  list,
  receiveVideo,
  deleteVideo,
  getVideoConfig
};
