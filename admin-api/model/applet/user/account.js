const knex = require("../../../db/knexManager").knexProxy;
const multer = require('multer');
const uploadSingle = multer().single('file');
const crypto = require('crypto');
const { uploadFile } = require('../../public/upload')
const { bufferToStream, knexTransaction, timestampSec } = require('../../../utils/tools')
const { ACCOUNT_TABLE, ACTINFO_TABLE, KOC_REGION, PLATFORM_ACCOUNT_TABLE, COURSE_WATCH, COURSE_FAVORITE, INVITE_DATA, CONTENT_FAVORITE, CONTENT_WATCH, APPLET_PLAN, CONTENT_FAVORITE_V2, CONTENT_WATCH_V2 } = require("../../../config/setting")
const { getAppletUrl } = require('../../wechat/public')
const moment = require("moment");
const { getLogData, insertLog } = require('../../public/operationLog');
const config = require('../../../config');
const { encrypt, decrypt } = require("../../../utils/jwt")
const request = require("../../../utils/request");
// const { checkBankName } = require('../../public/bank');
const { checkKeys, isArrayHas } = require("../../../utils/check_type")
const { checkSms } = require('../../public/sms')
const knexMount = require("../../../db/knexMount").knexProxy
// const { RK_BIND_XGSJ } = require("../../../config/redis_key")
const { getRedisClient } = require("../../../db/redis")
// const { AGENT_ID, changeAgent } = require("../../oauth/douyin/applet_plan")


async function update(body, user = {}) {
  if (body.iv && body.content) body = decrypt(body, user.token)
  let { old_password, new_password } = body;
  let id = user.id;
  if (!id) return Promise.reject('请设置用户ID！')
  let accountUpdate = checkKeys(body, [
    { key: 'name', type: String, validator: (val) => val.length <= 10, required: false, format: (val) => val.trim() }
  ])
  let infoUpdate = checkKeys(body, [
    { key: 'avatar', type: URL, format: (val) => val.trim(), required: false },
    { key: 'gender', type: Number, validator: (val) => isArrayHas([1, 2, 3], val), required: false },
    { key: 'birth', type: String, format: (val) => val.trim(), required: false },
    { key: 'region', type: String, format: (val) => val.trim(), required: false },
  ])
  let oldData = (await knex(ACTINFO_TABLE).select('*').where('account_id', id))[0]
  if (!oldData) return Promise.reject('未查询到该用户信息!');

  let data = (await knex(ACCOUNT_TABLE).select('*').where('id', id))[0];
  if (!data) return Promise.reject('未查询到该用户信息!')

  await knexTransaction(async (trx) => {
    if (old_password || new_password) {
      if (data.password && !old_password) return Promise.reject('请输入旧密码！')
      if (!new_password) return Promise.reject('请输入新密码！');
      let { password, telephone } = data
      if (password && password !== crypto.createHash('md5').update(old_password + config.deviation).digest('hex')) return Promise.reject('旧密码不正确！')
      let weak_pwd = [...config.weak_pwd, String(telephone)]
      if (weak_pwd.includes(new_password)) return Promise.reject('密码强度太低，请更换密码！')
      accountUpdate.password = crypto.createHash('md5').update(new_password + config.deviation).digest('hex');
    }

    if (!Object.keys(accountUpdate).length && !Object.keys(infoUpdate).length) throw new Error('未设置更新内容')

    if (Object.keys(accountUpdate).length) {

      await trx(ACCOUNT_TABLE).update(accountUpdate).where("id", id)
      let logData = getLogData(id, 102, accountUpdate, user, data);
      await insertLog(trx, logData);
    }

    if (Object.keys(infoUpdate).length) {
      await trx(ACTINFO_TABLE).update(infoUpdate).where('account_id', id);
      let logData = getLogData(id, 102, infoUpdate, user, oldData);
      await insertLog(trx, logData);
    }
  })

  let obj = { code: 0, message: "修改用户成功！", };
  return obj;
}

