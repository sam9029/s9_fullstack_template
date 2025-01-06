const moment = require("moment");
const lodash = require("lodash");
const knex = require("../../../db/knexManager").knexProxy;
const {
  XINGTU_TASK, ADVERTISER_TABLE, XINGTU_TASK_URL, PLATFORM_ACCOUNT_TABLE, PLATFORM_TABLE, XINGTU_SETTLE, BUSINESS_TYPE_TABLE, XINGTU_TASK_DATA
} = require("../../../config/setting");
const { knexTransaction, selectName, factoryAppListResponse, renderPrice } = require("../../../utils/tools");
const { checkKeys } = require("../../../utils/check_type");
// const { advertiser_mapper, content_sources } = require("../../../utils/redisCache");
const { sqlPagination, queryIfWhere, queryLikeWhere } = require("../../../utils/sqlHelper");
const { BUDGET_LEVEL, XT_PAY_TYPE_MAPPER } = require("../../../enum/popularize");
const { getUuid } = require('../../../utils/tools')
const { get_challenge_url } = require('../../oauth/xingtu/task')
const { getCustomCache, setCustomCache, useCustomCache } = require("../../../db/redis")
const { RK_XINGTU_TASK_COUNT } = require("../../../config/redis_key");

const list_cols = ["id", "advertiser_type", "demand_name", "import_name", "demand_icon", "expiration_time", "expiration_time_end", "video_type", "blogger_price", "blogger_commission_rate", "total_budget", "pay_type", "edit_max_income", "edit_join_people", "max_income"];

async function list(query, userinfo) {
  const app_res = await factoryAppListResponse(query, XINGTU_TASK);
  const response = app_res.data;
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  const knex_sql = knex(`${XINGTU_TASK} as task`)
    .select(...list_cols.map(v => "task." + v))
    .where({
      "task.status": 1,
      "task.verify_status": 3,
      "task.mcn_join_status": "JOINED",
    })
    .where(builder => {
      if (response.site && response.page > 1) {
        builder.where("task.id", "<=", response.site)
      }
    })
    // .andWhere('expiration_time', '<=', now)
    .andWhere('expiration_time_end', '>', now)
  // .orderBy("task.id", "desc");
  response.total = await useCustomCache(RK_XINGTU_TASK_COUNT, async () => {
    let count = (await knex(`${XINGTU_TASK} as task`).count('task.id as count').where({ "task.status": 1, "task.verify_status": 3, "task.mcn_join_status": "JOINED", }))[0]
    return count?.count || 0
  })
  handler.search_filter(knex_sql, query, userinfo);

  response.list = await sqlPagination(knex_sql, response)
    // .select(selectName("task", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_name"))
    // .select(selectName("task", "advertiser_type", ADVERTISER_TABLE, "icon", "advertiser_icon"))
    .select(knex.raw(
      `(SELECT COUNT(DISTINCT p.account_id) FROM ${XINGTU_TASK_URL} p WHERE p.demand_id = task.id) as join_num`
    ));

  handler.format_value(response.list);

  response.list.forEach(v => {
    v.max_income = Math.max(v.edit_max_income, v.max_income);
    v.join_num = Math.max(v.join_num, v.edit_join_people);
    v.demand_name = v.import_name || v.demand_name;
    // v.expiration_date = moment(v.expiration_time).format('YYYY/MM/DD');
    // v.expiration_date_end = moment(v.expiration_time_end).format('YYYY/MM/DD');
  })

  return app_res;
}


