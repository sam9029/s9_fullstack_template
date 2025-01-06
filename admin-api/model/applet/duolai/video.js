const { DUOLAI_VIDEO, DUOLAI_VIDEO_COLLECTION, COPYRIGHT, DUOLAI_COLLECT_TARGET, CHANNEL_TABLE } = require("../../../config/setting")
const { checkKeys, isArrayHas } = require("../../../utils/check_type")
const knex = require("../../../db/knexManager").knexProxy
const { insertLog, getLogData } = require("../../public/operationLog")
const { getDaysBetweenDate, knexTransaction, selectName, getUuid, checkSildeCode } = require("../../../utils/tools")
const { getDuoLaiApplets, getAppletInfo } = require("../../duolai/tools")
const ApprovalUtil = require("../../../utils/approval_lock_v2");
const { getLock } = require("../../../db/redis")
const { RK_TABLE_UPDATE_LOCK } = require("../../../config/redis_key")
const { queryLikeWhere, getNextPageSite, queryIfWhere } = require("../../../utils/sqlHelper")
const { getBottonPermission } = require("../../public/permission")
const moment = require('moment')
const { UploadParser } = require("../../manage/copyrightCenter/content_utils")

const json_keys = ['app_id_target', 'system_target', 'pay_type', 'copyright']
const cloums = ["id", "name", "url", "cover_url", "describe", "md5", "width", "height", "duration", "file_size", "account_id", "collection_id", "type", "app_id_target", "system_target", "pay_type", "price", "copyright", "preview_duration", "status", "shelf_status", "drama_order", "is_hot", "share_num", "like_num", "favorite_num", "watch_num", "create_time", "update_time", "verify_status", "verify_suggest"]
class VideoApproval extends ApprovalUtil {
    /**
     * 审核通过时，尝试调用星图接口设置任务分成比例
     * @param {*} update_obj 
     * @param {*} data_raw 
     * @param {*} trx 
     * @param {*} userInfo 
     */
    async after_update(update_obj, data_raw, trx, userInfo) {
        let { verify_status } = update_obj
        // let { id: demand_id, star_id, mcn_profit_rate } = data_raw
        // console.log(update_obj, data_raw, userInfo);
        if (verify_status == 3) {
        }
    }
}
async function delCollectionTarget(collection_id, insert_data = {}, userInfo, trx = knex) {
    let insert_info = { collection_id, create_user_id: userInfo.id, update_user_id: userInfo.id }
    let insert_target = []
    if (insert_data) {
        let app_id_target = JSON.parse(insert_data.app_id_target || '[]')
        if (!app_id_target?.length) return
        let applet_info = await Promise.all(app_id_target.map(app_id => getAppletInfo(app_id)))
        insert_target = applet_info.map(item => {
            let new_item = { app_id: item.app_id, ...insert_info }
            if (item.review_type == 'NONE') new_item.review_status = 3
            return new_item
        })
    }
    if (insert_target?.length) await trx(DUOLAI_COLLECT_TARGET).insert(insert_target)
}
async function add(body = {}, userInfo = {}) {
    let { id: account_id, oem_id, role_ids } = userInfo
    role_ids = (role_ids || '').split(',').filter(i => i).map(i => Number(i))
    await getBottonPermission([3107, 2974], userInfo)
    let insert_data = await check_data(body, role_ids)
    let id = await knexTransaction(async trx => {
        let { videos } = body
        const channel_info = (await trx(CHANNEL_TABLE).select("id as channel_id", "cdn_host").where("id", userInfo.channel_id))[0];
        await UploadParser.parse_upload(insert_data, channel_info, trx, false);
        insert_data = { ...insert_data, create_user_id: account_id, update_user_id: account_id, account_id, oem_id, create_date: moment().format('YYYY-MM-DD') }
        let [re_id] = await trx(DUOLAI_VIDEO_COLLECTION).insert(insert_data)
        await delCollectionTarget(re_id, insert_data, userInfo, trx)
        if (videos?.length) {
            let logs = await Promise.all(videos.map(async i => {
                let new_item = {
                    ...(check_video({ ...i, collection_id: re_id, copyright_id: insert_data.copyright_id, })),
                    create_user_id: account_id, update_user_id: account_id, account_id, oem_id,
                    create_date: moment().format('YYYY-MM-DD')
                }
                await UploadParser.parse_upload(new_item, channel_info, trx, true);
                let [video_id] = await trx(DUOLAI_VIDEO).insert(new_item)
                return getLogData(video_id, 7008, new_item, userInfo)
            }))
            await insertLog(trx, logs)
        }
        await insertLog(trx, getLogData(re_id, 7002, insert_data, userInfo))
        return re_id
    })
    return { code: 0, data: { message: 'success', id } }
}
/**
 * 对用户提交的视频进行过滤
 * @param {*} video 
 * @returns 
 */
