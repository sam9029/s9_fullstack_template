const moment = require("moment")
const knex = require('../../../db/knexManager').knexProxy;
const { XINGTU_ADVERTISER, XINGTU_TOKEN, XINGTU_TASK, XINGTU_TASK_DATA, XINGTU_TASK_URL } = require('../../../config/setting');
const { production_url, system_account_id } = require('../../../config/index');
const { RK_XINGTU_TOKEN_LOCK, RK_SYNC_XINGTU_TASK_LOCK, RK_SYNC_XINGTU_DATA_TIME,
    RK_SYNC_XINGTU_TASK_TIME, RK_SYNC_XINGTU_DATA_LOCK } = require('../../../config/redis_key');
const { getUuid, knexTransaction, validateUrl, sleep, timestampSec } = require("../../../utils/tools");
const { checkKeys } = require("../../../utils/check_type");
const { insertLog, getLogData, getExpireDay } = require("../../public/operationLog");
const { getToken, refreshToken, getAuthAdvertiser, getXTOnlinToken } = require("./api")
const { getCustomCache, setCustomCache, getWaitLock, getLock } = require("../../../db/redis");
const { chunk } = require("lodash");
// const { APPID, Secret } = require('../../../config/index').xingtu_auth
const AUTH_CALLBACK_DOMAIN = `${production_url}/public/callback/xingtu`
// console.log(AUTH_CALLBACK_DOMAIN);
function getAuthUrl() {
    let oauth_domain = 'https://open.oceanengine.com/audit/oauth.html'
    let state = getUuid(), scope = encodeURIComponent('[11000000]'), redirect_uri = encodeURIComponent(AUTH_CALLBACK_DOMAIN)
    return `${oauth_domain}?app_id=${APPID}&state=${state}&scope=${scope}&redirect_uri=${redirect_uri}`
}
function backRedirect(type = 'success', message = '') {
    if (type != 'success') return Promise.reject(message)
    return { code: 0, data: message }
}
async function refreshXingtuToken(token_info = {}) {
    // console.log('刷新token');
    if (process.env.NODE_ENV != "production") return token_info.access_token //非生产环境不进行token刷新！
    let refresh_info = await refreshToken({ app_id: APPID, secret: Secret, refresh_token: token_info.refresh_token })
    if ([40103, 40107].includes(refresh_info?.code)) { //如果返回错误是refresh token过期的话，该账户授权失效
        await knex(XINGTU_TOKEN).update({ status: 2 }).where('state', token_info.state)
        await knex(XINGTU_ADVERTISER).update({ auth_status: 'NOT_AUTH' }).where('state', token_info.state)
    }
    if (refresh_info?.code) return Promise.reject(refresh_info.message)
    let { access_token, expires_in, refresh_token, refresh_token_expires_in } = refresh_info?.data || {}
    let time_now = timestampSec()
    let token_insert = {
        access_token,
        refresh_token,
        expires_in: time_now + expires_in,
        refresh_token_expires_in: time_now + refresh_token_expires_in
    }
    await knex(XINGTU_TOKEN).update(token_insert).where('state', token_info.state)
    return access_token
}
async function getOnlineToken(advertiser_id = '') {
    let token_info = await getXTOnlinToken(advertiser_id)
    if (token_info?.code) return Promise.reject(token_info.message)
    return token_info.data
}
/**
 * 获取星图账户的access_token,会自行维护access token的刷新
 * @param {string} [advertiser_id=''] 星图MCN id
 * @returns 
 */
async function getXingtuToken(advertiser_id = '') {
    if (!advertiser_id) return Promise.reject('未设置星图账户ID！')
    if (process.env.NODE_ENV != "production") return await getOnlineToken(advertiser_id)
    let token_info = (await knex.select('tok.*').from(`${XINGTU_ADVERTISER} as adv`)
        .leftJoin(`${XINGTU_TOKEN} as tok`, 'tok.state', 'adv.state')
        .where({ 'adv.advertiser_id': advertiser_id }).limit(1))[0]
    if (!token_info) return Promise.reject('账户不存在或已失效！')
    if (token_info.expires_in - 100 > timestampSec()) return token_info.access_token
    const lock_key = `${RK_XINGTU_TOKEN_LOCK}:${token_info.state}`
    return await getWaitLock(lock_key, async () => {
        token_info = (await knex.select('tok.*').from(`${XINGTU_TOKEN} as tok`).where({ 'tok.state': token_info.state }).limit(1))[0]
        if (!token_info) return Promise.reject('账户不存在或已失效！')
        if (token_info.expires_in - 100 > timestampSec()) return token_info.access_token
        return await refreshXingtuToken(token_info)
    }, 8, 300, true)
}

