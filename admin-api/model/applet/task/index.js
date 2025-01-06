const { ACCOUNT_TABLE, TITLE_TABLE, TITLE_CONTENT_TABLE, MATERIAL_COLLECTION, MATERIAL_TABLE,
    PLATFORM_TABLE, SETTLEMENT_METHOD_TABLE, ADVERTISER_TABLE, TASK_TABLE, TASK_FEEDBACK } = require("../../../config/setting")
const knex = require("../../../db/knexManager").knexProxy
const { STATUS_MAPPER } = require("../../../utils/mapper")
const { getDaysBetweenDate, knexTransaction, selectName } = require("../../../utils/tools")
const { insertLog, getLogData } = require("../../public/operationLog")
const { getGroupAccountId } = require("../../public/permission");
const { getPermission } = require('../../public/permission');
const moment = require('moment')
const { getCoverUrl, getOriginalUrl, getDownloadUrl, checkFileMd5 } = require("../../public/upload")
const { releaseTask } = require("../../manage/task/index")
const cloums = ['tsk.id', 'tsk.name', 'tsk.publish_status', 'tsk.status as task_status', 'tsk.download_start_time', 'tsk.download_end_time',
    'tsk.feedback_end_time', 'tsk.settle_rule', 'tsk.cover_url', 'tsk.create_time']

