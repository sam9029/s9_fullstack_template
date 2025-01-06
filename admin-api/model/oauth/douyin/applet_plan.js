const knex = require("../../../db/knexManager").knexProxy
const { APPLET_PLAN, ADVERTISER_TABLE, APPLET_TASK_INFO } = require("../../../config/setting")
const { getAgentId, getAgentLink, getAgentBindPeople, getAgentVideoData, 
    getTaskIds, getTaskInfo, chengeAgentBind, getAgentBillLink,getDownloadUrl } = require("./api")
const { makeClientToken, TWYQ_APP_KEY, XGSJ_APP_KEY } = require("./index")
const { sleep } = require("../../../utils/tools")
async function createAgent() {
    let { access_token } = await makeClientToken(false, TWYQ_APP_KEY)
    console.log(access_token);
    let agent = { agent_nickname: "推文引擎", agent_id: 0 }
    let agent_info = await getAgentId(agent, access_token)
    console.log(agent_info, JSON.stringify(agent_info));
}
const moment = require("moment")
const { getCustomCache, setCustomCache } = require("../../../db/redis")
const APPLET_PLAN_APP_ID = 'ttf31985a46c214faf' //小程序推广计划小程序ID
const lodash = require("lodash")
const { analysisCSV } = require("../../public/upload")
const AGENT_ID = '7277673345854816311'
// const XGSJ_APP_KEY = 'awnng6k7loc8o40x'
// const TWYQ_APP_KEY = 'awuk8m1ss2gtfouj'
// 7264802154362437672 小果视界测试1
// 7264701174048194597 小果视界
// 7277673345854816311 小果繁星
// 7277625769453633599 魔音工坊
// 7324543972754931746 推文引擎

// 换绑团长
async function changeAgent(new_agent_id = null, douyin_id = null, agency_talent_uid, old_agent_id = "7264701174048194597",) {
    let { access_token } = await makeClientToken(false, XGSJ_APP_KEY)
    let send_data = { new_agent_id, douyin_id, old_agent_id }
    // console.log(send_data);
    if (agency_talent_uid) send_data.agency_talent_uid = check_agency_talent_uid(agency_talent_uid)
    let agent_link = await chengeAgentBind(send_data, access_token)
    // console.log(agent_link);
    if (agent_link?.err_no) return Promise.reject(agent_link?.err_msg || agent_link || '未知异常！')
    return agent_link.data
}
/**
 * 获取结算账单
 * @param {*} bill_date 
 * @returns 
 */
async function getBillLink(bill_date = '') {
    let { access_token } = await makeClientToken(false, XGSJ_APP_KEY)
    let send_data = { bill_date }
    let agent_link = await getAgentBillLink(send_data, access_token)
    // console.log(agent_link);
    if (agent_link?.err_no) return Promise.reject(agent_link?.err_msg || agent_link || '未知异常！')
    return agent_link.data
}
/**
 * 获取csv中的数据
 * @param {*} advertiser_type 
 * @param {*} app_id 
 * @param {*} agent_id 
 * @param {*} date 
 */
