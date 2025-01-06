const { sms: SMS } = require("../../config/index")
const { SMS_TABLE } = require("../../config/setting")
// const Core = require('@alicloud/pop-core');
const knex = require("../../db/knexManager").knexProxy
// const client = new Core(SMS);
const moment = require("moment")
const { doRequest } = require("../oauth/huoshan/sms")
const requestOption = {
    method: 'POST'
};
function getSendParams(phone, code) {
    return {
        PhoneNumbers: phone,//接收短信的手机号码
        SignName: "推小果管理平台",//短信签名名称
        TemplateCode: "SMS_235825128", //短信模板CODE,
        TemplateParam: JSON.stringify({ code })
    }
}
function getCode() {
    const vertify = '0123456789'
    let sd = '';
    for (let i = 0; i < 6; i++) {
        sd += String(Math.floor(Math.random() * (vertify.length)))
    }
    return sd
}
async function sendSms(params = {}) {
    let { phone, sms_type } = params
    const code = getCode()
    if (!phone || !sms_type) return Promise.reject('参数异常，请检查参数！')
    let before = (await knex(SMS_TABLE).select('id as sms_id', 'expire_time', 'create_time')
        // .select(knex.raw(`(${process.env.NODE_ENV == "production" ? 'null' : code}) as code`))
        .select(knex.raw(`IF(CURRENT_TIMESTAMP >= send_time,0,TIMESTAMPDIFF( SECOND, CURRENT_TIMESTAMP, send_time )) as limit_second`)) //多少秒后才可以重发
        .where({ phone, sms_type, status: 1 })
        .whereRaw(`CURRENT_TIMESTAMP <= send_time`)
        .limit(1).orderBy('id', 'desc'))[0]
    if (before && before.limit_second > 0) return before
    let message = null
    if (process.env.NODE_ENV == "production") await doRequest(phone, code)
    // await client.request('SendSms', getSendParams(phone, code), requestOption).catch(err => {
    //     message = err
    // })
    if (message) return Promise.reject('短信发送过于频繁，请稍后再试！')
    // console.log(send_info);
    let send_time = moment().add(2, "minutes").format("YYYY-MM-DD HH:mm:ss")
    let expire_time = moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss")
    let sms_id = (await knex(SMS_TABLE).insert({
        phone, sms_type, code,
        send_time,
        expire_time,
    }))[0]
    let back = { sms_id, limit_second: 120, send_time, expire_time, }
    if (process.env.NODE_ENV != "production") back.code = code
    return back
}
async function checkSms(params = {}) {
    let { sms_id, code, sms_type, phone } = params
    if (!sms_id || !code || !sms_type) return Promise.reject('查询信息异常！')
    let sms_info = (await knex(SMS_TABLE).select('id as sms_id', 'phone', 'sms_type')
        .select(knex.raw(`IF(CURRENT_TIMESTAMP >= expire_time,0,TIMESTAMPDIFF( SECOND, CURRENT_TIMESTAMP, expire_time )) as limit_second`)) //多少秒后才过期
        .where({ id: sms_id, code, status: 1, sms_type })
        .where(builder => {
            if (phone) builder.where({ phone })
        }))[0]
    // console.log(sms_info);
    if (!sms_info) return Promise.reject('验证码错误或已失效！')
    await knex(SMS_TABLE).update({ status: 2 }).where({ id: sms_id })
    if (sms_info.limit_second <= 0) return Promise.reject('验证码已过期！')
    return sms_info
}
module.exports = {
    sendSms,
    checkSms
}
// checkSms({ sms_id: 2, code: 500596 })
// sendSms({ phone: 17396983034, sms_type: 1 })
// client.request('SendSms', getSendParams(17396983034, 123456), requestOption).then((result) => {
//     console.log(JSON.stringify(result));
// }, (ex) => {
//     console.log(ex);
// })