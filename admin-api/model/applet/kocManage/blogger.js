const knex = require("../../../db/knexManager").knexProxy;
const { GetAccountMapper } = require("../../../utils/apiMapper");
const moment = require("moment");
const {
  ACCOUNT_TABLE,
  PLATFORM_TABLE,
  PLATFORM_ACCOUNT_TABLE,
  CATEGORY_TABLE,
  ACCOUNT_ROLE,
  ACTINFO_TABLE,
  KOC_MEMBER
} = require("../../../config/setting");
const { getLogData, insertLog } = require("../../public/operationLog");
const crypto = require("crypto"); //加载加密文件
const config = require("../../../config");
const { getChildrenByPermission } = require("../../public/permission");
const { telIsRepeat } = require("../../marking/user");
const { getUuid, knexTransaction } = require("../../../utils/tools");

async function list(query, userInfo) {
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page) || 1,
    pagesize: Number(query.pagesize) || 20,
  };

  let accountIds = await getChildrenByPermission(userInfo);
  let sql = knex
    .select(
      "blogger.account_id",
      "blogger.status",
      "blogger.type",
      "blogger.create_time",
      "blogger.update_time",
      "account_info.avatar",
      "blogger.is_sale"
    )
    .count("platform_account.platform_account_id as platform_count")
    .from(`${KOC_MEMBER} as blogger`)
    .leftJoin(`${ACCOUNT_TABLE} as account`, "blogger.account_id", "account.id")
    .leftJoin(`${PLATFORM_ACCOUNT_TABLE} as platform_account`, "blogger.account_id", "platform_account.blogger_id")
    .leftJoin(`${ACTINFO_TABLE} as account_info`, "blogger.account_id", "account_info.account_id")
    .where({
      "blogger.oem_id": userInfo.oem_id,
      "account.flag": 1,
      "account.status": 1,
    })
    .andWhere((builder) => {
      handler.searchFilter(query, builder, "blogger.", "account.");
    })
    .andWhere((builder) => {
      if (accountIds) builder.whereIn("account.id", accountIds);
    })
    .groupBy("blogger.account_id");
  let count = await knex.count({ count: "*" }).from(knex.raw(`(${sql}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;

  let data = await sql
    .limit(retu.pagesize)
    .offset((retu.page - 1) * retu.pagesize)
    .orderBy("blogger.create_time", "desc");

  let accountMapper = await GetAccountMapper();

  data.forEach((t) => {
    t.name = accountMapper[t.account_id]
    t.create_time = moment(t.create_time).format("YYYY-MM-DD");
    t.update_time = moment(t.update_time).format("YYYY-MM-DD");
  });

  retu.data = data;
  return retu;
}

async function def(query, userInfo) {
  let sql = knex
    .select(
      "blogger.account_id",
      "blogger.status",
      "blogger.type as blogger_type",
      "blogger.sign",
      "blogger.sign_begin",
      "blogger.sign_end",
      "blogger.create_time",
      "blogger.update_time",
      "account.telephone",
      "account.direct_leader",
      "account_info.avatar",
    )
    .count("platform_account.platform_account_id as platform_count")
    .from(`${KOC_MEMBER} as blogger`)
    .leftJoin(`${ACCOUNT_TABLE} as account`, "blogger.account_id", "account.id")
    .leftJoin(`${PLATFORM_ACCOUNT_TABLE} as platform_account`, "blogger.account_id", "platform_account.blogger_id")
    .leftJoin(`${ACTINFO_TABLE} as account_info`, "blogger.account_id", "account_info.account_id")
    .where({
      "blogger.oem_id": userInfo.oem_id,
      "account.flag": 1,
      "account.status": 1,
      "blogger.account_id": query.account_id,
    })
    .groupBy("blogger.account_id");

  let data = await sql
  let accountMapper = await GetAccountMapper();

  data.forEach((t) => {
    t.name = accountMapper[t.account_id]
    t.direct_leader_name = accountMapper[t.direct_leader];
    t.create_time = moment(t.create_time).format("YYYY-MM-DD");
    t.update_time = moment(t.update_time).format("YYYY-MM-DD");
    t.sign_time = [t.sign_begin, t.sign_end]
  });

  return {
    code: 0,
    data: data[0]
  };
}

async function update(query, userInfo) {
  let result = null;
  let sql = knex
    .select("blogger.*", "account.telephone", "account.password")
    .from(`${KOC_MEMBER} as blogger`)
    .leftJoin(`${ACCOUNT_TABLE} as account`, "blogger.account_id", "account.id")
    .where("blogger.oem_id", userInfo.oem_id)
    .andWhere((builder) => {
      builder.where("blogger.account_id", query.account_id);
    });
  let data = await sql;
  let res = await knexTransaction(async (trx) => {
    let kocBloggerField = [
      "status",
      "type",
      "sign",
      "sign_begin",
      "sign_end",
    ];
    let koc_blogger_insert_data = {};
    kocBloggerField.forEach((t) => {
      if (query[t]) {
        koc_blogger_insert_data[t] =
          Object.prototype.toString.call(query[t]) == "[object Object]" ?
            JSON.stringify(query[t]) :
            query[t];
      }
    });

    if (JSON.stringify(koc_blogger_insert_data) != "{}") {
      koc_blogger_insert_data.update_user_id = userInfo.id;
      result = await trx(KOC_MEMBER)
        .where("account_id", query.account_id)
        .andWhere("oem_id", userInfo.oem_id)
        .update(koc_blogger_insert_data);
    }

    let accountField = ["direct_leader", "telephone"];
    let account_insert_data = {};
    accountField.forEach((t) => {
      if (query[t]) {
        account_insert_data[t] =
          Object.prototype.toString.call(query[t]) == "[object Object]" ?
            JSON.stringify(query[t]) :
            query[t];
      }
      account_insert_data.update_user_id = userInfo.id;
    });
    if (query.new_password) {
      let password = crypto
        .createHash("md5")
        .update(query.new_password + config.deviation)
        .digest("hex");
      account_insert_data.update_user_id = userInfo.id;
      account_insert_data.password = password;
      // account_insert_data.update_time = moment().format("YYYY-MM-DD HH:mm:ss");
    }

    if (query.status == 1) {
      account_insert_data.status = 1;
      account_insert_data.flag = 1;
    } else if (query.status == 2) {
      account_insert_data.flag = 2;
    } else if (query.status == 3) {
      account_insert_data.status = 2;
    }
    Object.keys(query).forEach((key) => {
      if (key == "direct_leader")
        account_insert_data.direct_leader = query.direct_leader;
    });

    if (query.telephone) {
      await telIsRepeat(query, userInfo, 2);
    }
    if (JSON.stringify(account_insert_data) != "{}") {
      account_insert_data.update_user_id = userInfo.id;
      result = await trx(ACCOUNT_TABLE)
        .where("id", query.account_id)
        .andWhere("oem_id", userInfo.oem_id)
        .update(account_insert_data);
    }

    if (result) {
      let newData = Object.assign({},
        koc_blogger_insert_data,
        account_insert_data
      );
      let log_data = await Promise.all(
        data.map(async (item) => {
          return getLogData(result, 1102, newData, userInfo, item);
        })
      );
      await insertLog(trx, log_data);
    }
  });
  return {
    code: 0,
    data: query.account_id,
  };
}

async function add(body, userInfo, logType = 1101) {
  let data = await knexTransaction(async (trx) => {
    let success = [];
    for (let i = 0; i < body.length; i++) {
      let item = body[i];
      for (let j in item) {
        item[j] = (item[j] + '').replace(/\s+/g, '');
      }
      handler.checkData(item);
      if (!item.password) return Promise.reject('密码必填！');
      let { name, telephone, password, direct_leader, phone_verification, blogger_type } = item;
      await telIsRepeat(item, userInfo);
      let uid = getUuid();
      password = crypto.createHash('md5').update(password + config.deviation).digest('hex');
      let accountInsertData = {
        uid,
        name,
        password,
        telephone,
        phone_verification,
        flag: 1,
        status: 1,
        create_user_id: userInfo.id,
        direct_leader,
        oem_id: userInfo.oem_id || 0,
        version: '1.0'
      };

      let accountData = await trx(ACCOUNT_TABLE).insert(accountInsertData);
      if (accountData) {
        let account_id = accountData[0]
        let bloggerInsertData = {
          account_id,
          status: 1,
          create_user_id: userInfo.id,
          oem_id: userInfo.oem_id || 0,
          type: blogger_type,
          sign: 2
        },
          accountRoleInsertData = {
            account_id,
            role_id: 3,
            status: 1,
            create_user_id: userInfo.id,
            update_user_id: userInfo.id,
            oem_id: userInfo.oem_id || 0
          },
          accountInfoInsertData = {
            account_id,
            avatar_type: 1,
            register_type: 2,
            auth_type: 1,
            data_type: 1
          };
        let consultData = await trx(KOC_MEMBER).insert(bloggerInsertData);
        await trx(ACCOUNT_ROLE).insert(accountRoleInsertData);
        await trx(ACTINFO_TABLE).insert(accountInfoInsertData);
        if (consultData) {
          success.push(consultData[0]);
          let logData1 = getLogData(account_id, logType, accountInsertData, userInfo, {});
          let logData2 = getLogData(account_id, logType, bloggerInsertData, userInfo, {});
          let logData3 = getLogData(account_id, logType, accountRoleInsertData, userInfo, {});
          let logData4 = getLogData(account_id, logType, accountInfoInsertData, userInfo, {});
          await insertLog(trx, [logData1, logData2, logData3, logData4]);
        }
      }
    }
    return success;
  })
  return {
    code: 0,
    data,
    message: '添加成功'
  }
}

async function consultantLeader(query, userInfo) {
  let sql = knex
    .distinct(
      "account_copy.direct_leader as id",
    )
    .from(`${KOC_MEMBER} as blogger`)
    .leftJoin(`${ACCOUNT_TABLE} as account`, "blogger.account_id", "account.id")
    .leftJoin(`${ACCOUNT_TABLE} as account_copy`, "account.direct_leader", "account_copy.id")
    .where({
      "blogger.oem_id": userInfo.oem_id,
      "blogger.type": 3,
    })
    .andWhere((builder) => {
      handler.searchFilter(query, builder, "blogger.", "account.");
    })
    .andWhere((builder) => {
      if (query.tree_account) {
        builder.whereIn("account.direct_leader", children);
      }
    });
  let data = await sql
  let accountMapper = await GetAccountMapper();
  data.forEach((t) => {
    t.name = accountMapper[t.id];
  })
  return {
    code: 0,
    data,
  }
}

const handler = {
  async searchFilter(query, builder, table1, table2) {
    if (query.keyword) {
      builder.where(builder_copy => {
        builder_copy.where(`${table2}name`, "like", `%${query.keyword}%`)
          // .orWhere(`${table2}uid`, "like", `%${query.keyword}%`)
          .orWhere(`${table1}account_id`, "like", `%${query.keyword}%`)
          .orWhere(`${table2}telephone`, "like", `%${query.keyword}%`);;
      })
    }
    if (query.type) {
      builder.whereIn(`${table1}type`, query.type);
    }
    if (query.direct_leader) {
      builder.where(`${table2}direct_leader`, query.direct_leader);
    }
    if (query.status) {
      builder.where(`${table1}status`, query.status);
    }
    let dateRange = query.dateRange && JSON.parse(query.dateRange)
    if (dateRange.length) {
      builder
        .where(`${table1}create_time`, ">=", dateRange[0])
        .andWhere(`${table1}create_time`, "<=", dateRange[1]);
    }
  },
  checkData(body) {
    let requiredFields = ['name', 'telephone', 'direct_leader', 'phone_verification', 'blogger_type'];
    for (let i = 0; i < requiredFields.length; i++) {
      if (!body[requiredFields[i]]) {
        throw new Error(`${requiredFields[i]}字段必填！`)
      }
    }
  }
};

module.exports = {
  list,
  def,
  update,
  add,
  consultantLeader,
};