function check_video(video) {
    let insert_data = checkKeys(video, [
        { key: 'name', required: true, type: String },
        { key: 'url', required: false, type: URL },
        { key: 'video_upload_id', required: false, type: Number },
        { key: 'cover_url', required: false, type: URL },
        { key: 'cover_upload_id', required: false, type: Number },
        { key: 'md5', required: true, type: String },
        { key: 'describe', required: true, type: String },
        { key: 'is_free', required: true, type: String, validator: (val) => isArrayHas(['F', 'T'], val) },
        { key: 'copyright_id', required: true, type: Number },
        { key: 'collection_id', required: true, type: Number },
        { key: 'file_size', required: true, type: Number, validator: (val) => val && val > 0 },
        { key: 'width', required: true, type: Number, validator: (val) => val && val > 0 },
        { key: 'height', required: true, type: Number, validator: (val) => val && val > 0 },
        { key: 'duration', required: false, type: Number, validator: (val) => val && val >= 0 },
        { key: 'sequence_no', required: false, type: Number, validator: (val) => val && val > 0 },
        { key: 'preview_duration', required: false, type: Number, validator: (val) => val >= 0 },
        {
            key: 'price', required: false, type: Number, validator: (val) => {
                if (video.is_free == 'T') return val == 0
                return val > 0
            }
        },
        "online_time?"
    ], true)
    return insert_data
}
/**
 * 对用户提交的数据进行粗过滤,并根据角色和版权,控制价格数值字段
 * @param {*} body 
 * @returns 
 */
