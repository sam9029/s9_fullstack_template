const knex = require("../db/knexManager").knexProxy
const { getRedisClient, getCustomCache, setCustomCache, delCustomCache, useCustomCache } = require("../db/redis")
const { selectName, renderPrice } = require("./tools")
const config = require('../config')

const {
  ACCOUNT_ROLE, ROLE_TABLE, ADVERTISER_TABLE, SUBJECT_TABLE, SETTLEMENT_METHOD_TABLE,
  SETTLEMENT_PARAM_TABLE, EXTENSION_GOAL_TABLE, DEPT_TABLE, PLATFORM_ACCOUNT_TABLE,
  ACCOUNT_TABLE, CATEGORY_TABLE, PLATFORM_TABLE, KEYWORD_DICT, KEYWORD_PROP, DUOLAI_ACCOUNT_INFO,
  POLICY_TABLE, POLICY_SETTLEMENT_TABLE, VIP_DATA, VIP_LEVEL, VIP_CARD, TAG_TABLE, CHANNEL_TABLE, CONTENT_MIME
} = require("../config/setting")

const { RK_ADVERTISER_SETTLEMENTS, RK_CHANNEL_ROUTER, RK_CREATOR_HOST, RK_BUY_RECORD,
  RK_MAPPER_MIME_TYPE, RK_CHANNEL_INFO, RK_MAPPER_TAGS, RK_MAPPER_ACCOUNT_LELVE,
  RK_MAPPER_PLATFORM, RK_KWD_DICT_TO_NAME_KEY, RK_KWD_NAME_TO_DICT_KEY,
} = require("../config/redis_key");
const { advertiser_mapper } = require("./redisCache");

// 获取角色类型映射
async function GetRoleTypeMapper() {
  let data = await knex(ROLE_TABLE).select("id", "role_name")
  let mapper = {}
  handler.setRoleMapper(data, mapper)
  return mapper
}
/**
 * 获取创作者的登录host
 * @param {*} account_id 
 * @param {knex} trx 
 * @returns 
 */
async function getCreatorHost(account_id = 0, trx = knex) {
  const redis_key = `${RK_CREATOR_HOST}:${account_id}`
  return await useCustomCache(redis_key, async () => {
    let creator_host = `${config.creator_host}/login/personal`
    let creator_info = (await trx(`${ACCOUNT_TABLE} as acc`)
      .select(selectName('acc', 'id', DUOLAI_ACCOUNT_INFO, 'type', 'type', 'account_id'))
      .select('acc.account_type').where({ 'acc.id': account_id }))[0]
    if (creator_info?.type == 'business') creator_host = `${config.creator_host}/login/mcn`
    if (creator_info?.account_type == 3) creator_host = `${config.creator_host}/login`
    return creator_host
  }, 180)
}

/**
 * 获取用户是否存在会员购买记录、支付记录
 * @param {*} account_id 
 * @param {knex} trx 
 * @returns 
 */
async function getAccountRecord(account_id = 0, trx = knex) {
  const redis_key = `${RK_BUY_RECORD}:${account_id}`
  return await useCustomCache(redis_key, async () => {
    let back = { has_vip_record: false, has_pay_record: false }
    let vip_info = (await trx(`${VIP_DATA} as vid`)
      .count('vid.id as total')
      .select(knex.raw('SUM(IF(vid.vip_card_type = 1, 1, 0)) as vip_count'))
      .where({ 'vid.account_id': account_id }))[0]
    if (vip_info?.total) back.has_pay_record = true
    if (vip_info?.vip_count) back.has_vip_record = true
    return back
  }, 600)
}

async function GetKeywordDictMapper(type = 1) {
  const KEY = type == 1 ? RK_KWD_DICT_TO_NAME_KEY : RK_KWD_NAME_TO_DICT_KEY;
  const cache_data = await getCustomCache(KEY);
  if (cache_data) return cache_data

  const data = await knex(`${KEYWORD_PROP} as prop`)
    .leftJoin(`${KEYWORD_DICT} as dict`, "prop.id", "dict.prop_id")
    .select("prop.prop", "dict.label", "dict.value")
    .where("prop.comp_type", 2); // 目前只有下拉需要翻译 接口类型走子查询

  const v2n_obj = {}; // val => name
  const n2v_obj = {}; // name => val
  data.forEach(v => {
    const v2n_map = v2n_obj[v.prop] || {};
    v2n_map[v.value] = v.label;
    v2n_obj[v.prop] = v2n_map;

    const n2v_map = n2v_obj[v.prop] || {};
    n2v_map[v.label] = v.value;
    n2v_obj[v.prop] = n2v_map;
  })

  const EXPIRE_SEC = 600;
  await setCustomCache(v2n_obj, RK_KWD_DICT_TO_NAME_KEY, EXPIRE_SEC);
  await setCustomCache(n2v_obj, RK_KWD_NAME_TO_DICT_KEY, EXPIRE_SEC);

  return getCustomCache(KEY);
}
async function clearKeywordDictMapper() {
  await delCustomCache([RK_KWD_DICT_TO_NAME_KEY, RK_KWD_NAME_TO_DICT_KEY]);
}

