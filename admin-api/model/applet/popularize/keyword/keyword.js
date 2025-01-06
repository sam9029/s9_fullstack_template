const knex = require("../../../../db/knexManager").knexProxy;
const kocProxy = require("../../../../db/knexKoc").knexProxy;
const kocMount = require("../../../../db/knexMount").knexProxy;

const {
    KOC_KEYWORD,
    CONTENT_TABLE,
    ADVERTISER_TABLE,
    KEYWORD_FEEDBACK,
    DATA_TABLE,
    DATA_SETTLE_TABLE,
    CONTENT_RELATION
} = require("../../../../config/setting");
const {
    getLogData,
    insertLog,
} = require("../../../public/operationLog");
const { knexTransaction, selectName, getDaysBetweenDate } = require("../../../../utils/tools");
const moment = require("moment");
const { sqlCount } = require("../../../../utils/sqlHelper");
const { get_project_render_props, RenderType } = require('../../../manage/popularize/keyword/utils');
const { add: add_content } = require('../../../manage/popularize/keyword/content');
const { planCreate } = require('../../../public/zhihu')

const {
    SERIALIZED_STATUS_MAPPER,
    COPYRIGHT_MAPPER,
    VIDEO_MAPPER,
    VERIFY_STATUS_MAPPER,
} = require("../../../../enum/popularize");
const { kocAdMapper, mountAdMapper } = require('./public');
const { getAdvertiserMapper } = require("../../../../utils/apiMapper");
const { add_model } = require('../../../manage/popularize/keyword/content')
const validator = require("validator").default;
const lodash = require('lodash')
const { send } = require("../../../public/message")
const { system_account_id } = require("../../../../config");

async function add(body, userInfo, logType = 2001) {
    let { unableData, ableData, is_video } = await handler.checkData(body, userInfo);
    let logs = [];
    await knexTransaction(async (trx) => {
        let res = await add_keyword_model(trx, ableData, is_video, logs, body, userInfo, logType, unableData)
        logs = res.logs;
        unmatch_data = res.unableData;
    })
    return {
        code: 0,
        data: {
            unmatch_data: unableData,
            message: logs.length ? "添加成功" : "添加失败",
        }
    };
}

async function add_keyword_model(trx = knex, ableData, is_video, logs = [], body, userInfo, logType = 2001, unableData = []) {
    for (let i = 0; i < ableData.length; i++) {
        let item = ableData[i], failedTag = false;
        let insertObj = {
            keyword: item,
            advertiser_type: body.advertiser_type,
            create_user_id: userInfo.id,
            create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
            content_id: body.content_id,
            content_relation_id: body.content_relation_id,
            is_video: is_video || null,
            oem_id: userInfo.oem_id || 1,
            channel_id: userInfo.channel_id || 0
        }
        if (body.advertiser_type == 1003) { // 知乎送审
            try {
                let zhihuRes = await planCreate({ content_url: body.link, is_video, keyword: item });
                if (zhihuRes?.plan_id?.toString()) {
                    insertObj.plan_id = zhihuRes.plan_id.toString();
                    insertObj.verify_status = 2;
                    insertObj.verify_time = moment().format("YYYY-MM-DD HH:mm:ss");
                    insertObj.verify_feedback_time = moment().format("YYYY-MM-DD HH:mm:ss");
                }
            } catch (error) {
                failedTag = true;
                unableData.push({
                    keyword: item,
                    message: error.error.message,
                });
            }
        }
        if (failedTag) continue;
        let id = (await trx(KOC_KEYWORD).insert(insertObj))[0];
        if (id) logs.push(getLogData(id, logType, insertObj, userInfo, {}))
    }
    if (logs.length) await insertLog(trx, logs);
    return { logs, unableData };
}

