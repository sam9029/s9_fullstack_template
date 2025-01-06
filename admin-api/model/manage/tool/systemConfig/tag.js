const knex = require('../../../../db/knexManager').knexProxy;
const { TAG_TABLE, ACCOUNT_TABLE, COURSE_TAG } = require('../../../../config/setting');
const { knexTransaction, selectName, factoryListResponse, extractProp } = require("../../../../utils/tools")
const { checkKeys, isEmpty } = require("../../../../utils/check_type")
const { insertLog, getLogData } = require("../../../public/operationLog")
const { sqlPagination, sqlCount } = require('../../../../utils/sqlHelper');


async function list(query, userinfo) {
  const response = await factoryListResponse(query, TAG_TABLE);

  const knex_sql = knex(TAG_TABLE)
    .select("*")
    .where({ oem_id: userinfo.oem_id })
    .andWhere(builder => {
      if (response.page > 1 && response.site) {
        builder.where("id", "<=", response.site)

      }
    })
    .select(selectName(TAG_TABLE, "create_user_id", ACCOUNT_TABLE, "name", "create_user_name"))
    .select(selectName(TAG_TABLE, "update_user_id", ACCOUNT_TABLE, "name", "update_user_name"));

  handler.search_filter(knex_sql, query, userinfo);
  if (query.query_count) {
    response.count = await sqlCount(knex, knex_sql)
  } else {
    response.data = await sqlPagination(knex_sql, response)
      .orderBy("id", "desc");
  }

  return response;
}


async function add(body, userinfo) {
  // const data = checkKeys(body, ["type", "name", "order", "status"]);
  let { type, status, name, order } = body;
  if (!type) return Promise.reject('请填写类型');
  if (!name) return Promise.reject('请填写标签名称');
  if (!order) return Promise.reject('请填写排序');
  if (!status) return Promise.reject('请填写状态');

  let insertData = {
    type,
    status,
    order,
    name,
    create_user_id: userinfo.id,
    update_user_id: userinfo.id,
    oem_id: userinfo.oem_id
  }
  const id = await knex(TAG_TABLE).insert(insertData);

  return { code: 0, data: id }
}

async function edit(body, userinfo) {
  const data = checkKeys(body, ["id", "type?", "name?", "status?", "order?"]);
  const { id } = extractProp(data, ["id"]);
  if (isEmpty(data, true)) throw "请传入修改的属性！";
  Object.assign(data, {
    update_user_id: userinfo.id,
  })

  await knexTransaction(async trx => {
    await trx(TAG_TABLE).update(data).where("id", id);
    if (data.status != 1) {
      await trx(COURSE_TAG).update({ status: 4 }).where({ tag_id: id });
    } else {
      await trx(COURSE_TAG).update({ status: 1 }).where({ tag_id: id, status: 4 });
    }
  })

  return { code: 0, data: null }
}
const BUSINESS_TYPE_MAPPER = {
  // 1: '影视短剧' 3,
  // 4: '小说推文' 2,
  // 5: '漫画动漫' 1,
  3: 1,
  2: 4,
  1: 5,
  // 2: '学习课程',
  // 3: '爆款模型',
}

const handler = {
  search_filter(builder, query, userinfo) {
    if (query?.business_types?.length) {
      builder.whereIn('type', query.business_types.map(i => BUSINESS_TYPE_MAPPER[i]))
    }
    if (query.status) {
      builder.where('status', query.status)
    }
    if (query.type) {
      builder.where('type', query.type)
    }
    if (query.name) {
      builder.where('name', 'like', `${query.name}%`)
    }
  }
}

module.exports = {
  list,
  add,
  edit
}