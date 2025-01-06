const knex = require("../../../../db/knexManager").knexProxy;
const {
    KOC_KEYWORD,
    QIMAO_KEYWORD_TASK,
    QQREADER_KEYWORD_TASK,
    ADVERTISER_TABLE,
    CONTENT_TABLE,
    PUBLISH_TASK,
    KEYWORD_FEEDBACK,
} = require("../../../../config/setting");
const { knexTransaction, getUuid, getDaysBetweenDate } = require("../../../../utils/tools")
const { createKeywords: qqCreate, queryTask: qqQuery } = require('../../../public/qqreader');
const { aliasCreate: shuqiCreate, queryBatchId: shuqiQuery, publishCreate } = require('../../../public/shuqi');
const { createKeywords: qimaoCreate, queryKeywordStatus: qimaoQuery } = require("../../../public/qimao");
const { apply_original_keywords: ucCreate, apply_change_keywords: quarkCreate, query_apply_status: uqckQuery } = require("../../../public/media/uqck")
const moment = require('moment'), lodash = require('lodash');
const { system_account_id } = require("../../../../config");
const { send } = require("../../../public/message");
const { commonVerify } = require("../../../manage/popularize/keyword/publish");
const { getWaitLock } = require('../../../../db/redis')
const { RK_SHUQI_KEYWORD_CREATE } = require("../../../../config/redis_key")

async function qqCreatekeyword() {
    let now = moment().format('YYYY-MM-DD HH:mm:ss'), advertiser_type = 1002;
    await knexTransaction(async (trx) => {
        let today = moment().format('YYYY-MM-DD'), yestoday = moment().subtract(1, 'd').format('YYYY-MM-DD'), beforeYestoday = moment().subtract(2, 'd').format('YYYY-MM-DD'), lastYesterday = moment().subtract(3, 'd').format('YYYY-MM-DD');
        let keywords = await trx(`${KOC_KEYWORD} as k`).select('k.keyword', 'k.id', 'k.content_id')
            .select(knex.raw(`(select c.book_id from ${CONTENT_TABLE} as c where c.id = k.content_id) as book_id`))
            .where({
                'k.advertiser_type': advertiser_type,
                'k.verify_status': 4,
                'k.status': 1,
                'k.shelf_status': 1
            }).whereIn('k.create_date', [today, yestoday, beforeYestoday, lastYesterday])
            .andWhere('k.create_time', '<', now);
        if (!keywords.length) return
        let chunkData = lodash.chunk(keywords, 300);
        for (let i = 0; i < chunkData.length; i++) {
            let chunkItem = chunkData[i];
            let ids = [], insertData = [], updateData = {};
            chunkItem.forEach(item => {
                // item.book_id = remove_keyword_bookid_prefix(item.book_id, prefix); // #CONT MOD  -
                item.book_id = Number(item.book_id);
                if (item.book_id && item.keyword) {
                    ids.push(item.id);
                    insertData.push({ keyword: item.keyword, book_id: item.book_id });
                }
            })
            if (insertData.length) {
                let taskId = await qqCreate(insertData);
                if (taskId) {
                    updateData.verify_status = 1;
                    updateData.verify_time = moment().format("YYYY-MM-DD HH:mm:ss");
                    await trx(QQREADER_KEYWORD_TASK).insert({ task_id: taskId, expire_time: moment().add(20, 'm').format('YYYY-MM-DD HH:mm:ss'), advertiser_type });
                    await trx(KOC_KEYWORD).update(updateData).whereIn('id', ids);
                }
            }
        }
    })
}