async function list(query, userInfo, req) {
    let { $version: version, $platform: platform } = req;
    let vtag = (platform == 'android' && version <= 665);
    const response = {
        code: 0,
        data: {
            list: [],
            page: Number(query.page) || 1,
            pagesize: Number(query.pagesize) || 2,
            count: 0
        },
    }
    if (!query.advertiser_type) return Promise.reject("未设置广告主类型！");
    if (!query.page_type) return Promise.reject("未设置页面类型！");
    let columns = ["k.advertiser_type", "k.keyword", "k.verify_status", "k.create_time", "k.verify_suggest", "k.shelf_status", 'k.publish_status', 'k.content_id']
    let sql = knex(`${KOC_KEYWORD} as k`).select("k.id")
        .where({ 'k.create_user_id': userInfo.id });
    handler.searchFilter(sql, query);

    if (query.query_count) {
        response.data.count = await sqlCount(knex, sql);
    } else {
        const advertiserMapper = await getAdvertiserMapper(userInfo);
        if (Number(query.site) && query.page != 1) {
            sql.where('k.id', '<', Number(query.site))
        }
        let data = await sql.orderBy("k.id", "desc")
            .select(columns)
            .select(knex.raw(`(select sum(data_settle.total_blogger_amount) from ${DATA_TABLE} as data left join ${DATA_SETTLE_TABLE} as data_settle
                on data.id = data_settle.data_id where data.keyword_id = k.id and data.import_status = 1 and data.status = 1 and data_settle.settle_status = 3) as income`))
            .limit(response.data.pagesize)
            .select(selectName('k', "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_name"))
            .select(selectName('k', "advertiser_type", ADVERTISER_TABLE, "icon", "advertiser_icon"))
            .select(knex.raw(`(select count(feedback.id) from ${KEYWORD_FEEDBACK} as feedback where feedback.status = 1 and feedback.keyword_id=k.id) as feedback_num`))

        let contentIds = data.map(item => item.content_id);
        let contentData = await knex(CONTENT_TABLE).select('id', 'book_name', 'cover_url', 'title').whereIn('id', contentIds).andWhere({ status: 1, oem_id: userInfo.oem_id });
        let contentMapper = {};
        contentData.forEach(item => {
            contentMapper[item.id] = item
        })

        data.forEach(ele => {
            ele.copyright = COPYRIGHT_MAPPER[ele.copyright];
            ele.is_video = VIDEO_MAPPER[ele.is_video];
            ele.serialized_status = SERIALIZED_STATUS_MAPPER[ele.serialized_status];
            ele.create_time = moment(ele.create_time).format('YYYY-MM-DD HH:mm');
            ele.book_name = contentMapper[ele.content_id]?.book_name || '';
            ele.title = contentMapper[ele.content_id]?.title || '';
            ele.cover_url = contentMapper[ele.content_id]?.cover_url || null;
            ele.advertiser_type_name = advertiserMapper[ele.advertiser_type]?.name
            ele.icon = advertiserMapper[ele.advertiser_type]?.icon;
            if (vtag) { ele.income = lodash.divide(ele.income, 100)}
        })
        response.data.list = data;
        if (data.length) {
            response.data.site = data[data.length - 1].id;
        } else {
            response.data.site = null;
            response.data.has_next_page = false;
        }
    }
    return response;
}

async function deleteKeyword(body, userInfo) {
    let logTag = 2006;
    if (!body.ids || !body.ids.length)
        return Promise.reject("未设置删除的关键词ID！");
    body.status = 3;
    let success = [];
    await knexTransaction(async (trx) => {
        let oldValue = await knex(KOC_KEYWORD).select('id').whereIn('id', body.ids).andWhere('create_user_id', userInfo.id);
        if (oldValue.length) {
            body.ids = oldValue.map(item => item.id);
        } else {
            return {
                code: 0,
                data: {
                    success: [],
                    message: "未查询到改组关键词，更新失败"
                },
            }
        }
        for (let i = 0; i < body.ids.length; i++) {
            let item = body.ids[i];
            let old_item = await trx(KOC_KEYWORD).select("status").where({
                id: item,
            });
            await trx(KOC_KEYWORD).update("status", body.status).where("id", item);
            success.push(item);
            let logData = getLogData(
                item,
                logTag,
                { status: body.status },
                userInfo,
                old_item[0]
            );
            await insertLog(trx, logData);
        }
    });
    return {
        code: 0,
        data: {
            success,
            message: "删除成功",
        }
    };
}

async function getConfig(query, userInfo) {
    let { advertiser_type } = query;
    if (!advertiser_type) return Promise.reject('请传入项目产品id')
    let config = await get_project_render_props(knex, advertiser_type, RenderType.Keyword, userInfo);
    config.affix = {
        prefix: '', // 关键词前缀
        suffix: '' // 关键词尾缀
    }
    if (advertiser_type == 1019) {
        config.affix.prefix = '故事';
    }
    return {
        code: 0,
        data: config
    }
}

