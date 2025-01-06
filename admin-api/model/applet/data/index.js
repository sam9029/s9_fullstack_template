const knex = require('../../../db/knexManager').knexProxy;
const { DATA_TABLE, DATA_SPLIT } = require('../../../config/setting');
const moment = require("moment");
const { getChildrenByPermission } = require("../../public/permission");
const { getDaysBetweenDate } = require("../../../utils/tools")
const { getAccountType } = require("../../public/operationLog")
const { has_prm_advertiser: SHOW_ADV_TYPES } = require('../../../config/index');
// 账户概览
async function overview(query, userInfo, tag = false) {
  let { id: account_id } = userInfo, retu = {};
  let account_type = await getAccountType(account_id)
  if (account_type != 1 && account_type != 2) return { code: 0, data: {} }

  let data = (await knex(`${DATA_SPLIT} as dsp`)
    .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dsp.data_id')
    .where('dat.status', 1)
    .select(knex.raw(`SUM(IF(dsp.payment_date IS NOT NULL, dsp.total_price, 0)) as paid_income`)) //已付款收益
    .select(knex.raw(`SUM(IF(dsp.payment_date IS NULL, dsp.total_price, 0)) as unpaid_income`)) //未付款收益
    .select(knex.raw(`SUM(dsp.total_price) as total_income`)) //总收益
    .where('dsp.account_id', account_id)
    .where(builder => {
      if (tag && query.start_date && query.end_date) builder.whereIn('dsp.date', getDaysBetweenDate(query.start_date, query.end_date))
    }))[0]

  retu = {
    code: 0,
    total_income: data.total_income || 0,
    paid_income: data.paid_income || 0,
    unpaid_income: data.unpaid_income || 0
  }
  if (tag) retu.account_type = account_type;
  return retu;
}

// 收益列表
async function summaryList(query, userInfo) {
  //  TODO:判断是否报价
  let { id: account_id } = userInfo;
  let account_type = await getAccountType(account_id)
  let list = []

  if (account_type == 1 || account_type == 2) { // 博主 或 投顾
    let new_date_sql = `(SELECT CONCAT_WS('~', MIN(ds.date), MAX(ds.date)) FROM ${DATA_SPLIT} as ds where ds.import_log_id = MAX(dsp.import_log_id) AND ds.account_id = ${account_id} AND ds.advertiser_type = dsp.advertiser_type)`
    list = await knex(`${DATA_SPLIT} as dsp`)
      .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dsp.data_id')
      .where('dat.status', 1)
      .select(knex.raw(`sum(dsp.total_price) as total_income`))
      // .select(knex.raw(`MAX(dsp.date) as new_income_date`))
      .select(knex.raw(`IF(dsp.advertiser_type = 7, ${new_date_sql}, MAX(dsp.date)) as new_income_date`))
      .select(knex.raw(`(SELECT SUM(ds.total_price) FROM ${DATA_SPLIT} as ds where IF(dsp.advertiser_type = 7, ds.import_log_id = MAX(dsp.import_log_id), ds.date = MAX(dsp.date)) AND ds.account_id = ${account_id} AND ds.advertiser_type = dsp.advertiser_type) as new_income`)) //最新收益
      .select('dsp.advertiser_type')
      .groupBy('dsp.advertiser_type')
      .orderBy('dsp.advertiser_type')
      .where({
        "dsp.account_id": account_id,
        "dsp.oem_id": userInfo.oem_id,
      })
      .whereIn('dsp.advertiser_type', SHOW_ADV_TYPES)
  } else if (account_type == 3) {
    let account_ids = await getChildrenByPermission(userInfo, [], false) //获取当前查询者的成员
    let new_data_sql = knex.select(knex.raw('SUM(IF(dst.settle_type = 1, dst.settle_num, 0))'))
      .from(`${DATA_SPLIT} as dst`)
      .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dst.data_id').where('dat.status', 1)
      .whereRaw('IF(dsp.advertiser_type = 7, dst.import_log_id = MAX(dsp.import_log_id), dst.date = MAX(dsp.date)) AND dst.advertiser_type = dsp.advertiser_type')
    if (account_ids) new_data_sql.whereIn('dst.account_id', account_ids)
    new_data_sql = new_data_sql.toString()
    let new_date_sql = knex.select(knex.raw(`CONCAT_WS('~', MIN(dst.date), MAX(dst.date))`))
      .from(`${DATA_SPLIT} as dst`)
      .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dst.data_id').where('dat.status', 1)
      .whereRaw('dst.import_log_id = MAX(dsp.import_log_id) AND dst.advertiser_type = dsp.advertiser_type')
    if (account_ids) new_date_sql.whereIn('dst.account_id', account_ids)
    new_date_sql = new_date_sql.toString()
    list = await knex(`${DATA_SPLIT} as dsp`)
      .leftJoin(`${DATA_TABLE} as dat`, 'dat.id', 'dsp.data_id')
      .where('dat.status', 1)
      .select(knex.raw(`IF(dsp.advertiser_type = 7, (${new_date_sql}), MAX(dsp.date)) as new_income_date`))
      .select(knex.raw(`SUM(IF(dsp.settle_type = 1, dsp.settle_num, 0)) as total_settle_num`))
      .select(knex.raw(`(${new_data_sql}) as new_total_settle_num`))
      .select('dsp.advertiser_type')
      .groupBy('dsp.advertiser_type')
      .orderBy('dsp.advertiser_type')
      .whereIn('dsp.advertiser_type', SHOW_ADV_TYPES)
      .where(builder => {
        if (account_ids) builder.whereIn('dsp.account_id', account_ids)
      })
  }
  return {
    code: 0,
    list,
    account_type
  }
}