async function updateQQreqderStatus() {
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss"), advertiser_type = 1002;
    let today = moment().format('YYYY-MM-DD'), yestoday = moment().subtract(1, 'd').format('YYYY-MM-DD'), beforeYestoday = moment().subtract(2, 'd').format('YYYY-MM-DD');
    let data = await knex(QQREADER_KEYWORD_TASK).select('task_id').where({ status: 1, advertiser_type }).andWhere('expire_time', '<', currentTime).whereIn('create_date', [today, yestoday, beforeYestoday]);
    if (data.length) {
        await knexTransaction(async (trx) => {
            for (let i = 0; i < data.length; i++) {
                let keywordInfo = await qqQuery(data[i].task_id);
                // console.log("qq送审结果", keywordInfo);
                if (keywordInfo?.data && keywordInfo.data.length) {
                    let keywords = keywordInfo.data.map(item => item.alias);
                    let oldData = await knex(`${KOC_KEYWORD} as k`)
                        .select('k.id', 'k.keyword', 'k.advertiser_type', 'k.content_id', 'k.create_user_id')
                        .select(knex.raw(`(select ad.business_type from ${ADVERTISER_TABLE} as ad where ad.id = k.advertiser_type) as business_type`))
                        .whereIn('keyword', keywords)
                        .andWhere('advertiser_type', advertiser_type);

                    for (let j = 0; j < keywordInfo.data.length; j++) {
                        let item = keywordInfo.data[j];
                        let updateInfo = {
                            verify_suggest: item.remark || '未知原因',
                            verify_feedback_time: currentTime
                        }
                        let old_item = oldData.find(ele => ele.keyword == item.alias);
                        if (!old_item) return
                        let message = `恭喜您申请的关键词「${item.alias}」已审核通过`, code = 101;
                        if (item.status == 1) {
                            updateInfo.plan_id = item.aliasId;
                            updateInfo.verify_status = 2;
                        } else {
                            message = `您申请的关键词「${item.alias}」因${updateInfo.verify_suggest}审核未通过`
                            code = 102;
                            updateInfo.verify_status = 3
                        }
                        await send({
                            message_type: code,
                            message_title: '',
                            message: '',
                            show_message: [
                                { label: '', value: message }
                            ],
                            receiver_ids: [old_item.create_user_id],
                            parma: { advertiser_type, content_id: old_item.content_id, business_type: old_item.business_type }
                        }, { id: system_account_id, oem_id: 1 }, trx);
                        let id = await trx(KOC_KEYWORD).update(updateInfo).where({ keyword: item.alias, advertiser_type });
                        id && await trx(QQREADER_KEYWORD_TASK).update({ status: 2 }).where({ task_id: data[i].task_id })

                    }
                } else {
                    console.log(keywordInfo.message)
                }
            }
        })

    }
}

// 书旗小说（订单=会员=短片）：1012   书旗小说（拉新=非会员=长篇): 1011
async function shuqiCreatekeyword() {
    let now = moment().format('YYYY-MM-DD HH:mm:ss'), contentMapper = {
        1012: 2,
        1011: 1
    }
    await knexTransaction(async (trx) => {
        let end_date = moment().format('YYYY-MM-DD'), start_date = moment().subtract(10, 'd').format('YYYY-MM-DD');
        let dates = getDaysBetweenDate(start_date, end_date);
        let keywords = await trx(`${KOC_KEYWORD} as k`).select('k.keyword', 'k.id', 'k.advertiser_type')
            .select(knex.raw(`(select c.book_id from ${CONTENT_TABLE} as c where c.id = k.content_id) as book_id`))
            .where({
                'k.verify_status': 4,
                'k.status': 1,
                'k.shelf_status': 1
            }).whereIn('k.create_date', dates)
            .andWhere('k.create_time', '<', now)
            .whereIn('advertiser_type', [1012, 1011]);
        if (!keywords.length) return

        // const prefixs = await trx(ADVERTISER_TABLE)
        //     .select("id", "prefix")
        //     .whereIn('id', [1012, 1011]);
        // const prefix_map = {};
        // prefixs.forEach(v => prefix_map[v.id] = v.prefix);

        let groupData = lodash.groupBy(keywords, 'advertiser_type');
        for (let key in groupData) {
            let chunkData = lodash.chunk(groupData[key], 100);
            for (let i = 0; i < chunkData.length; i++) {
                let chunkItem = chunkData[i];
                let ids = [], insertData = [], updateData = {};
                chunkItem.forEach(item => {
                    // item.book_id = remove_keyword_bookid_prefix(item.book_id, prefix_map[key]); // #CONT MOD  -
                    item.book_id = Number(item.book_id);
                    if (item.book_id && item.keyword) {
                        ids.push(item.id);
                        insertData.push({ keyword: item.keyword, book_id: item.book_id });
                    }
                })
                if (insertData.length) {
                    let taskId = await shuqiCreate(insertData, contentMapper[key], key);
                    if (taskId) {
                        return await getWaitLock(RK_SHUQI_KEYWORD_CREATE, async () => {
                            updateData.verify_status = 1;
                            updateData.verify_time = moment().format("YYYY-MM-DD HH:mm:ss");
                            updateData.plan_id = taskId;
                            await trx(QQREADER_KEYWORD_TASK).insert({ task_id: taskId, expire_time: moment().add(20, 'm').format('YYYY-MM-DD HH:mm:ss'), advertiser_type: key });
                            await trx(KOC_KEYWORD).update(updateData).whereIn('id', ids);
                        }, 5, 300)
                    }
                }
            }
        }
    })
}