async function getCsvData(advertiser_type, app_id, agent_id, date) {
    if (!advertiser_type || !app_id || !agent_id || !date) return Promise.reject('查询参数异常！')
    let { bill_link } = (await getBillLink(date)) || {}
    if (!bill_link) return Promise.reject('未获取到下载链接！')
    bill_link = getDownloadUrl(bill_link)
    // console.log(bill_link);
    console.time('解析数据链接耗时');
    let datas = []
    let info = (await analysisCSV(bill_link)).forEach(item => {
        if (app_id == item['视频关联的小程序ID'] && agent_id == item['视频关联的团长ID']) {
            datas.push({
                advertiser_type: advertiser_type,
                date: item['账单统计日期'],
                video_id: item['视频ID'],
                app_id: item['视频关联的小程序ID'],
                task_id: item['视频关联的任务ID'],
                agent_id: item['视频关联的团长ID'],
                publish_time: item['视频发布时间'],
                douyin_id: item['视频归属用户抖音号'],
                // '视频累计播放量': '0',
                // '视频累计点击数': '0',
                // '视频累计评论数': '0',
                // '视频累计点赞数': '0',
                // '视频累计分享量': '0',
                talent_profit_1d: item['视频当日达人佣金（单位：分）'] || 0,
                // '视频累计达人佣金（单位：分）': '0',
                gmv_1d: item['当日视频产生的交易订单支付金额（单位：分）'] || 0,
                // '视频累计产生的交易订单支付金额（单位：分）': '0',
                refund_gmv_1d: item['视频产生的交易订单当日退款金额（单位：分）'] || 0,
                // '视频产生的交易订单累计退款金额（单位：分）': '0',
                billing_gmv_1d: item['当日视频CPS关联的交易订单支付金额（单位：分）'] || 0,
                // '视频累计CPS关联的交易订单支付金额（单位：分）': '0',
                billing_refund_gmv_1d: item['视频CPS关联的交易订单当日退款金额（单位：分）'] || 0,
                // '视频CPS关联的交易订单累计退款金额（单位：分）': '0',
                ad_share_cost_1d: item['当日视频产生的广告收入（单位：分）'] || 0,
                // '视频累计产生的广告收入（单位：分）': '0',
                feed_ad_share_cost_1d: item['当日视频Feed流产生的广告收入（单位：分）'] || 0,
                // '视频Feed流累计产生的广告收入（单位：分）': '0',
                active_cnt_1d: item['当日视频关联的有效日活用户数'] || 0,
                // '视频累计关联的有效日活用户数': '0',
                // '视频结束计费时间': '2024-03-27 23:59:59'
            })
        }

    })
    console.timeEnd('解析数据链接耗时');
    return datas
}

async function getBindLink(app_id = null, task_id = null, agency_talent_uid, agent_id) {
    if (!agency_talent_uid) return Promise.reject('未设置绑定UID!')
    let { access_token } = await makeClientToken(false, XGSJ_APP_KEY)
    // agency_talent_uid = agency_talent_uid ? String(agency_talent_uid) : null
    agency_talent_uid = check_agency_talent_uid(agency_talent_uid)
    let send_data = { app_id, task_id, agency_talent_uid, agent_id: agent_id || AGENT_ID }
    // console.log(send_data);
    let agent_link = await getAgentLink(send_data, access_token)
    // console.log(agent_link);
    if (agent_link?.err_no) return Promise.reject(agent_link?.err_msg || agent_link || '未知异常！')
    return agent_link.data
}
async function getBindPeople(agency_talent_uid = null, douyin_id = null, agent_id) {
    let { access_token } = await makeClientToken(false, XGSJ_APP_KEY)
    // agency_talent_uid = agency_talent_uid ? String(agency_talent_uid) : null
    agency_talent_uid = check_agency_talent_uid(agency_talent_uid)
    douyin_id = douyin_id ? String(douyin_id) : null
    let send_data = { agency_talent_uid, agent_id: agent_id || AGENT_ID, douyin_id, page_no: 1, page_size: 100 }
    // console.log(send_data);
    let agent_link = await getAgentBindPeople(send_data, access_token)
    if (agent_link?.err_no) return Promise.reject(agent_link?.err_msg || agent_link || '未知异常！')
    // console.log(agent_link.data);
    if (!agent_link?.data?.total_count) return null
    return agent_link?.data?.results

}
function getSchemaUrl(path, app_id = APPLET_PLAN_APP_ID) {
    return `snssdk1128://microapp?start_page=${encodeURIComponent(path)}&__ad_app_type__=2&version_type=current&app_id=${app_id}&scene=0&version=v2&bdpsum=79357e4`
}
function getDyPublishSchemaUrl(relation_task_id = null, advertiser_task_id = null, app_id = null) {
    // if (!app_id) throw new Error('参数异常！')
    if (!relation_task_id && !advertiser_task_id && !app_id) throw new Error('参数异常！');
    let path = `subPackage/subApp/appDetail/index?appId=${app_id}&enter_from=8`
    if (relation_task_id || advertiser_task_id) path = `subPackage/pages/taskDetail/index?taskId=${relation_task_id || advertiser_task_id}&enter_from=7`
    return getSchemaUrl(path)
}

