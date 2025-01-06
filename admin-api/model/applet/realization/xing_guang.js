const moment = require("moment");
const lodash = require("lodash");
const knex = require("../../../db/knexManager").knexProxy;
const {
  XINGGUANG_TASK, XINGGUANG_POLICY, ADVERTISER_TABLE, XINGGUANG_ACCOUNT, PLATFORM_ACCOUNT_TABLE, PLATFORM_TABLE, SETTLEMENT_METHOD_TABLE
} = require("../../../config/setting");
const { knexTransaction, selectName, factoryAppListResponse, renderPrice } = require("../../../utils/tools");
const { checkKeys } = require("../../../utils/check_type");
// const { advertiser_mapper, content_sources } = require("../../../utils/redisCache");
const { sqlPagination, queryIfWhere, queryLikeWhere } = require("../../../utils/sqlHelper");
const { BUDGET_LEVEL } = require("../../../enum/popularize");


const list_cols = ["id", "advertiser_type", "task_id", "task_name", "budget_level", "budget_amount", "start_date", "end_date", "tag"];

async function list(query, userinfo) {
  const app_res = await factoryAppListResponse(query, XINGGUANG_TASK);
  const response = app_res.data;

  const knex_sql = knex(`${XINGGUANG_TASK} as task`)
    .leftJoin(`${ADVERTISER_TABLE} as adv`, "adv.id", "task.advertiser_type")
    .select(...list_cols.map(v => "task." + v))
    .select("adv.name as advertiser_name", "adv.icon as advertiser_icon")
    .where({
      "task.status": 1,
      "task.verify_status": 3,
      "task.task_status": "ONLINE",
    })
    .where(builder => {
      if (response.site && response.page > 1) {
        builder.where("task.id", "<=", response.site)
      }
      if (userinfo.account_type != 3) {
        builder.where("adv.is_test", 1)
      }
    })
    .orderBy([
      { column: "task.sort", order: "desc" },
      { column: "task.id", order: "desc" },
    ])

  handler.search_filter(knex_sql, query, userinfo);

  response.list = await sqlPagination(knex_sql, response)
    .select(knex.raw(
      `(SELECT COUNT(DISTINCT p.blogger_id) FROM ${XINGGUANG_ACCOUNT} p WHERE p.task_primary_id = task.id AND p.status = 1) as join_num`
    ));

  await handler.list_policys(response.list, true);

  response.list.forEach(v => {
    v.budget_level_name = BUDGET_LEVEL[v.budget_level] || "";
    v.start_date = moment(v.start_date).format('YYYY/MM/DD');
    v.end_date = moment(v.end_date).format('YYYY/MM/DD');
  })

  return app_res;
}

const SuccessSuggest = `恭喜您当下账号所报名的星广任务，我们已经增派成功啦！

后续接单和投稿需在抖音APP进行，分为3步：
【第1步】报名接单：找到该星图账号绑定的手机号，查看短信通知，点击链接报名任务；若未收到短信，在星图任务广场，搜索报名通过的任务ID（是任务ID，不是自己的星图ID哦），找到任务并进行报名。
【第2步】等待服务商审核：服务商每日10:00-23:00期间审核，需等待1-3小时。
【第3步】开始投稿：服务商选中后，即可在星图任务台看到任务，然后就可以开始投稿变现啦！（每个任务最多可以投稿10条，单账号所有任务每日投稿上限为3条。）`;