const mapper = { 1: 'image_id', 2: 'video_id', 3: 'audio_id', 4: 'title_id', 5: 'title_content_id' }
async function list(query = {}, userInfo = {}) {
    let { oem_id } = userInfo || {}
    let retu = {
        code: 0,
        count: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select(cloums)
        .from(`${TASK_TABLE} as tsk`)
        // .leftJoin(`${BLOGGER_TABLE} as blog`, 'tsk.blogger_id', 'blog.account_id')
        // .leftJoin(`${TABLE_CONSULTANT} as cst`, 'tsk.blogger_id', 'cst.account_id')
        .where({ "tsk.oem_id": oem_id })
    let accountIds = await getPermission(query, userInfo)
    if (accountIds.length) knexSql.where(builder => {
        builder.whereIn("tsk.create_user_id", accountIds)
    })
    knexSql = handler.searchFilter(knexSql, query)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    // console.log(knexSql.toString());
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        // .select(selectName('tsk', "content_type", CONTENT_TYPE_TABLE, "name", "content_type_name"))
        .select(selectName('tsk', "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
        .select(knex.raw(`(SELECT GROUP_CONCAT(pat.name) as platform_names FROM ${PLATFORM_TABLE} as pat WHERE JSON_CONTAINS(tsk.platform_ids->'$[*]',JSON_ARRAY(pat.id))) as platform_names`))
        .select(selectName('tsk', "create_user_id", ACCOUNT_TABLE, "name", "create_user_name"))
        .select(selectName('tsk', "update_user_id", ACCOUNT_TABLE, "name", "update_user_name"))
        .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", 'desc')
    retu.data = retu.data.map(item => {
        item.platform_ids = JSON.parse(item.platform_ids || '[]')
        // item.platform_names = (item.platform_names||'').split(',')
        return item
    })
    return retu

}
async function myTask(query, userInfo = {}) {
    let { oem_id, id: account_id } = userInfo || {}
    let retu = {
        code: 0,
        count: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
    }
    let { collection_id } = query
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let collection_cloums = ['mac.status', 'mac.id as collection_id', 'mac.create_time as collection_time', 'mac.expire_time']
    if (collection_id) collection_cloums.push('tsk.describe', 'tle.content as title_name', 'tlc.content as title_content_name', 'mac.video_id', 'mac.image_id', 'mac.audio_id')
    let knexSql = knex.select(cloums)
        .select(collection_cloums)
        .from(`${MATERIAL_COLLECTION} as mac`)
        .leftJoin(`${TASK_TABLE} as tsk`, 'tsk.id', 'mac.task_id')
        .leftJoin(`${TITLE_TABLE} as tle`, 'tle.id', 'mac.title_id')
        .leftJoin(`${TITLE_CONTENT_TABLE} as tlc`, 'tlc.id', 'mac.title_content_id')
        .where({ "tsk.oem_id": oem_id })
        .where('mac.account_id', account_id)

    if (collection_id) knexSql.where('mac.id', collection_id)
    let task_feedback_sql = knex.count('tfb.id as task_feedback_num')
        .from(`${TASK_FEEDBACK} as tfb`)
        .where('tfb.status', 1)
        .whereRaw(`tfb.collection_id = mac.id`).toString()
    knexSql = handler.taskFilter(knexSql, query)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    // console.log(knexSql.toString());
    retu.count = count.length && count[0]['count'] || 0;
    let time_now = new Date().getTime()
    retu.data = await knexSql
        // .select(selectName('tsk', "content_type", CONTENT_TYPE_TABLE, "name", "content_type_name"))
        .select(knex.raw(`(${task_feedback_sql}) as task_feedback_num`))
        .select(selectName('tsk', "settle_type", SETTLEMENT_METHOD_TABLE, "name", "settle_type_name"))
        .select(selectName('tsk', "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
        .select(knex.raw(`(SELECT GROUP_CONCAT(pat.name) as platform_names FROM ${PLATFORM_TABLE} as pat WHERE JSON_CONTAINS(tsk.platform_ids->'$[*]',JSON_ARRAY(pat.id))) as platform_names`))
        .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("mac.id", 'desc')

    retu.data = retu.data.map(async item => {
        // item.platform_ids = JSON.parse(item.platform_ids || '[]')
        if (collection_id) {
            let { image_id, video_id, audio_id } = item
            let material_sql = knex.select('mat.type as material_type', 'mat.watermark_oss_key', 'mat.original_oss_key', 'mat.name', 'mat.id as material_id')
                .select(knex.raw(`CONCAT_WS('x', mat.width, mat.height) as ratio`))
                .select(knex.raw(`CONCAT(ROUND(mat.size/1048576, 2), 'MB') as size`))
                .select(knex.raw(`ROUND(mat.size/1048576, 2) as orginal_size`))
                .select(knex.raw(`mat.duration*1000 as duration`))
                .from(`${MATERIAL_TABLE} as mat`)
            let ids = []
            image_id && ids.push(image_id)
            video_id && ids.push(video_id)
            audio_id && ids.push(audio_id)
            item.material_info = (await material_sql.whereIn('mat.id', ids)).map(mat => {
                mat.material_cover_url = getCoverUrl(mat.material_type, mat.watermark_oss_key || mat.original_oss_key)
                mat.mime_type = `.${mat.original_oss_key.split('.').pop()}`
                mat.duration = moment.utc(mat.duration).format('HH:mm:ss')
                mat.play_url = getOriginalUrl(mat.watermark_oss_key || mat.original_oss_key)
                delete mat.watermark_oss_key
                delete mat.original_oss_key
                return mat
            })
        }
        item.platform_names = (item.platform_names || '').split(',')
        item.task_limit_time = item.expire_time * 1000 - time_now
        item.task_limit_time = item.task_limit_time >= 0 ? item.task_limit_time : 0
        return item
    })
    retu.data = await Promise.all(retu.data)
    if (collection_id) return { code: 0, data: retu.data[0] || {} }
    return retu

}
//放弃任务
async function giveup(body = {}, userInfo = {}) {
    let { id: account_id } = userInfo
    let { collection_id } = body
    if (!collection_id) return Promise.reject('未设置领取记录ID！')
    let task_feedback_sql = knex.count('tfb.id as task_feedback_num')
        .from(`${TASK_FEEDBACK} as tfb`)
        .where('tfb.status', 1)
        .whereRaw(`tfb.collection_id = mac.id`).toString()
    let before_data = (await knex.select('*')
        .select(knex.raw(`(${task_feedback_sql}) as task_feedback_num`))
        .from(`${MATERIAL_COLLECTION} as mac`)
        .where({ 'mac.id': collection_id, 'mac.account_id': account_id, 'mac.status': 1 })
        .whereRaw(`(mac.expire_time > 0 AND unix_timestamp(now()) <= mac.expire_time)`)
    )[0]
    if (!before_data) return Promise.reject('领取记录不存在或已失效！')
    if (before_data.task_feedback_num > 0) return Promise.reject('任务已回填，暂无法放弃任务！')
    await knexTransaction(async trx => {
        let new_data = { status: 2 }
        await trx(MATERIAL_COLLECTION).update(new_data).where('id', collection_id)
        await releaseTask(before_data.task_id, before_data)
        await insertLog(trx, getLogData(collection_id, 4162, new_data, userInfo, before_data))
    })
    return { code: 0, data: collection_id }
}
async function def(query = {}, userInfo = {}) {
    let { id } = query || {}
    let { oem_id } = userInfo || {}
    if (!id) return Promise.reject('未设置查询ID！')
    let retu = {
        code: 0,
        data: {}
    }
    let knexSql = knex.select(cloums)
        .select("advertiser_type")
        .from(`${TASK_TABLE} as tsk`)
        .where({ "tsk.oem_id": oem_id, "tsk.id": id })
    retu.data = await knexSql
        .select(selectName('tsk', "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
        .select(knex.raw(`(SELECT GROUP_CONCAT(pat.name) as platform_names FROM ${PLATFORM_TABLE} as pat WHERE JSON_CONTAINS(tsk.platform_ids->'$[*]',JSON_ARRAY(pat.id))) as platform_names`))
        .select(selectName('tsk', "create_user_id", ACCOUNT_TABLE, "name", "create_user_name"))
        .select(selectName('tsk', "update_user_id", ACCOUNT_TABLE, "name", "update_user_name"))
        .limit(1)
    retu.data = retu.data.map(item => {
        // item.cover_url = getCoverUrl(item.type, item.watermark_oss_key || item.original_oss_key)
        // if (item.type == 1) item.original_url = getOriginalUrl(item.original_oss_key) //图片返回临时访问链接
        delete item.watermark_oss_key
        delete item.original_oss_key
        return item
    })
    retu.data = retu.data[0] || {}
    return retu
}
async function getSearch(query = {}, userInfo = {}) {
    let { type = 1, query_type = 'size' } = query || {}
    let { oem_id } = userInfo || {}
    let groupBy = []
    let retu = { code: 0, data: [] }
    let sqlKnex = knex(TASK_TABLE).where({ type, oem_id })
    if (query_type == 'size') {
        groupBy = ['width', 'height']
        retu.data = await sqlKnex.select(knex.raw(`CONCAT_WS('x', width, height) as label`)).groupBy(groupBy)
    }
    retu.data = retu.data.map(i => {
        if (query_type == 'size') i.value = i.label
        return i
    })
    return retu
}
async function add(body = {}, userInfo = {}) {
    let new_data = handler.checkData(body, userInfo)
    let data = await knexTransaction(async (trx) => {
        new_data.name = new_data.name.trim()
        let detail_id = (await trx(TASK_TABLE).insert(new_data))[0]
        await insertLog(trx, getLogData(detail_id, 4151, new_data, userInfo))
        return detail_id
    })
    return { code: 0, data }

}
async function batchAdd(body = {}, userInfo = {}) {
    let { files = [], director_account_id, patcut_account_id, late_account_id, content_type, advertiser_type, promotion_category } = body || {}
    if (!files.length) return Promise.reject('文件信息不存在！')
    let materials = files.map(i => {
        return { ...i, director_account_id, patcut_account_id, late_account_id, content_type, advertiser_type, promotion_category }
    })
    materials = materials.map(async item => {
        let back = {}
        let { md5 } = item
        await add(item, userInfo).then(data => {
            back = { ...data, md5 }
        }).catch(err => {
            back = { code: 1, message: String(err.message || err || '未知异常'), md5 }
        })
        return back
    })
    return { code: 0, data: await Promise.all(materials) }
}
async function save(body = {}, userInfo = {}) {
    let id = body.id || null
    if (!id) return Promise.reject('未设置修改数据')
    let new_data = handler.checkData(body, userInfo, "edit")
    let before_data = (await knex(TASK_TABLE).select('*').where({ id }))[0]
    let data = await knexTransaction(async (trx) => {
        await trx(TASK_TABLE).update(new_data).where('id', id)
        await insertLog(trx, getLogData(id, 4152, new_data, userInfo, before_data))
        return id
    })
    return { code: 0, data }
}
async function check(body = {}, userInfo = {}) {
    let { md5 } = body || {}
    let { oem_id } = userInfo || {}
    if (!md5) return Promise.reject('未设置查询的md5！')
    let data = (await knex.select('original_oss_key as oss_key', 'size', 'width', 'height')
        .from(TASK_TABLE).where({ md5, oem_id }).limit(1))[0]
    return { code: 0, data }
}
let handler = {
    searchFilter(knexSql, query = {}) {
        if (!query.status) knexSql.whereIn('tsk.status', [1, 2])
        if (query.status) knexSql.where('tsk.status', query.status)
        if (query.advertiser_type) knexSql.where('tsk.advertiser_type', query.advertiser_type)
        if (query.director_account_id) knexSql.where('tsk.director_account_id', query.director_account_id)
        if (query.patcut_account_id) knexSql.where('tsk.patcut_account_id', query.patcut_account_id)
        if (query.late_account_id) knexSql.where('tsk.late_account_id', query.late_account_id)
        if (query.content_type) knexSql.where('tsk.content_type', query.content_type)
        if (query.create_date_range) knexSql.whereIn('tsk.create_date', getDaysBetweenDate(query.create_date_range[0], query.create_date_range[1]))
        // if (query.platform_ids && query.platform_ids.length) knexSql.whereIn('tsk.platform_id', query.platform_ids)
        if (query.keyword) {
            let keyword = query.keyword.trim()
            knexSql.where(builder => {
                builder.where('tsk.id', 'like', `%${keyword}%`).orWhere('tsk.name', 'like', `%${keyword}%`)
            })
        }
        if (query.resolution && query.resolution.indexOf('x') != -1) {
            let [width, height] = query.resolution.split('x')
            knexSql.where({ 'tsk.width': width, 'tsk.height': height })
        }
        // if (query.consultant_id) knexSql.whereRaw(`(tsk.blogger_id IN (SELECT id FROM ${ACCOUNT_TABLE} WHERE direct_leader = ${query.consultant_id}) OR tsk.blogger_id = ${query.consultant_id})`)
        return knexSql
    },
    taskFilter(knexSql, query = {}) {
        if (query.status) knexSql.where('mac.status', query.status) // 不传 不限 1 正常 2 已失效
        if (query.advertiser_type) knexSql.where('tsk.advertiser_type', query.advertiser_type) //广告商
        if (query.recive_date_range) knexSql.where('mac.create_time', '>=', `${query.recive_date_range[0]} 00:00:00`) //领取时间 ['2022-09-06','2022-09-06']
            .where('mac.create_time', '<=', `${query.recive_date_range[1]} 23:59:59`)
        if (query.keyword) { //任务名称关键字
            let keyword = query.keyword.trim()
            knexSql.where(builder => {
                builder.where('tsk.id', 'like', `%${keyword}%`).orWhere('tsk.name', 'like', `%${keyword}%`)
            })
        }
        // if (query.consultant_id) knexSql.whereRaw(`(tsk.blogger_id IN (SELECT id FROM ${ACCOUNT_TABLE} WHERE direct_leader = ${query.consultant_id}) OR tsk.blogger_id = ${query.consultant_id})`)
        return knexSql
    },
    checkData(body = {}, userInfo = {}, type = "add") {
        let user_id = userInfo.id
        let checkKeys = ['name', 'feedback_end_time', 'settle_type', 'target_type', 'advertiser_type']
        let dataKeys = ['download_start_time', 'download_end_time', 'settle_rule', 'describe', 'status']
        let jsonKeys = ['platform_account_target', 'gender_target', 'platform_target', 'platform_ids']
        let data = {}
        function getTagetInfo(key = '', data = {}) {
            let item = { allowed: [], forbidden: [] }
            if (Object.prototype.toString.call(data) != '[object Object]') throw new Error(`字段${key}参数不合法！请检查参数`)
            if (data.allowed && !Array.isArray(data.allowed)) throw new Error(`字段${key}.allowed类型不合法！请检查参数`)
            if (data.forbidden && !Array.isArray(data.forbidden)) throw new Error(`字段${key}.forbidden类型不合法！请检查参数`)
            item.allowed = data.allowed || []
            item.forbidden = data.forbidden || []
            return JSON.stringify(item)
        }
        if (type == "add") {
            data = {
                create_user_id: user_id,
                update_user_id: user_id,
                create_date: moment().format('YYYY-MM-DD'),
                oem_id: userInfo.oem_id
            }
            checkKeys.forEach(key => {
                if (!body[key]) throw new Error(`字段${key}参数不合法！请检查参数`)
                data[key] = body[key]
            })
        } else if (type == "edit") {
            data = { update_user_id: user_id }
        }
        jsonKeys.forEach(key => {
            if (type == "add" && key == 'platform_ids' && (!body[key] || body[key] && !Array.isArray(body[key]))) throw new Error(`字段${key}参数不合法！请检查参数`)
            if (type == "add" && data.target_type != 1 && !Object.hasOwnProperty.call(body, key)) throw new Error(`字段${key}参数不合法！请检查参数`)
            if (Object.hasOwnProperty.call(body, key) && key != 'platform_ids') data[key] = getTagetInfo(key, body[key])
            if (Object.hasOwnProperty.call(body, key) && key == 'platform_ids') data[key] = JSON.stringify(body[key])
        })
        checkKeys.concat(dataKeys).forEach(key => {
            if (Object.hasOwnProperty.call(body, key)) data[key] = body[key]
        })
        return data
    }
}
//该接口只能拿水印视频的预览播放链接
async function getViewUrl(query, userInfo = {}) {
    let { id } = query || {}
    let { oem_id } = userInfo
    if (!id) return Promise.reject('未设置查询的视频！')
    let data = (await knex(TASK_TABLE).select('watermark_oss_key', 'watermark_status').where({ id, oem_id }).limit(1))[0]
    if (!data) return Promise.reject('该视频不存在！')
    let { watermark_status, watermark_oss_key } = data
    let message = null
    if (watermark_status != 4 && watermark_status != 5) message = '视频水印生成中，请稍后预览！'
    if (watermark_status == 5) message = '视频水印生成失败，暂不支持预览，请点击按钮重新生成水印视频！'
    if (message) return { code: 1, watermark_status, message }
    return { code: 0, data: getOriginalUrl(watermark_oss_key) }
}
async function download(body, userInfo = {}) {
    let { material_id, collection_id, material_type = 1 } = body || {}
    let { id: account_id } = userInfo || {}
    if (!mapper[material_type]) return Promise.reject('请检查请求参数！')
    if (!material_id || !collection_id) return Promise.reject('请检查请求参数！')
    let cloum = ['mat.id', 'mat.name as file_name', 'mat.original_oss_key as oss_key', 'mat.status as material_status', 'mac.status as collection_status',
        'tsk.status as task_status', 'tsk.name as task_name', 'mac.expire_time', 'tsk.download_start_time', 'tsk.download_end_time']

    let task_feedback_sql = knex.count('tfb.id as task_feedback_num')
        .from(`${TASK_FEEDBACK} as tfb`)
        .where('tfb.status', 1)
        .whereRaw(`tfb.collection_id = mac.id`).toString()
    let knexSql = knex.select(cloum)
        .select(knex.raw(`(${task_feedback_sql}) as task_feedback_num`))
        .select(knex.raw(`ROUND(mat.size/1048576, 2) as orginal_size`))
        .from(`${MATERIAL_COLLECTION} as mac`)
        .leftJoin(`${TASK_TABLE} as tsk`, 'tsk.id', 'mac.task_id')
        .leftJoin(`${MATERIAL_TABLE} as mat`, 'mat.id', `mac.${mapper[material_type]}`)
        .where({ "mac.id": collection_id })
        .where('mac.account_id', account_id)
        .where('mat.id', material_id)
        .limit(1)
    let data = (await knexSql)[0]
    if (!data) return Promise.reject('素材不存在或无下载权限！')
    let { download_start_time, download_end_time, task_feedback_num, collection_status, task_name, oss_key, orginal_size } = data
    download_start_time = download_start_time ? new Date(download_start_time).getTime() : 0
    download_end_time = download_end_time ? new Date(download_end_time).getTime() : 0
    let time_now = new Date().getTime()
    let task_limit_time = data.expire_time * 1000 - time_now
    task_limit_time = task_limit_time ? task_limit_time : 0
    // console.log({ ...data, task_limit_time, download_start_time, download_end_time, });
    if (task_feedback_num <= 0 && task_limit_time <= 0 || collection_status == 2) return Promise.reject('任务已失效，暂无法下载！')
    if (download_start_time && time_now < download_start_time) return Promise.reject('未到任务下载时间！')
    if (download_end_time && time_now > download_end_time) return Promise.reject('任务下载已截止！')
    let file_name = `${task_name}-${moment().format('YYYYMMDD')}`
    let url = await knexTransaction(async trx => {
        await trx(MATERIAL_COLLECTION).increment('download_times', 1).where('id', collection_id)
        await insertLog(trx, getLogData(collection_id, 4163, { material_id }, userInfo))
        return getDownloadUrl(oss_key, file_name)
    })
    return { code: 0, data: { url, size: orginal_size, file_name: `${file_name}.${oss_key.split('.').pop()}` } }
}
module.exports = {
    list,
    add,
    save,
    def,
    check,
    batchAdd,
    getViewUrl,
    getSearch,
    download,
    myTask,
    giveup
}