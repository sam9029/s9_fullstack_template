const knex = require("../../../../db/knexManager").knexProxy;
const {
  VIDEO_TABLE, ADVERTISER_TABLE, CONTENT_TABLE, CONTENT_RELATION, PLATFORM_TABLE, VIDEO_TYPE_TAG
} = require("../../../../config/setting");
const {
  getLogData,
  insertLog,
} = require("../../../public/operationLog");
const { knexTransaction, selectName, getDaysBetweenDate, getUrlPath } = require("../../../../utils/tools");
const moment = require("moment");
const { getTableSite, sqlPagination } = require("../../../../utils/sqlHelper");
const { operateEquity, queryEquity } = require("../../../../utils/payment/equity")
const { getCoverUrl } = require("../../../public/upload");
const { getAdvertiserMapper, getPlatformMapper, getMineTypeMapper } = require("../../../../utils/apiMapper");
const { getContentMapper, RelationType } = require('../../../../utils/mapper')
const { getCustomCache, setCustomCache } = require("../../../../db/redis")

const lodash = require('lodash')
async function list(query, userInfo, req) {
  let { content_id, receive_status, business_type } = query;
  if (!receive_status) return Promise.reject('未设置领取状态');
  const response = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page) || 1,
      pagesize: Number(query.pagesize) || 20,
      site: Number(query.site) || 0,
      count: 0
    },
  }
  let data = [], sql = null;
  let { $version: version, $platform: platform } = req;
  let vtag = (platform == 'ios' && version > 62) || (platform == 'android' && version > 525);
  if (vtag) {
    if (receive_status && !content_id) {
      if (!business_type) return Promise.reject('请传入业务类型')
      sql = knex(`${VIDEO_TABLE} as video`)
        .select('video.content_id')
        // .select(knex.raw(`(select cover_url from ${CONTENT_TABLE} as c where c.id = video.content_id) as cover_url`))
        .countDistinct('video.id as video_num')
        .groupBy('video.content_id')

      await handler.searchFilter2(sql, query, userInfo);

      let countSql = knex(`${VIDEO_TABLE} as video`).countDistinct('video.id as count');
      await handler.searchFilter2(countSql, query, userInfo)
      response.data.count = (await countSql)[0]?.count;

    } else {
      sql = knex(`${VIDEO_TABLE} as video`)
        .select('video.id', "video.url", "video.video_cover_url as cover_url", 'video.publish_date', 'video.receive_time', 'video.content_id', 'video.source_from')
        .where(builder => {
          if (Number(response.data.site) && response.data.page > 1) {
            builder.where("video.id", "<", response.data.site);
          }
        })
      await handler.searchFilter(sql, query, userInfo);
    }
  } else {
    if (receive_status == 1 && !content_id) {
      if (!business_type) return Promise.reject('请传入业务类型')
      sql = knex(`${VIDEO_TABLE} as video`)
        .select('video.content_id')
        // .select(knex.raw(`(select cover_url from ${CONTENT_TABLE} as c where c.id = video.content_id) as cover_url`))
        .countDistinct('video.id as video_num')
        .groupBy('video.content_id')

      await handler.searchFilter2(sql, query, userInfo);

      let countSql = knex(`${VIDEO_TABLE} as video`).countDistinct('video.id as count');
      await handler.searchFilter2(countSql, query, userInfo)
      response.data.count = (await countSql)[0]?.count;

    } else {
      sql = knex(`${VIDEO_TABLE} as video`)
        .select('video.id', "video.url", "video.video_cover_url as cover_url", 'video.publish_date', 'video.receive_time', 'video.content_id', 'video.source_from')
        .where(builder => {
          if (Number(response.data.site) && response.data.page > 1) {
            builder.where("video.id", "<", response.data.site);
          }
        })
      await handler.searchFilter(sql, query, userInfo);
    }
  }

  if (response.data.page == 1) {
    response.data.site = await getTableSite(VIDEO_TABLE, "id")
  } else {
    response.data.site = Number(query.site) || 0;
  }

  // console.log(sql.toString())
  data = await sqlPagination(sql, { page: response.data.page, pagesize: response.data.pagesize });

  let contentIds = data.map(item => item.content_id);
  let contentMapper = await getContentMapper(contentIds);

  for (let i = 0; i < data.length; i++) {
    let item = data[i];
    if (item.url) {
      let oss_key = getUrlPath(item.url)
      if (item.receive_status == 1) {
        //未领取的视频，仅返回图片链接
        item.url = item.cover_url || getCoverUrl(2, oss_key, 'koc-material')
      } else {
        if (item.source_from == 0) {
          item.cover_url = getCoverUrl(2, oss_key, 'koc-material')
          item.url = getCoverUrl(3, oss_key, 'koc-material')
        }
        // item.url = item.url.replace('koc-material.domain.cn', 'koc-material.oss-cn-beijing.aliyuncs.com')
      }
    } else {
      item.url = contentMapper[item.content_id].cover_url;
      item.content_name = contentMapper[item.content_id].book_name;
      let contentData = await knex(`${CONTENT_RELATION} as r`)
        .leftJoin(`${PLATFORM_TABLE} as p`, 'p.id', 'r.platform_id')
        .leftJoin(`${ADVERTISER_TABLE} as ad`, 'ad.id', 'r.advertiser_type')
        .select('p.icon', 'p.id', 'p.name', 'p.status', 'ad.id as ad_id', 'ad.icon as ad_icon', 'ad.status as ad_status', 'ad.name as ad_name', 'ad.promotion_type')
        .where('content_id', item.content_id)
        .distinct('r.platform_id');
      item.platform_list = contentData.map(item => {
        return {
          icon: item.icon,
          id: item.id,
          status: item.status,
          name: item.name
        }
      });
      item.advertiser_list = contentData.map(item => {
        return {
          icon: item.ad_icon,
          id: item.ad_id,
          status: item.ad_status,
          name: item.ad_name,
          promotion_type: item.promotion_type
        }
      });
    }
  }
  response.data.list = data;
  if (!data.length || data.length < response.data.pagesize) {
    response.data.site = null;
    response.data.has_next_page = false;
  }
  return response;
}

