const knex = require("../../../db/knexManager").knexProxy;
const {
  VIP_REBATE,
  VIP_REBATE_COMMISSION,
  VIP_REBATE_RELATION,
  AMOUNT_VIP_REBATE,
  PAYMENT_ORDERS,
  REBATE_POLICY_COMMISSION,
  ACCOUNT_TABLE,
  VIP_CARD,
  VIP_LEVEL,
  ACTINFO_TABLE,
} = require("../../../config/setting");
const { bucket } = require("../../../config/index");
const {
  knexTransaction,
  getUrlPath,
  selectName,
  getDaysBetweenDate,
} = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const {
  getTableSite,
  sqlCount,
  sqlPagination,
} = require("../../../utils/sqlHelper");
const moment = require("moment");
const { getCoverUrl } = require("../../public/upload");
const { floor, divide, cloneDeep, sum, orderBy } = require("lodash");
// const {
//   commissionPolicy,
// } = require("../../manage/business/rebatePolicy/index");

async function list(query, userInfo, is_wallet) {
  // userInfo.id = 10009889;
  // 基础返利
  let sql = handler.unAmountSql("date", 1, null, userInfo);
  sql
    .sum("vip_rebate.amount as amount")
    .select(
      knex.raw(
        `ifnull((${handler.unWithdrawalSql(
          "date",
          userInfo
        )}),0) as withdrawal_amount`
      )
    );

  let basicRebate = (await sql)[0] || {
    un_amount: 0,
    amount: 0,
    withdrawal_amount: 0,
  };

  sql = handler.unAmountSql("date", 1, null, userInfo);
  sql = handler.commonUnAmountSql(sql, "date");
  let result = await sql
  basicRebate.un_amount = sum(result.map(t=> t.un_amount || 0));

  let date = moment();
  dateRange = handler.dateRange("month");
  // 月度返利
  let monthRebate = await handler.defCommonSql(
    "month",
    date.format("YYYY-MM"),
    2,
    dateRange,
    userInfo
  );

  // 季度返利
  dateRange = handler.dateRange("quarter");
  let quarterRebate = await handler.defCommonSql(
    "quarter",
    `${date.year()}-Q${date.quarter()}`,
    3,
    dateRange,
    userInfo
  );

  // 年度返利
  dateRange = handler.dateRange("year");
  let yearRebate = await handler.defCommonSql(
    "year",
    date.year(),
    4,
    dateRange,
    userInfo
  );

  sql = knex
    .countDistinct("vip_rebate.blogger_id as invite_num")
    .sum("vip_rebate.recharge_amount as recharge_amount")
    .from(`${VIP_REBATE} as vip_rebate`)
    .where({
      "vip_rebate.oem_id": userInfo.oem_id,
      "vip_rebate.status": 1,
      "vip_rebate.account_id": userInfo.id,
    })
    .groupBy("vip_rebate.account_id");
  let total = (await sql)[0] || {};
  total.basic_amount = basicRebate.amount;

  let field = ["withdrawal_amount", "un_amount", "amount"];
  field.forEach((t) => {
    let arr = [];
    arr.push(basicRebate?.[t]);
    arr.push(monthRebate?.[t]);
    arr.push(quarterRebate?.[t]);
    arr.push(yearRebate?.[t]);

    if (t != "amount") {
      delete monthRebate?.[t];
      delete quarterRebate?.[t];
      delete yearRebate?.[t];
    }

    total[t] = sum(arr);
  });

  if (is_wallet) return total;

  return {
    code: 0,
    data: {
      basicRebate,
      monthRebate,
      quarterRebate,
      yearRebate,
      total,
    },
  };
}