// 获取account映射
async function GetAccountMapper(roleIds = []) {
  // let data = await knex(ACCOUNT_TABLE).select("id", "name").where(builder => {
  //   if (roleIds && roleIds.length) {
  //     builder.whereIn("role_id", roleIds)
  //   }
  // })
  let mapper = {}
  // handler.setMapper(data, mapper)
  return mapper
}

// 反转键值对
const invertKeyValues = obj =>
  Object.keys(obj).reduce((acc, key) => {
    acc[obj[key]] = key;
    return acc;
  }, {});

const handler = {
  setMapper(data, mapper, key, value) {
    for (let i = 0, len = data.length; i < len; i++) {
      let item = data[i]
      mapper[item[key || "id"]] = item[value || "name"]
    }
  },
  setRoleMapper(data, mapper, key, value) {
    for (let i = 0, len = data.length; i < len; i++) {
      let item = data[i]
      mapper[item[key || "id"]] = item[value || "role_name"]
    }
  },
  async findPid(ids) {
    let knexSql = knex.select('a.id', 'a.direct_leader', 'group_concat(r.role_id) as role_ids')
      .from(ACCOUNT_TABLE + " as a")
      .leftJoin(knex.raw(`${ACCOUNT_ROLE} as r on a.id = r.account_id and r.status = 1`))
      .whereIn('a.id', ids)
      .groupBy('a.id')
    let data = (await knex.raw(knexSql.toQuery().replace(/`/g, '')))[0]
    return data
  },
  async getPersonAccountIds(userInfo, result, filterStatus = true) {
    await getAllChildren(userInfo.id, result)
    result.push(userInfo.id)

    // 获取所有下级
    async function getAllChildren(userId, result) {
      const children = await getNextChildren(userId);
      if (!children.length) {
        return;
      }
      for (let child of children) {
        result.push(child);
        await getAllChildren(child, result);
      }
    }

    // 获取直属下级
    async function getNextChildren(userId) {
      const childrenArr = await knex(ACCOUNT_TABLE).select('id').where({
        'direct_leader': userId,
        "oem_id": userInfo.oem_id,
      }).andWhere(builder => {
        if (filterStatus) {
          builder.where({ 'status': 1, 'flag': 1 })
        }
      })
      const childId = childrenArr.map(item => item.id)
      if (childId.length) {
        return childId;
      } else {
        return [];
      }
    }
  },
}

//获取所有用户的权限名称
async function GetAccountRoleName(ids = []) {
  let result = {}
  let dataSql = knex.select('group_concat(distinct role_name) as role_names', 'acc.account_id')
    .from(`${ROLE_TABLE} as r`)
    .leftJoin(`${ACCOUNT_ROLE} as acc`, 'acc.role_id', 'r.id')
    .where({ 'acc.status': 1, 'r.status': 1 })
    .groupBy('acc.account_id')
  if (ids.length) dataSql.whereIn('acc.account_id', ids)
  let data = (await knex.raw(dataSql.toQuery().replace(/`/g, '')))[0]
  if (!data.length) return result
  data.forEach(item => {
    result[item.account_id] = item.role_names
  })
  return result
}

//获取所有用户的权限详情
async function GetAccountRoleInfo(ids = []) {
  let result = {}
  let dataSql = knex.select('r.*', 'acc.account_id')
    .from(`${ROLE_TABLE} as r`)
    .leftJoin(`${ACCOUNT_ROLE} as acc`, 'acc.role_id', 'r.id')
    .where({ 'acc.status': 1, 'r.status': 1 })
  if (ids.length) dataSql.whereIn('acc.account_id', ids)
  let data = (await knex.raw(dataSql.toQuery().replace(/`/g, '')))[0]
  if (!data.length) return result
  data.forEach(item => {
    if (result[item.account_id]) {
      result[item.account_id].push({ ...item })
    } else {
      result[item.account_id] = [{ ...item }]
    }
  })
  return result
}

//推广项目mapper
async function projectList(userInfo, query = {}) {
  let { type } = query
  let knexSql = knex(ADVERTISER_TABLE).select('id', 'name').where({ status: 1, oem_id: userInfo.oem_id || 1 })
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}
//公司主体mapper
async function subjectList(userInfo, query = {}) {
  let { type } = query
  let knexSql = knex(SUBJECT_TABLE).select('id', 'name').where({ status: 1, oem_id: userInfo.oem_id || 1 })
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}
//简称
async function shortSubjectList(userInfo, query = {}) {
  let { type } = query
  let knexSql = knex(SUBJECT_TABLE).select('id', 'short_name').where({ status: 1, oem_id: userInfo.oem_id || 1 })
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result, 'id', 'short_name')
  }
  return result
}
//结算方式mapper
async function settlementMethodList(userInfo, query = {}) {
  let { type } = query
  let knexSql = knex(SETTLEMENT_METHOD_TABLE).select('id', 'name').where({ status: 1, oem_id: userInfo.oem_id || 1 }).orderBy('id')
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}
//结算参数mapper
async function settlementParamList(userInfo, query = {}) {
  let { advertiser_type, type } = query
  let knexSql = knex(SETTLEMENT_PARAM_TABLE).select('id', 'name', 'advertiser_type').where({ status: 1, oem_id: userInfo.oem_id || 1 })
  if (advertiser_type) knexSql.where('advertiser_type', advertiser_type)
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}
//推广目的mapper
async function extensionGoalList(userInfo, query = {}) {
  let { type } = query
  let knexSql = knex(EXTENSION_GOAL_TABLE).select('id', 'name').where({ status: 1, oem_id: userInfo.oem_id || 1 })
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}

async function deptList(userInfo, query = {}) {
  let { type } = query
  let knexSql = knex(DEPT_TABLE).select('id', 'dept_name as name').where({ status: 1, oem_id: userInfo.oem_id || 1 })
    .andWhere(builder => {
      if (query.ids && query.ids.length) {
        builder.whereIn('id', query.ids.length)
      }
    })
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}

async function platformAccount(userInfo, query = {}) {
  let { type, id } = query
  let knexSql = knex(PLATFORM_ACCOUNT_TABLE).select('platform_account_id as id', 'platform_account_name as name').where({ status: 1, oem_id: userInfo.oem_id || 1 })
  if (id) knexSql.where("id", id)
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}

async function platformAccountId(userInfo, query = {}) {
  let sql = knex(PLATFORM_ACCOUNT_TABLE).select('id', 'platform_account_id').where({
    status: 1,
    oem_id: userInfo.oem_id,
  });
  if (query.id) sql.where("id", query.id)
  let result = await sql
  let platformAccountMapper = {};
  result.forEach(i => {
    platformAccountMapper[i.id] = i.platform_account_id;
  })
  return platformAccountMapper;
}

async function findKoc(query) {
  let result = {}
  let { ids } = query
  if (ids.length) {
    let first = await handler.findPid(ids)
    let firstPid = first.map(item => item.direct_leader)
    let second = await handler.findPid(firstPid)
    first.forEach(item => {
      result[item.id] = { consultant: null, koc: null }
      item.role_ids = item.role_ids ? item.role_ids.split(',') : []
      if (item.role_ids.includes('2')) {
        result[item.id] = { consultant: item.id, koc: item.direct_leader }
      } else if (item.role_ids.includes('3')) {
        let pid = second.find(sItem => sItem.id == item.direct_leader)
        if (pid) {
          if (pid.role_ids.includes('2')) {
            result[item.id].consultant = item.direct_leader
            result[item.id].koc = pid.direct_leader || null
          }
          else
            result[item.id].koc = pid.id || null
        }
      } else {
        result[item.id].consultant = item.direct_leader
        let pid = second.find(sItem => sItem.id == item.direct_leader)
        if (pid) result[item.id].koc = pid.direct_leader || null
      }
    })
  }
  return result
}

async function subUser(query, user) {
  let result = [], account = []
  let userInfo = user
  if (query.id) userInfo = { id: query.id, oem_id: user.oem_id || 0 }
  await handler.getPersonAccountIds(userInfo, result)
  if (result.length) {
    // result = result.filter(item => item != userInfo.id)
    let knexSql = knex.select('a.id', 'a.name')
      .from(`${ACCOUNT_TABLE} as a`)
      .leftJoin(knex.raw(`${ACCOUNT_ROLE} as r on a.id = r.account_id and r.status = 1`))
      .whereIn('a.id', result)
    if (query.role_id) knexSql.where('r.role_id', query.role_id)
    account = await knexSql
  }
  return account.map(item => item.id)
}

async function userDept(userInfo, query = {}) {
  let { type } = query
  let knexSql = knex(ACCOUNT_TABLE).select('id', 'department as name').where({ status: 1, oem_id: userInfo.oem_id || 1 })
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}

async function categoryList(userInfo, query = {}) {
  let { type } = query
  let knexSql = knex(CATEGORY_TABLE).select('id', 'name').where({ status: 1, oem_id: userInfo.oem_id || 1 })
  let back = await knexSql
  let result = {}
  if (type && type == 'arr') {
    result = back
  } else {
    handler.setMapper(back, result)
  }
  return result
}

async function getPlatformMapper(userInfo, query = {}) {
  const cacheKey = RK_MAPPER_PLATFORM
  const cache = await getCustomCache(cacheKey);
  if (cache) return cache;

  const sql = knex(PLATFORM_TABLE)
    .select("id", "name", "icon", "sort", "status")
    .where({ oem_id: userInfo.oem_id });
  if (query.status) sql.where("status", query.status)
  const data = await sql
  const mapper = {}
  data.forEach(v => {
    mapper[v.id] = v;
  });
  mapper[0] = { id: 0, name: "不限", icon: "https://koc-img.domain.cn/xgfx/app/other.png", status: 1 }
  await setCustomCache(mapper, cacheKey, 600);
  return mapper
}

async function getAdvertiserMapper(userInfo = {}) {
  const cache = await advertiser_mapper(userInfo);
  const map = {};

  for (let [k, v] of Object.entries(cache)) {
    map[k] = {
      id: v.advertiser_type,
      name: v.advertiser_type_name,
      icon: v.advertiser_icon,
      promotion_type: JSON.parse(v.promotion_type || '[]'),
      business_type: v.business_type
    }
  }
  return map;
}


async function getAdvertierSettlements(advertiser_type = null) {
  // const cache_key = `xgfx:finance:advertier:settlements`;
  const cache_data = await getCustomCache(RK_ADVERTISER_SETTLEMENTS);
  if (cache_data) {
    if (advertiser_type) return cache_data[advertiser_type] || [];
    return cache_data;
  }
  const policy_sql = knex(`${POLICY_TABLE} as p`)
    .select("p.advertiser_type", "p.promotion_type", "p.channel_id", "p.data_type", "smt.id", "smt.name", "ps.publish as value", "smt.suffix")
    // .select(knex.raw("IF(ps.settlement_id = 3, '‰', '分') as unit"))
    .leftJoin(`${POLICY_SETTLEMENT_TABLE} as ps`, "p.id", "ps.policy_id")
    .leftJoin(`${SETTLEMENT_METHOD_TABLE} as smt`, "ps.settlement_id", "smt.id")
    .where({ "p.status": 1, "p.verify_status": 3 })
    .whereRaw(`CURDATE() >= p.effective_start_date and ( p.effective_end_date IS NULL OR CURDATE() <= p.effective_end_date )`)
    .orderBy([{ column: "p.channel_id", order: 'desc' }, { column: "smt.id", order: 'asc' }]);
  const policy_list = await policy_sql;
  const map = {};
  policy_list.forEach(v => {
    map[v.advertiser_type] = map[v.advertiser_type] || []
    map[v.advertiser_type].push(v);
  })
  await setCustomCache(map, RK_ADVERTISER_SETTLEMENTS, 120);

  if (advertiser_type) return map[advertiser_type] || []
  return map;
}

async function getAdvertierMounts(advertiser_type = null, userInfo = {}) {
  // const cache_key = `xgfx:finance:advertier:mounts`;
  const cache = await advertiser_mapper(userInfo);
  const map = {};

  for (let [k, v] of Object.entries(cache)) {
    map[k] = v.mount_type
  }
  if (advertiser_type) return map[advertiser_type] || []
  return map;
}

async function getAccountVipLelve(account_id = null) {
  let vip_info = { vip_card_id: null, level_name: null }
  if (!account_id) return vip_info
  const cacheKey = `${RK_MAPPER_ACCOUNT_LELVE}${account_id}`;
  const cache = await getCustomCache(cacheKey);
  if (cache) return cache;
  vip_info = (await knex(`${VIP_DATA} as vid`)
    .select('vid.vip_card_id')
    .select(selectName('card', 'level', VIP_LEVEL, 'name', 'level_name'))
    .leftJoin(`${VIP_CARD} as card`, 'card.id', 'vid.vip_card_id')
    .where({ 'vid.vip_card_type': 1, 'vid.status': 1, 'vid.account_id': account_id })
    .limit(1)
    .orderBy('card.level', 'desc'))[0] || vip_info
  await setCustomCache(vip_info, cacheKey, 3600);
  return vip_info
}
async function removeVipLelveCache(account_id = null) {
  if (!account_id) return
  const cacheKey = `${RK_MAPPER_ACCOUNT_LELVE}${account_id}`;
  await delCustomCache([cacheKey]).catch(err => { console.log('缓存删除失效！', err); })
}
// tag_ids = [1,2,3] return [{label:name,value:id}]
async function getTagsData(tag_ids = null) {
  let back = []
  if (!tag_ids) return back
  await Promise.all(tag_ids.map(async id => {
    const cacheKey = `${RK_MAPPER_TAGS}${id}`;
    const cache = await getCustomCache(cacheKey);
    if (cache) {
      back.push({ label: cache?.name, value: id })
    } else {
      let tag_info = (await knex(`${TAG_TABLE} as tag`).select('tag.*').where({ 'tag.id': id }).limit(1))[0]
      if (tag_info) {
        await setCustomCache(tag_info, cacheKey, 3600);
        back.push({ label: tag_info?.name, value: id })
      }
    }
  }))
  return back
}
async function getChannelRouterIds(channel_id = null) {
  const cache_key = `${RK_CHANNEL_ROUTER}:${channel_id}`;
  const cache_data = await getCustomCache(cache_key);
  if (cache_data && process.env.NODE_ENV == "production") return cache_data;

  const adver_sql = knex(`${CHANNEL_TABLE} as chl`)
    .select("chl.id", "chl.manage_router")
    .where({ "chl.status": 1, "chl.id": channel_id })
  const adver_list = JSON.parse((await adver_sql)[0]?.manage_router || '[]')

  await setCustomCache(adver_list, cache_key, 120);
  return adver_list;
}

async function getChannel(channel_id = null) {
  const cache_key = `${RK_CHANNEL_INFO}:${channel_id}`;
  const cache_data = await getCustomCache(cache_key);
  if (cache_data && process.env.NODE_ENV == "production") return cache_data;

  const sql = knex(`${CHANNEL_TABLE} as chl`)
    .select("chl.id", "chl.name", "chl.logo")
    .where({ "chl.status": 1, "chl.id": channel_id })
  const data = (await sql)[0]
  await setCustomCache(data, cache_key, 600);
  return data;
}

async function getMineTypeMapper(userInfo, query = {}) {
  const cacheKey = RK_MAPPER_MIME_TYPE
  const cache = await getCustomCache(cacheKey);
  if (cache) return cache;

  const sql = knex(CONTENT_MIME)
    .select("id", "name", "status");
  if (query.status) sql.where("status", query.status)
  const data = await sql
  const mapper = {}
  data.forEach(v => {
    mapper[v.id] = v;
  });
  await setCustomCache(mapper, cacheKey, 600);
  return mapper
}
module.exports = {
  GetAccountMapper,
  GetRoleTypeMapper,
  invertKeyValues,
  GetAccountRoleName,
  GetAccountRoleInfo,
  projectList,
  subjectList,
  shortSubjectList,
  settlementMethodList,
  settlementParamList,
  extensionGoalList,
  deptList,
  findKoc,
  subUser,
  platformAccount,
  platformAccountId,
  userDept,
  categoryList,
  getPlatformMapper,
  GetKeywordDictMapper,
  clearKeywordDictMapper,
  getAdvertiserMapper,
  getAdvertierSettlements,
  getAdvertierMounts,
  getAccountVipLelve,
  removeVipLelveCache,
  getTagsData,
  getChannelRouterIds,
  getMineTypeMapper,
  getChannel,
  getCreatorHost,
  getAccountRecord
}