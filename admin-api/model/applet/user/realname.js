const knex = require("../../../db/knexManager").knexProxy;
const { knexTransaction, timestampSec } = require('../../../utils/tools')
const { DUOLAI_ACCOUNT_INFO, ACCOUNT_REALNAME } = require("../../../config/setting");
const { checkKeys } = require("../../../utils/check_type");
const { getOrderSn, getCertifyId, getAuthResult } = require("../../oauth/aliyun/index")
const moment = require("moment");
const { decodeSignAES } = require("../../../utils/jwt");
const config = require("../../../config");

/**
 * sdk 获取实名认证的certify_id
 * @param {*} body 
 * @param {*} userInfo 
 * @returns 
 */
async function makeCertifyId(body, userInfo = {}) {
    let { id: account_id, realname_status } = userInfo

    try {
        body = JSON.parse(decodeSignAES(body.data, body.iv))
    } catch (error) {
        return Promise.reject('签名认证错误或其他异常!')
    }

    let { meta_info, cert_no, cert_name } = checkKeys(body, [
        { key: 'meta_info', type: String, required: true },
        { key: 'cert_no', type: String, required: true, format: (val) => String(val).trim() },
        { key: 'cert_name', type: String, required: true, format: (val) => String(val).trim() },
    ])
    if (realname_status == 'T') return Promise.reject('账户已完成实名认证，无须再次认证！')
    let data = await knexTransaction(async trx => {
        let insert_data = {
            outer_order_no: await getOrderSn(ACCOUNT_REALNAME),
            cert_no,
            cert_name,
            meta_info,
            account_id: account_id,
            create_date: moment().format('YYYY-MM-DD'),
            create_user_id: account_id,
            update_user_id: account_id,
        }
        let [relation_id] = await trx(ACCOUNT_REALNAME).insert(insert_data)
        if (!relation_id) return Promise.reject('认证系统繁忙，请稍后重试！')
        let { certifyId } = await getCertifyId({ outerOrderNo: insert_data.outer_order_no, certNo: insert_data.cert_no, certName: insert_data.cert_name, metaInfo: insert_data.meta_info })
        // console.log(certify_info);
        if (certifyId) await trx(ACCOUNT_REALNAME).update({ certify_id: certifyId }).where('id', relation_id)
        return { certify_id: certifyId, outer_order_no: insert_data.outer_order_no }
    })
    return { code: 0, data }
}

// /login/personal
// /login/mcn
async function getCertifyResult(body, userInfo = {}) {
    let { id: account_id } = userInfo
    let { certify_id } = checkKeys(body, [
        { key: 'certify_id', type: String, required: true, format: (val) => String(val).trim() },
    ])
    let data = await knexTransaction(async trx => {
        let passed = await getAuthResult(certify_id, account_id, trx)
        let creator_host = `${config.creator_host}/login/personal`
        let creator_info = (await trx(DUOLAI_ACCOUNT_INFO).select('type').where({ account_id }))[0]
        if (creator_info?.type == 'business') creator_host = `${config.creator_host}/login/mcn`
        return { passed, creator_host }
    })

    return { code: 0, data }
}

module.exports = {
    makeCertifyId,
    getCertifyResult
};