async function basicList(query, userInfo) {
  // userInfo.id = 10009889;
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
    response.site = await getTableSite(VIP_REBATE);
  } else {
    response.site = query.site || 0;
  }
  let sql = knex
    .select(
      "vip_rebate.rebate_date as settle_status",
      "vip_rebate.blogger_id",
      "payment_orders.amount as recharge_amount",
      "payment_orders.basic_rebate_amount as amount",
      "payment_orders.pay_date as date",
      "payment_orders.pay_status",
      "vip_level.name as vip_level_name"
    )
    .select(
      selectName(
        "vip_rebate",
        "blogger_id",
        ACCOUNT_TABLE,
        "name",
        "blogger_name"
      )
    )
    .select(
      selectName(
        "vip_rebate",
        "blogger_id",
        ACTINFO_TABLE,
        "avatar",
        "avatar",
        "account_id"
      )
    )
    .from(`${VIP_REBATE} as vip_rebate`)
    .leftJoin(
      `${PAYMENT_ORDERS} as payment_orders`,
      "vip_rebate.payment_order_id",
      "payment_orders.id"
    )
    .leftJoin(
      `${VIP_CARD} as vip_card`,
      "payment_orders.vip_card_id",
      "vip_card.id"
    )
    .leftJoin(`${VIP_LEVEL} as vip_level`, "vip_card.level", "vip_level.id")
    .where({
      "vip_rebate.oem_id": userInfo.oem_id,
      "vip_rebate.status": 1,
      "vip_rebate.account_id": userInfo.id,
    });

  sql.orderBy("vip_rebate.date");
  sql = handler.searchFilter(sql, query);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    if (response.site && response.page > 1) {
      sql.where("vip_rebate.id", "<=", response.site);
    }
    sql = sqlPagination(sql, response);

    let data = await sql;
    data.forEach((t) => {
      t.is_refund = t.pay_status == 3;
      delete t.pay_status;
    });
    if (!data.length) response.site = null;
    response.list = data;

    // 汇总
    sql = handler.unAmountSql("date", 1, null, userInfo, query);
    sql
      .sum("vip_rebate.amount as amount")
      .countDistinct("vip_rebate.blogger_id as invite_num")
      .select(
        knex.raw(
          `ifnull((${handler.unWithdrawalSql(
            "date",
            userInfo,
            query
          )}),0) as withdrawal_amount`
        )
      );
    let basicRebate = (await sql)[0] || {
      un_amount: 0,
      amount: 0,
      withdrawal_amount: 0,
    };;

    sql = handler.unAmountSql("date", 1, null, userInfo, query);
    sql = handler.commonUnAmountSql(sql, "date");
    let result = await sql
    basicRebate.un_amount = sum(result.map(t=> t.un_amount || 0));

    response.total = basicRebate
  }
  return res;
}

async function andBasicList(query, userInfo) {
  return await basicList(query, userInfo);
}

async function monthList(query, userInfo) {
  query.type = "month";
  query.order = 2;
  return await gradientList(query, userInfo);
}

async function quarterList(query, userInfo) {
  query.type = "quarter";
  query.order = 3;
  return await gradientList(query, userInfo);
}

async function yearList(query, userInfo) {
  query.type = "year";
  query.order = 4;
  return await gradientList(query, userInfo);
}

async function gradientList(query, userInfo) {
  // userInfo.id = 10009889;
  let { type, order } = query;
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
    response.site = await getTableSite(VIP_REBATE);
  } else {
    response.site = query.site || 0;
  }
  let sql = handler.gradientCommonSql(type, order, userInfo);
  sql
    .select(`vip_rebate.${type}`)
    .select(`vip_rebate.rebate_${type} as settle_status`)
    .select(
      knex.raw(`group_concat(distinct rebate_policy_commission.radix) as radix`)
    )
    .select(
      knex.raw(`group_concat(distinct rebate_policy_commission.ratio) as ratio`)
    )
    .sum("vip_rebate.recharge_amount as recharge_amount")
    .groupBy(`vip_rebate.rebate_${type}`);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql, type);
  } else {
    if (response.site && response.page > 1) {
      sql.where("vip_rebate.id", "<=", response.site);
    }
    sql = sqlPagination(sql, response).orderByRaw(`vip_rebate.${type} desc`);

    let data = await sql;
    data.forEach((t) => {
      t.radix = Number(t.radix) || 0;
      t.ratio = Number(t.ratio) || 0;

      let progress = t.radix ? floor(t.recharge_amount / t.radix, 1) : 0;
      t.progress = progress > 100 ? 100 : progress;

      let date = handler.dateReplce(t[type]);
      let dateRange = handler.dateRange(type, date);
      t.date_range = `${dateRange[0]}~${dateRange[1]}`;

      t.dateTtitle = handler.dateChinse(t[type], type);

      if (t.recharge_amount / 100 >= t.radix)
        t.amount = Math.round((t.recharge_amount * t.ratio) / 10000);
      else t.amount = 0;

      delete t.ratio;
    });
    if (!data.length) response.site = null;
    response.list = data;

    sql = handler.gradientCommonSql(type, order, userInfo);
    sql
      .select(
        knex.raw(
          `IF(sum(vip_rebate.recharge_amount) / 100 > CAST(group_concat(distinct rebate_policy_commission.radix) as UNSIGNED), 
          round(sum( vip_rebate.recharge_amount) * CAST(group_concat(distinct rebate_policy_commission.ratio) as UNSIGNED) / 10000), 0) 
          AS amount`
        )
      )
      .select(
        knex.raw(
          `if(sum(vip_rebate.recharge_amount) / 100 > group_concat( DISTINCT rebate_policy_commission.radix) , 1, 0) as count`
        )
      );
    let total = (
      await knex
        .select(knex.raw(`ifnull(sum(amount),0) as amount`))
        .select(knex.raw(`ifnull(sum(count),0) as count`))
        .from(knex.raw(`(${sql.toString()}) c`))
    )[0];

    // 待入账
    sql = handler.unAmountSql(type, order, null, userInfo, query);
    sql = handler.commonUnAmountSql(sql, type);
    let result = await sql;
    total.un_amount = sum(result.map((t) => t.un_amount || 0));
    // 结算频次
    // let settle_count = await sqlCount(knex, sql, type);
    // total.settle_count = settle_count;
    response.total = total;
  }
  return res;
}