// getXingtuToken('1755341270488139').then(res => {
//     console.log(res);
// })
async function xingtuAuthCallback(query = {}) {
    let { auth_code, state } = checkKeys(query, ["auth_code", "state"])
    // console.log({auth_code,state});
    let token_info = await getToken({ app_id: APPID, secret: Secret, auth_code })
    // console.log(token_info);
    if (token_info?.code) return backRedirect('error', token_info?.message)
    let { access_token, expires_in, refresh_token, refresh_token_expires_in } = token_info?.data || {}
    if (!access_token) return backRedirect('error', '未返回有效access_token！')
    let time_now = timestampSec()
    let token_insert = {
        access_token,
        refresh_token,
        state,
        expires_in: time_now + expires_in,
        refresh_token_expires_in: time_now + refresh_token_expires_in
    }
    // 拿到token后尝试获取账户信息
    let advertiser_list = await getAuthAdvertiser({ access_token })
    // console.log(advertiser_list);
    if (advertiser_list?.code) return backRedirect('error', advertiser_list?.message)
    let { list } = advertiser_list?.data || {}
    if (!list || !list?.length) return backRedirect('error', '未返回有效授权账户！')
    const star_role = ['PLATFORM_ROLE_STAR_ISV', 'PLATFORM_ROLE_STAR_MCN']
    advertiser_list = list.filter(i => star_role.includes(i?.account_role))
    if (!advertiser_list || !advertiser_list?.length) return backRedirect('error', '授权账户无星图MCN账户！')
    //入库星图MCN账户
    // console.log(advertiser_list);
    advertiser_list = advertiser_list.map(i => {
        return {
            advertiser_id: i.advertiser_id,
            advertiser_name: i.advertiser_name,
            account_role: i.account_role,
            state,
            auth_status: i.is_valid ? 'AUTH' : 'AUTH',
        }
    })
    await knexTransaction(async trx => {
        await trx(XINGTU_TOKEN).insert(token_insert).onConflict(['state']).merge()
        await trx(XINGTU_ADVERTISER).insert(advertiser_list).onConflict(['advertiser_id']).merge()
    })
    return backRedirect('success', `共授权${advertiser_list?.length}个星图MCN账户！`)
}
// console.log(getAuthUrl());
async function syncTask(params = {}) {
    return await getLock(RK_SYNC_XINGTU_TASK_LOCK, async () => {
        const taskModel = require("./task")
        let task = await taskModel.get_unparticipated_task(params.star_id, params, (item) => {
            return {
                star_id: params.star_id,
                commission_rate: item.commission_rate || 0,
                demand_icon: item.demand_icon,
                demand_name: item.demand_name,
                evaluate_type: item.evaluate_type,
                expiration_time: item.expiration_time,
                expiration_time_end: item.expiration_time_end,
                first_class_category: item.first_class_category,
                item_component_type: item.item_component_type,
                pay_type: item.pay_type,
                second_class_category: item.second_class_category,
                video_type: item.video_type,
                id: String(item.demand_id),
                task_create_time: item.create_time,
                price: (item.price || 0) / 10,
                total_budget: (item.total_budget || 0) / 10,
            }
        })
        if (task?.length) await knex(XINGTU_TASK).insert(task).onConflict(['id']).merge()
        await setCustomCache({ sync_time: moment().format("YYYY-MM-DD HH:mm:ss") }, RK_SYNC_XINGTU_TASK_TIME, null)
        return task
    })
}
/**
 * 同步所有已参与任务的数据
 * @param {any[]} [demand_ids=[]] {star_id,id}
 * @param {{}} [userInfo={}] 同步的用户信息
 * @param {*} import_log_id 同步的日志ID
 * @returns 
 */