async function updateShuqiStatus() {
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss"), contentMapper = {
        1012: 2,
        1011: 1
    };
    let end_date = moment().format('YYYY-MM-DD'), start_date = moment().subtract(10, 'd').format('YYYY-MM-DD');
    let dates = getDaysBetweenDate(start_date, end_date);
    let data = await knex(QQREADER_KEYWORD_TASK).select('task_id', 'advertiser_type')
        .where('status', 1).andWhere('expire_time', '<', currentTime)
        .whereIn('create_date', dates)
        .whereIn('advertiser_type', [1011, 1012]);
    if (data.length) {
        await knexTransaction(async (trx) => {
            for (let i = 0; i < data.length; i++) {
                let keywordInfo = await shuqiQuery({ batchId: data[i].task_id, content_type: contentMapper[data[i].advertiser_type] });
                if (keywordInfo?.dataList && keywordInfo.dataList.length) {
                    let keywords = keywordInfo.dataList.map(item => item.alias);
                    let oldData = await knex(`${KOC_KEYWORD} as k`)
                        .select('k.id', 'k.keyword', 'k.advertiser_type', 'k.content_id', 'k.create_user_id')
                        .select(knex.raw(`(select ad.business_type from ${ADVERTISER_TABLE} as ad where ad.id = k.advertiser_type) as business_type`))
                        .whereIn('keyword', keywords)
                        .whereIn('advertiser_type', [1011, 1012]);
                    for (let j = 0; j < keywordInfo.dataList.length; j++) {
                        let item = keywordInfo.dataList[j];
                        let updateInfo = {
                            verify_suggest: item.rejectReasonDesc || '',
                            verify_feedback_time: currentTime
                        }
                        let old_item = oldData.find(ele => ele.keyword == item.alias);
                        if (!old_item) return
                        let message = `恭喜您申请的关键词「${item.alias}」已审核通过`, code = 101;
                        if (item.status == '生效中(已经确认)') {
                            updateInfo.plan_id = item.aliasId;
                            updateInfo.verify_status = 2;
                        } else {
                            message = `您申请的关键词「${item.alias}」因${updateInfo.verify_suggest}审核未通过`
                            code = 102;
                            updateInfo.verify_status = 3
                        }
                        await send({
                            message_type: code,
                            message_title: '',
                            message: '',
                            show_message: [
                                { label: '', value: message }
                            ],
                            receiver_ids: [old_item.create_user_id],
                            parma: { advertiser_type: old_item.advertiser_type, content_id: old_item.content_id, business_type: old_item.business_type }
                        }, { id: system_account_id, oem_id: 1 }, trx);
                        let id = await trx(KOC_KEYWORD).update(updateInfo).where({ keyword: item.alias, advertiser_type: old_item.advertiser_type });
                        id && await trx(QQREADER_KEYWORD_TASK).update({ status: 2 }).where({ task_id: data[i].task_id })

                    }
                } else {
                    console.log(keywordInfo.message)
                }
            }
        })

    }
}