async function testDef(query, userInfo) {
  if(userInfo.account_type != 3 || !query.account_id) return {}
  userInfo.id = query.account_id
  return await list(query, userInfo); 
}

let handler = {
  searchFilter(sql, query) {
    if (query?.date) {
      sql.whereIn(
        "vip_rebate.date",
        getDaysBetweenDate(query.date[0], query.date[1])
      );
    }
    return sql;
  },
  gradientCommonSql(type, order, userInfo) {
    let sql = knex
      .from(`${VIP_REBATE} as vip_rebate`)
      .leftJoin(
        `${REBATE_POLICY_COMMISSION} as rebate_policy_commission`,
        (builder) => {
          builder
            .on(
              "vip_rebate.rebate_policy_id",
              "=",
              "rebate_policy_commission.policy_id"
            )
            .andOn("rebate_policy_commission.order", "=", order);
        }
      )
      .where({
        "vip_rebate.oem_id": userInfo.oem_id,
        "vip_rebate.status": 1,
        "vip_rebate.account_id": userInfo.id,
      })
      .groupByRaw(`vip_rebate.${type}`);
    return sql;
  },
  async defCommonSql(type, date, order, dateRange, userInfo) {
    let sql = handler.gradientCommonSql(type, order, userInfo);
    sql
      .select(`vip_rebate.${type}`)
      .select(
        knex.raw(
          `group_concat(distinct rebate_policy_commission.radix) as radix`
        )
      )
      .select(
        knex.raw(
          `group_concat(distinct rebate_policy_commission.ratio) as ratio`
        )
      )
      .select(
        knex.raw(
          `ifnull((${handler.withdrawalSql(
            type,
            userInfo
          )}),0) as withdrawal_amount`
        )
      )
      .sum("vip_rebate.recharge_amount as recharge_amount");
    // .where(`vip_rebate.${type}`, date);

    let data = await sql;
    let rebatePolicy = await commissionPolicy({ commission_type: 1, order });
    let result = {
      count: 0,
      amount: 0,
      radix: 0,
      ratio: 0,
      progress: 0,
      withdrawal_amount: 0,
    };
    if (!data.length || !data.find((t) => t[type] == date)) {
      result.radix = rebatePolicy?.commission_radix || 0;
      result.ratio = rebatePolicy?.commission_ratio || 0;
    }
    data.forEach((t) => {
      result.withdrawal_amount += t.withdrawal_amount;
      let radix = Number(t.radix);
      let ratio = Number(t.ratio);
      if (t.recharge_amount / 100 > radix) {
        result.count += 1;
        result.amount += Math.round((t.recharge_amount * ratio) / 10000);
      }

      if (t[type] == date) {
        result.radix = Number(t.radix);
        result.ratio = Number(t.ratio);
        let progress = floor(t.recharge_amount / radix, 1);
        result.progress = progress > 100 ? 100 : progress;
      } else {
        progress = 0;
      }
    });

    sql = handler.unAmountSql(type, order, dateRange, userInfo);
    sql = handler.commonUnAmountSql(sql, type);
    let unAmountList = await sql
    result.un_amount = sum(unAmountList.map(t=> t.un_amount || 0));

    return result;
  },
  // 待入账sql
  unAmountSql(type, order, dateRange, userInfo, query) {
    let sql = knex
      .from(`${VIP_REBATE} as vip_rebate`)
      .leftJoin(
        `${REBATE_POLICY_COMMISSION} as rebate_policy_commission`,
        (builder) => {
          builder
            .on(
              "vip_rebate.rebate_policy_id",
              "=",
              "rebate_policy_commission.policy_id"
            )
            .andOn("rebate_policy_commission.order", "=", order);
        }
      )
      .where({
        "vip_rebate.oem_id": userInfo.oem_id,
        "vip_rebate.status": 1,
        "vip_rebate.account_id": userInfo.id,
      })
      .groupBy("vip_rebate.account_id");
    sql = handler.searchFilter(sql, query);
    // if (dateRange)
    //   sql.whereIn(
    //     "vip_rebate.date",
    //     getDaysBetweenDate(dateRange[0], dateRange[1])
    //   );
    return sql;
  },
  commonUnAmountSql(sql, type) {
    sql
      .select(
        knex.raw(
          `round(if(
          sum(IF ( vip_rebate.rebate_${type} != 3, vip_rebate.recharge_amount, NULL )) / 100 >= CAST(group_concat(distinct rebate_policy_commission.radix) as UNSIGNED),
          sum(IF ( vip_rebate.rebate_${type} != 3, vip_rebate.recharge_amount, NULL )) * CAST(group_concat(distinct rebate_policy_commission.ratio) as UNSIGNED) / 10000, null)	
          ) as un_amount `
        )
      )
      .groupBy(`vip_rebate.${type}`);
    return sql;
  },
  // 可提现sql
  unWithdrawalSql(type, userInfo, query) {
    let sql = `SELECT ifnull(sum(amount_balance), 0) AS withdrawal_amount FROM ${AMOUNT_VIP_REBATE} 
    WHERE oem_id = ${userInfo.oem_id} AND status = 1 AND account_id = ${userInfo.id} AND settle_type = '${type}'
    and type = 3`;
    if (query?.date)
      `${sql} and where date In (${getDaysBetweenDate(
        query.date[0],
        query.date[1]
      ).toString()})`;
    sql = `${sql} GROUP BY account_id`;

    return sql;
  },
  // 可提现sql
  withdrawalSql(type, userInfo, query) {
    let sql = `SELECT ifnull(sum(amount_balance), 0) AS withdrawal_amount FROM ${AMOUNT_VIP_REBATE} 
    WHERE oem_id = ${userInfo.oem_id} AND status = 1 AND account_id = ${userInfo.id} AND settle_type = '${type}' and vip_rebate.${type} = ${type}
    and type = 3`;
    if (query?.date)
      `${sql} and where date In (${getDaysBetweenDate(
        query.date[0],
        query.date[1]
      ).toString()})`;
    sql = `${sql} GROUP BY account_id,${type}`;

    return sql;
  },
  dateReplce(date) {
    // 季度替换特殊符号
    return date
      .replace("Q1", "03")
      .replace("Q2", "06")
      .replace("Q3", "09")
      .replace("Q4", "12");
  },
  dateChinse(date, type) {
    let mapper = {
      Q1: "一季度",
      Q2: "二季度",
      Q3: "三季度",
      Q4: "四季度",
    };
    switch (type) {
      case "month":
        return `${Number(date.split("-")[1])}月会员佣金`;
      case "quarter":
        return `${mapper[date.split("-")[1]]}会员佣金`;
      case "year":
        return `${Number(date.split("-")[0])}年度会员佣金`;
    }
  },
  dateRange(type, date) {
    date = date || moment();
    let begin_date = moment(date).startOf(type).format("YYYY-MM-DD");
    let end_date = moment(date).endOf(type).format("YYYY-MM-DD");
    return [begin_date, end_date];
  },
};

module.exports = {
  list,
  basicList,
  andBasicList,
  monthList,
  quarterList,
  yearList,
  testDef,
};