async function newList(query, userInfo, req) {
  let { content_id, receive_status, business_type } = query;
  if (!receive_status) return Promise.reject('未设置领取状态');
  let response = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page) || 1,
      pagesize: Number(query.pagesize) || 20,
      site: Number(query.site) || 0,
      count: 0
    },
  }
  let data = [], sql = null, orderData = [];
  if (!content_id) {
    if (!business_type) return Promise.reject('请传入业务类型')
    sql = knex(`${VIDEO_TABLE} as video`)
      .select('video.content_id')
      .countDistinct('video.id as video_num')
      .groupBy('video.content_id')

    if (receive_status == 1) {
      sql.max('publish_date as update_time')
    } else {
      sql.max('receive_time as update_time')
    }

    await handler.searchFilter2(sql, query, userInfo);

    // 缓存排序
    let orderSql = knex(`${VIDEO_TABLE} as video`)
      .select('video.content_id')
      .groupBy('video.content_id')
      .limit(20)

    let orderQuery = {
      receive_status,
      business_type
    }
    const cacheKey = 'xgfx:origin_video:order';
    const cache = await getCustomCache(cacheKey);
    if (cache && cache.length) {
      orderData = cache;
    } else {
      await handler.searchFilter2(orderSql, orderQuery, userInfo);
      let data = await orderSql;
      await setCustomCache(data, cacheKey, 300);
      orderData = data;
    }

    let countSql = knex(`${VIDEO_TABLE} as video`).countDistinct('video.id as count');
    await handler.searchFilter2(countSql, query, userInfo)
    response.data.count = (await countSql)[0]?.count;

  } else {
    sql = knex(`${VIDEO_TABLE} as video`)
      .select('video.id', "video.url", "video.video_cover_url as video_cover_url", 'video.publish_date', 'video.receive_time', 'video.content_id', 'video.source_from', 'video.video_type as content_type')
      .where(builder => {
        if (Number(response.data.site) && response.data.page > 1) {
          builder.where("video.id", "<", response.data.site);
        }
      })
    await handler.searchFilter(sql, query, userInfo);
  }

  if (response.data.page == 1) {
    response.data.site = await getTableSite(VIDEO_TABLE, "id")
  } else {
    response.data.site = Number(query.site) || 0;
  }

  // console.log(sql.toString())
  data = await sqlPagination(sql, { page: response.data.page, pagesize: response.data.pagesize });

  let contentIds = data.map(item => item.content_id);
  let contentMapper = await getContentMapper(contentIds, ['id', 'cover_url', 'book_name', 'mime_type']);

  let contentData = await knex(`${CONTENT_RELATION} as r`)
    .select('r.content_id')
    .leftJoin(`${PLATFORM_TABLE} as p`, 'p.id', 'r.platform_id')
    .leftJoin(`${ADVERTISER_TABLE} as ad`, 'ad.id', 'r.advertiser_type')
    .select(knex.raw(`group_concat(DISTINCT p.id) as platform_ids`))
    .select(knex.raw(`group_concat(ad.id) as ad_ids`))
    // .select('p.icon', 'p.id', 'p.name', 'p.status', 'ad.id as ad_id', 'ad.icon as ad_icon', 'ad.status as ad_status', 'ad.name as ad_name', 'ad.promotion_type')
    .whereIn('r.content_id', contentIds)
    .groupBy('r.content_id')
  // .distinct('r.platform_id');

  let contentRelationMapper = {};
  contentData.forEach(item => {
    contentRelationMapper[item.content_id] = item;
  })

  let advertiserMapper = [], platformMapper = [], mimeTypeMapper = [];
  if (!content_id) {
    advertiserMapper = await getAdvertiserMapper(userInfo), platformMapper = await getPlatformMapper(userInfo), mimeTypeMapper = await getMineTypeMapper(userInfo);
  }

  for (let i = 0; i < data.length; i++) {
    let item = data[i];
    item.content_cover_url = contentMapper[item.content_id].cover_url;
    item.content_name = contentMapper[item.content_id].book_name;
    item.mime_type = contentMapper[item.content_id].mime_type;
    if (!content_id) {
      item.mime_type = mimeTypeMapper[item.mime_type]?.name || '';
      item.platform_ids = contentRelationMapper[item.content_id]?.platform_ids?.split(',') || [];
      item.ad_ids = contentRelationMapper[item.content_id]?.ad_ids?.split(',') || [];
      item.platform_list = item.platform_ids.map(item => {
        return {
          icon: platformMapper[item].icon,
          id: +item,
          name: platformMapper[item].name,
        }
      });
      item.advertiser_list = item.ad_ids.map(item => {
        let promotion_type = advertiserMapper[item].promotion_type;
        if (promotion_type.includes(1)) {
          promotion_type = 1
        } else {
          promotion_type = 2;
        }
        return {
          icon: advertiserMapper[item].icon,
          id: +item,
          name: advertiserMapper[item].name,
          promotion_type
        }
      });
      // if (item.advertiser_list[0]?.promotion_type == 1) {
        item.icon_list = item.advertiser_list;
      // } else {
        // item.icon_list = item.platform_list
      // }
      delete item.ad_ids;
      delete item.platform_ids;
      let index = orderData.findIndex(ele => item.content_id == ele.content_id);
      if (index != -1) item.order = index + 1;

      if(item.update_time) {
        item.update_time = moment(item.update_time).format('YYYY-MM-DD');
      }
    } else {
      if (item.source_from == 0) {
        let oss_key = getUrlPath(item.url)
        item.video_cover_url = getCoverUrl(2, oss_key, 'koc-material');
      }
    }
    delete item.url

  }
  response.data.list = data;
  if (!data.length || data.length < response.data.pagesize) {
    response.data.site = null;
    response.data.has_next_page = false;
  }
  return response;
}