async function qimaoCreatekeyword() {
    let now = moment().format('YYYY-MM-DD HH:mm:ss'), advertiser_type = 1016;
    await knexTransaction(async (trx) => {
        let today = moment().format('YYYY-MM-DD'), yestoday = moment().subtract(1, 'd').format('YYYY-MM-DD'), beforeYestoday = moment().subtract(2, 'd').format('YYYY-MM-DD'), lastYesterday = moment().subtract(3, 'd').format('YYYY-MM-DD');
        let keywords = await trx(`${KOC_KEYWORD} as k`)
            .select('k.keyword', 'k.id', 'k.content_id')
            .select(knex.raw(`(select c.book_id from ${CONTENT_TABLE} as c where c.id = k.content_id) as book_id`))
            .where({
                'k.advertiser_type': advertiser_type,
                'k.verify_status': 4,
                'k.status': 1,
                'k.shelf_status': 1
            }).whereIn('k.create_date', [today, yestoday, beforeYestoday, lastYesterday])
            .andWhere('k.create_time', '<', now);
        if (!keywords.length) return
        let chunkData = lodash.chunk(keywords, 500);
        for (let i = 0; i < chunkData.length; i++) {
            let chunkItem = chunkData[i];
            let ids = [], insertData = [];
            chunkItem.forEach(item => {
                // item.book_id = remove_keyword_bookid_prefix(item.book_id, prefix); // #CONT MOD  -
                item.book_id = Number(item.book_id);
                item.kol_name = getUuid().substring(0, 8);
                if (item.book_id && item.keyword && item.kol_name) {
                    ids.push(item.id);
                    insertData.push({ keyword: item.keyword, book_id: item.book_id, kol_name: item.kol_name });
                }
            })
            if (insertData.length) {
                let result = await qimaoCreate(insertData);
                // console.log('七猫送审', result);
                if (result && result.length) {
                    let verify_time = moment().format("YYYY-MM-DD HH:mm:ss");
                    for (let i = 0; i < result.length; i++) {
                        let item = result[i];
                        let updateData = { verify_time }
                        if (item.id) {
                            if (item.status === true) {
                                updateData.plan_id = item.id;
                                updateData.verify_status = 1;
                                await trx(QIMAO_KEYWORD_TASK).insert({ task_id: item.id, expire_time: moment().add(20, 'm').format('YYYY-MM-DD HH:mm:ss'), advertiser_type });
                            } else {
                                updateData.verify_status = 3;
                                updateData.verify_suggest = item.reason;
                                updateData.verify_feedback_time = verify_time;
                            }
                            await trx(KOC_KEYWORD).update(updateData).where({ keyword: item.search_keyword, advertiser_type });
                        }
                    }
                }
            }
        }
    })
}

async function qimaoUpdateVerifyStatus() {
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss"), advertiser_type = 1016;
    let today = moment().format('YYYY-MM-DD'), yestoday = moment().subtract(1, 'd').format('YYYY-MM-DD'), beforeYestoday = moment().subtract(2, 'd').format('YYYY-MM-DD');
    let data = await knex(QIMAO_KEYWORD_TASK).select('task_id').where({ status: 1, advertiser_type }).andWhere('expire_time', '<', currentTime).whereIn('create_date', [today, yestoday, beforeYestoday]);
    if (data.length) {
        let ids = data.map(item => Number(item.task_id));
        let keywordInfo = await qimaoQuery(ids), successKeywords = [];
        // console.log('七猫审核结果', keywordInfo)
        let taskIds = keywordInfo.map(item => item.id);
        let oldData = await knex(`${KOC_KEYWORD} as k`)
            .select('k.id', 'k.keyword', 'k.advertiser_type', 'k.content_id', 'k.create_user_id')
            .select(knex.raw(`(select ad.business_type from ${ADVERTISER_TABLE} as ad where ad.id = k.advertiser_type) as business_type`))
            .where('advertiser_type', advertiser_type)
            .whereIn('plan_id', taskIds);
        await knexTransaction(async (trx) => {
            for (let i = 0; i < keywordInfo.length; i++) {
                let item = keywordInfo[i];
                let message = `恭喜您申请的关键词「${item.search_keyword}」已审核通过`, code = 101;
                let old_item = oldData.find(ele => ele.keyword == item.search_keyword);
                if (!old_item) return
                if (item.status_text == '已通过') {
                    let updateInfo = {
                        verify_status: 2,
                        verify_feedback_time: currentTime
                    }
                    await trx(KOC_KEYWORD).update(updateInfo).where({ advertiser_type }).where('plan_id', item.id);
                    successKeywords.push(item.id);
                } else if (item.status_text == '已驳回') {
                    let updateInfo = {
                        verify_suggest: item.reject_reason,
                        verify_feedback_time: currentTime,
                        verify_status: 3
                    }
                    let id = await trx(KOC_KEYWORD).update(updateInfo).where({ plan_id: item.id, advertiser_type });
                    id && await trx(QIMAO_KEYWORD_TASK).update({ status: 2 }).where({ task_id: item.id })
                    message = `您申请的关键词「${item.search_keyword}」因${updateInfo.verify_suggest}审核未通过`, code = 102;
                }
                await send({
                    message_type: code,
                    message_title: '',
                    message: '',
                    show_message: [
                        { label: '', value: message }
                    ],
                    receiver_ids: [old_item.create_user_id],
                    parma: { advertiser_type, content_id: old_item.content_id, business_type: old_item.business_type }
                }, { id: system_account_id, oem_id: 1 }, trx);
            }

            if (successKeywords.length) {
                await trx(QIMAO_KEYWORD_TASK).update({ status: 2 }).whereIn('task_id', successKeywords);
            }

        })
    }
}