async function syncData(demand_ids = [], import_log_id, userInfo = {}, trx = knex) {
    return await getLock(RK_SYNC_XINGTU_DATA_LOCK, async () => {
        const taskModel = require("./task")
        let new_datas = chunk(demand_ids, 5)
        // console.log(new_datas);
        for (let index = 0; index < new_datas.length; index++) {
            const element = new_datas[index];
            let chunk_datas = []
            let p = element.map(async i => {
                let data_list = await taskModel.get_challenge_author_item_list(i.star_id, i.id, (item) => {
                    return {
                        star_id: i.star_id,
                        demand_id: String(item.demand_id),
                        item_id: String(item.item_id),
                        publish_time: moment(item.publish_time).format('YYYY-MM-DD HH:mm:ss'),
                        author_id: String(item.author_id),
                        author_name: item.author_name,
                        is_own: item.is_own || 0,
                        share_vv: item.share_vv || 0,
                        play: item.play || 0,
                        import_log_id,
                        install_finish_cnt: item.install_finish_cnt || 0,
                        ios_convert_count: item.ios_convert_count || 0,
                        android_convert_count: item.android_convert_count || 0,
                        clue_cnt: item.clue_cnt || 0,
                        share_price: (item.share_price || 0) / 10,
                        author_amount: (item.author_amount || 0) / 10,
                        mcn_amount: (item.mcn_amount || 0) / 10,
                        uid: item.channel_id || 0,
                        create_date: moment().format('YYYY-MM-DD'),
                        create_user_id: userInfo.id,
                        update_user_id: userInfo.id,
                        oem_id: userInfo.oem_id,
                    }
                }).catch(err => {
                    console.log(err, i);
                })
                chunk_datas = chunk_datas.concat(data_list || [])
                return data_list
            })
            await Promise.all(p)
            // console.log(chunk_datas);
            if (chunk_datas?.length) await trx(XINGTU_TASK_DATA).insert(chunk_datas).onConflict(['item_id']).merge()
        }
        let update_sql = `UPDATE ${XINGTU_TASK_DATA} as dat LEFT JOIN ${XINGTU_TASK_URL} as turl ON turl.uid = dat.uid 
        SET dat.account_id = turl.account_id
        WHERE dat.import_log_id = ${import_log_id} AND turl.id IS NOT NULL`
        // console.log(update_sql);
        await trx.raw(update_sql)
        await setCustomCache({ sync_time: moment().format("YYYY-MM-DD HH:mm:ss") }, RK_SYNC_XINGTU_DATA_TIME, null)
        return 'success'
    })
}
async function syncJoinedTask(params = {}, userInfo = {}) {
    return await getLock(RK_SYNC_XINGTU_TASK_LOCK, async () => {
        const taskModel = require("./task")
        let task = await taskModel.get_contracted_task(params.star_id, params, (item) => {
            return {
                star_id: params.star_id,
                commission_rate: item.commission_rate || 0,
                demand_icon: item.demand_icon,
                demand_name: item.demand_name,
                evaluate_type: item.evaluate_type,
                expiration_time: item.expiration_time,
                expiration_time_end: item.expiration_time_end,
                first_class_category: item.first_class_category,
                item_component_type: item.item_component_type,
                pay_type: item.pay_type,
                second_class_category: item.second_class_category,
                video_type: item.video_type,
                id: String(item.demand_id),
                task_create_time: item.create_time,
                price: (item.price || 0) / 10,
                total_budget: (item.total_budget || 0) / 10,
                mcn_profit_rate: (item.mcn_profit_rate || 0) * 10,
                mcn_join_status: "JOINED",
                verify_status: 3,
                create_user_id: userInfo?.id || system_account_id,
                update_user_id: userInfo?.id || system_account_id,
                verify_suggest: "系统自动同步！",
                challenge_status: item.challenge_status || 0
            }
        })

        if (task?.length) {
            let mapper = {};
            (await knex(XINGTU_TASK).select('id').whereIn('id', task.map(i => i.id))).forEach(i => {
                mapper[i.id] = i.id
            })
            // console.log(mapper);
            task = task.filter(i => !mapper[i.id])
            // console.log(task);
            if (task?.length) await knex(XINGTU_TASK).insert(task).onConflict(['id']).merge()
        }
        return task
    })
}
// syncJoinedTask({ star_id: "1755341270488139", date_range: ['2024-02-22', '2024-02-27'] })
module.exports = {
    xingtuAuthCallback,
    getXingtuToken,
    syncTask,
    syncData,
    syncJoinedTask
}