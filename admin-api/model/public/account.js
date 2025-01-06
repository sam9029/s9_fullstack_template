const config = require('../../config');
const crypto = require('crypto'); //加载加密文件
const { ACCOUNT_TABLE, ACTINFO_TABLE, INVITE_DATA } = require('../../config/setting');
const { knexTransaction, validateUrl, checkSildeCode, getWeakPassword } = require("../../utils/tools")
const { getLogData, insertLog } = require("./operationLog")
const { GENDER_ENUM } = require("../../enum/public")
// const { getUidInfo, saveInviteLog } = require("./vip/index")
const { info: getAccountInfo } = require("../marking/user")
const WEAK_PWD = getWeakPassword()
const moment = require("moment");
exports.changePassword = async (body = {}, userInfo = {}, req) => {
  let { id: account_id } = userInfo
  let { password = null, captcha_code = null, old_password = null } = body
  if (!account_id || !captcha_code || !password) return Promise.reject('请检查填写信息是否完整！')
  if (password.length < 6) return Promise.reject('密码长度小于6位！')
  if (!await checkSildeCode(req, captcha_code)) return Promise.reject('验证码错误！')
  password = crypto.createHash('md5').update(password + config.deviation).digest('hex')
  old_password = crypto.createHash('md5').update(old_password + config.deviation).digest('hex')
  if (WEAK_PWD.includes(String(password))) return Promise.reject('密码安全性较低！')
  await knexTransaction(async trx => {
    let before_data = (await trx(ACCOUNT_TABLE).select('password').where({ id: account_id }))[0].password
    if (before_data && before_data != old_password) return Promise.reject('账户原密码不正确！')
    await trx(ACCOUNT_TABLE).update({ password }).where({ id: account_id })
    await insertLog(trx, getLogData(account_id, 107, { password }, userInfo, { password: old_password }))
  })
  return { code: 0, data: '修改密码成功' }
};

exports.edit = async (body = {}, userInfo = {}) => {
  let { id: account_id } = userInfo
  let new_data = handler.checkData(body)
  if (!account_id) return Promise.reject('参数异常！')
  data = await knexTransaction(async trx => {
    let before_data = (await trx.select('acc.name', 'acf.gender', 'acf.avatar', 'acf.birth', 'acf.region')
      .from(`${ACCOUNT_TABLE} as acc`).leftJoin(`${ACTINFO_TABLE} as acf`, 'acc.id', 'acf.account_id')
      .where('acc.id', account_id).where('acc.status', 1))[0]
    if (!before_data) return Promise.reject('账户不存在或已关闭！')
    if (Object.keys(new_data).length > 0) await trx(ACTINFO_TABLE).update(new_data).where('account_id', account_id)
    if (body.name) {
      await trx(ACCOUNT_TABLE).update({ name: body.name }).where('id', account_id)
      new_data.name = body.name
    }
    await insertLog(trx, getLogData(account_id, 106, new_data, userInfo, before_data))
    return { ...before_data, ...new_data }
  })
  return { code: 0, data }
};
//用户绑定邀请码 
exports.bindInviter = async (body = {}, userInfo = {}) => {
  let { id: account_id, account_type } = userInfo
  let { invite_code } = body
  if (![1, 4].includes(Number(account_type))) return Promise.reject('全职类型账户暂不允许绑定邀请码！')
  if (!account_id || !invite_code) return Promise.reject('参数异常！')
  data = await knexTransaction(async trx => {
    let acc_invite = (await trx(INVITE_DATA).select('id').where({ invite_account_id: account_id }))[0]
    if (acc_invite) return Promise.reject('用户已绑定邀请码，请勿重复绑定！')
    let { inviter_id, oem_id } = await getUidInfo(invite_code, null, trx)
    if (inviter_id == account_id) return Promise.reject('禁止绑定本人邀请码！')
    let account_back = (await trx(INVITE_DATA).select('id').where({ inviter_id: account_id, invite_account_id: inviter_id }))[0]
    if (account_back) return Promise.reject('禁止互相绑定邀请码！')
    let insert_data = {
      inviter_id,
      invite_account_id: account_id,
      create_date: moment().format('YYYY-MM-DD'),
      create_user_id: account_id,
      update_user_id: account_id,
      oem_id
    }
    let invite_data_id = (await trx(INVITE_DATA).insert(insert_data))[0]
    await insertLog(trx, getLogData(invite_data_id, 108, insert_data, userInfo))
    return invite_data_id
  })
  return { code: 0, data: '邀请码绑定成功！' }
};
exports.info = async (body = {}, userInfo = {}) => {
  let data = await getAccountInfo(userInfo, 'applet')
  return data
};
const handler = {
  checkData(body = {}) {
    let dataKeys = ['gender', 'avatar', 'birth', 'region']
    let data = {}
    // console.log(body.avatar, validateUrl(String(body.avatar)));
    if (body.avatar && validateUrl(String(body.avatar))) throw new Error('头像类型错误！')
    if (body.name && String(body.name).length > 10) throw new Error('昵称长度超出限制！')
    if (body.birth && !moment(body.birth, 'YYYY-MM-DD', true).isValid()) throw new Error('生日类型错误！')
    if (body.gender && !Object.keys(GENDER_ENUM).includes(String(body.gender))) throw new Error('性别类型错误！')
    dataKeys.forEach(key => {
      if (Object.hasOwnProperty.call(body, key) && body[key]) data[key] = body[key]
    })
    return data
  },
}