async function ucCreatekeyword() {
    let now = moment().format('YYYY-MM-DD HH:mm:ss'), advertiser_type = 1007;
    await knexTransaction(async (trx) => {
        let today = moment().format('YYYY-MM-DD'), yestoday = moment().subtract(1, 'd').format('YYYY-MM-DD'), beforeYestoday = moment().subtract(2, 'd').format('YYYY-MM-DD'), lastYesterday = moment().subtract(3, 'd').format('YYYY-MM-DD');
        let keywords = await trx(`${KOC_KEYWORD} as k`).select('k.keyword', 'k.id', 'k.content_id')
            .select(knex.raw(`(select c.link from ${CONTENT_TABLE} as c where c.id = k.content_id) as url`))
            .where({
                'k.verify_status': 4,
                'k.status': 1,
                'k.shelf_status': 1
            })
            .where('advertiser_type', advertiser_type)
            .whereIn('k.create_date', [today, yestoday, beforeYestoday, lastYesterday])
            .andWhere('k.create_time', '<', now);
        if (!keywords.length) return;

        let chunkData = lodash.chunk(keywords, 500);
        for (let i = 0; i < chunkData.length; i++) {
            let chunkItem = chunkData[i];
            let ids = [], insertData = [], updateData = { verify_time: now };
            chunkItem.forEach(item => {
                if (item.url && item.keyword) {
                    ids.push(item.id);
                    insertData.push({ keyword: item.keyword, tag: '搜索直达_UC故事会会员', url: item.url });
                }
            })
            if (insertData.length) {
                let res = await ucCreate(insertData, advertiser_type);
                if (res?.unpassedKeywords && res.unpassedKeywords.length) {
                    updateData.verify_status = 3;
                    await trx(KOC_KEYWORD).update(updateData).whereIn('keyword', res.unpassedKeywords);
                }
                if (res.taskId) {
                    updateData.verify_status = 1;
                    updateData.plan_id = res.taskId;
                    await trx(QQREADER_KEYWORD_TASK).insert({ task_id: res.taskId, expire_time: moment().add(30, 'm').format('YYYY-MM-DD HH:mm:ss'), advertiser_type });
                    await trx(KOC_KEYWORD).update(updateData).whereIn('id', ids).whereNotIn('keyword', res.unpassedKeywords);
                }
            }

        }
    })
}