async function updateAvatar(req, res) {
  //form 表单数据，小程序上需要表单，调用upload 接口，
  let data = await new Promise((resolve, reject) => {
    uploadSingle(req, res, (err) => {
      if (err) return reject(err)
      if (!req.file) return reject('未上传头像文件！')
      if (req.file.size > 1024 * 1024) return reject('文件大小不超过1Mb！')
      resolve({ ...(req.body || {}), buffer: req.file.buffer, file_name: req.file.originalname })
    })
  })
  let md5 = crypto.createHash('md5').update(data.buffer).digest('hex')
  let stream = bufferToStream(data.buffer)
  stream.query = { name: data.file_name, md5 }
  let upload_info = await uploadFile(stream, req.$user, 'avatar')
  const { id: account_id } = req.$user || {}
  const { url: avatar } = upload_info || {}
  if (avatar && account_id) {
    await knex(ACTINFO_TABLE).update({ avatar }).where({ account_id })
    if (req.body && req.body.name) await knex(ACCOUNT_TABLE).update({ name: req.body.name }).where({ id: account_id })
  } else return Promise.reject('信息异常！')
  return { code: 0, data: avatar }
}

async function getRegion(query) {
  let { region_code } = query;
  let level = await knex(KOC_REGION).select('code', 'name').where('pid', null);
  let level2 = [];
  if (region_code) {
    level2 = await knex(KOC_REGION).select('code', 'name').where('pid', region_code);
  } else {
    level2 = await knex(KOC_REGION).select('code', 'name').where('pid', level[0].code);
  }
  return {
    code: 0,
    data: [level, level2]
  }
}
async function shareInfo(query, userInfo) {
  const account_id = query.account_id || userInfo.id || null
  const { id: update_user_id } = userInfo
  if (!account_id) return Promise.reject('未设置分享人ID！')
  let search = (await knex.select('acc.name as account_name', 'acc.uid as invite_code', 'info.avatar as account_avatar')
    .select(knex.raw(`CONCAT_WS(' ',preg.name,reg.name) as region_name`))
    .from(`${ACCOUNT_TABLE} as acc`)
    .leftJoin(`${ACTINFO_TABLE} as info`, 'info.account_id', 'acc.id')
    // .leftJoin(`${KOC_REGION} as reg`, 'info.region', 'reg.code')
    // .leftJoin(`${KOC_REGION} as preg`, 'reg.pid', 'preg.code')
    .where({ 'acc.id': account_id }).limit(1))[0]
  if (!search) return Promise.reject('未查询到该顾问！')
  search.qr_link = `https://test.domain.cn/fast_register?cst=${search.account_uid}`
  let data = await knexTransaction(async (trx) => {
    if (!search.expire_date || search.expire_date <= moment().format("YYYY-MM-DD")) {
      let new_info = await getAppletUrl(`cst=${search.account_uid}`)
      await trx(ACTINFO_TABLE).update({ ...new_info }).where({ account_id })
      await insertLog(trx, getLogData(account_id, 1008, { ...new_info, update_user_id }, userInfo, search))
      search = { ...search, ...new_info }
    }
    // let base64 = Buffer.from(QR.imageSync(search.qr_link, { type: 'png' })).toString('base64')
    // search.image_base64 = String(`data:image/png;base64,${base64}`)
    return search
  })
  return { code: 0, data }

}
function getWechatAvatar(url) {
  return request({
    url,
    method: 'get',
    responseType: "stream"
  })
}
async function getAvatarUrl(avatar, user) {
  try {
    let stream = await getWechatAvatar(avatar)
    stream.query = { name: "avatar.jpg" }
    let info = await uploadFile(stream, user, 'avatar', false)
    return info.url
  } catch (error) {
    return await getAvatarUrl(avatar, user)
  }

}
async function operationNum(params, user, req) {
  const { $version, $platform } = req;
  let { id: account_id } = user

  let content_collect_num = knex.where({ create_user_id: account_id, status: 1 })
  let content_view_num = knex.where({ create_user_id: account_id, status: 1 })
  if($platform == "ios" && $version > 166 || $platform == 'android' && $version >733)  {
    content_collect_num.from(CONTENT_FAVORITE_V2).countDistinct('content_relation_id as count')
    content_view_num.from(CONTENT_WATCH_V2).countDistinct('content_relation_id as count')
  } else {
    content_collect_num.from(CONTENT_FAVORITE).countDistinct('content_id as count')
    content_view_num.from(CONTENT_WATCH).countDistinct('content_id as count')
  }

  let account_num = knex(PLATFORM_ACCOUNT_TABLE).count('id as count')
    .where({ blogger_id: account_id, status: 1 })

  let course_collect_num = knex(COURSE_FAVORITE).countDistinct('course_id as count')
    .where({ create_user_id: account_id, status: 1 })

  let course_view_num = knex(COURSE_WATCH).countDistinct('course_id as count')
    .where({ create_user_id: account_id, status: 1 })

  let all = await Promise.all([account_num, course_collect_num, course_view_num, content_collect_num, content_view_num])

  let course_collect = all[1][0]?.count || 0
  let content_collect = all[3][0]?.count || 0

  let course_view = all[2][0]?.count || 0
  let content_view = all[4][0]?.count || 0

  if($platform == "ios" && $version > 166 || $platform == 'android' && $version >733)  {
    course_collect = 0
    course_view = 0
  }

  return {
    code: 0, data: {
      account_num: all[0][0]?.count || 0,
      collect_num: Number(course_collect) + Number(content_collect),
      view_num: Number(course_view) + Number(content_view),
    }
  }
}
async function unsubscribe(body = {}, userInfo = {}) {
  let { sms_id, captcha_code } = checkKeys(body, [{ key: "sms_id", required: true },
  { key: "captcha_code", required: true }])
  await checkSms({ sms_id, code: captcha_code, sms_type: 7, phone: userInfo.telephone })
  async function getOldPhone(phone, trx = knex) {
    phone = phone + '_UB_' + timestampSec()
    return phone
  }
  let back = await knexTransaction(async trx => {
    let new_phone = await getOldPhone(userInfo.telephone)
    let update = {
      status: 4, //注销账号
      apple_id: null,
      wechat_id: null,
      union_id: null,
      telephone: new_phone
    }
    await trx(ACCOUNT_TABLE).update(update).where('id', userInfo.id)
    await trx(INVITE_DATA).update({ bind_status: 2 }).where('inviter_id', userInfo.id)
    await insertLog(trx, getLogData(userInfo.id, 110, update, userInfo, userInfo))
    return "success"
  })
  return { code: 0, data: { message: back } }
}
//检查用户是否为小果视界用户，符合条件后，开始弹窗
async function checkBind(query, userInfo = {}) {
  let back = { code: 0, data: { show: false, times: 0 } }
  let { telephone, id: account_id } = userInfo
  if (!telephone) return Promise.reject('该账户未绑定手机号！')
  let data = await knexMount(`${APPLET_PLAN} as plan`)
    .leftJoin(`${ACCOUNT_TABLE} as acc`, 'acc.id', 'plan.account_id')
    .select('plan.*')
    .where({ 'acc.migrate': 'NOT', 'acc.telephone': telephone })
  // 拿到绑定账号的数据，存在的话提示用户弹窗绑定
  if (!data?.length) return back
  back.data.show = true

  let redis_key = `${RK_BIND_XGSJ}${moment().format('YYYYMMDD')}:${account_id}`

  let expire_time = moment().endOf('days').diff(moment(), 'seconds')

  let [has, count] = await getRedisClient().multi().set(redis_key, 0, { NX: true, EX: expire_time }).incrBy(redis_key, 1).exec()
  back.data.times = count

  if (count > 3) back.data.show = false
  return back
}