async function check_data(body, user_roles = [], trx = knex) {

    let { copyright_id } = checkKeys(body, [{ key: 'copyright_id', required: true, type: Number }])
    let copyright_info = (await trx(COPYRIGHT).select('id', 'origin', 'origin_type').where({ id: copyright_id, status: 1 }).limit(1))[0]
    if (!copyright_info) return Promise.reject('版权信息异常！')
    // 新增的时候，如果用户为承制方，且版权为被授权版权，授权类型为推小果 不可设置价格
    // console.log(copyright_info);
    if (user_roles?.includes(6) && copyright_info?.origin == 2 && copyright_info?.origin_type == 'txg') {
        body.set_price = 'UNSET'
        return checkKeys(body, [
            { key: 'name', required: true, type: String },
            { key: 'cover_url', required: false, type: URL },
            { key: 'cover_upload_id', required: false, type: Number },
            { key: 'describe', required: true, type: String },
            { key: 'copyright_id', required: true, type: Number },
            { key: 'set_price', required: true, type: String, validator: (val) => isArrayHas(['UNSET', 'SETED'], val) },
            {
                key: 'type', required: true, type: String, validator: (val) => {
                    if (val == 'MULTIPLE' && !body.episode_num) throw new Error('未设置总集数！')
                    return isArrayHas(['SINGEL', 'MULTIPLE'], val)
                }
            },
            {
                key: 'episode_num', required: false, type: Number, validator: (val) => {
                    if (val && body.type != 'MULTIPLE') throw new Error('不可设置总集数！')
                    if (body.type == 'MULTIPLE') return val && val >= 2
                    return val && val >= 1
                }
            }
        ])
    }

    let insert_data = checkKeys(body, [
        { key: 'name', required: true, type: String },
        { key: 'cover_url', required: false, type: URL },
        { key: 'cover_upload_id', required: false, type: Number },
        { key: 'describe', required: true, type: String },
        { key: 'copyright_id', required: true, type: Number },
        {
            key: 'set_price', required: false, type: String, validator: (val) => isArrayHas(['UNSET', 'SETED'], val)
        },

        {
            key: 'type', required: true, type: String, validator: (val) => {
                if (val == 'MULTIPLE' && !body.episode_num) throw new Error('未设置总集数！')
                return isArrayHas(['SINGEL', 'MULTIPLE'], val)
            }
        },
        {
            key: 'episode_num', required: false, type: Number, validator: (val) => {
                if (val && body.type != 'MULTIPLE') throw new Error('不可设置总集数！')
                if (body.type == 'MULTIPLE') return val && val >= 2
                return val && val >= 1
            }
        },
        {
            key: 'free_episode', required: false, type: Number, validator: (val) => {
                if (val && body.type != 'MULTIPLE') throw new Error('不可设置免费集数！')
                if (val >= body.episode_num) throw new Error('免费集数设置错误！')
                return val >= 0
            }
        },
        { key: 'preview_duration', required: false, type: Number, validator: (val) => val >= 0 },
        {
            key: 'price_type', required: true, type: String, validator: (val) => {
                if (val == 'UNIQUE' && !body.unique_price) throw new Error('未设置统一价格！')
                return isArrayHas(['UNIQUE', 'CUSTOM', 'BYTIME'], val)
            }
        },
        {
            key: 'unique_price', type: Number, validator: (val) => {
                if (val && body.price_type != 'UNIQUE') throw new Error('不可设置统一价格！')
                return true
            }
        },
        'app_id_target?', 'system_target?', 'pay_type'
    ], true)

    if (insert_data?.app_id_target) {
        if (!insert_data?.app_id_target?.length) return Promise.reject('未设置定向小程序！')
        let applets = (await getDuoLaiApplets()).map(i => i.app_id)
        let { app_id_target } = checkKeys(insert_data, [{
            key: 'app_id_target', type: Array, validator: (val) => {
                return val.every(item => applets.includes(item))
            }
        }])
        insert_data.app_id_target = JSON.stringify(app_id_target)
    }
    if (insert_data?.system_target) {
        if (!insert_data?.system_target?.length) return Promise.reject('未设置定向系统！')
        let { system_target } = checkKeys(insert_data, [{
            key: 'system_target', type: Array, validator: (val) => {
                return val.every(item => ['AND', 'IOS'].includes(item))
            }
        }])
        insert_data.system_target = JSON.stringify(system_target)
    }
    let { pay_type } = checkKeys(insert_data, [{
        key: 'pay_type', type: Array, validator: (val) => {
            if (!val?.length) throw new Error('未设置支付方式！')
            // if (val.includes('AD') && !insert_data?.price && !insert_data?.collection_id) throw new Error('未设置剧集价格！')
            return val.every(item => ['MONEY', 'AD'].includes(item))
        }
    }])

    insert_data.pay_type = JSON.stringify(pay_type)

    return insert_data
}
/**
 * 用户提交视频进行审核
 * @param {*} body 
 * @param {*} userInfo 
 */
async function subimit_approvel(body, userInfo = {}) {
    let { id: account_id } = userInfo || {}
    let { ids } = checkKeys(body, [{ key: 'ids', required: true, type: Array }])
    await getBottonPermission([3115, 3079], userInfo)
    return await getLock(`${RK_TABLE_UPDATE_LOCK}:${DUOLAI_VIDEO}:${account_id}`, async () => {
        const Approval = new VideoApproval({ data_table: DUOLAI_VIDEO, approval_type: 1, log_type: 7003, cols: ['price'] });
        let data = await knexTransaction(async (trx) => {
            let old_info = await trx(DUOLAI_VIDEO).select('*').where({ account_id, status: 1 }).whereIn('verify_status', [1, 4, 5]).whereIn('id', ids)
            if (!old_info?.length) return Promise.reject('视频、图片不存在或者已失效！')
            return await Approval.batch_approval(old_info, 2, '用户提交审核', userInfo, true, trx);
        });
        return { code: 0, data }
    })
}
/**
 * 用户视频上下架
 * @param {*} body 
 * @param {*} userInfo 
 * @returns 
 */