async function ucUpdateStatus() {
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss"), advertiser_type = 1007;
    let end_date = moment().format('YYYY-MM-DD'), start_date = moment().subtract(30, 'd').format('YYYY-MM-DD');
    let dates = getDaysBetweenDate(start_date, end_date);
    let data = await knex(QQREADER_KEYWORD_TASK).select('task_id').where({ status: 1, advertiser_type }).andWhere('expire_time', '<', currentTime)
        .whereIn('create_date', dates);
    if (data.length) {
        await knexTransaction(async (trx) => {
            for (let i = 0; i < data.length; i++) {
                let keywordInfo = await uqckQuery(data[i].task_id, advertiser_type);
                // console.log("uc送审结果", keywordInfo);
                if (keywordInfo?.taskId && keywordInfo?.status == 'FINAL_CHECKED') {
                    let taskId = keywordInfo.taskId;
                    let oldData = await knex(`${KOC_KEYWORD} as k`)
                        .select('k.id', 'k.keyword', 'k.advertiser_type', 'k.content_id', 'k.create_user_id')
                        .select(knex.raw(`(select ad.business_type from ${ADVERTISER_TABLE} as ad where ad.id = k.advertiser_type) as business_type`))
                        .where('plan_id', taskId)
                        .andWhere('advertiser_type', advertiser_type);

                    for (let i = 0; i < oldData.length; i++) {
                        let item = oldData[i];
                        let updateInfo = {
                            verify_suggest: '',
                            verify_feedback_time: currentTime
                        }
                        let message = `恭喜您申请的关键词「${item.keyword}」已审核通过`, code = 101;
                        let unpassedKeywords = keywordInfo?.unpassedKeywords || [];
                        if (!unpassedKeywords.includes(item.keyword)) {
                            updateInfo.verify_status = 2;
                        } else {
                            message = `您申请的关键词「${item.alias}」审核未通过`
                            code = 102;
                            updateInfo.verify_status = 3
                        }
                        await send({
                            message_type: code,
                            message_title: '',
                            message: '',
                            show_message: [
                                { label: '', value: message }
                            ],
                            receiver_ids: [item.create_user_id],
                            parma: { advertiser_type, content_id: item.content_id, business_type: item.business_type }
                        }, { id: system_account_id, oem_id: 1 }, trx);
                        let id = await trx(KOC_KEYWORD).update(updateInfo).where({ keyword: item.keyword, advertiser_type, plan_id: taskId });
                        id && await trx(QQREADER_KEYWORD_TASK).update({ status: 2 }).where({ task_id: taskId + '' })
                    }

                }
            }
        })

    }
}

async function quarkCreateKeyword() {
    let now = moment().format('YYYY-MM-DD HH:mm:ss'), advertiser_types = [1013, 1006], tagMap = { 1006: 'xs_102', 1013: 'mh_104' };
    await knexTransaction(async (trx) => {
        let end_date = moment().format('YYYY-MM-DD'), start_date = moment().subtract(7, 'd').format('YYYY-MM-DD');
        let dates = getDaysBetweenDate(start_date, end_date);
        let keywords = await trx(`${KOC_KEYWORD} as k`)
            .select('k.keyword', 'k.id', 'k.content_id', 'k.advertiser_type', 'c.describe', 'c.link as url', 'c.book_name')
            .leftJoin(`${CONTENT_TABLE} as c`, 'c.id', 'k.content_id')
            .where({
                'k.verify_status': 4,
                'k.status': 1,
                'k.shelf_status': 1
            })
            .whereIn('k.advertiser_type', advertiser_types)
            .whereIn('k.create_date', dates)
            .andWhere('k.create_time', '<', now);
        if (!keywords.length) return;

        let groupData = lodash.groupBy(keywords, 'advertiser_type');
        for (let key in groupData) {
            let chunkData = lodash.chunk(groupData[key], 500);
            for (let i = 0; i < chunkData.length; i++) {
                let chunkItem = chunkData[i];
                let ids = [], insertData = [], updateData = { verify_time: now };
                chunkItem.forEach(item => {
                    if (item.keyword && item.book_name) {
                        ids.push(item.id);
                        let info = { keyword: item.keyword, changeKeyword: item.book_name, tag: tagMap[item.advertiser_type] };
                        if (item.describe && item.url) {
                            info.url = item.url;
                            info.description = item.describe;
                            info.title = item.book_name;
                        }
                        insertData.push(info);
                    }
                })
                if (insertData.length) {
                    let res = await quarkCreate(insertData, key);
                    // console.log('11111111111', res)
                    if (res?.unpassedKeywords && res.unpassedKeywords.length) {
                        updateData.verify_status = 3;
                        await trx(KOC_KEYWORD).update(updateData).whereIn('keyword', res.unpassedKeywords);
                    }
                    if (res.taskId) {
                        updateData.verify_status = 1;
                        updateData.plan_id = res.taskId;
                        await trx(QQREADER_KEYWORD_TASK).insert({ task_id: res.taskId, expire_time: moment().add(30, 'm').format('YYYY-MM-DD HH:mm:ss'), advertiser_type: key });
                        await trx(KOC_KEYWORD).update(updateData).whereIn('id', ids).whereNotIn('keyword', res.unpassedKeywords);
                    }

                }
            }
        }
    })
}

