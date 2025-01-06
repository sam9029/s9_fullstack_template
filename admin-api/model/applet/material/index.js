const { ACCOUNT_TABLE, PROMOTION_TABLE, CONTENT_TYPE_TABLE, TASK_TABLE, TITLE_TABLE, TITLE_CONTENT_TABLE,
    MATERIAL_COLLECTION, ADVERTISER_TABLE, MATERIAL_TABLE, PLATFORM_ACCOUNT_TABLE, TASK_RELATION } = require("../../../config/setting")
const knex = require("../../../db/knexManager").knexProxy
const { STATUS_MAPPER } = require("../../../utils/mapper")
const { getDaysBetweenDate, knexTransaction, selectName, getUuid, checkSildeCode } = require("../../../utils/tools")
const { insertLog, getLogData } = require("../../public/operationLog")
const { getGroupAccountId } = require("../../public/permission");
const { getPermission } = require('../../public/permission');
const moment = require('moment')
const { getCoverUrl, getOriginalUrl, getDownloadUrl, checkFileMd5 } = require("../../public/upload")
const { setNEXKey, getNEXKey, getRedisClient } = require("../../../db/redis")
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
    let cloums = ['mat.id', 'mat.name', 'mat.type', 'mat.size', 'mat.width', 'mat.director_account_id', 'mat.patcut_account_id', 'mat.update_frequency',
        'mat.height', 'mat.watermark_oss_key', 'original_oss_key', 'mat.advertiser_type', 'mat.content_type', 'mat.late_account_id', 'mat.duration', 'mat.task_id',
        'mat.create_time', 'mat.update_time', 'mat.create_user_id', 'mat.update_user_id', 'mat.watermark_status', 'mat.promotion_category', 'mat.status']
    let knexSql = knex.select(cloums)
        .from(`${MATERIAL_TABLE} as mat`)
        // .leftJoin(`${BLOGGER_TABLE} as blog`, 'mat.blogger_id', 'blog.account_id')
        // .leftJoin(`${TABLE_CONSULTANT} as cst`, 'mat.blogger_id', 'cst.account_id')
        .where({ "mat.oem_id": oem_id })
    let accountIds = await getPermission(query, userInfo)
    if (accountIds.length) knexSql.where(builder => {
        builder.whereIn("mat.create_user_id", accountIds)
    })
    knexSql = handler.searchFilter(knexSql, query)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    // console.log(knexSql.toString());
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        .select(selectName('mat', "content_type", CONTENT_TYPE_TABLE, "name", "content_type_name"))
        .select(selectName('mat', "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
        .select(selectName('mat', "promotion_category", PROMOTION_TABLE, "name", "promotion_category_name"))
        .select(selectName('mat', "director_account_id", ACCOUNT_TABLE, "name", "director_account_name"))
        .select(selectName('mat', "patcut_account_id", ACCOUNT_TABLE, "name", "patcut_account_name"))
        .select(selectName('mat', "late_account_id", ACCOUNT_TABLE, "name", "late_account_name"))
        .select(selectName('mat', "create_user_id", ACCOUNT_TABLE, "name", "create_user_name"))
        .select(selectName('mat', "update_user_id", ACCOUNT_TABLE, "name", "update_user_name"))
        .select(selectName('mat', "task_id", TASK_TABLE, "name", "task_name"))
        .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", 'desc')
    retu.data = retu.data.map(item => {
        item.cover_url = getCoverUrl(item.type, item.watermark_oss_key || item.original_oss_key)
        if (item.type == 1) item.original_url = getOriginalUrl(item.original_oss_key) //图片返回临时访问链接
        delete item.watermark_oss_key
        delete item.original_oss_key
        return item
    })
    return retu

}

async function taskMaterial(query = {}, userInfo = {}) {
    // let { oem_id, id: account_id } = userInfo || {}
    let retu = {
        code: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
        count: 0
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let { task_id, type = 1 } = query
    if (Number(type) > 3) return await getTitleMaterial(query, userInfo)
    if (!task_id) return Promise.reject('未设置查询任务！')
    let cloums = ['mat.id', 'mat.name', 'mat.type', 'mat.size', 'mat.watermark_oss_key', 'mat.original_oss_key', 'mat.duration']
    let knexSql = knex.select(cloums)
        .countDistinct('mac.id as collection_times')
        .select(knex.raw(`CONCAT_WS('x', mat.width, mat.height) as resolution_ratio`))
        .from(`${MATERIAL_TABLE} as mat`)
        .where({ 'mat.task_id': task_id, 'mat.status': 1, 'mat.type': type, 'mat.verify_status': 2, })
        .leftJoin(`${MATERIAL_COLLECTION} as mac`, builder => {
            builder.on('mac.task_id', '=', Number(task_id)).andOn('mac.status', '=', 1).andOn(`mac.${mapper[type]}`, '=', 'mat.id')
        })
        .groupBy('mat.id')
    // knexSql = handler.searchFilter(knexSql, query)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    // console.log(knexSql.toString());
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        .select(selectName('mat', "content_type", CONTENT_TYPE_TABLE, "name", "content_type_name"))
        .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderByRaw(`COUNT(mac.id)`).orderBy([
            { column: 'mat.id', order: 'desc' }
        ])
    const task_key = `koctask_${task_id}`
    let data = []
    if (retu.data.length) data = await getRedisClient().hmGet(task_key, retu.data.map(i => `${i.type}_${i.id}`))
    retu.data = retu.data.map((item, index) => {
        item.remainder = Number(data[index] || 0)
        item.cover_url = getCoverUrl(item.type, item.watermark_oss_key || item.original_oss_key)
        if (item.type == 1) item.original_url = getOriginalUrl(item.original_oss_key) //图片返回临时访问链接
        if (item.type == 2) item.original_url = getOriginalUrl(item.watermark_oss_key || item.original_oss_key) //视频返回水印访问链接
        if (item.type == 3) item.original_url = getOriginalUrl(item.original_oss_key) //音频返回临时访问链接
        delete item.watermark_oss_key
        delete item.original_oss_key
        return item
    })
    return retu
}
async function getTitleMaterial(query = {}, userInfo = {}) {
    let retu = {
        code: 0,
        data: [],
        page: Number(query.page || 1),
        pagesize: Number(query.pagesize || 20),
        count: 0
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let { task_id, type = 4 } = query
    if (![4, 5].includes(Number(type))) return Promise.reject('查询类型错误！')
    if (!task_id) return Promise.reject('未设置查询任务！')
    let TABLE = type == 4 ? TITLE_TABLE : TITLE_CONTENT_TABLE
    let knexSql = knex.select('mat.id', 'mat.content', 'mat.task_id')
        .select(knex.raw(`'${type}' as type`))
        .countDistinct('mac.id as collection_times')
        .from(`${TABLE} as mat`)
        .where({ 'mat.task_id': task_id, 'mat.status': 1, 'mat.verify_status': 2 })
        .leftJoin(`${MATERIAL_COLLECTION} as mac`, builder => {
            builder.on('mac.task_id', '=', Number(task_id)).andOn('mac.status', '=', 1).andOn(`mac.${mapper[type]}`, '=', 'mat.id')
        })
        .groupBy('mat.id')
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderByRaw(`COUNT(mac.id)`).orderBy([
            { column: 'mat.id', order: 'desc' }
        ])
    const task_key = `koctask_${task_id}`
    let data = []
    if (retu.data.length) data = await getRedisClient().hmGet(task_key, retu.data.map(i => `${i.type}_${i.id}`))
    retu.data = retu.data.map((item, index) => {
        item.remainder = Number(data[index] || 0)
        item.type = Number(item.type)
        return item
    })
    return retu
}
//领取视频、图片、标题、文案素材
/*
1、领取请求命中redis 有key 说明素材可以领取 无key说明不可以领取
2、可以领取后，立即将库存更改，库存减1操作
3、判断任务是否有效（任务是否开启、是否投放状态中、是否满员），不满足条件释放该任务 原key库存加 1
4、在数据库中落表领取记录 落表成功 返回领取成功，开始计算有效发布时间 超过多久后且未发布回填，任务进行释放 释放后原库存加 1，将领取记录标记为失效
在redis 存的 格式为
  task_key:{
    feedback_expire_scend:
    feedback_end_time:
    download_start_time:
    download_end_time:
    status:
    publish_status:
    material_num: 素材数量 0 不需要该类型素材
    title_num:标题数量
    title_content_num:置顶标题数量
    participants_num: 总参与人数
    check_keys:[] //需要验证的key
  }
 */
function getTaskInfo(task_info = {}) {
    let { feedback_expire_scend, feedback_end_time, download_start_time, download_end_time, material_num, title_num, title_content_num } = task_info || {}
    let back = { feedback_expire_scend, feedback_end_time, download_start_time, download_end_time, material_num, title_num, title_content_num }
    Object.keys(back).forEach(key => {
        back[key] = back[key] ? Number(back[key]) : null
    })
    return back
}
async function receive(body = {}, userInfo = {}, req) {
    let { id: account_id } = userInfo || {}
    const { task_id, video_id, image_id, audio_id, title_id, title_content_id, captcha_code } = body
    if (!await checkSildeCode(req, captcha_code)) return Promise.reject('验证码错误,请重试！')
    if (!task_id) return Promise.reject('参数异常，请检查参数！')
    //这个地方验证验证码 防止脚本请求
    const task_key = `koctask_${task_id}`
    let time_now = parseInt(new Date().getTime() / 1000) //获取当前时间戳 秒级
    let task_info = await getRedisClient().hGetAll(task_key)
    if (!task_info) return Promise.reject('任务不存在或已被删除！')
    let { feedback_expire_scend, feedback_end_time, download_start_time, download_end_time } = getTaskInfo(task_info)
    if (download_start_time && time_now < download_start_time) return Promise.reject('未到任务领取时间！')
    if (download_end_time && time_now > download_end_time) return Promise.reject('任务领取已截止！')
    if (task_info && task_info.status != 1) return Promise.reject('任务已停止领取！')
    if (task_info && task_info.publish_status == 4) return Promise.reject('任务预算不足，已停止领取！')
    if (task_info && task_info.publish_status != 2) return Promise.reject('任务已停止发布！')
    let task_relation = await knex(TASK_RELATION).select('*').where({ task_id, status: 1 })
    if (!task_relation.length) return Promise.reject('该任务配置异常，暂无法领取！')
    let check_keys = []
    let data_keys = task_relation.map(i => {
        if (i.required == 1) check_keys.push(mapper[i.type])
        return mapper[i.type]
    })
    // if (material_num) check_keys.push('video_id')
    // if (title_num) check_keys.push('title_id')
    // if (title_content_num) check_keys.push('title_content_id')
    const key_mapper = {
        image_id: `1_${image_id}`,
        video_id: `2_${video_id}`,
        audio_id: `3_${audio_id}`,
        title_id: `4_${title_id}`,
        title_content_id: `5_${title_content_id}`,
    }
    let get_data_key = []
    for (let index = 0; index < data_keys.length; index++) {
        const key = data_keys[index];
        if (!body[key] && check_keys.includes(key)) return Promise.reject('参数异常，请检查参数！')
        if (body[key]) get_data_key.push(key_mapper[key])
    }
    if (!get_data_key.length) return Promise.reject('未选择领取资源！')
    let str_mapper = { 1: '图片', 2: '视频', 3: '音频', 4: '标题', 5: '置顶内容' }
    let data = await getRedisClient().hmGet(task_key, get_data_key)
    //开始检查素材库存
    for (let index = 0; index < get_data_key.length; index++) {
        let [material_type, id] = get_data_key[index].split('_');
        let num = (data[index] === null ? null : Number(data[index]))
        if (!num || num <= 0) return Promise.reject(`${str_mapper[material_type]}已被领取或领取次数已达上限！`)
    }
    await Promise.all(get_data_key.map(material_key => getRedisClient().hIncrBy(task_key, material_key, -1)))// 素材存在时，开始减库存
    // for (let index = 0; index < get_data_key.length; index++) {
    //     const material_key = get_data_key[index];
    //     await getRedisClient().hIncrBy(task_key, material_key, -1) // 素材存在时，开始减库存
    // }
    let recive_log = {
        task_id,
        status: 1,
        image_id: image_id || 0,
        video_id: video_id || 0,
        audio_id: audio_id || 0,
        title_id: title_id || 0,
        title_content_id: title_content_id || 0,
        account_id,
        expire_time: 0,
        create_user_id: account_id,
        update_user_id: account_id,
        etag: getUuid()
    }
    if (feedback_expire_scend) {
        let expire_time = time_now + feedback_expire_scend //过期时间的时间戳
        if (feedback_end_time && expire_time > feedback_end_time) expire_time = feedback_end_time
        recive_log.expire_time = expire_time //任务反馈过期时间
    }
    let message = null
    data = await knexTransaction(async trx => {
        //检测这个人有没有账号，没有审核通过的账号就不准领取
        let platfrom_account = (await trx(PLATFORM_ACCOUNT_TABLE).select('id').where({ blogger_id: account_id, status: 1, verify_status: 2 }).limit(1))[0]
        if (!platfrom_account) return Promise.reject('暂无审核通过的平台账号，无法领取任务！')
        let before = (await trx(MATERIAL_COLLECTION).select('id').where({ task_id, account_id, status: 1 }).limit(1))[0]
        if (before) return Promise.reject('您已领取过该任务，每个账号仅限领取一次！')
        let data_id = (await trx(MATERIAL_COLLECTION).insert(recive_log)
            .onConflict(['video_id', 'image_id', 'audio_id', 'title_id', 'title_content_id', 'account_id', 'task_id']).merge())[0]
        await insertLog(trx, getLogData(data_id, 4161, recive_log, userInfo))
        return data_id
    }).catch(async err => {
        await Promise.all(get_data_key.map(material_key => getRedisClient().hIncrBy(task_key, material_key, 1))) // 领取记录写入异常，库存+1
        message = String(err.message || err || '未知异常！')
    })
    if (message) return Promise.reject(message)
    return { code: 0, data }
}
async function def(query = {}, userInfo = {}) {
    let { id } = query || {}
    let { oem_id } = userInfo || {}
    if (!id) return Promise.reject('未设置查询ID！')
    let retu = {
        code: 0,
        data: {}
    }
    let cloums = ['mat.id', 'mat.name', 'mat.type', 'mat.size', 'mat.width', 'mat.director_account_id', 'mat.patcut_account_id', 'mat.update_frequency',
        'mat.height', 'mat.watermark_oss_key', 'original_oss_key', 'mat.advertiser_type', 'mat.content_type', 'mat.late_account_id', 'mat.duration',
        'mat.create_time', 'mat.update_time', 'mat.create_user_id', 'mat.update_user_id', 'mat.watermark_status', 'mat.promotion_category', 'mat.status']
    let knexSql = knex.select(cloums)
        .from(`${MATERIAL_TABLE} as mat`)
        .where({ "mat.oem_id": oem_id, "mat.id": id })
    let accountIds = await getPermission(query, userInfo)
    if (accountIds.length) knexSql.where(builder => {
        builder.whereIn("mat.create_user_id", accountIds)
    })
    retu.data = await knexSql
        .select(selectName('mat', "content_type", CONTENT_TYPE_TABLE, "name", "content_type_name"))
        .select(selectName('mat', "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
        .select(selectName('mat', "promotion_category", PROMOTION_TABLE, "name", "promotion_category_name"))
        .select(selectName('mat', "director_account_id", ACCOUNT_TABLE, "name", "director_account_name"))
        .select(selectName('mat', "patcut_account_id", ACCOUNT_TABLE, "name", "patcut_account_name"))
        .select(selectName('mat', "late_account_id", ACCOUNT_TABLE, "name", "late_account_name"))
        .select(selectName('mat', "create_user_id", ACCOUNT_TABLE, "name", "create_user_name"))
        .select(selectName('mat', "update_user_id", ACCOUNT_TABLE, "name", "update_user_name"))
        .select(selectName('mat', "task_id", TASK_TABLE, "name", "task_name"))
        .limit(1)
    retu.data = retu.data.map(item => {
        item.cover_url = getCoverUrl(item.type, item.watermark_oss_key || item.original_oss_key)
        if (item.type == 1) item.original_url = getOriginalUrl(item.original_oss_key) //图片返回临时访问链接
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
    let sqlKnex = knex(MATERIAL_TABLE).where({ type, oem_id })
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
    let { oem_id, md5 } = new_data
    let beforeData = (await knex(MATERIAL_TABLE).select('id', 'name', 'status')
        .where({ oem_id, md5 }).limit(1))[0]
    if (beforeData) return Promise.reject(`存在状态【${STATUS_MAPPER[beforeData.status]}】的相同素材【${beforeData.name}】，请勿重复添加`)
    await checkFileMd5(new_data.original_oss_key, new_data.md5)
    let data = await knexTransaction(async (trx) => {
        new_data.name = new_data.name.split('.')
        new_data.name.pop()
        new_data.name = new_data.name.join('.')
        let detail_id = (await trx(MATERIAL_TABLE).insert(new_data))[0]
        await insertLog(trx, getLogData(detail_id, 5451, new_data, userInfo))
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
    let before_data = (await knex(MATERIAL_TABLE).select('*').where({ id }))[0]
    if (!new_data.original_oss_key) delete new_data.original_oss_key
    if (new_data.original_oss_key && new_data.original_oss_key != before_data.original_oss_key && before_data.type == 2) { //说明更新了视频，需要重新生成
        if ([2, 3].includes(before_data.watermark_status)) return Promise.reject('视频水印生成中，暂无法上传更新视频！')
        new_data.watermark_status = 1
        new_data.watermark_oss_key = null
        new_data.update_frequency = before_data.update_frequency + 1
        await checkFileMd5(new_data.original_oss_key, new_data.md5)
    }
    let data = await knexTransaction(async (trx) => {
        await trx(MATERIAL_TABLE).update(new_data).where('id', id)
        await insertLog(trx, getLogData(id, 5452, new_data, userInfo, before_data))
        return id
    })
    return { code: 0, data }
}
async function check(body = {}, userInfo = {}) {
    let { md5 } = body || {}
    let { oem_id } = userInfo || {}
    if (!md5) return Promise.reject('未设置查询的md5！')
    let data = (await knex.select('original_oss_key as oss_key', 'size', 'width', 'height')
        .from(MATERIAL_TABLE).where({ md5, oem_id }).limit(1))[0]
    return { code: 0, data }
}
let handler = {
    searchFilter(knexSql, query = {}) {
        if (!query.status) knexSql.whereIn('mat.status', [1, 2])
        if (query.status) knexSql.where('mat.status', query.status)
        if (!query.type) knexSql.where('mat.type', 1)
        if (query.type) knexSql.where('mat.type', query.type)
        if (query.advertiser_type) knexSql.where('mat.advertiser_type', query.advertiser_type)
        if (query.director_account_id) knexSql.where('mat.director_account_id', query.director_account_id)
        if (query.patcut_account_id) knexSql.where('mat.patcut_account_id', query.patcut_account_id)
        if (query.late_account_id) knexSql.where('mat.late_account_id', query.late_account_id)
        if (query.content_type) knexSql.where('mat.content_type', query.content_type)
        if (query.create_date_range) knexSql.whereIn('mat.create_date', getDaysBetweenDate(query.create_date_range[0], query.create_date_range[1]))
        // if (query.platform_ids && query.platform_ids.length) knexSql.whereIn('mat.platform_id', query.platform_ids)
        if (query.keyword) {
            let keyword = query.keyword.trim()
            knexSql.where(builder => {
                builder.where('mat.id', 'like', `%${keyword}%`).orWhere('mat.name', 'like', `%${keyword}%`)
            })
        }
        if (query.resolution && query.resolution.indexOf('x') != -1) {
            let [width, height] = query.resolution.split('x')
            knexSql.where({ 'mat.width': width, 'mat.height': height })
        }
        // if (query.consultant_id) knexSql.whereRaw(`(mat.blogger_id IN (SELECT id FROM ${ACCOUNT_TABLE} WHERE direct_leader = ${query.consultant_id}) OR mat.blogger_id = ${query.consultant_id})`)
        return knexSql
    },
    checkData(body = {}, userInfo = {}, type = "add") {
        let user_id = userInfo.id
        let checkKeys = ['name', 'type', 'md5', 'size', 'width', 'height', 'original_oss_key', 'advertiser_type', 'content_type']
        let dataKeys = ['id', 'director_account_id', 'patcut_account_id', 'late_account_id', 'status', 'promotion_category', 'duration', 'task_id']
        let data = {}
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
    let data = (await knex(MATERIAL_TABLE).select('watermark_oss_key', 'watermark_status').where({ id, oem_id }).limit(1))[0]
    if (!data) return Promise.reject('该视频不存在！')
    let { watermark_status, watermark_oss_key } = data
    let message = null
    if (watermark_status != 4 && watermark_status != 5) message = '视频水印生成中，请稍后预览！'
    if (watermark_status == 5) message = '视频水印生成失败，暂不支持预览，请点击按钮重新生成水印视频！'
    if (message) return { code: 1, watermark_status, message }
    return { code: 0, data: getOriginalUrl(watermark_oss_key) }
}
async function download(body, userInfo = {}) {
    let { ids } = body || {}
    let { oem_id } = userInfo || {}
    if (!ids || !ids.length) return Promise.reject('未设置下载的素材ID！')
    let cloums = ['mat.id', 'mat.name as file_name', 'mat.original_oss_key as oss_key', 'mat.status']
    let knexSql = knex.select(cloums)
        .from(`${MATERIAL_TABLE} as mat`)
        .where({ "mat.oem_id": oem_id, })
        .whereIn("mat.id", ids)
    let accountIds = await getPermission(body, userInfo)
    if (accountIds.length) knexSql.where(builder => {
        builder.whereIn("mat.create_user_id", accountIds)
    })
    let data = await knexSql
    let can_download = {}
    data.forEach(i => can_download[i.id] = i)
    let success = [], fail = []
    ids.forEach(id => {
        if (can_download[id]) {
            if (can_download[id].status != 1) {
                fail.push({ id, reason: '该视频已删除或停用，暂无法下载！' })
            } else {
                success.push({ id, url: getDownloadUrl(can_download[id].oss_key, can_download[id].file_name) })
            }
        } else {
            fail.push({ id, reason: '该视频无下载权限！' })
        }
    })
    return { code: 0, data: { success, fail } }
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
    taskMaterial,
    receive
}