async function shelf(body, userInfo = {}) {
    let { id: account_id } = userInfo || {}
    let { id, shelf_status } = checkKeys(body, [
        { key: 'id', required: true, type: Number, validator: (val) => val > 0 },
        { key: 'shelf_status', required: true, type: String, validator: (val) => isArrayHas(['ONLINE', 'OFFLINE'], val) }])
    return await getLock(`${RK_TABLE_UPDATE_LOCK}:${DUOLAI_VIDEO}:${id}`, async () => {
        await knexTransaction(async (trx) => {
            let old_info = (await trx(DUOLAI_VIDEO).select('*').where({ id, account_id, status: 1, verify_status: 3 }).limit(1))[0]
            if (!old_info) return Promise.reject('视频、图片不存在或者已失效！') //只有审核通过的视频才可以上下架
            await trx(DUOLAI_VIDEO).update({ shelf_status, update_user_id: account_id }).where('id', id)
            await insertLog(trx, getLogData(id, 7004, { shelf_status, update_user_id: account_id }, userInfo, old_info))
        });
        return { code: 0, data: { message: 'success', id } }
    })
}
/**
 * 审核失败、待提交、召回的数据可以进行编辑
 * @param {*} body 
 * @param {*} userInfo 
 * @returns 
 */
async function edit(body, userInfo = {}) {
    let { id: account_id } = userInfo || {}
    let { id } = checkKeys(body, [{ key: 'id', required: true, type: Number, validator: (val) => val > 0 }])
    return await getLock(`${RK_TABLE_UPDATE_LOCK}:${DUOLAI_VIDEO}:${id}`, async () => {
        let old_info = (await knex(DUOLAI_VIDEO).select('*').where({ id, account_id, status: 1 })
            .whereIn('verify_status', [1, 4, 5])
            .limit(1))[0]
        if (!old_info) return Promise.reject('视频、图片不存在或者已失效！') //只有审核通过的视频才可以上下架
        Object.keys(old_info).forEach(i => {
            if (old_info[i] && json_keys.includes(i)) old_info[i] = JSON.parse(old_info[i])
        })
        let new_update = await check_data({ ...old_info, ...body, update_user_id: account_id })
        let { collection_id } = new_update
        // console.log(new_update);
        await knexTransaction(async (trx) => {
            if (collection_id) {// 如果是合集，此时查询原合集信息，定向、支付方式、和原合集一致
                if (collection_id == id) return Promise.reject('合集不存在或者已失效！') //不可以指定本身为合集ID
                let old_collection_info = (await trx(DUOLAI_VIDEO).select('app_id_target', 'system_target', 'pay_type', 'type')
                    .where({ id: collection_id, account_id, status: 1, type: 'MULTIPLE', collection_id: 0 }).limit(1))[0]
                if (!old_collection_info) return Promise.reject('合集不存在或者已失效！')
                new_update = { ...new_update, ...old_collection_info }
            }
            await trx(DUOLAI_VIDEO).update(new_update).where('id', id)
            await insertLog(trx, getLogData(id, 7005, new_update, userInfo, old_info))
        });
        return { code: 0, data: { message: 'success', id } }
    })
}
/**
 * 用户删除视频
 * @param {*} body 
 * @param {*} userInfo 
 * @returns 
 */
async function del(body, userInfo = {}) {
    let { id: account_id } = userInfo || {}
    let { id } = checkKeys(body, [{ key: 'id', required: true, type: Number, validator: (val) => val > 0 }])
    return await getLock(`${RK_TABLE_UPDATE_LOCK}:${DUOLAI_VIDEO}:${id}`, async () => {
        await knexTransaction(async (trx) => {
            let old_info = (await trx(DUOLAI_VIDEO).select('*').where({ id, account_id, status: 1 }).limit(1))[0]
            if (!old_info) return Promise.reject('视频、图片不存在或者已失效！') //只有审核通过的视频才可以上下架
            if (old_info?.shelf_status != 'OFFLINE') return Promise.reject('视频、图片下架后才可删除！')
            // 这个是合集时，将下架并删除所有子集视频
            let update_data = { status: 3, shelf_status: "OFFLINE" }
            let childrens = await trx(DUOLAI_VIDEO).select('*').where({ collection_id: id, account_id, status: 1 })
            let logs = childrens.map(item => getLogData(item.id, 7006, update_data, userInfo, item))
            if (childrens?.length) await trx(DUOLAI_VIDEO).update(update_data).whereIn('id', childrens.map(i => i.id))
            await trx(DUOLAI_VIDEO).update(update_data).where('id', id)
            await insertLog(trx, logs.push(getLogData(id, 7006, update_data, userInfo, old_info)))
        });
        return { code: 0, data: { message: 'success', id } }
    })
}
/**
 * 获取合集下拉
 */