async function quarkUpdateStatus() {
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss"), advertiser_types = [1013, 1006];
    let end_date = moment().format('YYYY-MM-DD'), start_date = moment().subtract(30, 'd').format('YYYY-MM-DD');
    let dates = getDaysBetweenDate(start_date, end_date);
    let data = await knex(QQREADER_KEYWORD_TASK)
        .select('task_id', 'advertiser_type')
        .where({ status: 1 }).andWhere('expire_time', '<', currentTime)
        .whereIn('create_date', dates)
        .whereIn('advertiser_type', advertiser_types);

    if (data.length) {
        await knexTransaction(async (trx) => {
            for (let i = 0; i < data.length; i++) {
                let advertiser_type = data[i].advertiser_type;
                let keywordInfo = await uqckQuery(data[i].task_id, advertiser_type);
                // console.log("夸克送审结果", keywordInfo);
                if (keywordInfo?.taskId && keywordInfo?.status == 'FINAL_CHECKED') {
                    let taskId = keywordInfo.taskId;
                    let oldData = await knex(`${KOC_KEYWORD} as k`)
                        .select('k.id', 'k.keyword', 'k.advertiser_type', 'k.content_id', 'k.create_user_id')
                        .select(knex.raw(`(select ad.business_type from ${ADVERTISER_TABLE} as ad where ad.id = k.advertiser_type) as business_type`))
                        .where('plan_id', taskId)
                        .andWhere('advertiser_type', advertiser_type);

                    for (let i = 0; i < oldData.length; i++) {
                        let item = oldData[i];
                        let updateInfo = {
                            verify_suggest: '',
                            verify_feedback_time: currentTime
                        }
                        let message = `恭喜您申请的关键词「${item.keyword}」已审核通过`, code = 101;
                        let unpassedKeywords = keywordInfo?.unpassedKeywords || [];
                        if (!unpassedKeywords.includes(item.keyword)) {
                            updateInfo.verify_status = 2;
                        } else {
                            message = `您申请的关键词「${item.alias}」审核未通过`
                            code = 102;
                            updateInfo.verify_status = 3
                        }
                        await send({
                            message_type: code,
                            message_title: '',
                            message: '',
                            show_message: [
                                { label: '', value: message }
                            ],
                            receiver_ids: [item.create_user_id],
                            parma: { advertiser_type, content_id: item.content_id, business_type: item.business_type }
                        }, { id: system_account_id, oem_id: 1 }, trx);
                        let id = await trx(KOC_KEYWORD).update(updateInfo).where({ keyword: item.keyword, advertiser_type, plan_id: taskId });
                        id && await trx(QQREADER_KEYWORD_TASK).update({ status: 2 }).where({ task_id: taskId + '' })
                    }

                }
            }
        })

    }
}

async function shuqiPublish() {
    let now = moment().format('YYYY-MM-DD HH:mm:ss');
    let contentMapper = {
        1012: 2,
        1011: 1
    }
    await knexTransaction(async (trx) => {
        let today = moment().format('YYYY-MM-DD'), yestoday = moment().subtract(1, 'd').format('YYYY-MM-DD'), beforeYestoday = moment().subtract(2, 'd').format('YYYY-MM-DD'), lastYesterday = moment().subtract(3, 'd').format('YYYY-MM-DD');
        let keywords = await trx.select('feedback.id', 'feedback.platform_id', 'feedback.opus_url', 'keyword.keyword', 'feedback.advertiser_type')
            .from(`${KEYWORD_FEEDBACK} as feedback`)
            .leftJoin(`${KOC_KEYWORD} as keyword`, "feedback.keyword_id", "keyword.id").where({
                "feedback.status": 1,
                'keyword.status': 1,
                'keyword.shelf_status': 1
            }).whereIn('feedback.verify_status', [4]).whereIn('feedback.advertiser_type', [1012, 1011]).whereNotNull("keyword.plan_id").whereIn('feedback.create_date', [today, yestoday, beforeYestoday, lastYesterday]).andWhere('feedback.create_time', '<', now);
        if (!keywords.length) return
        let groupData = lodash.groupBy(keywords, 'advertiser_type');
        for (let key in groupData) {
            let chunkData = lodash.chunk(groupData[key], 100);
            for (let i = 0; i < chunkData.length; i++) {
                let chunkItem = chunkData[i];
                let ids = [], insertData = [], updateData = {};
                chunkItem.forEach(item => {
                    ids.push(item.id);
                    let boj = {
                        keyword: item.keyword,
                        opus_url: item.opus_url,
                        platform_id: item.platform_id,
                    }
                    insertData.push(boj);
                })
                let batchId = await publishCreate(insertData, contentMapper[key], 2);
                if (batchId) {
                    updateData.batch_id = batchId;
                    updateData.verify_status = 1;
                    updateData.verify_time = moment().format("YYYY-MM-DD HH:mm:ss");
                    await trx(PUBLISH_TASK).insert({ task_id: batchId, expire_time: moment().add(20, 'm').format('YYYY-MM-DD HH:mm:ss'), advertiser_type: key, create_date: today });
                    await trx(KEYWORD_FEEDBACK).update(updateData).whereIn('id', ids);
                }
            }
        }
    })
}

