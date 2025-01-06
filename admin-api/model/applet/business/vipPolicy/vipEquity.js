const knex = require("../../../../db/knexManager").knexProxy;
const {
  VIP_CARD,
  ACCOUNT_TABLE,
  VIP_LEVEL,
  VIP_TYPE,
  REBATE_POLICY,
  REBATE_POLICY_COMMISSION,
  PAYMENT_ORDERS,
  ACTINFO_TABLE,
  VIP_DATA,
} = require("../../../../config/setting");
const {
  knexTransaction,
  selectName,
  getDaysBetweenDate,
} = require("../../../../utils/tools");
const { getPermission } = require("../../../public/permission");
const { insertLog, getLogData } = require("../../../public/operationLog");
const moment = require("moment");
const { floor, divide, cloneDeep } = require("lodash");
const {
  setSession,
  setCustomCache,
  getCustomCache,
  delCustomCache,
} = require("../../../../db/redis");
const {
  getTableSite,
  sqlPagination,
  sqlCount,
} = require("../../../../utils/sqlHelper");

async function total(query, userInfo) {
  let date = moment().format("YYYY-MM-DD HH:mm:ss");
  let sql = knex
    .count("vip_data.id as recharge_num")
    .from(`${VIP_DATA} as vip_data`)
    .where({
      "vip_data.vip_card_type": 2,
      "vip_data.account_id": userInfo.id,
      "vip_data.oem_id": userInfo.oem_id,
    });
  let data = (await sql)[0];

  sql = knex
    .sum("vip_data.limit_num as limit_num")
    .from(`${VIP_DATA} as vip_data`)
    .where({
      "vip_data.vip_card_type": 2,
      "vip_data.status": 1,
      "vip_data.account_id": userInfo.id,
      "vip_data.oem_id": userInfo.oem_id,
    })
    .where("vip_data.expire_time", ">=", date)
    .where("vip_data.start_time", "<=", date);
  let result = (await sql)[0];

  let res = {
    recharge_num: data?.recharge_num || 0,
    limit_num: result?.limit_num || 0,
  };
  return {
    code: 0,
    data: res,
  };
}

async function rechargeRecord(query, userInfo) {
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
    response.site = await getTableSite(VIP_DATA, "id");
  } else {
    response.site = Number(query.site) || 0;
  }

  let sql = knex
    .select(
      "vip_data.total_num",
      "vip_data.limit_num",
      "vip_data.amount",
      "vip_data.start_time",
      "vip_data.expire_time",
      "vip_data.status"
    )
    .from(`${VIP_DATA} as vip_data`)
    .where({
      "vip_data.vip_card_type": 2,
      // "vip_data.status": 1,
      "vip_data.account_id": userInfo.id,
      "vip_data.oem_id": userInfo.oem_id,
    })
    .where((builder) => {
      if (Number(response.site) && response.page > 1) {
        builder.where("vip_data.id", "<", response.site);
      }
    })
    .orderBy("vip_data.id", "desc");

  let data = await sqlPagination(sql, {
    page: response.page,
    pagesize: response.pagesize,
  });
  data.forEach((t) => {
    if (t.status == 1) {
      t.record_status =
        moment(t.expire_time).diff(moment(), "days") < 0 ? 3 : 1;
    } else t.record_status = t.status == 2 ? 4 : 2;

    t.start_time = moment(t.start_time).format("YYYY-MM-DD");
    t.expire_time = moment(t.expire_time).format("YYYY-MM-DD");
  });

  response.list = data;
  if (!data.length || data.length < response.pagesize) {
    response.site = null;
    response.has_next_page = false;
  }
  return res;
}

const handler = {
  searchFilter(sql, query) {
    return sql;
  },
};

module.exports = {
  total,
  rechargeRecord,
};
