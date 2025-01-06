const {
  PLATFORM_ACCOUNT_TABLE,
  ACCOUNT_TABLE,
  PLATFORM_TABLE,
  CATEGORY_TABLE,
} = require("../../../config/setting");
const knex = require("../../../db/knexManager").knexProxy;
const { STATUS_MAPPER } = require("../../../utils/mapper");
const {
  getDaysBetweenDate,
  knexTransaction,
  selectName,
} = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const { getChildrenByPermission } = require("../../public/permission");
const {
  getTableSite,
  sqlCount,
  sqlPagination,
} = require("../../../utils/sqlHelper");

async function list(query = {}, userInfo = {}) {
  const res = {
    code: 0,
    data: {
      list: [],
      page: Number(query.page) || 1,
      pagesize: Number(query.pagesize) || 20,
      // count: 0,
    },
  };
  let response = res.data;

  if (response.page == 1) {
    response.site = await getTableSite(PLATFORM_ACCOUNT_TABLE, "id");
  } else {
    response.site = query.site || 0;
  }
  let sql = knex
    .select("plac.id")
    .from(`${PLATFORM_ACCOUNT_TABLE} as plac`)
    .where({
      "plac.oem_id": userInfo.oem_id,
      "plac.status": 1,
      "plac.blogger_id": userInfo.id,
    }).where(builder => {
      if (query?.platform_id) builder.where('plac.platform_id', query?.platform_id)
    })
  // sql = handler.searchFilter(sql, query, userInfo);

  if (query.query_count) {
    response.count = await sqlCount(knex, sql);
  } else {
    sql = sqlPagination(sql, response)
      .select("plac.platform_account_id", "plac.platform_account_name", "plac.fan_counts",
        "plac.home_page_url", "plac.create_time", "plac.category_id", "plac.platform_id", "plac.screenshot_url", "plac.xingtu_id")
      .select(selectName("plac", "category_id", CATEGORY_TABLE, "name", "category_name"))
      .select(selectName("plac", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
      .select(selectName("plac", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"));
    let data = await sql.orderBy("plac.id", "desc");
    data.forEach((t) => { });
    response.list = data;
  }
  return res;
}

async function def(query = {}, userInfo = {}) {
  let { id } = query || {};
  let { oem_id, id: account_id } = userInfo || {};
  if (!id) return Promise.reject("未设置查询ID！");
  let retu = {
    code: 0,
    data: {},
  };
  let knexSql = knex
    .select("plac.*",)
    .select(selectName("plac", "category_id", CATEGORY_TABLE, "name", "category_name"))
    .select(selectName("plac", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
    .select(selectName("plac", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"))
    .from(`${PLATFORM_ACCOUNT_TABLE} as plac`)
    .where({ "plac.oem_id": oem_id });
  retu.data = (await knexSql.limit(1).where({ "plac.id": id, "plac.blogger_id": account_id }))[0] || {};

  return retu;
}
// dyInfoGetObj('UserId: 77021775284 DeviceId: 4365523865608779 UpdateVersionCode: 30009900 Channel: oppo_1128_64 GitSHA: 76a4f27499a VESDK: 16.5.1.1 EffectSdk: 16.5.0_rel_764_douyin_202405151531_6557bc7d94 CloudAlbumSdk: 5.0.0')
function dyInfoGetObj(inputString = '') {
  try {
    const pairs = inputString.match(/\w+:\s[\w\.]+/g);
    const result = {};
    // 遍历每个键值对，将其添加到对象中
    pairs.forEach(pair => {
      const [key, value] = pair.split(/:\s/);
      result[key] = value;
    });
    return result
  } catch (error) {
    return {}
  }
}
async function add(body = {}, userInfo = {}) {
  let newData = handler.checkData(body, userInfo);
  // let { oem_id, platform_id, platform_account_id } = newData;
  if (String(newData?.platform_account_id).indexOf('UserId') != -1) {
    newData.platform_account_id = dyInfoGetObj(String(newData?.platform_account_id))?.UserId
    if (!newData.platform_account_id) return Promise.reject("平台账号填写错误！");
  }
  let data = await knexTransaction(async (trx) => {
    let detail_id = (await trx(PLATFORM_ACCOUNT_TABLE).insert(newData)
      .onConflict(["platform_id", "platform_account_id", "blogger_id"]).merge())[0];
    await insertLog(trx, getLogData(detail_id, 1301, newData, userInfo));
    return detail_id;
  });
  return { code: 0, data: { id: data } };
}

async function save(body = {}, userInfo = {}) {
  let id = body.id;
  if (!id) return Promise.reject("未设置修改数据");
  let result = await knex(PLATFORM_ACCOUNT_TABLE)
    .select("*")
    .where({ id: id, status: 1 });
  if (!result.length) return Promise.reject("该账号状态错误");

  let newData = handler.checkData(body, userInfo, "edit");

  let data = await knexTransaction(async (trx) => {
    await trx(PLATFORM_ACCOUNT_TABLE).update(newData).where("id", id);
    await insertLog(trx, getLogData(id, 1302, newData, userInfo, result[0]));
  });
  return { code: 0, data: { id } };
}

async function del(body = {}, userInfo = {}) {
  let ids = body.ids;
  let { id: blogger_id } = userInfo
  if (!ids) return Promise.reject("未设置修改数据");
  let result = await knex(PLATFORM_ACCOUNT_TABLE).select("*")
    .whereIn("id", ids).where({ status: 1, blogger_id });
  if (!result?.length) return Promise.reject("无可修改数据");
  let data = await knexTransaction(async (trx) => {
    let updateIds = result.map((t) => t.id);
    if (result.length) {
      let newData = { status: 3 };
      await trx(PLATFORM_ACCOUNT_TABLE).update(newData).whereIn("id", updateIds);
      let logList = updateIds.map((t) => getLogData(t, 1302, newData, userInfo, { status: 1 }));
      await insertLog(trx, logList);
    }
    return updateIds
  });
  return { code: 0, data: data };
}

let handler = {
  // searchFilter(sql, query = {}, userInfo) {
  //   if (query.blogger_id) {
  //     sql.where(`plac.blogger_id`, query.blogger_id);
  //   } else {
  //     sql.where(`plac.blogger_id`, userInfo.id);
  //   }
  //   return sql;
  // },
  checkData(body = {}, userInfo = {}, type = "add") {
    let user_id = userInfo.id;
    let checkKeys = ["platform_id", "platform_account_id", 'category_id'];
    let dataKeys = ["platform_account_name", "fan_counts", "home_page_url", "screenshot_url", "status", "xingtu_id",];
    let data = {};
    if (type == "add") {
      data = {
        blogger_id: user_id,
        create_user_id: user_id,
        update_user_id: user_id,
        oem_id: userInfo.oem_id,
        status: 1,
      };
      checkKeys.forEach((key) => {
        if (!body[key]) throw new Error(`字段${key}参数不合法！请检查参数`);
        data[key] = body[key];
      });
    } else if (type == "edit") {
      data = { update_user_id: user_id };
    }
    checkKeys.concat(dataKeys).forEach((key) => {
      if (Object.hasOwnProperty.call(body, key)) data[key] = body[key];
    });
    return data;
  },
};
module.exports = {
  list,
  add,
  save,
  def,
  del,
};