async function getContentConfig(query, userInfo) {
    let { advertiser_type } = query;
    if (!advertiser_type) return Promise.reject('请传入项目产品id')
    let config = await get_project_render_props(knex, advertiser_type, RenderType.Content, userInfo);
    return {
        code: 0,
        data: { list: config }
    }
}
async function addContent(body, userInfo) {
    let { advertiser_type } = body;
    if (!advertiser_type) return Promise.reject('请传入项目产品id')
    let { data } = await add_content({ ...body, from: 1 }, userInfo)
    return { code: 0, data }
}

async function contentKeywordAdd(body, userInfo) {
    let logs = [], unmatch_data;
    await knexTransaction(async (trx) => {
        let { content_id, relation_id } = await add_model(body, userInfo, trx, true);
        if (!content_id || !relation_id) return Promise.reject('添加失败')
        body.content_id = content_id;
        body.content_relation_id = relation_id;
        let { unableData, ableData, is_video } = await handler.checkData(body, userInfo, trx);
        let res = await add_keyword_model(trx, ableData, is_video, logs, body, userInfo, logType = 2001, unableData);
        logs = res.logs;
        unmatch_data = res.unableData;
    })
    return {
        code: 0,
        data: {
            unmatch_data,
            message: logs.length ? "添加成功" : "添加失败",
        }
    };
}

