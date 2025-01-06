const knex = require("../../../db/knexManager").knexProxy;
const {
  AMOUNT_PROMOTION,
  ADVERTISER_TABLE,
  REWARD,
  REWARD_ACTIVITY,
  CHANNEL_TABLE,
} = require("../../../config/setting");
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
const { floor, divide, cloneDeep, sum, orderBy } = require("lodash");
const { getChannel } = require("../../../utils/apiMapper");

async function list(query, userInfo) {
  const res = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page) || 1,
      pagesize: Number(query.pagesize) || 20,
      count: 0,
      total: {},
    },
  };
  let response = res.data;

  if (response.page == 1) {
    response.site = await getTableSite(AMOUNT_PROMOTION, "id");
  } else {
    response.site = query.site || 0;
  }
  let sql = knex
    .select("amount_promotion.advertiser_type")
    .sum("amount_promotion.amount as total_amount")
    .sum("amount_promotion.amount_balance as limit_amount")
    .max("amount_promotion.date as date")
    .select(
      knex.raw(
        `(SELECT sum(amount) FROM ${AMOUNT_PROMOTION} WHERE date = max(amount_promotion.date) and account_id = amount_promotion.account_id and advertiser_type = amount_promotion.advertiser_type and type = 5) as new_amount`
      )
    )
    .from(`${AMOUNT_PROMOTION} as amount_promotion`)
    .groupBy("amount_promotion.advertiser_type");
  sql = handler.commonWhere(sql, userInfo);
  sql = handler.searchFilter(sql, query);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    if (response.site && response.page > 1) {
      sql.where("amount_promotion.id", "<=", response.site);
    }

    sql = sqlPagination(sql, response).orderBy(
      "amount_promotion.advertiser_type",
      "desc"
    );

    let data = await sql
      .select(
        selectName(
          "amount_promotion",
          "advertiser_type",
          ADVERTISER_TABLE,
          "name",
          "advertiser_type_name"
        )
      )
      .select(
        selectName(
          "amount_promotion",
          "advertiser_type",
          ADVERTISER_TABLE,
          "icon",
          "advertiser_type_icon"
        )
      );

    let channel = await getChannel(userInfo.channel_id);

    data.forEach((t) => {
      t.advertiser_type_name = t.advertiser_type_name || channel.name;
      t.advertiser_type_icon = t.advertiser_type_icon || channel.logo;
    });

    if (!data.length) response.site = null;
    response.list = data;

    sql = knex
      .countDistinct("amount_promotion.advertiser_type as advertiser_count")
      .sum("amount_promotion.amount as total_amount")
      .sum("amount_promotion.amount_balance as limit_amount")
      .from(`${AMOUNT_PROMOTION} as amount_promotion`);
    sql = handler.commonWhere(sql, userInfo);
    sql = handler.searchFilter(sql, query);
    response.total = (await sql)[0] || {
      advertiser_count: 0,
      total_amount: 0,
      limit_amount: 0,
    };
  }

  return res;
}

async function def(query, userInfo, is_wallet) {
  const res = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page) || 1,
      pagesize: Number(query.pagesize) || 20,
      count: 0,
      total: {},
    },
  };
  let response = res.data;

  if (response.page == 1) {
    response.site = await getTableSite(AMOUNT_PROMOTION, "id");
  } else {
    response.site = query.site || 0;
  }
  let sql = knex
    .select(
      "reward_activity.name as activity_name",
      "amount_promotion.amount",
      "amount_promotion.date"
    )
    .from(`${AMOUNT_PROMOTION} as amount_promotion`)
    .leftJoin(
      `${REWARD} as reward`,
      "amount_promotion.order_relation_id",
      "reward.id"
    )
    .leftJoin(
      `${REWARD_ACTIVITY} as reward_activity`,
      "reward.relation_id",
      "reward_activity.id"
    );
  sql = handler.commonWhere(sql, userInfo);
  sql = handler.searchFilter(sql, query);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    if (response.site && response.page > 1) {
      sql.where("amount_promotion.id", "<=", response.site);
    }

    sql = sqlPagination(sql, response).orderBy("amount_promotion.date", "desc");

    let data = await sql.select(
      selectName(
        "amount_promotion",
        "advertiser_type",
        ADVERTISER_TABLE,
        "icon",
        "advertiser_type_icon"
      )
    );

    let channel = await getChannel(userInfo.channel_id);

    data.forEach((t) => {
      t.advertiser_type_name = t.advertiser_type_name || channel.name;
      t.advertiser_type_icon = t.advertiser_type_icon || channel.logo;
    });

    if (!data.length) response.site = null;
    response.list = data;

    sql = knex
      .countDistinct("amount_promotion.id as count")
      .sum("amount_promotion.amount as amount")
      .from(`${AMOUNT_PROMOTION} as amount_promotion`);
    sql = handler.commonWhere(sql, userInfo);
    sql = handler.searchFilter(sql, query);
    response.total = (await sql)[0] || {
      advertiser_count: 0,
      total_amount: 0,
      limit_amount: 0,
    };
  }

  return res;
}

let handler = {
  searchFilter(sql, query) {
    if (query?.date) {
      sql.whereIn(
        "amount_promotion.date",
        getDaysBetweenDate(query.date[0], query.date[1])
      );
    }
    if (query.advertiser_type) {
      sql.where("amount_promotion.advertiser_type", query.advertiser_type);
    }
    return sql;
  },
  commonWhere(sql, userInfo) {
    sql.where({
      "amount_promotion.oem_id": userInfo.oem_id,
      "amount_promotion.status": 1,
      "amount_promotion.account_id": userInfo.id,
      "amount_promotion.type": 5,
    });
    return sql;
  },
};

module.exports = {
  list,
  def,
};