async function confirmBind(body = {}, userInfo = {}) {
  let { telephone, id: account_id } = userInfo
  if (!telephone) return Promise.reject('该账户未绑定手机号！')
  let data = await knexMount(`${APPLET_PLAN} as plan`)
    .leftJoin(`${ACCOUNT_TABLE} as acc`, 'acc.id', 'plan.account_id')
    .select('plan.douyin_id', 'plan.bind_time', 'plan.unbind_time', 'plan.bind_status')
    .where({ 'acc.migrate': 'NOT', 'acc.telephone': telephone })
  // 拿到绑定账号的数据，存在的话提示用户弹窗绑定
  // console.log(data);
  if (!data?.length) return Promise.reject('暂无可绑定账号！')
  let new_data = data.map(i => {
    return { ...i, account_id, agent_id: AGENT_ID }
  })
  // console.log(new_data);

  await knexTransaction(async trx => {
    await knexMount(ACCOUNT_TABLE).update({ migrate: "XGFX" }).where({ telephone })
    if (process.env.NODE_ENV == "production") { //生产环境才切换抖音团长
      await Promise.all(new_data.map(async i => {
        return await changeAgent(AGENT_ID, i.douyin_id, account_id)
      }))
    }
    let logs = []
    for (let index = 0; index < new_data.length; index++) {
      const element = new_data[index];
      let id = await trx(APPLET_PLAN).insert(element).onConflict(['agent_id', 'account_id', 'douyin_id']).merge()
      logs.push(getLogData(id, 20000, element, userInfo))
    }
    if (logs?.length) await insertLog(trx, logs)
  })
  return { code: 0, data: { message: '换绑成功！' } }
}
module.exports = {
  update,
  updateAvatar,
  getRegion,
  shareInfo,
  operationNum,
  unsubscribe,
  checkBind,
  confirmBind
}