async function shuqiPublishQuery() {
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
    let contentMapper = {
        1012: 2,
        1011: 1
    }
    let today = moment().format('YYYY-MM-DD'), yestoday = moment().subtract(1, 'd').format('YYYY-MM-DD'), beforeYestoday = moment().subtract(2, 'd').format('YYYY-MM-DD');
    let data = await knex(PUBLISH_TASK).select('task_id', 'advertiser_type').where({ status: 1 }).whereIn('advertiser_type', [1011, 1012]).andWhere('expire_time', '<', currentTime).whereIn('create_date', [today, yestoday, beforeYestoday]).limit(5);
    if (data.length) {
        await knexTransaction(async (trx) => {
            for (let i = 0; i < data.length; i++) {
                let advertiser_type = data[i].advertiser_type
                let publishInfo = await shuqiQuery({ batchId: data[i].task_id, content_type: contentMapper[advertiser_type] }, 2);
                let verifyData = []
                if (publishInfo?.dataList && publishInfo.dataList.length) {
                    for (let j = 0; j < publishInfo.dataList.length; j++) {
                        let item = publishInfo.dataList[j];
                        let result = (await trx.select("id").from(KOC_KEYWORD).where({ keyword: item.alias, advertiser_type }))[0]
                        let feedback = (await trx.select("id").from(KEYWORD_FEEDBACK).where({ opus_url: item.callbackUrl, keyword_id: result.id }))[0]
                        if (feedback) {
                            let updateInfo = {
                                id: feedback.id,
                            }
                            if (item.statusCode === "0") {
                                updateInfo.verify_status = 2;
                                await trx(KEYWORD_FEEDBACK).update({ tripartite_id: item.id }).where({ id: feedback.id });
                            } else {
                                updateInfo.verify_suggest = item.statusDesc
                                updateInfo.verify_status = 3;
                            }
                            verifyData.push(updateInfo)
                        }
                        await trx(PUBLISH_TASK).update({ status: 2 }).where({ task_id: data[i].task_id })
                    }

                    if (verifyData.length)
                        await commonVerify(trx, verifyData, { advertiser_type }, { oem_id: 1, id: system_account_id }, []).catch(e => { });
                } else {
                    console.log(publishInfo.message)
                }
            }
        })
    }
}

// qqCreatekeyword()
// updateQQreqderStatus()
// shuqiCreatekeyword()
// updateShuqiStatus()
// qimaoCreatekeyword();
// qimaoUpdateVerifyStatus();
// ucCreatekeyword();
// ucUpdateStatus();
// quarkCreateKeyword();
// quarkUpdateStatus();
// shuqiPublish()
// shuqiPublishQuery()
// shuqiCreatekeyword()

module.exports = {
    qqCreatekeyword,
    updateQQreqderStatus,
    shuqiCreatekeyword,
    updateShuqiStatus,
    qimaoCreatekeyword,
    qimaoUpdateVerifyStatus,
    ucCreatekeyword,
    ucUpdateStatus,
    quarkCreateKeyword,
    quarkUpdateStatus,
    shuqiPublish,
    shuqiPublishQuery,
}