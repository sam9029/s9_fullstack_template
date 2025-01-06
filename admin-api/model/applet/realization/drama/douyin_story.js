const moment = require("moment");
const knex = require("../../../../db/knexManager").knexProxy;
const { CONTENT_TABLE, CONTENT_RELATION, ADVERTISER_TABLE, AUTH_ACCOUNT } = require("../../../../config/setting");
const { app_image_resize } = require("../../../../config/index")
const { knexTransaction, sleep, selectName, factoryAppListResponse, renderPrice, timestampSec, getUuid, extractLinks } = require("../../../../utils/tools");
const { checkKeys, isEmpty, isArrayHas } = require("../../../../utils/check_type");
// const { getPermission } = require("../../public/permission");
const { sqlPagination, sqlCount } = require("../../../../utils/sqlHelper");
const { getLogData, insertLog } = require("../../../public/operationLog");
const { getCustomCache, setCustomCache } = require("../../../../db/redis");
//
const { RK_DOUYIN_AUTH } = require("../../../../config/redis_key");
const { codeToUser, makeClientToken } = require("../../../oauth/douyin/index")
const { getDewatermark } = require("../../create/tools")
const OSS = require('ali-oss');
const CryptoJs = require('crypto-js')
const { bucket, system_account_id } = require('../../../../config/index');
const store = new OSS(bucket);
const publicHost = bucket.publicHost;
async function get_avatar(body = {}, userInfo = {}) {
  let { id: account_id } = userInfo
  const { auth_code } = checkKeys(body, [
    { key: "auth_code", type: String, required: true }
  ]);
  let data = await codeToUser(auth_code)
  let auth_key = getUuid()
  let redis_key = `${RK_DOUYIN_AUTH}:${account_id}:${auth_key}`
  if (!data) return Promise.reject('授权信息获取失败，请重新授权！')
  await setCustomCache(data, redis_key, 600)
  return { code: 0, data: { auth_key, name: data.name, avatar: data.avatar } }
}
const request = require("../../../../utils/request");
function getAvatar(url) {
  return request({
    url,
    method: 'get',
    headers: {
    },
    responseType: "stream"
  })
}
async function getAvatarUrl(url) {
  let md5 = CryptoJs.MD5(url)
  let result = await store.putStream(`auth_account_avatar/${md5}.jpg`, await getAvatar(url))
  return publicHost + result.name
}
async function create_plan(body = {}, userInfo = {}) {
  let { id: account_id, oem_id } = userInfo
  let { content_id = 0, advertiser_type, opus_url, auth_type, auth_key, uid } = checkKeys(body, [
    "opus_url", "advertiser_type", "auth_key?", "uid?", "content_id?",
    { key: "auth_type", type: String, required: true, validator: val => isArrayHas(['UID', 'AUTH'], val) }
  ]);
  //[uid, opus_url, content_id, advertiser_type]
  // [auth_key, opus_url, content_id, advertiser_type]
  opus_url = extractLinks(opus_url)?.shift()
  if (!opus_url) return Promise.reject('作品链接无效！')
  if (auth_type == 'AUTH') return Promise.reject('跳转申请已关闭，请使用表单申请！')
  if (uid) uid = String(uid).trim()
  if (auth_type == 'AUTH' && !auth_key) return Promise.reject('请填写auth_key字段！')
  if (auth_type == 'UID' && !uid) return Promise.reject('请填写uid字段！')
  let cache_auth = await getCustomCache(`${RK_DOUYIN_AUTH}:${account_id}:${auth_key}`)
  if (auth_type == 'AUTH' && !cache_auth) return Promise.reject('授权信息获取失败，请重新授权！')
  let opus_info = await getDewatermark({ url: opus_url })
  if (!opus_info || !opus_info?.author) return Promise.reject("作品链接不合法！")
  let opus_author_uid = opus_info.author?.uid || null
  let opus_author_name = opus_info.author?.name || null
  // if (auth_type == 'UID' && opus_author_uid != uid) return Promise.reject('用户填写UID与作品不一致，请重新填写！')
  if (auth_type == 'AUTH' && opus_author_name != cache_auth?.name) return Promise.reject('用户授权账户与作品不一致，请重新填写！')
  let insert_data = {
    account_id,
    content_id,
    advertiser_type,
    oem_id,
    douyin_uid: uid,
    name: opus_author_name,
    avatar: opus_info.author?.avatar,
    create_user_id: account_id,
    update_user_id: account_id,
    auth_status: 2,
    ...(cache_auth || {}),
  }
  if (insert_data.avatar) insert_data.avatar = await getAvatarUrl(insert_data.avatar)
  let data_id = await knexTransaction(async trx => {
    let before_data = (await trx.select('*').from(AUTH_ACCOUNT)
      .where({ advertiser_type, douyin_uid: insert_data.douyin_uid, oem_id }).limit(1))[0]
    if (before_data) return Promise.reject('该账户已申请，请勿重复添加！')
    let id = (await trx(AUTH_ACCOUNT).insert(insert_data))[0]
    await insertLog(trx, getLogData(id, 1315, insert_data, userInfo))
    return id
  })
  return { code: 0, data: { id: data_id, message: "账号申请成功！" } }
}
// makeClientToken().then(res => console.log(res))
let cloums = ['id', 'name', 'avatar', 'verify_status', 'verify_suggest']
async function list(query = {}, userInfo = {}) {
  let { verify_status, status, pagesize = 10, next_page_site = null } = checkKeys(query,
    ["verify_status?", "status?", 'pagesize?', "next_page_site?"])
  let { id: account_id } = userInfo
  let dataSql = knex(AUTH_ACCOUNT).select(cloums).where({ account_id })
  if (verify_status) dataSql.where({ verify_status })
  if (status) dataSql.where({ status })
  else dataSql.where({ status: 1 })
  if (next_page_site) dataSql.where('id', '<', next_page_site)
  let list = await dataSql.orderBy('id', 'desc').limit(pagesize)
  list.forEach(i => {
    i.verify_suggest = i.verify_suggest || '审核失败！'
  })
  next_page_site = null
  if (list.length) {
    let last = list[list.length - 1]
    next_page_site = last?.id || null
  }
  if (list.length < (pagesize)) next_page_site = null
  return { code: 0, data: { list, next_page_site } }
}