async function define(query, userinfo) {
  const { id } = checkKeys(query, ["id"]);

  const knex_sql = knex(`${XINGGUANG_TASK} as task`)
    .select(...list_cols.map(v => "task." + v))
    .select("task.describe", "task.task_status")
    .select(selectName("task", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_name"))
    .select(selectName("task", "advertiser_type", ADVERTISER_TABLE, "icon", "advertiser_icon"))
    .where({
      "task.id": id,
    });

  const data = (await knex_sql)[0];
  if (!data) { return Promise.reject("任务不存在或已停止！") };

  await handler.list_policys([data], false);

  data.budget_level_name = BUDGET_LEVEL[data.budget_level] || "";

  data.join_platform_accounts = [];
  if (!userinfo.is_visitor) {
    const join_accs = await knex(`${XINGGUANG_ACCOUNT} as acc`)
      .leftJoin(`${PLATFORM_ACCOUNT_TABLE} as plat`, "plat.id", "acc.platform_primary_id")
      .select("acc.id", "acc.xingtu_id", "acc.fan_counts", "acc.platform_primary_id", "acc.status", "acc.verify_status", "acc.verify_suggest")
      .select("plat.platform_account_name", "plat.platform_account_id")
      .select(selectName("plat", "platform_id", PLATFORM_TABLE, "icon", "platform_icon"))
      .where({
        "acc.task_primary_id": data.id,
        "acc.blogger_id": userinfo.id,
      });
    join_accs.forEach(v => {
      if (v.verify_status == 3) {
        v.verify_suggest = SuccessSuggest;
      }
    })
    data.join_platform_accounts = join_accs;
  }

  return { code: 0, data }
}


async function my_task(query, userinfo) {
  const { task_status } = checkKeys(query, ["task_status"])
  const app_res = await factoryAppListResponse(query, XINGGUANG_ACCOUNT);
  const response = app_res.data;

  const knex_sql = knex(`${XINGGUANG_ACCOUNT} as acc`)
    .leftJoin(`${XINGGUANG_TASK} as task`, "task.id", "acc.task_primary_id")
    .where({
      "acc.blogger_id": userinfo.id,
      "acc.status": 1,
      // "acc.verify_status": 3,
    })
    .where(builder => {
      if (task_status == "ONLINE") {
        builder.where("task.task_status", task_status)
      } else {
        builder.whereIn("task.task_status", ["ENDED", "OFFLINE"])
      }
    })
    .select(...list_cols.map(v => "task." + v))
    .groupBy("task.id");


  handler.search_filter(knex_sql, query, userinfo);

  response.list = await sqlPagination(knex_sql, response)
    .select(selectName("task", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_name"))
    .select(selectName("task", "advertiser_type", ADVERTISER_TABLE, "icon", "advertiser_icon"))
    .select(knex.raw(
      `(SELECT COUNT(DISTINCT p.platform_primary_id) FROM ${XINGGUANG_ACCOUNT} p WHERE p.task_primary_id = task.id AND p.status = 1 AND p.blogger_id = ${userinfo.id}) as join_num`
    ));

  await handler.list_policys(response.list, true);

  response.list.forEach(v => {
    v.budget_level_name = BUDGET_LEVEL[v.budget_level] || "";
    v.start_date = moment(v.start_date).format('YYYY/MM/DD');
    v.end_date = moment(v.end_date).format('YYYY/MM/DD');
  })

  return app_res;
}


async function register(body, userinfo) {
  const data = checkKeys(body, ["task_primary_id", "platform_primary_id", "xingtu_id", "fan_counts?"]);

  const plat_acc = (
    await knex(PLATFORM_ACCOUNT_TABLE).select("id").where({
      "id": data.platform_primary_id,
      "blogger_id": userinfo.id,
      "status": 1
    })
  )[0];
  if (!plat_acc) { return Promise.reject("媒体账号不存在！"); }

  const exist = await knex(XINGGUANG_ACCOUNT)
    .select("blogger_id", "task_primary_id", "platform_primary_id", "xingtu_id")
    .where({
      xingtu_id: data.xingtu_id,
      status: 1,
    });

  if (exist.some(v => v.blogger_id != userinfo.id)) {
    return Promise.reject("该星图ID已被其他博主申请！");
  }
  const defal_val = {
    create_user_id: userinfo.id,
    update_user_id: userinfo.id,
    blogger_id: userinfo.id,
    create_date: moment().format("YYYY-MM-DD"),
    verify_status: 2,
  };
  Object.assign(data, defal_val);

  await knexTransaction(async trx => {
    await trx(XINGGUANG_ACCOUNT).insert(data);
    const plat_update = {
      xingtu_id: data.xingtu_id
    };
    if (data.fan_counts) {
      plat_update.fan_counts = data.fan_counts;
    }
    await trx(PLATFORM_ACCOUNT_TABLE).update(plat_update).where("id", data.platform_primary_id)
  })



  return { code: 0, data: null };
}

const handler = {
  search_filter(knex_sql, query, userinfo) {
    queryIfWhere(knex_sql, "task.advertiser_type", query.advertiser_type);

    queryIfWhere(knex_sql, "task.budget_level", query.budget_level);

    queryLikeWhere(knex_sql, ["task.task_name"], query.keyword);
  },
  async list_policys(list, use_short_name) {
    if (list.length) {
      const ids = list.map(v => v.id);
      const policys = await knex(`${XINGGUANG_POLICY} as p`)
        .leftJoin(`${SETTLEMENT_METHOD_TABLE} as smt`, "smt.id", "p.settle_id")
        .select("p.settle_id", "p.publish", "p.publish_max", "p.service", "p.task_primary_id", "smt.name", "smt.short_name", "smt.suffix")
        .whereIn("p.task_primary_id", ids)
        .where({
          "p.status": 1
        });
      const groups = lodash.groupBy(policys, "task_primary_id");
      list.forEach(v => {
        v.policys = handler.format_policys(groups[v.id] || [], use_short_name);
      })
    }
  },

  format_policys(policys, use_short_name) {
    const arr = [];
    policys.forEach(v => {
      const { settle_id, publish, publish_max, service, name, short_name, suffix } = v;
      const item = {
        id: settle_id,
        publish,
        service,
        show_name: "",
        show_value: "",
      };
      if (use_short_name) {
        item.show_name = short_name;
        if (arr.some(v => v.show_name == short_name)) { return; } // 简称合并
      } else {
        item.show_name = name;
      }
      item.show_value = renderPrice(publish, false, false);
      if (publish_max) {
        item.show_value += `~${renderPrice(publish_max, false, false)}`
      }
      item.show_value += (suffix || "元")
      // return item;
      arr.push(item);
    })
    return arr.sort((a, b) => {
      if (a.id == 5) return -1;
      return a.id - b.id;
    });
  }
}



module.exports = {
  list,
  define,
  my_task,
  register,
}