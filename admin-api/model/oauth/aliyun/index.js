const { system_account_id } = require("../../../config")
const { ACCOUNT_REALNAME, ACCOUNT_TABLE, DUOLAI_ACCOUNT_INFO, ACCOUNT_ROLE } = require("../../../config/setting")
const { knexTransaction } = require("../../../utils/tools")
const { getLogData, insertLog } = require("../../public/operationLog")
const api = require("./api")
const tools = require("./tools")
const knex = require('../../../db/knexManager').knexProxy
const moment = require('moment')
/**
 * 认证回调触发
 * @param {*} query
 * @returns
 */
async function callbackGetResult(query = {}) {
    await knexTransaction(async trx => {
        await getAuthResult(query.certifyId, null, trx)
    }).catch(err => {
        console.log(err);
    })
    return { code: 0, data: 'success' }
}
/**
 * 用户主动查询认证结果
 * @param {*} certify_id
 * @param {*} account_id
 * @param {*} trx
 * @returns
 */
async function getAuthResult(certify_id = '', account_id = null, trx = knex) {
    let { deviceToken, materialInfo, passed } = await api.getCertifyResult({ certifyId: certify_id })
    if (deviceToken || materialInfo || passed) {
        let old_data = (await trx(ACCOUNT_REALNAME).select('*').where({ certify_id })
            .where(builder => {
                if (account_id) builder.where('account_id', account_id)
            }).limit(1))[0]
        if (!old_data) return Promise.reject('认证数据不存在！')
        let new_data = { passed, material_info: materialInfo, device_token: deviceToken, verify_time: moment().format('YYYY-MM-DD HH:mm:ss') }
        await trx(ACCOUNT_REALNAME).update(new_data).where({ certify_id })
        if (passed && old_data?.account_id) {
            let update_info = { realname_status: passed }
            if (passed == 'T') { //仅当实名认证通过后写入承制方角色
                update_info.account_type = 4
                await trx(DUOLAI_ACCOUNT_INFO).insert({ account_id: old_data.account_id, type: "personal", create_user_id: old_data.account_id }).onConflict(["account_id"]).merge()
                await trx(ACCOUNT_ROLE).insert({ account_id: old_data.account_id, role_id: 6, create_user_id: system_account_id, update_user_id: system_account_id }).onConflict(["account_id", "role_id"]).merge()
            }
            await trx(ACCOUNT_TABLE).update(update_info).where('id', old_data.account_id).whereNot('realname_status', 'T')
        }
        await insertLog(trx, getLogData(old_data.id, 111, new_data, { id: system_account_id, oem_id: 1 }, old_data))
    }
    return passed
}
// getAuthResult('bja52879589280e1873197bdb3d0f68a')
module.exports = {
    ...tools,
    ...api,
    callbackGetResult,
    getAuthResult
}