// 收益趋势
async function incomeTrend(query, userInfo) {
  let date_type = query.date_type || 'day', start_date, end_date, list = [], formatValue = '%Y-%m-%d';
  if (date_type == 'day') {
    start_date = query.start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
    end_date = query.end_date || moment().format('YYYY-MM-DD');
  } else if (date_type == 'month') {
    formatValue = '%Y-%m'
    start_date = query.start_date || moment().subtract(5, 'months').format('YYYY-MM-DD');
    end_date = query.end_date || moment().format('YYYY-MM-DD');
  } else if (date_type == 'year') {
    formatValue = '%Y'
    start_date = query.start_date || moment().subtract(5, 'years').format('YYYY-MM-DD');
    end_date = query.end_date || moment().format('YYYY-MM-DD');
  }
  let { id: account_id } = userInfo;
  let days = getDaysBetweenDate(start_date, end_date);
  let data = await knex.select(knex.raw(`DATE_FORMAT(date,'${formatValue}') as date`))
    .sum('total_price as total_income')
    .from(DATA_SPLIT)
    .whereIn('date', days)
    .where('account_id', account_id)
    .whereIn('advertiser_type', SHOW_ADV_TYPES)
    .groupByRaw(`DATE_FORMAT(date,'${formatValue}')`)
    .orderByRaw(`DATE_FORMAT(date,'${formatValue}') asc`)

  // 无收益的补0并排序
  days.forEach(item => {
    if (date_type == 'day') {
      let index = data.findIndex(i => i.date == item);
      if (index == -1) {
        data.push({
          date: item,
          total_income: 0
        })
      }
    } else {
      let tag = date_type == 'month' ? 'YYYY-MM' : 'YYYY';
      item = moment(item).format(tag)
      let index = data.findIndex(i => i.date == item);
      if (index == -1) {
        data.push({
          date: item,
          total_income: 0
        })
      }
    }
  })
  data.sort(function (m, n) {
    let a = m['date'], b = n['date'];
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  })


  return {
    code: 0,
    list: data
  }
}

// 收益分布
async function incomeDistribution(query, userInfo) {
  let { start_date, end_date } = query, { id: account_id } = userInfo;
  let totalData = await overview(query, userInfo, true);
  let details = await knex(DATA_SPLIT)
    .select('advertiser_type')
    .sum('total_price as total_income')
    .where('account_id', account_id)
    .andWhere('oem_id', userInfo.oem_id)
    .groupBy('advertiser_type')
    .andWhere(builder => {
      if (query.start_date && query.end_date) {
        builder.whereIn('date', getDaysBetweenDate(start_date, end_date));
      }
    })
    .whereIn('advertiser_type', SHOW_ADV_TYPES)
  return {
    code: 0,
    totalData: totalData.total_income,
    details: details
  }
}

module.exports = {
  overview,
  summaryList,
  incomeTrend,
  incomeDistribution
}