async function change_bind(body = {}, userInfo = {}) {
  let { id: account_id } = userInfo
  let { id, operation_type, url } = checkKeys(body, [
    "id", "url?",
    { key: "operation_type", type: String, required: true, validator: val => isArrayHas(['QUERY', 'ADD', 'UNBIND'], val) }
  ]);
  let before_data = (await knex.select('*')
    .from(AUTH_ACCOUNT)
    .where({ account_id, id, verify_status: "REBIND_REJECT" })
    .limit(1))[0]
  if (!before_data) return Promise.reject('该账号不存在或已删除！')
  let data = {
    douyin_uid: before_data.douyin_uid,
    name: before_data.name,
    description: "确认只在小果繁星机构进行抖音故事活动申请及推广吗？"
  }
  if (operation_type == 'QUERY') return { code: 0, data }
  if (operation_type == 'UNBIND') {
    data.description = '您的账号在小果繁星进行投放后将无收益产生，请联系原机构进行投放结算'
    return { code: 0, data }
  }
  if (operation_type == 'ADD' && !url) return Promise.reject('参数url缺失！')
  await knexTransaction(async trx => {
    let update_data = { verify_status: "REBIND_APPROVE", rebind_screenshot: url }
    await trx(AUTH_ACCOUNT).update(update_data).where({ account_id, id, verify_status: "REBIND_REJECT" })
    await insertLog(trx, getLogData(id, 1316, update_data, userInfo, before_data))
  })
  return { code: 0, data: { id, message: "换绑申请成功！", description: "现在将为您返回申请列表页面，并重新申请" } }
}
module.exports = {
  create_plan,
  get_avatar,
  list,
  change_bind
}