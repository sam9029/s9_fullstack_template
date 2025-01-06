const { getCountWaitLock, getWaitLock, getCustomCache, setCustomCache, getLock } = require("../../../db/redis")
const { RK_DUOLAI_LOGIN_NUM_LOCK, RK_DLKD_TOKEN_LOCK, RK_DUOLAI_VIDEO_SYNC_MEDIA } = require("../../../config/redis_key")
const { DUOLAI_ORDERS, DUOLAI_APPLET, DUOLAI_MEDIA_VIDEO_PUSH,
    DUOLAI_VIDEO, DUOLAI_MEDIA_COLLECTION_PUSH, DUOLAI_VIDEO_COLLECTION } = require("../../../config/setting")
const { kuaishou_auth, production_url, system_account_id } = require("../../../config/index")
const { md5 } = require('../../public/externalMedia/utils')
const { checkKeys } = require("../../../utils/check_type")
const moment = require('moment')
const { knexTransaction, selectName, getUrlPath } = require("../../../utils/tools")
const { getAppletInfo } = require("../../duolai/tools")
const { syncContent: ksSyncContent } = require("../kuaishou")
const { getOriginalUrl } = require("../../public/upload")
const knex = require("../../../db/knexManager").knexProxy
const lodash = require("lodash")

/**
 * @typedef {import("knex").Knex.Transaction } KnexTransaction
 */

/**
 * @param { (trx: KnexTransaction) => Promise<any> } callback
 * @returns
 */
async function use_trx(trx, callback = async () => { }) {
    if (trx) return await callback(trx)
    return await knexTransaction(async trx => {
        return await callback(trx)
    })
}
const video_cloums = ['id', 'name', 'cover_url', 'collection_id', 'is_free', 'sequence_no', 'duration', 'describe', 'status', 'verify_status']
async function push_video_tomedia(video_id, app_id, update_user_id = 0, c_trx) {
    //首先看是否使用了事务，未使用事务内部启用事务
    const redis_key = `${RK_DUOLAI_VIDEO_SYNC_MEDIA}${app_id}:${video_id}`
    return await getLock(redis_key, async () => {
        return await use_trx(c_trx, async trx => {
            let [applet_info, [video_info]] = await Promise.all([
                getAppletInfo(app_id),
                trx(`${DUOLAI_VIDEO} as vdo`)
                    .select(selectName('vdo', 'collection_id', DUOLAI_VIDEO_COLLECTION, 'type', 'collection_type'))
                    .select(selectName('vdo', 'collection_id', DUOLAI_VIDEO_COLLECTION, 'app_id_target', 'app_id_target'))
                    .select(video_cloums.map(i => `vdo.${i}`)).where({ id: video_id }).limit(1)
            ])
            if (!video_info) return Promise.reject('该视频不存在！')
            let [[before_info], [collection_info]] = await Promise.all([
                trx(DUOLAI_MEDIA_VIDEO_PUSH).select('id', 'third_id', 'collection_push_id').where({ video_id, app_id }).limit(1),
                trx(DUOLAI_MEDIA_COLLECTION_PUSH).select('id as collection_push_id', 'third_id').where({ collection_id: video_info.collection_id, app_id }).limit(1)
            ])
            let collection_push_id = before_info?.collection_push_id || collection_info?.collection_push_id
            let is_online = video_info?.status == 1 && video_info?.verify_status == 3
            if (video_info?.app_id_target) video_info.app_id_target = new Set(JSON.parse(video_info.app_id_target))
            let insert_data = {
                app_id,
                video_id,
                collection_id: video_info.collection_id,
                third_id: `v-${video_info.id}`,
                update_user_id
            }
            let cardFormat = video_info?.collection_type == 'SINGEL' ? 1 : 3
            if (cardFormat == 3 && !collection_info) return Promise.reject('合集未推送，暂无法推送视频！')
            if (collection_push_id) insert_data.collection_push_id = collection_push_id
            let back_data = {}
            if (!before_info) insert_data.create_user_id = update_user_id
            if (!before_info && !is_online) return Promise.reject('该内容无须同步下线状态！')
            if (!before_info && (!is_online)) return Promise.reject('该内容未推送，无须同步上线状态！')
            // console.log(before_info, is_online);

            let sync_type = 'add'
            if (before_info && (!is_online)) sync_type = 'del' //存在视频，但现在的视频下线，走删除逻辑
            if (before_info && (!video_info.app_id_target?.has(app_id))) sync_type = 'del' //存在视频，但现在的视频定向取消，走删除逻辑
            switch (Number(applet_info.platform_id)) {
                case 2:
                    let send_data = {
                        sync_type,
                        app_id,
                        thirdId: insert_data.third_id,
                        cardContent: 10,
                        cardFormat,
                        collectionId: collection_info?.third_id,
                        title: video_info.name,
                        path: `play/index?cid=${video_info.collection_id}&id=${video_info.id}`,
                        cover: getOriginalUrl(getUrlPath(video_info.cover_url), 'duolai-img', 'https://duolai-img.domain.cn'),
                        chargeOrNot: video_info?.is_free == 'F',
                        updateDoneOrNot: true,
                        episodeNumber: video_info?.sequence_no || 1,
                        extraInfo: {},
                        videoInfo: {
                            videoDuration: video_info.duration,
                            introduction: video_info.describe,
                        },
                        coverInfo: {}

                    }
                    back_data = await ksSyncContent(send_data)
                    break;

                default:
                    return Promise.reject('暂不支持该媒体平台同步！');
            }
            insert_data = { ...insert_data, ...back_data }
            await trx(DUOLAI_MEDIA_VIDEO_PUSH).insert(insert_data).onConflict(['app_id', 'video_id']).merge()
            // console.log(insert_data);
            return insert_data
        })
    }, true, 20)
}
/**
 * 将一个合集下的视频全部推送，一般用于合集更新时
 * @param {*} collection_id 
 * @param {*} app_ids 
 * @param {*} trx 
 */
