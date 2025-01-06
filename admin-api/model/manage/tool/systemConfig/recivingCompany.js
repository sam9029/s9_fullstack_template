const knex = require("../../../../db/knexManager").knexProxy;
const moment = require("moment");
const {
  RECIVING_COMPANY_TABLE,
  POLICY_TABLE,
  POLICY_SETTLEMENT_TABLE,
  POLICY_KEYWORD_TABLE,
  ACCOUNT_TABLE
} = require("../../../../config/setting");
const { getLogData, insertLog } = require("../../../public/operationLog");
const crypto = require("crypto"); //加载加密文件
const config = require("../../../../config");
const { getGroupAccountId } = require("../../../public/permission");
const { getPermission } = require("../../../public/permission");
const { getUuid, knexTransaction, selectName } = require("../../../../utils/tools");
const {
  shortSubjectList,
  findKoc,
  subUser,
  platformAccount,
  userDept,
  deptList,
  categoryList,
  projectList,
} = require("../../../../utils/apiMapper");
const { object } = require("underscore");
const { onlyControlInterface } = require("../../../public/permission");

async function list(query, userInfo) {
  if (query.interface_id) await onlyControlInterface(query, userInfo);
  let response = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  };
  let knexSql = knex(RECIVING_COMPANY_TABLE).select("*");
  if (query.status) {
    knexSql.where("status", query.status);
  } else {
    knexSql.whereIn("status", [1, 2]);
  }
  knexSql = handler.searchFilter(knexSql, query);
  let count = await knex
    .count({ count: "*" })
    .from(knex.raw(`(${knexSql.toQuery().replace(/`/g, "")}) as t`));
  response.count = (count.length && count[0]["count"]) || 0;
  knexSql
    .limit(response.pagesize)
    .offset((response.page - 1) * response.pagesize)
    .select(selectName(RECIVING_COMPANY_TABLE, "create_user_id", ACCOUNT_TABLE, "name", "create_user_name"))
    .select(selectName(RECIVING_COMPANY_TABLE, "update_user_id", ACCOUNT_TABLE, "name", "update_user_name"))
    .orderBy("id", "desc");
  let back = await knexSql;
  let adv_mapper = await projectList(userInfo, query);
  response.data = back.map((item) => {
    // item.create_user_name = accountMapper[item.create_user_id];
    // item.update_user_name = accountMapper[item.update_user_id];
    item.advertiser_types = JSON.parse(item.advertiser_types || "[]");
    item.advertiser_types_name = [];
    item.advertiser_types.forEach((t) => {
      item.advertiser_types_name.push(adv_mapper[t]);
    });
    return item;
  });
  return response;
}

async function add(query, userInfo) {
  let { name, rate, money_upper } = query;
  if (!name) return Promise.reject("请传入服务商");
  if (!rate) return Promise.reject("请传入费率");
  if (!money_upper) return Promise.reject("请传入限额");
  let checkData = await knex(RECIVING_COMPANY_TABLE)
    .select("id", "name")
    .where({ oem_id: userInfo.oem_id, name: name });
  if (checkData.length && checkData[0].status == 1)
    throw new Error(`服务商已存在，请勿重复添加`);
  let response = {
    code: 0,
    data: null,
  };
  money_upper = Number(money_upper) * 100;
  await knexTransaction(async (trx) => {
    let insertObj = {
      name: name,
      rate: rate,
      money_upper: money_upper,
      oem_id: userInfo.oem_id,
      status: 1,
      create_user_id: userInfo.id,
      update_user_id: userInfo.id,
    };
    let id = (await trx(RECIVING_COMPANY_TABLE).insert(insertObj))[0];
    await insertLog(trx, getLogData(id, 5002, insertObj, userInfo));
    response.data = id;
  });
  return response;
}

async function update(query, userInfo) {
  if (!query.id) return Promise.reject("请传入服务商id");
  let checkData = await knex(RECIVING_COMPANY_TABLE)
    .select("id")
    .where({ oem_id: userInfo.oem_id })
    .where("id", "!=", query.id)
    .where(builder => {
      if (query.name) {
        builder.where('name', query.name)
      }
    });
  if (checkData.length && checkData[0].status == 1)
    throw new Error(`服务商已存在，请勿重复添加`);

  await knexTransaction(async (trx) => {
    let updateData = {};
    if (query.status) {
      updateData = {
        status: query.status,
        update_user_id: userInfo.id,
      };
    }
    else if (query.name) {
      query.money_upper = Number(query.money_upper) * 100;
      updateData = {
        name: query.name,
        rate: query.rate,
        money_upper: query.money_upper,
        update_user_id: userInfo.id
      };
    }
    await trx(RECIVING_COMPANY_TABLE).update(updateData).where("id", query.id);
    await insertLog(
      trx,
      getLogData(query.id, 5004, updateData, userInfo, checkData[0])
    );
  });
  return {
    code: 0,
    message: "修改成功",
  };
}

const handler = {
  searchFilter(knexSql, query) {
    if (query.keyword) {
      knexSql.where('name', 'like', `%${query.keyword}%`).orWhere('id', 'like', `%${query.keyword}%`)
    }
    if (query.status) {
      knexSql.where('status', query.status)
    }
    return knexSql;
  },
};
//根据人员，日期，关键词获取报价
async function getPolicyPriceByInfo(
  advertiser_type = 1,
  account_id,
  date = "",
  end_date = "",
  keyword_id,
  content_type = "",
  trx = knex
) {
  let data = await trx
    .select("poc.id as policy_id", "poc.keyword_type", "pst.content_type")
    .select(
      "pst.service_price",
      "pst.service_ratio",
      "pst.publish_price",
      "pst.publish_ratio",
      "pst.settlement_id"
    )
    .select(knex.raw(`GROUP_CONCAT(psw.keyword_id) as keyword_ids`))
    .select(
      knex.raw(
        `IF(pst.settlement_id = 5, pst.publish_price, 0) as distribute_price`
      )
    )
    .from(`${POLICY_TABLE} as poc`)
    .leftJoin(`${POLICY_SETTLEMENT_TABLE} as pst`, "poc.id", "pst.policy_id")
    .leftJoin(`${POLICY_KEYWORD_TABLE} as psw`, "poc.id", "psw.policy_id")
    .where({
      "poc.offer_account_id": account_id,
      "poc.status": 1,
      "poc.advertiser_type": advertiser_type,
    })
    .where("pst.content_type", content_type)
    .whereIn("poc.verify_status", [3, 6])
    .where((builder) => {
      if (advertiser_type != 7) {
        builder
          .where((bu) => {
            bu.where("poc.effective_start_date", "<=", date).whereNull(
              "poc.effective_end_date"
            );
          })
          .orWhere((bu) => {
            bu.where("poc.effective_start_date", "<=", date).where(
              "poc.effective_end_date",
              ">=",
              date
            );
          });
      } else {
        builder
          .where((bu) => {
            bu.where("poc.effective_start_date", "<=", date).whereNull(
              "poc.effective_end_date"
            );
          })
          .orWhere((bu) => {
            bu.where("poc.effective_start_date", "<=", date).where(
              "poc.effective_end_date",
              ">=",
              end_date
            );
          });
      }
    })
    .groupBy("poc.id", "pst.id");
  if (!data.length) return null;

  // let price
  data.forEach((element) => {
    element.keyword_ids = element.keyword_ids
      ? element.keyword_ids.split(",")
      : [];
  });
  // console.log(data);
  let prices = [];
  let price_info = {};
  if (keyword_id) {
    prices = data.filter(
      (i) => i.keyword_type == 2 && i.keyword_ids.includes(String(keyword_id))
    ); //先找特定报价内是否存在该关键词
    if (prices && prices.length) {
      //存在特定报价
      price_info = merageArray(prices);
      if (!price_info.distribute_price) {
        //如果不存在
        let dest = data.find(
          (i) => i.keyword_type == 1 && i.settlement_id == 5
        );
        if (dest) prices.push(dest);
      }
      price_info = merageArray(prices);
      return price_info;
    } else {
      //这个词没有特定报价，走通用报价
      prices = data.filter((i) => i.keyword_type == 1);
      price_info = merageArray(prices);
    }
  } else {
    prices = data.filter((i) => i.keyword_type == 1);
    price_info = merageArray(prices);
  }
  return price_info;
  // console.log(dataSql.toString());
}
function merageArray(price = []) {
  if (price.length == 1) return price[0];
  let data = { ...price[0] };
  price.forEach((element, index) => {
    if (index != 0) {
      Object.keys(element).forEach((key) => {
        if (!data[key]) data[key] = element[key];
      });
    }
  });
  return data;
}
// getPolicyPriceByInfo(2, 10007831, '2022-05-20', null, null, 0).then(data=>console.log(data))
module.exports = {
  list,
  add,
  update,
  getPolicyPriceByInfo,
};
