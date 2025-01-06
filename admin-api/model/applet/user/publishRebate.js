const knex = require("../../../db/knexManager").knexProxy;
const {
  REBATE_POLICY_COMMISSION,
  ACCOUNT_TABLE,
  ACTINFO_TABLE,
  AMOUNT_REBATE,
  DATA_SETTLE_TABLE,
  DATA_TABLE,
  INVITE_DATA,
  ADVERTISER_TABLE,
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
const { getAccountVipLelve } = require("../../../utils/apiMapper");

const rebateType = [1, 2, 3, 4, 5];
async function list(query, userInfo, is_wallet) {
  // userInfo.id = 10014773;
  // 基础返利
  let sql = handler.unAmountSql("date", 1, null, userInfo);
  sql
    .select(knex.raw(`0 as un_amount`))
    .sum("amount_rebate.amount as amount")
    .select(
      knex.raw(
        `ifnull((${handler.unWithdrawalSql(rebateType, userInfo)}),0) as withdrawal_amount`
      )
    );
  let basicRebate = (await sql)[0] || {
    un_amount: 0,
    amount: 0,
    withdrawal_amount: 0,
  };

  let date = moment();
  dateRange = handler.dateRange("month");

  // 月度返利
  let monthRebate = await handler.defCommonSql(
    "month",
    date.format("YYYY-MM"),
    2,
    [12],
    dateRange,
    userInfo
  );

  // 季度返利
  dateRange = handler.dateRange("quarter");
  let quarterRebate = await handler.defCommonSql(
    "quarter",
    `${date.year()}-Q${date.quarter()}`,
    3,
    [13],
    dateRange,
    userInfo
  );

  // 年度返利
  dateRange = handler.dateRange("year");
  let yearRebate = await handler.defCommonSql(
    "year",
    date.year(),
    4,
    [14],
    dateRange,
    userInfo
  );

  sql = knex
    .countDistinct("amount_rebate.blogger_id as invite_num")
    .sum("amount_rebate.blogger_amount as publish_amount")
    .from(`${AMOUNT_REBATE} as amount_rebate`)
    .where({
      "amount_rebate.oem_id": userInfo.oem_id,
      "amount_rebate.status": 1,
      "amount_rebate.account_id": userInfo.id,
    })
    .groupBy("amount_rebate.account_id");
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
  // userInfo.id = 10009882;
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
    response.site = await getTableSite(AMOUNT_REBATE);
  } else {
    response.site = query.site || 0;
  }
  let sql = knex
    .select("amount_rebate.blogger_id")
    .sum("amount_rebate.blogger_amount as publish_amount")
    .sum("amount_rebate.amount as amount")
    .select(
      selectName(
        "amount_rebate",
        "blogger_id",
        ACCOUNT_TABLE,
        "name",
        "blogger_name"
      )
    )
    .select(
      selectName(
        "amount_rebate",
        "blogger_id",
        ACTINFO_TABLE,
        "avatar",
        "avatar",
        "account_id"
      )
    )
    .select(
      selectName(
        "amount_rebate",
        "blogger_id",
        INVITE_DATA,
        "create_time",
        "inviter_time",
        "invite_account_id"
      )
    )
    .from(`${AMOUNT_REBATE} as amount_rebate`)
    .where({
      "amount_rebate.oem_id": userInfo.oem_id,
      "amount_rebate.status": 1,
      "amount_rebate.account_id": userInfo.id,
    })
    .whereIn("amount_rebate.type", rebateType)
    .groupBy("amount_rebate.blogger_id");
  sql = handler.searchFilter(sql, query);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    if (response.site && response.page > 1) {
      sql.where("amount_rebate.id", "<=", response.site);
    }
    sql = sqlPagination(sql, response);

    let data = await sql;
    data.forEach(async (t) => {
      t.vip_level_name = (await getAccountVipLelve(t.blogger_id)).level_name;
      t.inviter_time = moment(t.inviter_time).format("YYYY-MM-DD");
    });
    if (!data.length) response.site = null;
    response.list = data;

    // 汇总
    sql = handler.unAmountSql("date", 1, null, userInfo, query);
    sql
      .select(knex.raw(`0 as un_amount`))
      .sum("amount_rebate.amount as amount")
      .countDistinct("amount_rebate.blogger_id as invite_num")
      .sum("amount_rebate.blogger_amount as publish_amount");
    let basicRebate = (await sql)[0] || {
      un_amount: 0,
      amount: 0,
      invite_num: 0,
      publish_amount: 0,
    };
    response.total = basicRebate;
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
  // userInfo.id = 10014773;
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
    response.site = await getTableSite(AMOUNT_REBATE);
  } else {
    response.site = query.site || 0;
  }
  let sql = handler.gradientCommonSql(type, order, userInfo);
  sql
    .select(`amount_rebate.${type}`)
    .select(`amount_rebate.rebate_${type} as settle_status`)
    .select(
      knex.raw(`group_concat(distinct rebate_policy_commission.radix) as radix`)
    )
    .select(
      knex.raw(`group_concat(distinct rebate_policy_commission.ratio) as ratio`)
    )
    .sum("amount_rebate.blogger_amount as blogger_amount")
    .groupBy(`amount_rebate.rebate_${type}`);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql, type);
  } else {
    if (response.site && response.page > 1) {
      sql.where("amount_rebate.id", "<=", response.site);
    }
    sql = sqlPagination(sql, response).orderByRaw(`amount_rebate.${type} desc`);

    let data = await sql;
    data.forEach((t) => {
      t.radix = Number(t.radix) || 0;
      t.ratio = Number(t.ratio) || 0;

      let progress = t.radix ? floor(t.blogger_amount / t.radix, 1) : 0;
      t.progress = progress > 100 ? 100 : progress;

      let date = handler.dateReplce(t[type]);
      let dateRange = handler.dateRange(type, date);
      t.date_range = `${dateRange[0]}~${dateRange[1]}`;

      t.dateTtitle = handler.dateChinse(t[type], type);

      if (t.blogger_amount / 100 >= t.radix)
        t.amount = Math.round((t.blogger_amount * t.ratio) / 10000);
      else t.amount = 0;

      delete t.ratio;
    });
    if (!data.length) response.site = null;
    response.list = data;

    sql = handler.gradientCommonSql(type, order, userInfo);
    sql
      .select(
        knex.raw(
          `IF(sum(amount_rebate.blogger_amount) / 100 > CAST(group_concat(distinct rebate_policy_commission.radix) as UNSIGNED), 
          round(sum( amount_rebate.blogger_amount) * CAST(group_concat(distinct rebate_policy_commission.ratio) as UNSIGNED) / 10000), 0) 
          AS amount`
        )
      )
      .select(
        knex.raw(
          `if(sum(amount_rebate.blogger_amount) / 100  > group_concat( DISTINCT rebate_policy_commission.radix) , 1, 0) as count`
        )
      );
    let total = (
      await knex
        .select(knex.raw(`ifnull(sum(amount),0) as amount`))
        .select(knex.raw(`ifnull(sum(count),0) as count`))
        .from(knex.raw(`(${sql.toString()}) c`))
    )[0];

    // 待入账
    sql = handler.unAmountSql(type, order, null, userInfo);
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

async function def(query, userInfo) {
  let { account_id, date } = query;
  if (!account_id) return Promise.reject("博主不能为空！");
  let sql = knex
    .select("invite_data.create_time as inviter_time")
    .select(
      selectName(
        "invite_data",
        "invite_account_id",
        ACCOUNT_TABLE,
        "name",
        "blogger_name"
      )
    )
    .select(
      selectName(
        "invite_data",
        "invite_account_id",
        ACTINFO_TABLE,
        "avatar",
        "avatar",
        "account_id"
      )
    )
    .from(`${INVITE_DATA} as invite_data`)
    .where({
      "invite_data.invite_account_id": account_id,
    });
  let data = (await sql)[0];
  data.vip_level_name = (await getAccountVipLelve(account_id)).level_name;

  sql = knex
    .select("amount_rebate.date")
    .sum("amount_rebate.blogger_amount as publish_amount")
    .sum("amount_rebate.amount as amount")
    .select(
      selectName(
        "amount_rebate",
        "advertiser_type",
        ADVERTISER_TABLE,
        "name",
        "advertiser_name"
      )
    )
    .from(`${AMOUNT_REBATE} as amount_rebate`)
    .where({
      "amount_rebate.oem_id": userInfo.oem_id,
      "amount_rebate.status": 1,
      "amount_rebate.blogger_id": account_id,
    })
    .whereIn("amount_rebate.type", rebateType)
    .groupBy("amount_rebate.date", "amount_rebate.advertiser_type")
    .orderBy("amount_rebate.date", "desc");
  if (date)
    sql.whereIn("amount_rebate.date", getDaysBetweenDate(date[0], date[1]));
  data.settle = await sql;
  return {
    code: 0,
    data,
  };
}

async function andDef(query, userInfo) {
  return await def(query, userInfo);
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
        "amount_rebate.date",
        getDaysBetweenDate(query.date[0], query.date[1])
      );
    }
    return sql;
  },
  gradientCommonSql(type, order, userInfo) {
    let sql = knex
      .from(`${AMOUNT_REBATE} as amount_rebate`)
      .leftJoin(
        `${REBATE_POLICY_COMMISSION} as rebate_policy_commission`,
        (builder) => {
          builder
            .on(
              "amount_rebate.rebate_policy_id",
              "=",
              "rebate_policy_commission.policy_id"
            )
            .andOn("rebate_policy_commission.order", "=", order);
        }
      )
      .where({
        "amount_rebate.oem_id": userInfo.oem_id,
        "amount_rebate.status": 1,
        "amount_rebate.account_id": userInfo.id,
      })
      .whereIn("amount_rebate.type", rebateType)
      .groupByRaw(`amount_rebate.${type}`);
    return sql;
  },
  async defCommonSql(type, date, order, rebate_type, dateRange, userInfo) {
    let sql = handler.gradientCommonSql(type, order, userInfo);
    sql
      .select(`amount_rebate.${type}`)
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
            rebate_type,
            userInfo
          )}),0) as withdrawal_amount`
        )
      )
      .sum("amount_rebate.blogger_amount as blogger_amount");
    // .where(`amount_rebate.${type}`, date);

    let data = await sql;
    let rebatePolicy = await commissionPolicy({ commission_type: 2, order });
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
      if (t.blogger_amount / 100 > radix) {
        result.count += 1;
        result.amount += Math.round((t.blogger_amount * ratio) / 10000);
      }

      if (t[type] == date) {
        result.radix = Number(t.radix);
        result.ratio = Number(t.ratio);
        let progress = floor(t.blogger_amount / radix, 1);
        result.progress = progress > 100 ? 100 : progress;
      } else {
        progress = 0;
      }
    });
    sql = handler.unAmountSql(type, order, dateRange, userInfo);
    sql = handler.commonUnAmountSql(sql, type);
    let unAmountList = await sql;
    result.un_amount = sum(unAmountList.map((t) => t.un_amount || 0));
    return result;
  },
  // 待入账sql
  unAmountSql(type, order, dateRange, userInfo, query) {
    let sql = knex
      .from(`${AMOUNT_REBATE} as amount_rebate`)
      .leftJoin(
        `${REBATE_POLICY_COMMISSION} as rebate_policy_commission`,
        (builder) => {
          builder
            .on(
              "amount_rebate.rebate_policy_id",
              "=",
              "rebate_policy_commission.policy_id"
            )
            .andOn("rebate_policy_commission.order", "=", order);
        }
      )
      .where({
        "amount_rebate.oem_id": userInfo.oem_id,
        "amount_rebate.status": 1,
        "amount_rebate.account_id": userInfo.id,
      })
      .whereIn("amount_rebate.type", rebateType)
      .groupBy("amount_rebate.account_id");
    sql = handler.searchFilter(sql, query);
    // if (dateRange)
    //   sql.whereIn("amount_rebate.date", getDaysBetweenDate(dateRange[0], dateRange[1]));
    return sql;
  },
  commonUnAmountSql(sql, type) {
    sql
      .select(
        knex.raw(
          `round(if(
          sum(IF ( amount_rebate.rebate_${type} != 3, amount_rebate.blogger_amount, NULL )) / 100 >= CAST(group_concat(distinct rebate_policy_commission.radix) as UNSIGNED),
          sum(IF ( amount_rebate.rebate_${type} != 3, amount_rebate.blogger_amount, NULL )) * CAST(group_concat(distinct rebate_policy_commission.ratio) as UNSIGNED) / 10000, null)	
          ) as un_amount `
        )
      )
      .groupBy(`amount_rebate.${type}`);
    return sql;
  },
  // 可提现sql
  unWithdrawalSql(type, userInfo, query) {
    let sql = `SELECT sum(amount_balance) AS withdrawal_amount FROM ${AMOUNT_REBATE} 
    WHERE oem_id = ${userInfo.oem_id} AND status = 1 AND account_id = ${userInfo.id} AND type in (${type})`;
    if (query?.date)
      `${sql} and where date In (${getDaysBetweenDate(
        query.date[0],
        query.date[1]
      ).toString()})`;
    sql = `${sql} GROUP BY account_id`;

    return sql;
  },
  // 可提现sql
  withdrawalSql(type, rebate_type, userInfo, query) {
    let sql = `SELECT sum(amount_balance) AS withdrawal_amount FROM ${AMOUNT_REBATE} 
    WHERE oem_id = ${userInfo.oem_id} AND status = 1 AND account_id = ${userInfo.id} AND type in (${rebate_type}) and amount_rebate.${type} = ${type}`;
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
        return `${Number(date.split("-")[1])}月发布佣金`;
      case "quarter":
        return `${mapper[date.split("-")[1]]}发布佣金`;
      case "year":
        return `${Number(date.split("-")[0])}年度发布佣金`;
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
  def,
  andDef,
  testDef,
};