async function my_task(query, userinfo) {
  const app_res = await factoryAppListResponse(query, XINGTU_TASK_URL);
  const response = app_res.data;

  const knex_sql = knex(`${XINGTU_TASK_URL} as acc`)
    .leftJoin(`${XINGTU_TASK} as task`, "task.id", "acc.demand_id")
    .where({
      "task.status": 1,
      "task.verify_status": 3,
      "task.mcn_join_status": "JOINED",
      "acc.account_id": userinfo.id
    })
    .select(...list_cols.map(v => "task." + v))
    .groupBy("task.id");

  handler.search_filter(knex_sql, query, userinfo);

  response.list = await sqlPagination(knex_sql, response)
    // .select(selectName("task", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_name"))
    // .select(selectName("task", "advertiser_type", ADVERTISER_TABLE, "icon", "advertiser_icon"))
    .select(knex.raw(
      `(SELECT COUNT(DISTINCT d.item_id) FROM ${XINGTU_TASK_DATA} d WHERE d.demand_id = task.id and d.account_id = ${userinfo.id} ) as join_num` // 直播频次 / 投稿量
    ))
    .select(knex.raw(
      `(SELECT sum(s.author_amount) FROM ${XINGTU_SETTLE} s left join ${XINGTU_TASK_DATA} data on data.id = s.xingtu_task_data_id WHERE s.account_id = ${userinfo.id} and data.demand_id = task.id) as my_income`
    ));

  handler.format_value(response.list);

  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  response.list.forEach(v => {
    v.my_income = v.my_income || 0;
    v.expiration_date = moment(v.expiration_time).format('YYYY/MM/DD');
    v.expiration_date_end = moment(v.expiration_time_end).format('YYYY/MM/DD');
    v.task_status = 'ONLINE'
    if (v.expiration_time_end <= now) {
      v.task_status = 'ENDED'
    }
    v.demand_name = v.import_name || v.demand_name;
  })

  return app_res;
}

async function join(body, userinfo) {
  const data = checkKeys(body, ["id"]);
  let info = (await knex(XINGTU_TASK).select('star_id').where({ id: data.id, status: 1, verify_status: 3, mcn_join_status: "JOINED" }).limit(1))[0];
  if (!info) return Promise.reject('该任务不可参与，请检查！');

  let taskInfo = (await knex(XINGTU_TASK_URL).select('id', 'uid').where({ account_id: userinfo.id, demand_id: data.id }).limit(1))[0];
  let uuid = null;
  if (taskInfo) {
    uuid = taskInfo.uid;
  } else {
    uuid = getUuid().toLocaleUpperCase();
  }
  let result = await get_challenge_url(info.star_id, data.id, uuid);
  if (result?.task_url) {
    await knex(XINGTU_TASK_URL).insert({
      account_id: userinfo.id,
      star_id: info.star_id,
      demand_id: body.id,
      create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      update_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      update_user_id: userinfo.id,
      uid: uuid,
      task_url: result.task_url,
      oem_id: userinfo.oem_id
    }).onConflict(['account_id', 'star_id', 'demand_id']).merge();

    return {
      code: 0,
      data: {
        task_url: result.task_url,
        schema_url: `snssdk1128://webview?url=${encodeURIComponent(result.task_url)}&from=webview&refer=web`
      }
    }
  } else {
    return {
      code: 1,
      messge: '参与失败'
    }
  }
}

async function pullDownList(query, userinfo) {
  const videoTypeList = [
    { value: 0, label: '全部' },
    { value: 6, label: "抖音短视频" },
    { value: 55, label: "抖音直播" }
  ],
    payTypeList = [
      { value: 0, label: "全部" },
      { value: 3, label: "按转化结算" },
      { value: 14, label: "按付费分拥结算" },
    ],
    timeList = [
      { value: 0, label: "所有上新时间" },
      { value: 1, label: "近1日" },
      { value: 3, label: "近3日" },
      { value: 7, label: "近7日" }
    ];
  const cacheKey = 'xgfx:xingtu:advertiser_list';
  const cache = await getCustomCache(cacheKey);
  let advertiserList = [];
  if (cache && cache.length) {
    advertiserList = cache;
  } else {
    let advertiser = await knex(`${ADVERTISER_TABLE} as ad`).select('ad.id as value', 'ad.name as label', 'ad.business_type')
      .where({ status: 1, is_test: 1, oem_id: 1 })
      .whereRaw(`JSON_CONTAINS(ad.promotion_type, JSON_ARRAY(5))`)
      .select(selectName("ad", "business_type", BUSINESS_TYPE_TABLE, "name", "business_type_name"));

    let groupData = lodash.groupBy(advertiser, 'business_type');
    for (let i in groupData) {
      let item = groupData[i];
      advertiserList.push({
        value: item[0].business_type,
        label: item[0].business_type_name,
        children: item
      })
    }
    await setCustomCache(advertiserList, cacheKey, 600);
  }

  return {
    code: 0,
    data: {
      advertiserList,
      videoTypeList,
      payTypeList,
      timeList
    }
  }
}