async function push_collection_tomedia(collection_id, update_user_id = 0, push_video_ids, c_trx) {
    const redis_key = `${RK_DUOLAI_VIDEO_SYNC_MEDIA}collection:${collection_id}`
    return await getLock(redis_key, async () => {
        return await use_trx(c_trx, async trx => {
            let [[collection_info], pushed_target, video_ids] = await Promise.all([
                trx(`${DUOLAI_VIDEO_COLLECTION} as coll`)
                    .select('coll.app_id_target').where({ id: collection_id }).limit(1),
                trx(`${DUOLAI_MEDIA_COLLECTION_PUSH} as coll`)
                    .select('coll.app_id').where({ collection_id }),
                trx(`${DUOLAI_VIDEO} as vdo`)
                    .select('vdo.id as video_id').where({ collection_id })
                    .where(builder => {
                        if (push_video_ids?.length) builder.whereIn('vdo.id', push_video_ids)
                    })
            ])
            if (!collection_info) return Promise.reject('剧集不存在！')
            let app_ids = JSON.parse(collection_info?.app_id_target || '[]')
            app_ids.push(...(pushed_target.map(i => i.app_id)))
            if (!app_ids?.length) return Promise.reject('定向不存在！')
            if (!video_ids?.length) return Promise.reject('合集下不存在视频！')
            video_ids = video_ids.map(i => i.video_id)
            let chunk_videos = lodash.chunk(video_ids, 20)
            // console.log(app_ids,video_ids);

            for (let index = 0; index < app_ids.length; index++) {
                const app_id = app_ids[index];
                for (let index2 = 0; index2 < chunk_videos.length; index2++) {
                    const ids = chunk_videos[index2];
                    await Promise.all(ids.map(video_id => push_video_tomedia(video_id, app_id, update_user_id, trx).catch(err => {
                        console.log('视频推送媒体内容库错误：', video_id, app_id, String(err?.message || err || '未知错误！'));
                    })))
                }

            }
            console.log('推送成功！剧集ID：', collection_id);
            return 'success'
        })
    }, true, 600)
}
module.exports = {
    push_video_tomedia,
    push_collection_tomedia
}
// push_video_tomedia(14543, 'ks700309742348504087', system_account_id).then(res => {
//     console.log(res);
// })
// push_collection_tomedia(343, system_account_id).then(res => {
//     console.log(res);
// })