const handler = {
    async checkData(body, userInfo, trx = knex) {
        let response = {};
        let { advertiser_type, keywords, is_video, content_relation_id } = body;
        // if (!Number(content_id)) return Promise.reject('请传入内容ID!');
        if (!Number(content_relation_id)) return Promise.reject('请传入内容关联ID！')
        if (!keywords || !Array.isArray(keywords) || !keywords.length) {
            return Promise.reject('请传入关键词！')
        }
        let relationData = await trx(CONTENT_RELATION).select('id', 'content_id').where({ 'id': content_relation_id, status: 1 }).limit(1);
        if (!relationData.length) return Promise.reject('未查询到该内容')
        body.content_id = relationData[0].content_id;
        if (advertiser_type == 1003) { // 知乎查书籍链接
            let contentData = (await trx(CONTENT_TABLE).select('link').where('id', body.content_id).limit(1))[0];
            if (contentData && contentData.link) {
                body.link = contentData.link;
            } else {
                return Promise.reject('未检测到该书籍链接，请检查！')
            }
        }
        if (!advertiser_type) return Promise.reject('请传入项目产品！');
        let config = await get_project_render_props(trx, advertiser_type, RenderType.Keyword, userInfo);
        if (!config) return Promise.reject("未查询到关键词配置规则，请联系管理员！");
        if (config && config.bind_config) {
            let index = config.bind_config.findIndex(i => i.prop_id == 2);
            if (index != -1) {
                if (!is_video) {
                    return Promise.reject('请传入是否视频号字段！')
                } else {
                    response.is_video = body.is_video;
                }
            }
        }

        let unableData = [], filterData = [], ableData = [];
        if (config.keyword_config) {
            // number: 1:不允许纯数字，2：不含数字，3：不限
            // alphabet：1：不允许纯字母，2：不含字母，3：不限
            // wordCount: 字数
            // symbol: 1：不含字符，2：不限
            let { number, symbol, alphabet, wordCount } = config.keyword_config;
            keywords.forEach(keyword => {
                keyword = keyword.trim()
                if (number == 1 && /^[0-9]+$/.test(keyword)) {
                    unableData.push({
                        keyword,
                        message: '关键词不能为纯数字'
                    })
                }

                else if (number == 2 && /[0-9]+$/.test(keyword)) {
                    unableData.push({
                        keyword,
                        message: '关键词不能包含数字'
                    })
                }

                else if (alphabet == 1 && validator.isAlpha(keyword)) {
                    unableData.push({
                        keyword,
                        message: '关键词不能为纯字母'
                    })
                }

                else if (alphabet == 2 && /[a-zA-Z]+/.test(keyword)) {
                    unableData.push({
                        keyword,
                        message: '关键词不能包含字母'
                    })
                }
                else if (keyword.length < wordCount[0] || keyword.length > wordCount[1]) {
                    unableData.push({
                        keyword,
                        message: `关键词长度须为${wordCount[0]} - ${wordCount[1]}， 请检查`
                    })
                }
                else if (symbol == 1 && !/^[\u4e00-\u9fa5a-z]+$/gi.test(keyword)) {
                    unableData.push({
                        keyword,
                        message: `关键词不能包含字符`
                    })
                }
                else if (advertiser_type == 1019) {
                    if (!keyword.startsWith('故事')) {
                        unableData.push({
                            keyword,
                            message: `关键词必须以“故事”开头`
                        })
                    } else {
                        filterData.push(keyword)
                    }
                } else {
                    filterData.push(keyword)
                }
            });

        }


        let data = await trx(KOC_KEYWORD).select('id', 'keyword').whereIn('keyword', filterData).where({ advertiser_type });

        if (kocAdMapper[advertiser_type]) {
            let kocAd = kocAdMapper[advertiser_type];
            if (kocAd) {
                let kocData = await kocProxy(KOC_KEYWORD).select('id', 'keyword').whereIn('keyword', filterData).where('advertiser_type', kocAd);
                data.push(...kocData);
            }
        }
        if (mountAdMapper[advertiser_type]) {
            let mountAd = mountAdMapper[advertiser_type];
            if (mountAd) {
                let kocData = await kocMount(KOC_KEYWORD).select('id', 'keyword').whereIn('keyword', filterData).where('advertiser_type', mountAd);
                data.push(...kocData);
            }
        }

        for (let i = 0; i < filterData.length; i++) {
            let item = filterData[i];
            let index = data.findIndex(i => i.keyword == item);
            if (index != -1) {
                unableData.push({
                    keyword: item,
                    message: '该关键词已存在，请勿重复添加！'
                })
            } else {
                ableData.push(item)
            }
        }

        response.unableData = unableData;
        response.ableData = ableData;
        return response
    },
    searchFilter(sql, query) {
        let page_type = query.page_type;
        if (page_type == 1) { // 总词库
            // 1. 可回填、2. 审核中、3.审核拒绝  4.下架
            if (query.keyword_status) {
                if (query.keyword_status == 1) {
                    sql.where({
                        'k.verify_status': 2,
                        'k.shelf_status': 1
                    })
                }
                else if (query.keyword_status == 2) {
                    sql.where({
                        'k.verify_status': 1,
                        'k.shelf_status': 1
                    })
                }
                else if (query.keyword_status == 3) {
                    sql.where({
                        'k.verify_status': 3,
                        'k.shelf_status': 1
                    })
                }
                else if (query.keyword_status == 4) {
                    sql.where('k.shelf_status', 2)
                }
            }

        } else if (page_type == 2) { // 待审核
            sql.whereIn('k.verify_status', [1, 3, 4]).andWhere('k.publish_status', 1)
        } else if (page_type == 3) { // 未回填
            sql.where({ 'k.verify_status': 2, 'k.publish_status': 1 });
        } else if (page_type == 4) { // 已回填
            sql.whereIn('k.publish_status', [2, 3]).andWhere('k.verify_status', 2)
        }

        if (query.keyword) {
            sql.leftJoin(`${CONTENT_TABLE} as content`, 'content.id', 'k.content_id');
            sql.where(builder => {
                builder.where('content.book_name', 'like', `${query.keyword}%`)
                    .orWhere('content.book_id', 'like', `${query.keyword}%`)
                    .orWhere('k.id', 'like', `${query.keyword}%`)
                    .orWhere('k.keyword', 'like', `${query.keyword}%`)
            })
        }

        if (query.publish_status) {
            sql.where('k.publish_status', query.publish_status)
        }
        if (query.content_id) {
            sql.where('k.content_id', query.content_id)
        }
        if (query.verify_status) {
            sql.where('k.verify_status', query.verify_status)
        }
        if (query.start_date && query.end_date) {
            sql.whereIn('k.create_date', getDaysBetweenDate(query.start_date, query.end_date))
        }
        if (query.shelf_status) {
            sql.where('k.shelf_status', query.shelf_status)
        }
        sql.andWhere({ "k.advertiser_type": query.advertiser_type, 'k.status': 1 })
        return sql;
    }
};

module.exports = {
    list,
    add,
    deleteKeyword,
    getConfig,
    getContentConfig,
    addContent,
    contentKeywordAdd
};
