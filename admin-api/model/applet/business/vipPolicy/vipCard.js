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
  VERSION,
} = require("../../../../config/setting");
const {
  knexTransaction,
  selectName,
  getDaysBetweenDate,
} = require("../../../../utils/tools");
const {} = require("../../../../utils/apiMapper");
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
const { compareVersion } = require("../../../public/version");

async function list(query, userInfo, req) {
  let sql = knex
    .select(
      "vip_card.id",
      "vip_card.day",
      "vip_card.amount",
      "vip_card.product_id",
      "vip_card.video_equity_type"
    )
    .select(selectName("vip_card", "level", VIP_LEVEL, "name", "level_name"))
    .select(selectName("vip_card", "type", VIP_TYPE, "name", "type_name"))
    .from(`${VIP_CARD} as vip_card`)
    .where({
      "vip_card.oem_id": userInfo?.oem_id || 1,
      "vip_card.sell_status": 2,
      "vip_card.status": 1,
    })
    .orderBy("vip_card.day", "asc");
  sql = handler.searchFilter(sql, query);
  let data = await sql;
  data.forEach((t) => {
    t.hot_sale = t.day == 90;
    t.daily_price = floor(t.amount / t.day, 1);
    t.equity_num = JSON.parse(t.video_equity_type)?.free_num;
    delete t.video_equity_type;
  });
  let vipRecord = await getCustomCache(`xgfx_vip_records`);
  if (!vipRecord) {
    let result = await knex
      .select("payment_orders.create_time")
      .select(
        selectName(
          "payment_orders",
          "account_id",
          ACCOUNT_TABLE,
          "name",
          "account_name"
        )
      )
      .select(
        selectName(
          "payment_orders",
          "account_id",
          ACTINFO_TABLE,
          "avatar",
          "avatar",
          "account_id"
        )
      )
      .from(`${PAYMENT_ORDERS} as payment_orders`)
      .where({
        "payment_orders.pay_status": 2,
        "payment_orders.status": 1,
        "payment_orders.oem_id": userInfo?.oem_id || 1,
      })
      .orderBy("payment_orders.id", "desc")
      .limit(5);
    function truncated(str, num) {
      let s = "";
      for (let v of str) {
        s += v;
        num--;
        if (num <= 0) {
          break;
        }
      }
      return s;
    }
    result.forEach((t) => {
      t.account_name = truncated(t.account_name || "", 1) + "**";
    });
    vipRecord = result;
    await setCustomCache(vipRecord, `xgfx_vip_records`, 600);
  }

  let bool = await compareVersion(req);
  let content = [
    `1、购买前请仔细阅读本页面全部内容${bool ? "" : "，购买后不支持退款"}`,
    "2、本权益包只针对“智能创作”工具做次数购买，不包含会员权益",
    "3、权益包可多次购买，购买后次数累加",
  ];
  if (!bool) content.push("4、权益包有效期为90天");
  return {
    code: 0,
    data: {
      vip: data,
      record: vipRecord,
      content,
    },
  };
}

async function equityList(query, userInfo) {
  let sql = knex
    .select("vip_card.video_equity_type", "vip_card.tool_equity_type")
    .select(selectName("vip_card", "level", VIP_LEVEL, "name", "level_name"))
    .select(selectName("vip_card", "type", VIP_TYPE, "name", "type_name"))
    .from(`${VIP_CARD} as vip_card`)
    .where({
      "vip_card.oem_id": userInfo?.oem_id || 1,
      "vip_card.sell_status": 2,
      "vip_card.status": 1,
      "vip_card.type": 1,
    })
    .orderBy("vip_card.day", "asc");
  sql = handler.searchFilter(sql, query);
  let equity_info = await sql;
  let videoFieldName = {
    day_num: "单日最高领取",
    free_num: "累计领取（数量）",
  };
  let toolFieldName = {
    mixed_shear: "超级混剪",
    remove_watermark: "去水印",
    word_check: "违禁词检查",
    link_text: "链接提取文字",
    video_text: "视频提取文字",
  };
  equity_info.forEach((t) => {
    t.video_equity_type = JSON.parse(t.video_equity_type || "{}");
    Object.keys(t.video_equity_type).forEach((k) => {
      t.video_equity_type[`${k}_name`] = videoFieldName[k];
    });
    t.tool_equity_type = JSON.parse(t.tool_equity_type || "{}");
    Object.keys(t.tool_equity_type).forEach((k) => {
      t.tool_equity_type[`${k}_name`] = toolFieldName[k];
    });
  });

  let nowDate = moment().format("YYYY-MM-DD");
  sql = knex
    .select(
      "rebate_policy.id",
      "rebate_policy.commission_type",
      "rebate_policy.commission_remark"
    )
    .from(`${REBATE_POLICY} as rebate_policy`)
    .where("rebate_policy.start_date", "<=", nowDate)
    .where("rebate_policy.end_date", ">=", nowDate)
    .where({
      "rebate_policy.oem_id": userInfo?.oem_id || 1,
      "rebate_policy.verify_status": 3,
      "rebate_policy.status": 1,
    });
  let rebate_info = await sql;
  rebate_info.forEach((t) => {
    t.policy_info = [];
  });
  let result = await knex
    .select(
      "rebate_policy_commission.policy_id",
      // "rebate_policy_commission.commission_type",
      "rebate_policy_commission.type",
      "rebate_policy_commission.radix",
      "rebate_policy_commission.ratio"
    )
    .from(`${REBATE_POLICY_COMMISSION} as rebate_policy_commission`)
    .whereIn(
      "rebate_policy_commission.policy_id",
      rebate_info.map((t) => t.id)
    )
    .orderBy("order", "asc");
  result.forEach((t) => {
    let item = rebate_info.find((k) => k.id == t.policy_id);
    if (item) {
      delete t.policy_id;
      item.policy_info.push(t);
    }
  });

  rebate_info.forEach((t) => {
    delete t.id;
  });

  return {
    code: 0,
    data: {
      equity_info,
      rebate_info,
    },
  };
}

const handler = {
  searchFilter(sql, query) {
    if (query.system) {
      sql.where(`vip_card.system`, query.system);
    }
    if (query.type) {
      sql.where(`vip_card.type`, query.type);
    } else if (query.type) {
      sql.where(`vip_card.type`, 1);
    }
    return sql;
  },
};

module.exports = {
  list,
  equityList,
};
