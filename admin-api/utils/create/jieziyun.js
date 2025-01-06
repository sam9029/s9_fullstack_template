const PRD_KEY = {
    app_id: "JowCgz2x",
    app_key: "36b1b7d398b15c954b3cc7b6ba3329b691831783"
}
const DEV_KEY = {
    app_id: "L8jUlzf0",
    app_key: "3bdad5d8244c0815f3035d70434357ee1dbd7005"
}

const JIEZIYUN_KEY = process.env.NODE_ENV == "production" ? PRD_KEY : PRD_KEY
const request = require("../request")
const CACHE_KEY = 'xgfx:external:jieziyun:token'
const FORK_CACHE_KEY = 'xgfx:external:jieziyun:fork'
const DOMAIN = process.env.NODE_ENV == "production" ? "https://console.icemdata.com" : "https://console.icemdata.com"
const { getCustomCache, setCustomCache, delCustomCache } = require("../../db/redis")
const utils = require("../../model/public/externalMedia/utils")
const CryptoJs = require("crypto-js")
const { knexTransaction, getDaysBetweenDate } = require("../tools")
const { TOOLS_RECORD } = require("../../config/setting")
const knex = require("../../db/knexManager").knexProxy
const moment = require("moment")
const { operateEquity } = require('../../utils/payment/equity')
async function get_token() {
    const cache = await getCustomCache(CACHE_KEY);
    if (cache) return cache;
    return fetch_token();
}
function makeSign(data = {}) {
    delete data.sign
    data.app_id = JIEZIYUN_KEY.app_id
    let str = utils.sort_and_join({ app_id: JIEZIYUN_KEY.app_id })
    data.sign = Buffer.from(CryptoJs.MD5(str += `&app_key=${JIEZIYUN_KEY.app_key}`).toString()).toString('base64').toLocaleUpperCase()
    // console.log(data);
    return data
}
async function fetch_token() {
    let token = "";
    return request({
        url: DOMAIN + '/api/outer/v1/token',
        method: 'post',
        data: JIEZIYUN_KEY,
        no_need_retry: true,
    }).then(data => {
        // console.log(data);
        if (data.errcode != 0) throw data.errmsg;
        token = data.access_token;
        return setCustomCache(token, CACHE_KEY, 3600)
    }).then(() => {
        return token;
    })
}
async function query_result(params = {}) {
    let token = await get_token()
    params = makeSign(params)
    return request({
        url: DOMAIN + '/api/video-cut/open/create/video_status',
        method: 'get',
        params,
        headers: { token },

    }).then(data => {
        if (data.result != 0) throw data.errmsg || data.message;
        return data.data
    })
}
async function make_video(data = {}) {
    let token = await get_token()
    return request({
        url: DOMAIN + '/api/video-cut/open/create/video',
        method: 'post',
        data: makeSign(data),
        headers: { token },
    }).then(data => {
        // console.log(data);
        if (data.result != 0) throw data.errmsg || data.message;
        return data.data
    })
}
async function fetch_material(params) {
    let token = await get_token()
    return request({
        url: DOMAIN + '/api/cms/v1/material/open/get_materials',
        method: 'get',
        params,
        headers: { token },

    }).then(data => {
        if (data.result != 0) throw data.errmsg || data.message;
        // console.log(data.data);
        return data
    })
}

async function query_classify() {
    const token = await get_token();
    return request({
        url: DOMAIN + '/api/cms/v1/material/open/get_cate',
        method: 'get',
        headers: { token },
    }).then(data => {
        if (data.result != 0) throw data.errmsg || data.message;
        return data.data
    })
}
//子进程每隔一段时间刷新生成状态
// let fork_loading = false
async function fork_get_result() {
    if (await getCustomCache(FORK_CACHE_KEY)) return
    await setCustomCache(true, FORK_CACHE_KEY, 300)
    await knexTransaction(async trx => {
        await trx(TOOLS_RECORD).update({ make_status: 3 }).where({ make_status: 1, type: "SMART_CREATE" })
            .whereRaw('DATEDIFF(CURDATE(),create_date) > 1') //把创建时间超过1天的任务设置为失败
        let records = await trx(TOOLS_RECORD).select('id', 'record_id', 'account_id', 'cost_equity_type').where({ make_status: 1, type: "SMART_CREATE", status: 1 })
            .whereIn('create_date', getDaysBetweenDate(moment().subtract(2, 'days').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')))
        await Promise.all(records.map(async i => {
            return await update_result(i, trx)
        }))
    }).finally(async () => {
        await setCustomCache(false, FORK_CACHE_KEY, 300)
    })
}
var task_id_mapper = {}
async function update_result(item = {}, trx = knex) {
    if (task_id_mapper[item.record_id]) return
    task_id_mapper[item.record_id] = true
    let result_data = await query_result({ task_id: item.record_id }).catch(err => {
        console.log(err);
    })
    let update_data = null
    if (result_data?.status == 'SUCCESS') {
        update_data = {
            make_status: 2,
            result: result_data?.video?.file_url,
            cover_url: result_data?.video?.thumbnail_url,
            raw_result: JSON.stringify(result_data)
        }
    }
    if (result_data?.status == 'FAIL') {
        update_data = {
            make_status: 3,
            raw_result: JSON.stringify(result_data)
        }
    }
    if (update_data) await trx(TOOLS_RECORD).update(update_data).where('id', item.id)
    if (update_data?.make_status == 3 && item.cost_equity_type == 'TOOL_PACKAGE') { //创作失败，返还次数
        await operateEquity({ diff_type: 'use_tool', times: -1, account_id: item.account_id }, 'diff', { id: item.account_id, oem_id: 1 }, trx)
    }
    task_id_mapper[item.record_id] = false
    return update_data
}

async function query_material(media_type) {
    const params = {
        media_type, // 文件类型：1-图片，2-视频，3-音频，4-其他
        // cat_id: 0,
        cur_cate_flg: 0, // 查询当前分类的素材（true）或当前分类且包含下级分类素材（false）
        source_type: 0, // 素材来源code 0:素材新建；17 视频批量套版
        page_no: 1,
        page_size: 1000,
        created_at_start: moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss'),
        created_at_end: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    let list = [];
    for (let i = 1; ; i++) {
        params.page_no = i;
        const res = await fetch_material(params);
        list = list.concat(res.data.materials);
        if (list.length >= res.total) break;
    }
    return list
}
async function sync_material(params = {}) {
    let list = [];
    for (let i = 1; ; i++) {
        params.page_no = i;
        const res = await fetch_material(params);
        if (!res?.data?.materials?.length) break;
        list = list.concat(res.data.materials);
    }
    return list
}
// sync_material().then(res=>{
//     console.log(res);
// })

module.exports = {
    query_classify,
    sync_material,
    query_material,
    jieziyun_make_video: make_video,
    fork_get_result,
    update_result
}