//subPackage/pages/taskDetail/index?taskId=7263409265006690340&enter_from=7 //有任务ID任务详情页
//subPackage/subApp/appDetail/index?appId=tt1a996c2485a709c101&enter_from=8 //有app_id的任务详情页

function check_agency_talent_uid(agency_talent_uid, plat = 'xgfx') {
    if (!agency_talent_uid) return null;
    const _env = (process.env.NODE_ENV || 'development').slice(0, 3);
    if (typeof agency_talent_uid == 'number') {
        return `${agency_talent_uid}-${plat}-${_env}`;
    }
    if (agency_talent_uid.includes('-')) return agency_talent_uid;
    return `${agency_talent_uid}-${plat}-${_env}`;
}

//subPackage/pages/taskDetail/index?taskId=7263409265006690340&enter_from=7 //有任务ID任务详情页
//subPackage/subApp/appDetail/index?appId=tt1a996c2485a709c101&enter_from=8 //有app_id的任务详情页

async function saveBindRation(data = [], trx = knex) {
    if (!data?.length) return
    const insert_data = [];
    const environment = process.env.NODE_ENV || 'development';
    const unbind_account = []
    data.forEach(i => {
        const [account_id, plat, _env] = (i.agency_talent_uid || '').split('-');
        if (!plat || (environment == "production" && _env != "pro")) {
            console.log('非小果繁星绑定账号！', i.agency_talent_uid, i.douyin_id);
            unbind_account.push({
                agent_id: String(i.agent_id),
                account_id: account_id || 0,
                douyin_id: i.douyin_id,
                bind_time: moment.unix(i.bind_time).format("YYYY-MM-DD HH:mm:ss"),
                unbind_time: i.unbind_time ? moment.unix(i.unbind_time).format("YYYY-MM-DD HH:mm:ss") : null,
                bind_status: i.unbind_time ? 2 : 1
            })
            return;
        }
        // console.log('小果繁星绑定账号！', i.agency_talent_uid, i.douyin_id);
        insert_data.push({
            agent_id: String(i.agent_id),
            account_id: account_id || 0,
            douyin_id: i.douyin_id,
            bind_time: moment.unix(i.bind_time).format("YYYY-MM-DD HH:mm:ss"),
            unbind_time: i.unbind_time ? moment.unix(i.unbind_time).format("YYYY-MM-DD HH:mm:ss") : null,
            bind_status: i.unbind_time ? 2 : 1
        })
    })
    if (unbind_account?.length) console.log('未能绑定博主抖音ID数量：', unbind_account.length);
    let datas = lodash.chunk(insert_data, 5000)
    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
        await trx(APPLET_PLAN).insert(element).onConflict(['agent_id', 'account_id', 'douyin_id']).merge()
    }
    return insert_data
}
//默认使用v2 接口进行数据同步
async function syncAppletData(advertiser_type = null, date = '', agent_id = AGENT_ID, version = 'v2') {
    let advertiser_info = (await knex(ADVERTISER_TABLE).select('app_id').where({ id: advertiser_type, promotion_plan: 2 }).limit(1))[0]
    let { app_id } = advertiser_info || {}
    if (!app_id || !advertiser_type || !date) return Promise.reject('参数异常或不支持小程序推广计划推广！')
    if (version == 'v2') return await getCsvData(advertiser_type, app_id, agent_id, date)
    let params = {
        page_num: 1,
        page_size: 5000,
        app_id,
        agent_id,
        billing_date: date,
        video_publish_start_time: moment().subtract(89, 'days').startOf('day').unix(),
        video_publish_end_time: moment(date).endOf('day').unix(),
    }
    let data = []
    let { access_token } = await makeClientToken(false, XGSJ_APP_KEY)

    let all_data = []
    // console.log(JSON.stringify(params),access_token);
    do {
        // console.log(params);
        console.log('正在同步第', params.page_num, '页数据');
        let info = await getAgentVideoData(params, access_token, version)
        // console.log(info.data);
        if (info?.err_no) return Promise.reject(info.err_msg || info)
        data = info?.data?.results || []
        all_data = all_data.concat(data.map(item => {
            // console.log(item);
            if (version == 'v1') return {
                advertiser_type: advertiser_type,
                app_id: app_id,
                agent_id: item.AgentID ? String(item.AgentID) : null,
                video_id: item.VideoId ? String(item.VideoId) : null,
                date: item.date,
                task_id: item.TaskId ? String(item.TaskId) : null,
                task_name: item.TaskName,
                publish_time: moment.unix(item.PublishTime).format("YYYY-MM-DD HH:mm:ss"),
                author: item.Author,
                douyin_id: item.DouyinID,
                video_title: item.VideoTitle,
                micro_app_title: item.MicroAppTitle,
                video_link: item.VideoLink,
                talent_profit_1d: item.TalentProfit1d || 0,
                gmv_1d: item.GMV1d || 0,
                ad_share_cost_1d: item.AdShareCost1d || 0,
                feed_ad_share_cost_1d: item.FeedAdShareCost1d || 0,
                active_cnt_1d: item.ActiveCnt1d || 0,
                refund_gmv_1d: item.RefundGMV1d || 0,
                billing_gmv_1d: item.BillingGMV1d || 0,
                billing_refund_gmv_1d: item.BillingRefundGMV1d || 0,
            }
            return {
                advertiser_type: advertiser_type,
                app_id: app_id,
                agent_id: item.agent_id ? String(item.agent_id) : null,
                video_id: item.video_id ? String(item.video_id) : null,
                date: item.date,
                task_id: item.task_id ? String(item.task_id) : null,
                task_name: item.task_name,
                publish_time: moment.unix(item.publish_time).format("YYYY-MM-DD HH:mm:ss"),
                author: item.author,
                douyin_id: item.douyin_id,
                video_title: item.video_title,
                micro_app_title: item.micro_app_title,
                video_link: item.video_link,
                talent_profit_1d: item.talent_profit_1d || 0,
                gmv_1d: item.gmv_1d || 0,
                ad_share_cost_1d: item.ad_share_cost_1d || 0,
                feed_ad_share_cost_1d: item.feed_ad_share_cost_1d || 0,
                active_cnt_1d: item.active_cnt_1d || 0,
                refund_gmv_1d: item.refund_gmv_1d || 0,
                billing_gmv_1d: item.billing_gmv_1d || 0,
                billing_refund_gmv_1d: item.billing_refund_gmv_1d || 0,
            }
        }))
        params.page_num++
        await sleep(500)
        // console.log(info.data);
    } while (data?.length == params.page_size);
    // console.log(all_data);
    return all_data
}
async function forkUpdateBindAccountId() {
    let account_info = []
    let data = []
    let params = {
        page_no: 1,
        page_size: 100,
        agent_id: AGENT_ID,
    }

    let { access_token } = await makeClientToken(false, XGSJ_APP_KEY)

    do {
        let info = await getAgentBindPeople(params, access_token)
        // console.log(info?.data);
        if (info?.err_no) return Promise.reject(info.err_msg || info)
        data = info?.data?.results || []
        account_info = account_info.concat(data)
        params.page_no++
        await sleep(300)
    } while (data?.length > 0);
    await saveBindRation(account_info)
    console.log(`账户绑定关系刷新成功！一共${account_info?.length}个账号数据`);
    // console.log(account_info);
}
async function getTaskDataInfo(appid = null, task_id = null) {
    if (!task_id || !appid) return Promise.reject('参数异常!')
    let { access_token } = await makeClientToken(false, XGSJ_APP_KEY)
    let send_data = {
        appid,
        query_params_type: 1,
        query_params_content: task_id,
        page_no: 1, page_size: 1
    }
    // console.log(send_data);
    let agent_link = await getTaskInfo(send_data, access_token)
    if (agent_link?.err_no) return Promise.reject(agent_link?.err_msg || agent_link || '未知异常！')
    if (agent_link?.data?.tasks[0]) agent_link = agent_link.data.tasks[0]
    if (agent_link?.payment_allocate_ratio) {
        // agent_link.payment_allocate_ratio = agent_link.payment_allocate_ratio * 100 //26.26 --> 2626
        agent_link.blogger_payment_allocate_ratio = Math.round(agent_link.payment_allocate_ratio * 10 / 11)
    }
    if (agent_link?.task_start_time) agent_link.task_start_time = moment.unix(agent_link.task_start_time).format("YYYY-MM-DD HH:mm:ss")
    if (agent_link?.task_end_time) agent_link.task_end_time = moment.unix(agent_link.task_end_time).format("YYYY-MM-DD HH:mm:ss")
    if (agent_link?.task_id) {
        agent_link.task_id = String(agent_link.task_id)
        const redis_key = `xgsj:applet_task:${task_id}`
        await setCustomCache(agent_link, redis_key, 60 * 5) //缓存5分钟
        await saveTaskData(agent_link)
        return agent_link
    }
    return Promise.reject(`任务信息获取失败：${task_id}`)
    // console.log(agent_link);
}
var loading = false
async function saveTaskData(data) {
    if (!data) return
    if (loading) {
        await sleep(200)
        return await saveTaskData(data)
    }
    loading = true
    let { appid, start_page, task_name, status, task_refund_period,
        payment_allocate_ratio, blogger_payment_allocate_ratio, task_settle_type, task_type, task_start_time, task_end_time } = data
    let insert_data = {
        id: String(data.task_id),
        app_id: appid, start_page, task_name, status, task_refund_period,
        payment_allocate_ratio, blogger_payment_allocate_ratio, task_settle_type, task_type, task_start_time, task_end_time
    }
    await knex(APPLET_TASK_INFO).insert(insert_data).onConflict(['id']).merge().finally(() => {
        loading = false
    })
}
async function getTaskDataByCache(appid = null, task_id = null, use_cache = true) {
    if (!task_id || !appid) return Promise.reject('参数异常!')
    const redis_key = `xgsj:applet_task:${task_id}`
    let cache = null
    if (use_cache) cache = await getCustomCache(redis_key)
    if (cache) return cache
    if (use_cache) cache = (await knex(APPLET_TASK_INFO).select('*', 'id as task_id').where('id', task_id))[0]
    if (cache) return cache
    return await getTaskDataInfo(appid, task_id)
}
async function getAllTaskIds(appid, start_date = '', end_date = '') {
    if (!appid) return Promise.reject('参数异常!')
    let create_start_time = start_date ? moment(start_date).startOf('day').unix() : moment().subtract(6, 'days').unix()
    let create_end_time = end_date ? moment(end_date).endOf('day').unix() : moment().subtract(10, 'minutes').unix()
    let { access_token } = await makeClientToken(false, XGSJ_APP_KEY)
    let info = await getTaskIds({ appid, create_start_time, create_end_time }, access_token)
    // console.log(info);
    if (info?.err_no) return Promise.reject(info.err_msg || info)
    let task_ids = info?.data?.task_ids || []
    task_ids = task_ids.map(task_id => String(task_id))
    // console.log(task_ids);
    return task_ids
}
async function getTaskDataByIds(appid = null, task_ids = [], use_cache = true) {
    if (!appid || !task_ids?.length) return Promise.reject('参数异常!')
    let datas = lodash.chunk(task_ids, 5)
    let tasks = []
    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
        tasks.push(...(await Promise.all(element.map(async task_id => await getTaskDataByCache(appid, task_id, use_cache)))))
    }
    return tasks
}
// makeClientToken(false, XGSJ_APP_KEY).then(res=>{
//     console.log(res);
// })
// changeAgent("7277673345854816311", "suiyueli5763", 10000).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(err);
// })
// getBindPeople(null, "334510335", "7277673345854816311").then(res => {
//     console.log(JSON.stringify(res));
// }).catch(err => {
//     console.log(err);
// })

module.exports = {
    getBindLink,
    APPLET_PLAN_APP_ID,
    getSchemaUrl,
    getBindPeople,
    saveBindRation,
    getDyPublishSchemaUrl,
    syncAppletData,
    forkUpdateBindAccountId,
    getTaskDataInfo,
    getTaskDataByCache,
    getTaskDataByIds,
    getAllTaskIds,
    createAgent,
    AGENT_ID,
    changeAgent,
    getBillLink
}
// getCsvData(11, 'tt7183073eeebc5a1f01', '7277673345854816311', '2024-02-20')
// createAgent()
// getBillLink('2024-02-14')
// getAllTaskIds('tt1a996c2485a709c101')
// getBindLink(null, null, 100000, '7324543972754931746').then(res => {
//     console.log(res);
// })