async function receiveVideo(body, userInfo) {
  let logTag = 6225;
  let { id } = body;
  if (!id) return Promise.reject("未设置领取的视频ID！");
  let oldData = await knex(VIDEO_TABLE).select('id', 'receive_status', 'url', 'source_from', 'size').where({ oem_id: userInfo.oem_id, receive_status: 1, publish_status: 2, status: 1, id });
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
      receive_date: moment().format('YYYY-MM-DD')
    }
    success = await trx(VIDEO_TABLE).update(updateData).where('id', id);
    await insertLog(trx, getLogData(id, logTag, updateData, userInfo, { receive_status: oldData[0].receive_status }));
    success = oldData;
    success.forEach(item => {
      item.size = lodash.floor(lodash.divide(item.size, lodash.multiply(1080 * 1080)), 2);
      item.unit = 'M'
      if (item.source_from == 0) {
        let oss_key = getUrlPath(item.url)
        item.url = getCoverUrl(3, oss_key, 'koc-material');
      }
      // item.url = item.url.replace('koc-material.domain.cn', 'koc-material.oss-cn-beijing.aliyuncs.com')
      delete item.receive_status;
    })
  });
  return {
    code: 0,
    data: {
      success: success[0],
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
  let { limit_num, vip_data_id, day_num, tool_equity_type } = await queryEquity({ diff_type: 'recept_video' }, userInfo);
  let today = moment().format('YYYY-MM-DD');
  let dayNum = (await knex(VIDEO_TABLE).count('id as count').where({ receive_user_id: userInfo.id, receive_date: today, oem_id: userInfo.oem_id }))[0].count;
  let mixed_shear = 0;
  if (tool_equity_type && tool_equity_type.mixed_shear) {
    mixed_shear = tool_equity_type.mixed_shear
  }
  return {
    code: 0,
    data: {
      original_day_total: day_num || 0,
      original_day_used: dayNum || 0,
      original_day_remain: lodash.subtract(day_num, dayNum) || 0,
      original_total: limit_num || 0,
      production_day_total: mixed_shear,
      production_day_used: 0,
      production_total: 0,
      production_day_remain: lodash.subtract(mixed_shear, 0),
    }
  }
}

async function queryDownlist(query, userInfo) {
  if (!query.business_type) return Promise.reject('请传入业务分类')
  let data = {};
  const cacheKey = 'xgfx:origin_video:query_downlist';
  const cache = await getCustomCache(cacheKey);
  if (cache) {
    data = cache;
  } else {
    // 内容平台
    const platform = await knex(PLATFORM_TABLE)
      .select("id as value", "name as label")
      .where({ oem_id: userInfo.oem_id, status: 1 })
      .whereIn('id', [1, 2, 4]);

    platform.forEach(item => {
      item.children = [];
    })

    const ads = await knex(ADVERTISER_TABLE).select('id as value', 'name as label', 'promotion_type', 'platform_id').where({ status: 1, is_test: 1, oem_id: userInfo.oem_id });

    let keywordAd = [], appletAd = [];
    ads.forEach(v => {
      const types = JSON.parse(v.promotion_type || '[]');
      if (types.includes(RelationType.Alias)) {
        keywordAd.push(v);
      }
      if (types.includes(RelationType.Mount) || types.includes(RelationType.AppletPlan)) {
        appletAd.push(v);
      }
    })

    appletAd.forEach(item => {
      platform.forEach(p => {
        if (item.platform_id == p.value) {
          p.children.push({
            value: item.value,
            label: item.label
          })
        }
      })
    })

    keywordAd.forEach(item => {
      platform.push({
        value: item.value,
        label: item.label,
        children: [{ value: item.value, label: '全部内容' }]
      })
    })

    data.content_platform = platform;

    // 频道
    data.audience_type = [{
      // value: 'MALE',
      value: 1,
      label: "男频"
    },
    {
      // value: "FEMALE",
      value: 2,
      label: "女频",
    }, {
      // value: "ALL",
      value: 3,
      label: "通用"
    }]

    // 篇幅
    data.length_type = [{
      // value: "LONG",
      value: 1,
      label: "长篇"
    },
    {
      // value: "SHORT",
      value: 2,
      label: "短篇"
    }]

    await setCustomCache(data, cacheKey, 600);
  }


   // 作品类型
   let contentType = await knex(VIDEO_TYPE_TAG).select('id as value', 'name as label').where('status', 1).andWhere('business_type', query.business_type);
   data.content_type = contentType;

  return {
    code: 0,
    data
  }
}

async function platformCotent(query, userInfo) {
  let { content_id, platform_id } = query;
  if (!content_id || !platform_id) return Promise.reject("请检查必填参数！")
  let data = await knex(CONTENT_RELATION).select('advertiser_type as value')
    .where({ oem_id: userInfo.oem_id, content_id, platform_id, status: 1 })
    .where(builder => {if (userInfo.account_type != 3) builder.where("is_test", 1)})
    .whereNot("relat_type", RelationType.AppletPlan); // #TEMP 移动端兼容

  const advertiserMapper = await getAdvertiserMapper(userInfo), platformMapper = await getPlatformMapper(userInfo);
  data.forEach(item => {
    item.label = advertiserMapper[item.value]?.name;
    item.icon = advertiserMapper[item.value]?.icon;
  })

  if (!data.length) {
    return Promise.reject(`该内容暂不支持${platformMapper[platform_id].name}平台推广`);
  }
  return {
    code: 0,
    data
  }
}

const handler = {
  async searchFilter(sql, query, userInfo) {
    let orderProp = 'publish_date';

    if (query.receive_status == 2) {
      orderProp = 'receive_time';
      sql.where('video.receive_user_id', userInfo.id)
    }
    sql.orderBy(orderProp, 'desc').orderBy('video.id', 'desc')

    if (query.receive_status) {
      sql.where("video.receive_status", Number(query.receive_status));
      if (query.receive_status == 2) {
        let start_date = moment().subtract(30, 'days').format('YYYY-MM-DD');
        let end_date = moment().format('YYYY-MM-DD');
        sql.whereIn("video.receive_date", getDaysBetweenDate(start_date, end_date))
      }
    }

    if (query.start_date && query.end_date) {
      sql.whereIn("video.create_date", getDaysBetweenDate(query.start_date, query.end_date))
    }

    if (query.content_id) {
      sql.where('video.content_id', query.content_id);
    }

    if (query.business_type || query.receive_status == 1) {
      sql.leftJoin(`${CONTENT_RELATION} as r`, 'r.content_id', 'video.content_id').groupBy('video.id')
      if (query.business_type) {
        let allAd = await knex(ADVERTISER_TABLE).select('id').where({ 'business_type': query.business_type, status: 1, oem_id: userInfo.oem_id });
        let advertiserIds = allAd.map(item => item.id);
        sql.whereIn('advertiser_type', advertiserIds)
      }
      if (query.receive_status == 1) {
        sql.where({ 'r.is_test': 1, 'r.status': 1 })
      }
    }
    if (Number(query.content_type)) {
      sql.where("video.video_type", query.content_type)
    }

    if (query.advertiser_type) {
      sql.where('advertiser_type', query.advertiser_type)
    }

    sql.where({
      'video.oem_id': userInfo.oem_id,
      'video.status': 1,
      "video.publish_status": 2
    })
  },
  async searchFilter2(sql, query, userInfo) {
    if (query.receive_status) {
      sql.where("video.receive_status", Number(query.receive_status));
      if (query.receive_status == 2) {
        let start_date = moment().subtract(30, 'days').format('YYYY-MM-DD');
        let end_date = moment().format('YYYY-MM-DD');
        sql.whereIn("video.receive_date", getDaysBetweenDate(start_date, end_date)).where('receive_user_id', userInfo.id);
      }
    }
    if (query.business_type) {
      let allAd = await knex(ADVERTISER_TABLE).select('id').where({ 'business_type': query.business_type, status: 1, oem_id: userInfo.oem_id }).where(builder => {
        if (query.content_platform) {
          let ids = query.content_platform.split(',') || [];
          builder.whereIn('id', ids);
        }
      });
      let advertiserIds = allAd.map(item => item.id);
      sql.leftJoin(`${CONTENT_RELATION} as r`, 'r.content_id', 'video.content_id')
        .leftJoin(`${CONTENT_TABLE} as c`, 'c.id', 'r.content_id')
        .where({ 'r.status': 1, 'c.status': 1, 'c.verify_status': 3, 'c.invalid_status': 0 })
        .orderBy('c.video_order', 'desc')
        .orderBy('c.id', 'desc')
        .whereIn('advertiser_type', advertiserIds)

      if (query?.receive_status == 1) {
        sql.where('r.is_test', 1);
      }
      if (Number(query.content_type)) {
        sql.where('video.video_type', query.content_type)
      }
      if (query.audience_type) {
        let audience_type = '';
        if (query.audience_type == 1) {
          audience_type = '男频'
        } else if (query.audience_type == 2) {
          audience_type = '女频'
        } else if (query.audience_type == 3) {
          audience_type = '通用'
        }
        if (audience_type) sql.where('c.audience_type', audience_type)
      }
      if (query.length_type) {
        if (query.length_type == 1) {
          sql.where('c.length_type', "LONG")
        } else if (query.length_type == 2) {
          sql.where('c.length_type', "SHORT")
        }
      }
      if (query.keyword) {
        sql.where('c.book_name', 'like', `${query.keyword}%`)
      }
    }
    sql.where({
      'video.oem_id': userInfo.oem_id,
      'video.status': 1,
      "video.publish_status": 2
    })
    // sql.whereIn('publish_date', ['2023-09-27', '2023-10-20'])
  },
  async checkReceiveAuth(userInfo, trx) {
    let { day_num } = await operateEquity({ diff_type: 'recept_video', times: 1, account_id: userInfo.id }, 'diff', userInfo, trx);  // 领取时使用 diffEquity, 查询时使用queryEquity
    if (!day_num) return Promise.reject('未获取到会员视频领取配置，请联系管理员')
    let today = moment().format('YYYY-MM-DD');
    let dayNum = (await knex(VIDEO_TABLE).count('id as count').where({ receive_user_id: userInfo.id, receive_date: today, oem_id: userInfo.oem_id }))[0].count;
    if (dayNum >= day_num) return Promise.reject('今日视频领取个数已到上限，明日再来！')
  }
};

async function batchDownload(body, userInfo) {
  let ids = body.ids;
  if (!Array.isArray(ids) || !ids.length) return Promise.reject("未设置下载的视频D！");
  if (ids.length > 1) return Promise.reject('仅支持一个视频进行下载，请重新选择！')
  let data = await knex(VIDEO_TABLE).select('id', 'status', 'url', 'size', 'source_from', 'download_times', 'last_download_date').whereIn('id', ids).where({ oem_id: userInfo.oem_id, receive_user_id: userInfo.id });
  if (!data.length) return Promise.reject('未检测到该视频，请检查');
  let downloadData = [], today = moment().format('YYYY-MM-DD'), unable_ids = [];
  data.forEach(item => {
    item.size = lodash.floor(lodash.divide(item.size, lodash.multiply(1080 * 1080)), 2);
    item.unit = 'M';
    if (item.source_from == 0) {
      let oss_key = getUrlPath(item.url)
      item.url = getCoverUrl(3, oss_key, 'koc-material');
    }
    if (item?.last_download_date == today) {
      if(item.download_times < 3) { // 今日领取次数小于3，可继续领取
        downloadData.push(item);
      } else {
        unable_ids.push(item.id); // 今日领取次数大于3，不可领取
      }
    } else { // 今日没有领取过，可领取
      downloadData.push(item);
    }
  })

  if(unable_ids.length) {
    return {
      code: 1,
      message: '该视频今日下载次数已用完，请明日再来'
    }
  } else {
    return {
      code: 0,
      data: downloadData,
    };
  }

}

async function videoType(query, userInfo) {
  let { content_id, receive_status } = query;
  if (!content_id) return Promise.reject('请传入内容id');
  if (!receive_status) return Promise.reject('请传入领取状态')
  let data = await knex(`${VIDEO_TABLE} as tag`).select('video_type as value')
      .where({ content_id, oem_id: userInfo.oem_id }).distinct('video_type')
      .select(selectName('tag', "video_type", VIDEO_TYPE_TAG, "name", "label"))
      .where(builder => {
        if (receive_status == 1) {
          builder.where('receive_status', 1)
        } else {
          builder.where('receive_user_id', userInfo.id)
        }
      })
      .whereNotNull('video_type')
  data.forEach(item => {
    delete item.video_type
  });

  if (data.length) {
    data.unshift({
      value: 0,
      label: '全部'
    })
  }
  return {
    code: 0,
    data
  }
}

async function updateDownloadTimes(body, userInfo) {
  let { ids } = body;
  let logTag = 6226, today = moment().format('YYYY-MM-DD');
  if (!Array.isArray(ids) || !ids.length) return Promise.reject("未设置下载的视频D！");
  let data = await knex(VIDEO_TABLE).select('id', 'download_times', 'last_download_date').whereIn('id', ids).where({ oem_id: userInfo.oem_id, receive_user_id: userInfo.id });
  if (!data.length) return Promise.reject('未检测到该组视频，请检查');
  await knexTransaction(async (trx) => {
    ids = data.map(item => item.id);
    for(let i = 0; i < data.length; i++) {
      let item = data[i];
      let updateData = {
        update_user_id: userInfo.id
      };
      if (item.last_download_date == today) {
        updateData.download_times = item.download_times + 1;
      } else {
        updateData.download_times = 1;
        updateData.last_download_date = today;
      }
      await knex(VIDEO_TABLE).update(updateData).where('id', item.id);
      logs = getLogData(
        item.id,
        logTag,
        updateData,
        userInfo,
        item
      );
    }
    await insertLog(trx, logs);
  })
  return {
    code: 0,
    data: ids
  }
}

module.exports = {
  list,
  newList,
  receiveVideo,
  deleteVideo,
  getVideoConfig,
  queryDownlist,
  platformCotent,
  batchDownload,
  videoType,
  updateDownloadTimes
};
