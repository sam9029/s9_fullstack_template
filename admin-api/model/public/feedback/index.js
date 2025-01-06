const knex = require('../../../db/knexManager').knexProxy;
const { KOC_KEYWORD, KEYWORD_FEEDBACK } = require('../../../config/setting');
const { getUuid, knexTransaction, validateUrl } = require("../../../utils/tools");
const { insertLog, getLogData, getExpireDay } = require("../operationLog")
const { getOpusInfo } = require("../media/douyin")
const moment = require("moment");
//开间小店发布回填作品链接
async function OpenShopFeedback(body, userInfo) {
    let { details, category_id, advertiser_type = 9, blogger_id = userInfo.id } = body || {}
    if (!advertiser_type || advertiser_type != 9) return Promise.reject('未选择客户类型或客户类型错误！')
    if (!blogger_id) return Promise.reject('未设置反馈人！')
    let { oem_id } = userInfo || {}
    if (details && details.length && !category_id) return Promise.reject('未设置作品品类！')
    let fail = []
    let data = await knexTransaction(async (trx) => {
        let success = []
        if (details && details.length) {
            let feedback_log = await Promise.all(details.map(async item => {
                let item_data = handler.checkData(item, userInfo, 'add')
                let { aweme_id } = await getOpusInfo(item_data.opus_url)
                let data_feedback = {
                    ...item_data,
                    category_id,
                    platform_id: 10001,
                    advertiser_type: 9,
                    content_type: 0,
                    keyword_id: 20000001,
                    period: 1,
                    configure_status: 2,
                    oem_id,
                    owner_user_id: blogger_id,
                    aweme_id
                }
                //将关键词期次和发布状态更新
                if (validateUrl(data_feedback.opus_url)) {
                    fail.push({ ...item_data, reason: '作品链接格式错误！' })
                    return null
                }
                let detail_id = await trx(KEYWORD_FEEDBACK).insert(data_feedback).catch(err => {
                    fail.push({ ...item_data, reason: '作品链接重复！' })
                })
                if (!detail_id) return null
                success.push(item_data)
                return getLogData(detail_id[0], 2053, data_feedback, userInfo)

            }))
            let logs = feedback_log.filter(i => i)
            if (logs.length) await insertLog(trx, logs)
        }
        return success
    })
    if (details && details.length && !data.length) return { code: 1, message: '作品发布异常，请检查是否重复反馈或链接格式错误！', fail }
    return { code: 0, data, fail }
}
//开间小店修改作品
async function OpenShopUpdate(body, userInfo) {
    let data = await knexTransaction(async (trx) => {
        let field = ["opus_url", "opus_type", "platform_account_id", "category_id"]
        let result = await trx.select(field).from(KEYWORD_FEEDBACK).where("id", body.id);

        let update_data = {}
        field.forEach(t => {
            update_data[t] = body[t]
        })
        if (update_data.opus_url) {
            let { aweme_id } = await getOpusInfo(update_data.opus_url)
            update_data.aweme_id = aweme_id
        }
        await trx(KEYWORD_FEEDBACK).update(update_data).where("id", body.id);
        let log_data = getLogData(body.id, 2106, update_data, userInfo, result[0])
        await insertLog(trx, log_data)
    })
    return {
        code: 0,
        data: data,
        message: "作品修改成功",
    };
}
let handler = {
    checkData(body = {}, userInfo = {}, type = "add") {
        let user_id = userInfo.id
        let checkKeys = ['opus_type', 'opus_url', 'platform_account_id']
        let dataKeys = ['category_id', 'id', 'status', 'publish_date']
        let data = {}
        if (type == "add") {
            data = {
                create_user_id: user_id,
                update_user_id: user_id,
                oem_id: userInfo.oem_id,
                publish_date: moment().format("YYYY-MM-DD")
            }
            checkKeys.forEach(key => {
                if (!body[key]) throw new Error(`字段${key}参数不合法！请检查参数`)
                data[key] = body[key]
            })

        } else if (type == "edit") {
            data = { update_user_id: user_id }
        }
        checkKeys.concat(dataKeys).forEach(key => {
            if (Object.hasOwnProperty.call(body, key)) data[key] = body[key]
        })
        return data
    }
}
module.exports = {
    OpenShopFeedback,
    OpenShopUpdate,
};