async function collection(query = {}, userInfo = {}) {
    let { id: account_id } = userInfo || {}
    let collections = await knex(DUOLAI_VIDEO).select('id as value', 'name as label')
        .where({ account_id, status: 1, type: 'MULTIPLE', collection_id: 0 }).where(builder => {
            queryLikeWhere(builder, ["id", "name"], query.keyword)
        }).limit(50)
    return { code: 0, data: { list: collections } }
}
/**
 * 获取已上传的视频列表
 */
async function list(query = {}, userInfo = {}) {
    let { next_page_site, pagesize = 20 } = checkKeys(query, [{ key: 'query_type', required: true, validator: (val) => isArrayHas(['UNAPPROVEL', 'BEAPPROVEL', 'APPROVED'], val) }, 'pagesize?'])
    const response = { next_page_site: null, list: [], pagesize }
    const knex_sql = knex(`${DUOLAI_VIDEO} as video`)
        .where({ 'video.account_id': userInfo.id, 'video.status': 1 })
        .where((builder) => {
            if (next_page_site) builder.where("video.id", "<", next_page_site);
        });

    handler.search_filter(knex_sql, query, userInfo);
    // if (query.sort_prop && query.sort_order) knex_sql.orderBy(query.sort_prop, query.sort_order)
    response.list = await knex_sql.select(cloums.map(i => `video.${i}`)).orderBy("video.id", "desc").limit(pagesize)
    response.next_page_site = getNextPageSite(response.data, pagesize)

    response.list = response.list.map(i => {
        json_keys.forEach(key => {
            if (i[key]) i[key] = JSON.parse(i[key])
        })
        return i
    })
    // .select(selectName('video', 'update_user_id', ACCOUNT_TABLE, 'name', 'update_user_name'))

    return { code: 0, data: response };
}
/**
 * 查询单个视频
 */
async function def(query = {}, userInfo = {}) {
    let { id } = checkKeys(query, [{ key: 'id', required: true, type: Number }, 'pagesize?'])
    const response = { code: 0, data: {} }
    const knex_sql = knex(`${DUOLAI_VIDEO} as video`)
        .where({ 'video.account_id': userInfo.id, 'video.status': 1, 'video.id': id, })
        .limit(1)

    handler.search_filter(knex_sql, query, userInfo);
    // if (query.sort_prop && query.sort_order) knex_sql.orderBy(query.sort_prop, query.sort_order)
    response.data = (await knex_sql.select(cloums.map(i => `video.${i}`)))[0]

    json_keys.forEach(key => {
        if (response.data[key]) response.data[key] = JSON.parse(response.data[key])
    })

    return response
}
const handler = {
    /**@param {knex} knex_sql  */
    search_filter(knex_sql, query, userInfo) {


        queryIfWhere(knex_sql, "video.verify_status", query.verify_status);
        if (query.query_type == 'UNAPPROVEL') knex_sql.whereIn('video.verify_status', [1, 4, 5])
        if (query.query_type == 'BEAPPROVEL') knex_sql.whereIn('video.verify_status', [2])
        if (query.query_type == 'APPROVED') knex_sql.whereIn('video.verify_status', [3])

        queryIfWhere(knex_sql, "video.pay_type", query.pay_type);
        queryLikeWhere(knex_sql, ["video.id", "video.name"], query.keyword)

        if (query.date_range?.length) {
            const [start_date, end_date] = query.date_range;
            knex_sql.whereIn("video.create_date", getDaysBetweenDate(start_date, end_date))
        }
    }
};
module.exports = {
    list,
    add,
    def,
    subimit_approvel,
    shelf,
    edit,
    del,
    collection
}