async function taskDetails(query, userinfo) {
  const data = checkKeys(query, ["id"]);
  const app_res = await factoryAppListResponse(query, XINGTU_TASK_DATA);
  const response = app_res.data;
  const knex_sql = knex(`${XINGTU_TASK_DATA} as data`)
    .select('item_id', 'publish_time', 'author_id', 'author_name', 'ios_convert_count', 'android_convert_count', 'share_price')
    .where(builder => {
      if (response.site && response.page > 1) {
        builder.where("data.id", "<=", response.site)
      }
    })
    .where({ demand_id: data.id, account_id: userinfo.id })

  response.list = await sqlPagination(knex_sql, response);

  response.list.forEach(item => {
    item.convert_count = lodash.add(item.ios_convert_count, item.android_convert_count);
    item.publish_time = moment(item.publish_time).format('YYYY-MM-DD');
  })

  response.content = '星图任务达人结算均在抖音星图平台进行，具体以星图结算规则为准。'

  let task_info = await knex(`${XINGTU_TASK} as task`).select(list_cols).where('id', data.id);
  handler.format_value(task_info);
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  task_info.forEach(v => {
    v.max_income = Math.max(v.edit_max_income, v.max_income);
    v.expiration_date = moment(v.expiration_time).format('YYYY/MM/DD');
    v.expiration_date_end = moment(v.expiration_time_end).format('YYYY/MM/DD');
    v.task_status = 'ONLINE'
    if (v.expiration_time_end <= now) {
      v.task_status = 'ENDED'
    }
    v.demand_name = v.import_name || v.demand_name;
  })
  response.task_info = task_info;


  return app_res;
}

const handler = {
  search_filter(knex_sql, query, userinfo) {
    queryIfWhere(knex_sql, "task.advertiser_type", query.advertiser_type);

    queryIfWhere(knex_sql, "task.video_type", query.video_type);

    queryIfWhere(knex_sql, "task.pay_type", query.pay_type);

    queryLikeWhere(knex_sql, ["task.demand_name"], query.keyword);

    if (Number(query?.time)) {
      let endDay = moment().format('YYYY-MM-DD');
      let startDay = moment().subtract(Number(query.time), 'days').format('YYYY-MM-DD');
      knex_sql.where('mcn_join_time', '>=', `${startDay} 00:00:00`).andWhere('mcn_join_time', '<=', `${endDay} 23:59:59`)
    }
    if (query.order_type) {
      if (query.order_type == 'time') {
        knex_sql.orderBy('mcn_join_time', 'desc')
      } else if (query.order_type == 'income') {
        knex_sql.orderBy('max_income', 'desc')
      }
    } else {
      knex_sql.orderBy('task.sort', 'desc')
    }
    if (query.advertiser_types && query.advertiser_types.length) {
      knex_sql.whereIn('task.advertiser_type', query.advertiser_types)
    }
  },

  format_value(list) {
    list.forEach(v => {
      // 结算方式文案
      if ([3, 4, 9].includes(v.pay_type)) {
        v.pay_type_value = v.blogger_price;
        v.pay_type_unit = '元'
        if (v.pay_type == 4) {
          v.pay_type_unit = '元/cpm'
        }
      } else if ([8, 11, 14].includes(v.pay_type)) {
        v.pay_type_value = v.blogger_commission_rate;
        v.pay_type_unit = '%'
      }

      // 预算量级文案
      let budget_level = 'UN_LIMIT';
      if (v.total_budget < 100000000) {
        budget_level = 'ONE_HUNDRED_THOUSAND'; // 十万级别
      } else if (v.total_budget >= 100000000 && v.total_budget < 1000000000) {
        budget_level = 'MILLION'; // 百万
      } else if (v.total_budget >= 1000000000) {
        budget_level = 'TEN_MILLION'
      }
      v.budget_level_name = BUDGET_LEVEL[budget_level] || "";
      v.pay_type_name = XT_PAY_TYPE_MAPPER[v.pay_type] || "";

    })
  }
}

module.exports = {
  list,
  my_task,
  join,
  pullDownList,
  taskDetails
}