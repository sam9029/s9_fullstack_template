const knex = require("../../db/knexManager").knexProxy;
const { PLATFORM_TABLE, CATEGORY_TABLE, ACCOUNT_TABLE, PLATFORM_ACCOUNT_TABLE, SETTLEMENT_METHOD_TABLE,
    XINGTU_ADVERTISER, PROMOTION_TABLE, ADVERTISER_TABLE, CONTENT_TYPE_TABLE, BUSINESS_TYPE_TABLE, OPEN_TIMES,
    PLATFORM_TAG, VIP_LEVEL, VIP_TYPE, COMMISSION_POLICY, VERSION, ACTINFO_TABLE, ACCOUNT_ROLE, ROLE_TABLE,
    CONTENT_TABLE, CONTENT_RELATION, VIP_CARD, BANNER, TAG_TABLE, REJECT_REASON, MESSAGE_TABLE, MOUNT_TYPE, DRAMA_PLAN, CHANNEL_TABLE,
    CONTENT_DATA, VIDEO_TYPE_TAG, REWARD_ACTIVITY, XINGGUANG_SETTLEMENT_METHOD, XINGGUANG_TASK, COPYRIGHT, DUOLAI_VIDEO_COLLECTION,
    SETTLEMENT_METHOD, DUOLAI_APPLET, MAIN_CONTENT } = require("../../config/setting")
const { PROMOTION_TYPE, TIKTOK_STORY, ADVER_TYPE_ENUM } = require("../../enum/advertiser")
// const { getBankInfo } = require("./bank")
const { uploadFile, getAccess, upload, getUploadUrl, CONTENT_TYPE_MAPPER } = require("./upload")
const moment = require('moment')
const { updatePublishDate, updateAbnormalKeyword, addBeforePayLog, addBeforeSplitData } = require("./import")
const { selectName, channel_advertisers } = require("../../utils/tools")
const { getChildrenByPermissionPc } = require("./permission")
// const Question = require("../../config/question")
const { h5_production_host, system_account_id } = require("../../config/index")
const { checkKeys, isArrayHas } = require("../../utils/check_type");
const { getWXClickUrl, getPublishInfo } = require("./drama");
const { version_before_tiktok_story } = require("../../utils/version_control");
const { getOriginalUrl } = require("../public/upload");
const { getCustomCache, setCustomCache } = require("../../db/redis");
const { RK_MAIN_CONTENT, RK_WITHDRAWAL_METHOD } = require("../../config/redis_key");
const { isArray } = require("lodash");
// const { upload_id: getDuolaiUploadId } = require("../channel/creation/upload")
// 业务分类
exports.category = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('ctg.id', 'ctg.name', 'ctg.id as value', 'ctg.name as label')
        .from(`${CATEGORY_TABLE} as ctg`)
        .where('ctg.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('ctg.id', 'like', `${keyword}%`).orWhere('ctg.name', 'like', `${keyword}%`)
        })
    }
    retu.data = await knexSql
        .limit(50).orderBy("id", 'asc')
    return retu
};

exports.mcn_list = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('ctg.advertiser_id', 'ctg.advertiser_name', 'ctg.advertiser_id as value', 'ctg.advertiser_name as label')
        .from(`${XINGTU_ADVERTISER} as ctg`)
        .where('ctg.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('ctg.advertiser_id', 'like', `${keyword}%`).orWhere('ctg.advertiser_name', 'like', `${keyword}%`)
        })
    }
    retu.data = await knexSql
        .limit(50).orderBy("advertiser_id", 'desc')
    return retu
};
// 业务分类
exports.businessType = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('ctg.id', 'ctg.name', 'ctg.id as value', 'ctg.name as label')
        .from(`${BUSINESS_TYPE_TABLE} as ctg`)
        .where('ctg.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('ctg.id', 'like', `${keyword}%`).orWhere('ctg.name', 'like', `${keyword}%`)
        })
    }
    retu.data = await knexSql.limit(50).orderBy("id", 'desc')
    return retu
};
// 内容类型
exports.contentType = async (query, userInfo) => {
    let retu = {
        code: 0,
        data: [],
    }
    let { oem_id = 1 } = userInfo || {}
    let { type } = query || {}
    if (!type) return Promise.reject('未设置查询类型！')
    let knexSql = knex.select('cnt.name as label', 'cnt.id as value', 'cnt.status').from(`${CONTENT_TYPE_TABLE} as cnt`)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('cnt.id', 'like', `${keyword}%`).orWhere('cnt.name', 'like', `${keyword}%`)
        })
    }
    if (query.status) knexSql.where('cnt.status', query.status)
    else knexSql.where('status', 1)
    retu.data = await knexSql.limit(50).where({ oem_id, type })
    return retu
};
// 广告主
exports.advertiser = async (query, req) => {
    const header = req.headers;
    let retu = {
        code: 0,
        data: [],
    }
    const { $platform, $version, $user } = req;

    const channel_advers = await channel_advertisers($user, query);

    let { oem_id = 1, token } = header || {};
    let columns = [
        'adv.name as label', 'adv.icon', 'adv.id as value', 'adv.status', 'adv.settlement_ids', 'adv.promotion_type', 'adv.product_type', 'adv.mount_type', 'adv.is_hot',
        'adv.business_type', 'adv.settle_gmv_type', "adv.trend", "adv.expected_yield"
    ];
    let knexSql = knex.select(columns)
        .from(`${ADVERTISER_TABLE} as adv`)
        .where(builder => {
            if (version_before_tiktok_story($platform, $version)) {
                builder.where("adv.id", "<>", TIKTOK_STORY);
            }
        })
        .andWhere(builder => {
            if (channel_advers.length) {
                builder.whereIn("adv.id", channel_advers)
            }
        })


    knexSql = handler.adSearchFilter(knexSql, query, oem_id);

    // 收益模块，抖音故事属于关键词推广
    retu.data = await knexSql.limit(query.limit || 80).orderBy('sort', 'asc').orderBy('id', 'desc')
    if (query.douyin && query.douyin == 1 && query.promotion_type) {
        if (query.promotion_type == 2) {
            let douyinIndex = retu.data.findIndex(item => item.value == TIKTOK_STORY);
            if (douyinIndex != -1) {
                retu.data.splice(douyinIndex, 1);
            }
        }
        else if (query.promotion_type == 1) {
            let douyinSql = knex.select(columns).from(`${ADVERTISER_TABLE} as adv`).where('id', TIKTOK_STORY);
            delete query.promotion_type;
            douyinSql = handler.adSearchFilter(douyinSql, query, oem_id);
            let douyinData = await douyinSql;
            retu.data.push(...douyinData);
        }
    }

    retu.data.forEach(t => {
        t.page_enum = ADVER_TYPE_ENUM[t.value] || ADVER_TYPE_ENUM.NORMAL;
        t.settlement_ids = JSON.parse(t.settlement_ids || "[]");
        t.promotion_type_mapper = JSON.parse(t.promotion_type || "[]");
        t.promotion_type = 0
    })
    return retu
};
// 广告主推广类目
exports.promotion = async (query, userInfo) => {
    let retu = {
        code: 0,
        data: [],
    }
    let { oem_id = 1 } = userInfo || {}
    let { advertiser_type } = query || {}
    if (!advertiser_type) return Promise.reject('未设置查询广告主！')
    let knexSql = knex.select('pro.name as label', 'pro.id as value', 'pro.status').from(`${PROMOTION_TABLE} as pro`)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('pro.id', 'like', `${keyword}%`).orWhere('pro.name', 'like', `${keyword}%`)
        })
    }
    if (query.status) knexSql.where('pro.status', query.status)
    else knexSql.where('status', 1)
    retu.data = await knexSql.limit(50).orderBy('id', 'desc').where({ advertiser_type, oem_id })
    return retu
};
// 账户平台
exports.platform = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('pat.id', 'pat.name', 'pat.id as value', 'pat.name as label')
        .from(`${PLATFORM_TABLE} as pat`)
        .where('pat.status', 1)
    if (query.icon == 2) knexSql.select('icon')
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('pat.id', 'like', `${keyword}%`).orWhere('pat.name', 'like', `${keyword}%`)
        })
    }
    if (query.promotion_type) knexSql.whereRaw(`json_contains(pat.promotion_type, JSON_ARRAY('${query.promotion_type}'))`)
    retu.data = await knexSql.limit(50)
    return retu
};
// 账户平台
exports.platformAccount = async (query, userInfo = {}) => {
    let retu = {
        code: 0,
        data: []
    }
    let { id: account_id, account_type } = userInfo || {}
    let knexSql = knex.select('pat.id', 'pat.category_id', 'pat.platform_account_id', 'pat.status', 'pat.fan_counts', 'pat.xingtu_id', 'pat.id as value', 'pat.platform_account_name as label')
        .from(`${PLATFORM_ACCOUNT_TABLE} as pat`)

    if ([1, 4].includes(account_type) || account_type == 3 && !query.all) knexSql.where({ 'pat.blogger_id': account_id })

    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('pat.id', 'like', `${keyword}%`).orWhere('pat.platform_account_name', 'like', `${keyword}%`)
                .orWhere('pat.platform_account_id', 'like', `${keyword}%`)
        })
    }
    if (query.status) knexSql.where('pat.status', query.status)
    else knexSql.whereIn('pat.status', [1, 2])
    if (query.platform_id) knexSql.where('pat.platform_id', query.platform_id)
    retu.data = await knexSql.select(selectName('pat', "platform_id", PLATFORM_TABLE, "name", "platform_name"))
        .limit(50)
        .orderBy('id', 'desc')
    return retu
};
// 获取银行信息
exports.bankInformation = async (query) => {
    const { bank_account, get_image } = query || {}
    if (!bank_account) return Promise.reject('未设置查询银行账号！')
    return {
        code: 0,
        data: await getBankInfo(bank_account, get_image || false)
    }
}
// 挂载方式下拉
exports.mountType = async (query, header) => {
    let retu = {
        code: 0,
        data: [],
    }
    let { oem_id = 1, token } = header || {}
    let knexSql = knex.select('mt.name as label', 'mt.id as value',).from(`${MOUNT_TYPE} as mt`)
    if (query.platform_id) {
        knexSql.whereRaw(`JSON_CONTAINS(mt.platform, JSON_ARRAY(${query.platform_id}))`)
    }
    retu.data = await knexSql.limit(50).orderBy('id')
    return retu
};
// 结算方式
exports.settleType = async (query, userInfo = {}) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('set.id as value', 'set.name as label', 'set.settle_field', 'set.suffix')
        .from(`${SETTLEMENT_METHOD_TABLE} as set`)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('set.id', 'like', `${keyword}%`).orWhere('set.name', 'like', `${keyword}%`)
        })
    }
    if (query.ids) knexSql.whereIn('set.id', query.ids)
    if (query.status) knexSql.where('set.status', query.status)
    else knexSql.whereIn('set.status', [1, 2])
    retu.data = await knexSql.limit(50)
        .orderBy('id', 'desc')
    return retu
};
//获取抖音信息
exports.platformAccountInfo = async (body) => {
    return { code: 0, data: null }
};
//上传接口
exports.upload = async (req, user) => {
    let data = await uploadFile(req, user, 'pc_doc')
    return { code: 0, data }
};
//上传接口鉴权
exports.uploadAccess = async (req, user) => {
    return await getAccess()
};
//获取文件上传链接
exports.uploadUrl = async (body, user) => {
    let { file_name, mime_type, bucket, folder } = checkKeys(body, [
        { key: 'file_name', type: String, format: (val) => String(val).trim() },
        { key: 'folder', type: String, format: (val) => String(val).trim() },
        {
            key: 'bucket', type: String, format: (val) => String(val).trim(),
            validator: (val) => isArrayHas(['koc-img', 'koc-material', 'duolai-img'], val)
        },
        {
            key: 'mime_type', type: String, required: true, format: (val) => String(val).trim().toLowerCase(),
            validator: (val) => isArrayHas(Object.keys(CONTENT_TYPE_MAPPER), val)
        }
    ])
    let data = await getUploadUrl(file_name, mime_type, folder, bucket, user)
    return { code: 0, data: { url: data } }
};
//小程序上传接口
exports.appUpload = async (req, res) => {
    let data = await upload(req, req.$user, res)
    return { code: 0, data }
};

exports.updatePublish = async (req, user) => {
    return await updatePublishDate(req.body, user)
};

exports.addBeforePayLog = async (req, user) => {
    return await addBeforePayLog(req.body, user)
};

exports.updateAbnormalKeyword = async (req, user) => {
    return await updateAbnormalKeyword(req.body, user)
};

exports.addBeforeSplitData = async (req, user) => {
    return await addBeforeSplitData(req.body, user)
};

// 账号标签下拉
exports.platformTag = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('ctg.id', 'ctg.name', 'ctg.id as value', 'ctg.name as label')
        // .select('ctg.*')
        .from(`${PLATFORM_TAG} as ctg`)
        .where('ctg.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('ctg.id', 'like', `${keyword}%`).orWhere('ctg.name', 'like', `${keyword}%`)
        })
    }
    // let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    // retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        // .select(handler.selectName('ctg', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
        .limit(50).orderBy("id", 'asc')
    return retu
};

// 会员等级下拉
exports.vipLevel = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('vip_level.id', 'vip_level.name', 'vip_level.id as value', 'vip_level.name as label', 'vip_level.day')
        .from(`${VIP_LEVEL} as vip_level`)
        .where('vip_level.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('vip_level.id', 'like', `${keyword}%`).orWhere('vip_level.name', 'like', `${keyword}%`)
        })
    }
    if (query.type) {
        knexSql.where("vip_level.type", query.type)
    }
    retu.data = await knexSql
        .limit(50).orderBy("id", 'asc')
    return retu
};

// 会员类型下拉
exports.vipType = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('vip_type.id', 'vip_type.name', 'vip_type.id as value', 'vip_type.name as label')
        .from(`${VIP_TYPE} as vip_type`)
        .where('vip_type.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('vip_type.id', 'like', `${keyword}%`).orWhere('vip_type.name', 'like', `${keyword}%`)
        })
    }
    if (query.id) {
        knexSql.where("vip_type.id", query.id)
    }
    retu.data = await knexSql
        .limit(50).orderBy("id", 'asc')
    return retu
};

// 广告主
exports.advertiserMenu = async (query, req) => {
    const { $platform, $version, $user } = req;
    let retu = {
        code: 0,
        data: [],
    }
    let { oem_id = 1 } = $user || {}

    const channel_advers = await channel_advertisers($user, query);

    let knexSql = knex.select('adv.name as label', 'adv.id as value', 'adv.icon', 'adv.status', 'adv.promotion_type', 'adv.business_type')
        .from(`${ADVERTISER_TABLE} as adv`)
        .where({ oem_id })
        .andWhere(builder => {
            if (version_before_tiktok_story($platform, $version)) {
                builder.where("adv.id", "<>", TIKTOK_STORY);
            }
        })
        .andWhere(builder => {
            if (channel_advers.length) {
                builder.whereIn("adv.id", channel_advers)
            }
        });



    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('adv.id', 'like', `${keyword}%`).orWhere('adv.name', 'like', `${keyword}%`)
        })
    }
    if (query.status) knexSql.where('adv.status', query.status)
    else knexSql.whereIn('status', [1, 2])


    if (query.promotion_type) {
        if (query.promotion_plan == 2) {
            query.promotion_type = 4;
        }
        knexSql.whereRaw(`JSON_CONTAINS(adv.promotion_type, JSON_ARRAY(${query.promotion_type}))`)
    }
    if (query.promotion_types && isArray(query.promotion_types)) {
        knexSql.where(builder => {
            query.promotion_types.forEach(element => {
                builder.orWhere(knex.raw(`JSON_CONTAINS(adv.promotion_type, JSON_ARRAY(${element}))`))
            });
        })
    }

    if (query.business_type) knexSql.where('adv.business_type', query.business_type)
    if (query.product_type) knexSql.where('adv.product_type', query.product_type)
    if (query.is_test) {
        if (query.is_test == 1 || query.is_test == 2) {
            knexSql.where('adv.is_test', query.is_test)
        } else {
            knexSql.whereIn('adv.is_test', [1, 2])
        }
    } else {
        knexSql.where('adv.is_test', 1)
    }
    retu.data = await knexSql.orderBy('sort', 'asc').orderBy('id', 'desc')
    retu.data.forEach(t => {
        t.promotion_name = PROMOTION_TYPE[JSON.parse(t.promotion_type)[0]] || '未知类型'
        // delete t.promotion_type
    })
    return retu
};

// 佣金政策
exports.commissionPolicy = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('commission_policy.id', 'commission_policy.id as value', 'commission_policy.commission_type', 'commission_policy.commission_policy')
        .from(`${COMMISSION_POLICY} as commission_policy`)
        .where('commission_policy.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('commission_policy.id', 'like', `${keyword}%`)
        })
    }
    if (query.commission_type) {
        knexSql.where('commission_policy.commission_type', query.commission_type)
    }
    let data = await knexSql.limit(50).orderBy("id", 'asc')
    data.forEach(t => {
        t.commission_policy = JSON.parse(t.commission_policy)
        t.commission_policy.forEach(k => {
            k.ratio /= 100
        })
        t.commission_frequency = t.commission_policy.length
    })
    retu.data = data
    return retu
};

// 佣金类型
exports.commissionType = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('commission_type.id', 'commission_type.name', 'commission_type.id as value', 'commission_type.name as label')
        .from(`${COMMISSION_TYPE} as commission_type`)
        .where({ 'commission_type.status': 1 })
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('commission_type.id', 'like', `${keyword}%`).orWhere('commission_type.name', 'like', `${keyword}%`)
        })
    }
    retu.data = await knexSql
        .limit(50).orderBy("id", 'asc')
    return retu
};


// 关键词配置下拉
exports.keywordOpts = async function (query, userInfo) {
    const prop_id = Number(query.prop_id);
    switch (prop_id) {
        case 1:
        case 16:
            return exports.platformAccount(query, userInfo);
        case 15:
            return exports.platform(query);
        default:
            throw "请传入正确的prop_id！";
    }
}
exports.userDownList = async (query, userInfo) => {
    let response = {
        code: 0,
        data: [],
    }
    let accountId = await getChildrenByPermissionPc(userInfo) || [];

    let sql = knex(`${ACCOUNT_TABLE} as a`).select('a.name as label', 'a.id as value', 'a.account_type')
        .leftJoin(knex.raw(`${ACCOUNT_ROLE} as acc_role on acc_role.account_id = a.id AND acc_role.status = 1`))
        .whereNotIn('a.id', [10000000, 10000001])
        .andWhere({ 'a.status': 1, 'a.oem_id': userInfo.oem_id })
        .limit(50)
        .orderBy("a.id", 'desc')
    if (accountId?.length) sql.whereIn('a.id', accountId)

    let mainRoleSql = knex(ROLE_TABLE).select('id').where({ status: 1 })
    if (query.creator_role) {
        mainRoleSql.where('creator_role', query.creator_role);
    } else {
        mainRoleSql.where('creator_role', 2);
    }
    let role_ids = (await mainRoleSql).map(i => i.id)
    sql.whereIn('acc_role.role_id', role_ids)
    sql = handler.searchFilter(sql, query);
    response.data = await sql;
    return response;
}

exports.contentList = async (query, userInfo) => {
    let retu = {
        code: 0,
        data: []
    }
    let sql = knex(CONTENT_TABLE)
        .select('content.book_name as name', 'content.id', 'content_relation.id as relation_id')
        .from(`${CONTENT_TABLE} as content`)
        .leftJoin(
            `${CONTENT_RELATION} as content_relation`,
            "content.id",
            "content_relation.content_id"
        )
        // .groupBy("content.id")
        .where({ "content.oem_id": userInfo.oem_id, 'content.status': 1, "content.verify_status": 3 })
    if (query.promotion_type) {
        sql.where('content_relation.relat_type', query.promotion_type)
    }

    if (query.is_income) {
        sql.select("cd.total_income", "cd.join_people_num").leftJoin(
            `${CONTENT_DATA} as cd`,
            "content.id",
            "cd.content_id"
        )
    }

    if (query.advertiser_type) {
        sql.where("content_relation.advertiser_type", query.advertiser_type);
    }
    if (query.keyword) {
        sql.where(builder => {
            builder.where('content.id', 'like', `${query.keyword}%`).orWhere('content.book_name', 'like', `${query.keyword}%`)
        })
    }
    retu.data = await sql.limit(50).orderBy("content.id", 'desc')
    return retu
}

exports.vipCard = async (query, userInfo) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('vip_card.id', 'vip_card.id as value', 'vip_card.system')
        .from(`${VIP_CARD} as vip_card`)
        .select(selectName("vip_card", "level", VIP_LEVEL, "name", "level_name"))
        .select(selectName("vip_card", "type", VIP_TYPE, "name", "type_name"))
        .where({ 'vip_card.status': 1, 'vip_card.oem_id': userInfo.oem_id })
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('vip_card.id', 'like', `${keyword}%`).orWhere('vip_card.name', 'like', `${keyword}%`)
        })
    }
    if (query.system) {
        knexSql.where("vip_card.system", query.system);
    }
    if (query.type) {
        knexSql.where("vip_card.type", query.type);
    }
    if (query.sell_status) {
        knexSql.where("vip_card.sell_status", query.sell_status);
    }
    retu.data = await knexSql.limit(50).orderBy("id", 'desc')
    return retu
}

exports.banner = async (query, userInfo = {}) => {
    let { channel_id } = userInfo
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 50) return Promise.reject('分页上限为50条！')
    let knexSql = knex.select('banner.id as banner_id', 'banner.type', 'banner.url', 'banner.content', 'banner.remark')
        .from(`${BANNER} as banner`)
        .where({ 'banner.status': 1, 'banner.oem_id': userInfo?.oem_id || 1 })
    if (query.site) knexSql.where("banner.site", query.site)
    if (channel_id) knexSql.where("banner.channel_id", channel_id)
    else knexSql.whereIn("banner.channel_id", [0, 1])
    retu.data = await knexSql
        .limit(50).orderBy([
            { column: "sort", order: "desc" },
            { column: "id", order: "desc" },
        ])

    retu.data = retu.data.map(i => {
        if (i.type == 4) i.content = `${h5_production_host}/parseurl?banner_id=${i.banner_id}`
        return i
    })
    return retu
}
const BUSINESS_TYPE_MAPPER = {
    // 1: '影视短剧' 3,
    // 4: '小说推文' 2,
    // 5: '漫画动漫' 1,
    3: 1,
    2: 4,
    1: 5,
    // 2: '学习课程',
    // 3: '爆款模型',
}

exports.tag = async (query, userInfo) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('tag.name', 'tag.id')
        .from(`${TAG_TABLE} as tag`)
        .where({ 'tag.status': 1, 'tag.oem_id': userInfo.oem_id })
    if (query.type) {
        knexSql.where("tag.type", query.type)
    }
    if (query.business_type) {
        knexSql.where('tag.type', BUSINESS_TYPE_MAPPER[query.business_type])
    }

    retu.data = await knexSql.limit(50).orderBy("id", 'asc')
    return retu
}

// 驳回原因下拉
exports.rejectReason = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('ctg.id', 'ctg.name', 'ctg.id as value', 'ctg.name as label')
        // .select('ctg.*')
        .from(`${REJECT_REASON} as ctg`)
        .where('ctg.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('ctg.id', 'like', `%${keyword}%`).orWhere('ctg.name', 'like', `%${keyword}%`)
        })
    }
    // let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    // retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        // .select(handler.selectName('ctg', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
        .limit(50).orderBy("id", 'asc')
    return retu
};

// 任务下拉
exports.taskContent = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('ctg.id', 'ctg.name', 'ctg.id as value', 'ctg.name as label')
        // .select('ctg.*')
        .from(`${REJECT_REASON} as ctg`)
        .where('ctg.status', 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('ctg.id', 'like', `%${keyword}%`).orWhere('ctg.name', 'like', `%${keyword}%`)
        })
    }
    // let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    // retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        // .select(handler.selectName('ctg', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
        .limit(50).orderBy("id", 'asc')
    return retu
};

//消息 富文本to url
exports.messageUrl = async (query) => {
    let { message_id } = query
    if (!message_id) return Promise.reject('参数异常！')
    let data = (await knex(`${MESSAGE_TABLE} as msg`)
        .select('id as message_id', 'msg.message').where({ status: 1, id: message_id })
        .whereRaw("JSON_EXTRACT(msg.message, '$.describe') IS NOT NULL").limit(1))[0]
    if (!data) return Promise.reject('该内容不存在！')

    data.content = JSON.parse(data.message)?.describe
    return { code: 0, data: { ...data } }
};

//获取常见问题
exports.commonProblem = async (body) => {
    return { code: 0, data: { list: Question } }
};
//
exports.appVersion = async (type, oem_type = 'tuixiaoguo') => {
    if (!type) return Promise.reject('类型参数异常！')
    let sql = knex(VERSION).select('id as app_id', 'name', 'apple_url', 'url as android_url',
        'version', 'remark', 'version_code', 'size', 'force_update').where({ status: 1 })
        .orderBy('id', 'desc').where({ type })
        .where(builder => {
            if (oem_type != 'tuixiaoguo') builder.where({ verify_status: 3 })
        })
        .limit(1)
    let data = (await sql)[0]
    if (data?.remark) data.remark = data.remark.split('\n')
    return { code: 0, data: { ...data } }
};
//banner 富文本to url
exports.bannerUrl = async (query) => {
    let { banner_id } = query
    if (!banner_id) return Promise.reject('参数异常！')
    let data = (await knex(`${BANNER} as banner`).select('banner.id as banner_id', 'banner.content')
        .select(selectName('banner', 'channel_id', CHANNEL_TABLE, 'name', 'channel_name'))
        .where({ status: 1, id: banner_id, type: 4 }).limit(1))[0]
    if (!data) return Promise.reject('该内容不存在！')
    return { code: 0, data: { ...data } }
};
//创作工具等模块进行版本控制
exports.authoringTool = async (body, platform = 'android') => {
    // "CHECK_WORD", "LINK_TO_WORD", "VIDEO_TO_WORD", "REMOVE_WATER", "SMART_CREATE"
    const TYPE_ARRAY = [{
        label: "创作工具",
        value: "AuthoringTool",
        show: true,
        children: [
            { value: 'CHECK_WORD', show: true, label: '违禁词检测' },
            { value: 'LINK_TO_WORD', show: true, label: '链接转文字' },
            { value: 'VIDEO_TO_WORD', show: true, label: '视频转文字' },
            { value: 'REMOVE_WATER', show: true, label: '去水印' },
            { value: 'SMART_CREATE', show: true, label: '智能创作' }
        ]
    }]
    let { oem_type, version_code } = checkKeys(body, [{
        key: "oem_type", type: String, required: true, validator: val => isArrayHas(['xiaomi', 'huawei', 'oppo', 'vivo', 'yingyongbao', 'honor', 'tuixiaoguo', 'ios'], val)
    }, "version_code"])
    //取最新的版本
    let data = (await knex(VERSION).select('id as app_id', 'name', 'apple_url', 'url as android_url',
        'version', 'remark', 'version_code', 'size', 'force_update', `${oem_type} as platfrom_setting`).where({ status: 1, type: platform, version_code })
        .orderBy('id', 'desc').limit(1))[0]
    // console.log(data, { status: 1, type: platform, version_code, oem_type });
    if (!data || !data?.platfrom_setting) return { code: 0, data: { list: TYPE_ARRAY } }
    data.platfrom_setting = JSON.parse(data.platfrom_setting)
    function recursiveTraversal(node) {
        // 在这里执行你希望对节点进行的操作
        if (data.platfrom_setting?.includes(node.value)) node.show = true
        else node.show = false
        if (node.children && node.children?.length) {
            // 递归遍历子节点
            node.children.forEach(child => {
                recursiveTraversal(child);
            });
        }
    }

    // 遍历初始节点数组
    TYPE_ARRAY.forEach(rootNode => {
        recursiveTraversal(rootNode);
    });
    // let list = TYPE_ARRAY.map(i => {
    //     let t = { ...i, show: true }
    //     if (['xiaomi', 'ios'].includes(oem_type) && Number(version_code) > Number(data?.version_code || 0)) t.show = false
    //     if (platform == 'ios' && Number(version_code) > Number(data?.version_code || 0)) t.show = false
    //     return t
    // })
    return { code: 0, data: { list: TYPE_ARRAY } }
};

exports.plan_share = async function (query) {
    const { plan_id } = checkKeys(query, ["plan_id"])
    let drama_info = (
        await knex.select('plan.referral_id', 'plan.extra_params', 'plan.advertiser_type', 'plan.status', 'plan.platform_id', 'plan.account_id')
            .select('dram.book_name as drama_name', 'dram.cover_url', 'dram.describe', 'dram.status as drama_status')
            .select('rat.app_id', 'rat.publish_url')
            .leftJoin(`${CONTENT_RELATION} as rat`, 'plan.relation_id', 'rat.id')
            .leftJoin(`${CONTENT_TABLE} as dram`, 'plan.drama_id', 'dram.id')
            .from(`${DRAMA_PLAN} as plan`)
            .where('plan.status', 1)
            .where('plan.type', 4) // 私域
            .where('plan.id', plan_id)
            .where('dram.status', 1)
    )[0]
    if (!drama_info) return Promise.reject('推广计划不存在或已取消分享！')

    const plat_info = (
        await knex(`${ADVERTISER_TABLE} as adv`)
            .select("adv.name as advertiser_name", "adv.icon as advertiser_icon", "plat.name as platform_name", "plat.icon as platform_icon")
            .leftJoin(`${PLATFORM_TABLE} as plat`, 'plat.id', 'adv.platform_id')
            .where("adv.id", drama_info.advertiser_type)
    )[0];

    const { drama_name, cover_url, describe, platform_id, advertiser_type, publish_url, referral_id, extra_params } = drama_info;
    const { schema_url } = getPublishInfo(drama_info)
    const data = { schema_url, drama_name, cover_url, describe, platform_id };
    Object.assign(data, plat_info);
    if (platform_id == 4) {
        data.schema_url = getWXClickUrl(advertiser_type, publish_url, referral_id, extra_params)
    }

    return {
        code: 0,
        data: data
    }

}
exports.openTimes = async (query, userInfo = {}) => {
    let retu = {
        code: 0,
        data: 'success',
    }
    let { id: account_id } = userInfo || {}
    let date = moment().format("YYYY-MM-DD")
    let unique_key = `opentimes:${account_id}:${date}`
    let data = await knex(OPEN_TIMES).increment('open_times', 1).where({ date, account_id })
    if (!data) {
        let insert_data = { date, account_id, open_times: 1, week: moment().isoWeekday(), month: moment().month() + 1 }
        await knex(OPEN_TIMES).insert(insert_data).catch(err => { console.log('计数发生错误：', err); })
    }
    return retu
};

// 渠道下拉
exports.channel = async (query, userInfo) => {
    let retu = { code: 0, data: [], }
    let { oem_id = 1 } = userInfo || {}
    let knexSql = knex.select("id", "name", "id as value", "name as label", "uid", "bind_account_id").from(`${CHANNEL_TABLE}`)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('id', 'like', `%${keyword}%`).orWhere('name', 'like', `%${keyword}%`).orWhere('uid', 'like', `%${keyword}%`)
        })
    }
    if (query.status) knexSql.where('status', query.status)
    else knexSql.whereIn('status', [1])

    if (query.current && query.current != 'false' && Number(userInfo.channel_id)) {
        knexSql.where('id', userInfo.channel_id)
    }
    if (query.duolai_bucket) {
        knexSql.whereNotNull('duolai_bucket');
    }
    retu.data = await knexSql.limit(50).where({ oem_id }).orderBy('id', 'desc')
    return retu
};
//获取常见问题
exports.course = async (query) => {
    const { course } = require("../applet/home/course")
    return await course(query)
};


exports.videoType = async (query, userInfo) => {
    let retu = {
        code: 0,
        data: [],
    }
    let knexSql = knex(VIDEO_TYPE_TAG).select('id as value', 'name as label').where({ status: 1, oem_id: userInfo.oem_id });
    if (query.business_type) {
        knexSql.where('business_type', query.business_type)
    }
    retu.data = await knexSql;
    return retu
}

//  奖励活动
exports.rewardActivity = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    if (retu.pagesize > 100) return Promise.reject('分页上限为100条！')
    let knexSql = knex.select('ctg.id', 'ctg.name', 'ctg.start_date', 'ctg.end_date', 'ctg.id as value', 'ctg.name as label')
        .from(`${REWARD_ACTIVITY} as ctg`)
        .where('ctg.status', 1)
        .where('ctg.verify_status', 3)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('ctg.id', 'like', `${keyword}%`).orWhere('ctg.name', 'like', `${keyword}%`)
        })
    }
    if (query.advertiser_type) {
        knexSql.where("ctg.advertiser_type", query.advertiser_type)
    }
    if (query.channel_id) {
        knexSql.where("ctg.channel_id", query.channel_id)
    }
    if (query.channel_type) {
        knexSql.where("ctg.channel_type", query.channel_type)
    }
    if (query.type) {
        knexSql.where("ctg.type", query.type)
    }
    retu.data = await knexSql
        .limit(50).orderBy("id", 'asc')
    return retu
};

//  星广结算方式
exports.xgSettleType = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('set.id as value', 'set.name as label', 'set.short_name', 'set.suffix')
        .from(`${XINGGUANG_SETTLEMENT_METHOD} as set`)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('set.id', 'like', `${keyword}%`).orWhere('set.name', 'like', `${keyword}%`)
        })
    }
    if (query.ids) knexSql.whereIn('set.id', query.ids)
    if (query.status) knexSql.where('set.status', query.status)
    else knexSql.whereIn('set.status', [1, 2])
    retu.data = await knexSql.limit(50)
        .orderBy('id', 'desc')
    return retu
};

//  星广任务下拉
exports.xgTask = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('set.id as value', 'set.task_name as label', "set.task_id")
        .from(`${XINGGUANG_TASK} as set`).where("set.status", 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('set.task_id', 'like', `${keyword}%`).orWhere('set.task_name', 'like', `${keyword}%`)
        })
    }
    retu.data = await knexSql.limit(50)
        .orderBy('id', 'desc')
    return retu
};

//  版权下拉
exports.copyright = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('set.id as value', 'set.name as label', "set.register_no", "set.author", "set.content_type", "set.account_id")
        .from(`${COPYRIGHT} as set`).where("set.status", 1)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('set.name', 'like', `${keyword}%`).orWhere('set.id', 'like', `${keyword}%`)
        })
    }
    if (query.register_no) {
        let register_no = query.register_no.trim()
        knexSql.where(builder => {
            builder.where('set.register_no', 'like', `${register_no}%`)
        })
    }
    if (query.verify_status) {
        knexSql.where('set.verify_status', query.verify_status)
    }
    if (query.authorize_type) {
        knexSql.where('set.authorize_type', query.authorize_type)
    }
    if (query.id) {
        knexSql.where('set.id', query.id)
    }
    if (query.uid) {
        knexSql.where('set.uid', query.uid)
    }
    retu.data = await knexSql.select(selectName('set', "account_id", ACCOUNT_TABLE, "name", "account_name"))
        .limit(50)
        .orderBy('id', 'desc')
    return retu
};

//  版权授权书下拉
exports.authorizeFile = async (query, userInfo = {}) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select("authorize_file").from(`${COPYRIGHT} as set`).whereNotNull("set.authorize_file")
        .whereRaw("JSON_LENGTH(authorize_file)>0").groupBy("set.id").where('set.account_id', userInfo.id)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.whereRaw(`JSON_CONTAINS(a.file_name->'$[*]',JSON_ARRAY(${keyword}))`);
    }
    // if (query.account_id) {
    //     knexSql.where('set.account_id', query.account_id)
    // }
    let data = await knexSql.limit(80).orderBy('id', 'desc')
    data.forEach(t => {
        t.authorize_file = (JSON.parse(t.authorize_file))[0]
        t.authorize_file.preview_url = getOriginalUrl(t.authorize_file.oss_key, "duolai-img");
    })
    retu.data = data
    return retu
};

//  剧集下拉
exports.videoCollection = async (query) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('set.id as value', 'set.name as label', "set.type", "set.account_id", "set.copyright_id", "copyright.name as copyright_name", "copyright.author as copyright_author", "copyright.register_no as copyright_register_no",
        "copyright_agent.account_id as copyright_account_id", "copyright_agent.agent_id as copyright_agent_id", "copyright.origin as copyright_origin", "copyright.origin_type as copyright_origin_type", "copyright.file as copyright_file",
        "copyright.authorize_object as copyright_authorize_object", "copyright.authorize_type as copyright_authorize_type", "copyright.uid as copyright_uid")
        .from(`${DUOLAI_VIDEO_COLLECTION} as set`).leftJoin(`${COPYRIGHT} as copyright`, "set.copyright_id", "copyright.id")
        .leftJoin(`${COPYRIGHT} as copyright_agent`, (builder) => {
            builder
                .on("copyright.uid", "=", "copyright_agent.uid")
                .andOn("copyright_agent.authorize_type", "=", 1)
        })
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('set.name', 'like', `${keyword}%`).orWhere('set.id', 'like', `${keyword}%`)
        })
    }
    if (query.content_type) {
        knexSql.where('copyright.content_type', query.content_type)
    }
    if (query.account_id) {
        knexSql.where('set.account_id', query.account_id)
    }
    if (query.verify_status) {
        knexSql.where('set.verify_status', query.verify_status)
    }
    if (query.status) {
        knexSql.where('set.status', query.status)
    }
    if (query.copyright_verify_status) {
        knexSql.where('copyright.verify_status', query.copyright_verify_status)
    }
    if (query.type) {
        knexSql.where('set.type', query.type)
    }

    let data = await knexSql.limit(50).select(selectName('set', "account_id", ACCOUNT_TABLE, "name", "account_name"))
        .select(selectName('copyright_agent', "account_id", ACCOUNT_TABLE, "name", "copyright_account_id_name"))
        .select(selectName('copyright_agent', "agent_id", ACCOUNT_TABLE, "name", "copyright_agent_name"))
        .orderBy('set.id', 'desc')
    data.forEach(t => {
        t.copyright_file = JSON.parse(t.copyright_file || '[]');

        t.copyright_file.forEach((k) => {
            k.preview_url = getOriginalUrl(k.oss_key, "duolai-img");
        });
    })
    retu.data = data
    return retu
};

// 结算方式
exports.settlementMethod = async (query, userInfo = {}) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('set.id as value', 'set.name as label', 'set.suffix')
        .from(`${SETTLEMENT_METHOD} as set`)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('set.id', 'like', `${keyword}%`).orWhere('set.name', 'like', `${keyword}%`)
        })
    }
    if (query.ids) knexSql.whereIn('set.id', query.ids)
    if (query.status) knexSql.where('set.status', query.status)
    else knexSql.whereIn('set.status', [1, 2])
    retu.data = await knexSql.limit(50)
        .orderBy('id', 'desc')
    return retu
};

// 爆款项目类型
exports.mainContentAdv = async (query, req) => {
    let key = `${RK_MAIN_CONTENT}_${query.business_type || 0}`
    let cache = await getCustomCache(key);
    if (cache) return cache;
    let retu = {
        code: 0,
        data: [],
    }
    let columns = ['adv.name as label', 'adv.icon', 'adv.id as value', 'adv.status', 'adv.settlement_ids', 'adv.promotion_type', 'adv.product_type', 'adv.mount_type', 'adv.is_hot', 'adv.business_type', 'adv.settle_gmv_type'];
    let knexSql = knex.select(columns)
        .from(`${MAIN_CONTENT} as main_content`)
        .where({
            "main_content.status": 1,
        })
        .leftJoin(
            `${CONTENT_RELATION} as content_relation`,
            "main_content.content_id",
            "content_relation.content_id"
        )
        .leftJoin(
            `${ADVERTISER_TABLE} as adv`,
            "content_relation.advertiser_type",
            "adv.id"
        )
        .groupBy("adv.id")

    knexSql = handler.adSearchFilter(knexSql, query);

    retu.data = await knexSql.limit(query.limit || 80).orderBy('adv.sort', 'asc').orderBy('adv.id', 'desc')
    retu.data.forEach(t => {
        t.page_enum = ADVER_TYPE_ENUM[t.value] || ADVER_TYPE_ENUM.NORMAL;
        t.settlement_ids = JSON.parse(t.settlement_ids || "[]");
        t.promotion_type_mapper = JSON.parse(t.promotion_type || "[]");
        t.promotion_type = 0
    })

    await setCustomCache(retu, key, 3600);
    return retu
};

// 提现方式
exports.withdrawalMethod = async (query, req) => {
    let key = RK_WITHDRAWAL_METHOD
    let cache = await getCustomCache(key);
    if (cache) return cache;
    let retu = {
        code: 0,
        data: [],
    }

    retu.data = [{
        type: "BANK",
        show: true
    }, {
        type: "ALIPAY",
        show: false
    }, {
        type: "WXPAY",
        show: false
    }]

    await setCustomCache(retu, key, 3600);
    return retu
};

// vip提示文案
exports.vipContent = async (query, userInfo, req) => {
    const { $version, $platform } = req;
    let data = {
        title: `用户权益变更通知`,
        content: `<p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">亲爱的用户：</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">因应市场变化以及产品功能的进一步优化，小果繁星自2024年5月1日起对用户权益进行以下调整：</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;"><strong>1.所有用户均享有邀约返利权益</strong></span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;"><strong>2.邀约返利包含已注册用户邀请新用户发布收益佣金和站内充值佣金两部分</strong></span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">3.关于邀请返佣和充值返佣政策请关注站内相关展示内容</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">4.所有返佣将根据结算周期和邀约返利政策自动存入您的账户</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">如有疑问，请咨询客服，感谢您的支持！</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">小果繁星运营团队</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">2024年5月1日</span></p>`
    }
    if (userInfo.vip_status == 2) {
        data = {
            title: `会员用户权益变更通知`,
            content: `<p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">尊敬的会员用户：</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">因应市场变化以及产品功能的进一步优化，小果繁星自2024年5月1日起对会员用户权益进行以下调整：</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">1.邀约（含会员佣金和发布佣金）返利权益保持不变</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">2.原创视频领取权益仅限小说推文项目使用，且视频类型仅限解压配音形式</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">如有任何疑问，请随时联系我们的客服团队，感谢您的支持！</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">小果繁星运营团队</span></p><p style="line-height: 1.3;"><span style="font-size: 14px; font-family: 黑体;">2024年5月1日</span></p>`
        }
    }
    if ($platform == "ios") {
        let result = await knex.select("*").from(VERSION).where({ "version_code": $version, "verify_status": 3 })
        if (!result.length)
            data = null
    }
    return {
        code: 0,
        data
    }
}

exports.sync_applet_plan = async (body) => {
    if (!body.pulls?.length) { return Promise.reject("请传入小程序计划信息") };

    const { getTaskDataByIds } = require("../oauth/douyin/applet_plan");

    for (const app of body.pulls) {
        await getTaskDataByIds(app.app_id, app.task_ids);
    }

    return { code: 0, data: null }
}

exports.duolaiApplet = async (query, userInfo = {}) => {
    let retu = {
        code: 0,
        data: []
    }
    let knexSql = knex.select('app.app_id as value', 'app.name as label')
        .from(`${DUOLAI_APPLET} as app`)
    if (query.keyword) {
        let keyword = query.keyword.trim()
        knexSql.where(builder => {
            builder.where('app.app_id', 'like', `${keyword}%`).orWhere('app.name', 'like', `${keyword}%`)
        })
    }
    if (query.status) knexSql.where('app.status', query.status)
    else knexSql.whereIn('app.status', [1])
    retu.data = await knexSql.limit(50).orderBy('id', 'desc')
    return retu
};

/**
 * 
 * @param {Object} query 
 * @returns 
 */
exports.duolaiUploadId = async (query, userInfo) => {
    let { id: account_id, channel_id } = userInfo
    let duolai_bucket = 'duolai-img', cdn_host = "https://duolai-img.domain.cn"
    return await getDuolaiUploadId(query, { duolai_bucket, bind_account_id: account_id, channel_id, cdn_host })
}

const handler = {
    searchFilter(sqlKnex, query) {
        if (query.keyword) {
            let keyword = query.keyword.trim()
            sqlKnex.where(builder => {
                builder.where("a.name", "like", `%${keyword}%`).orWhere("a.id", "like", `%${keyword}%`)
            });
        }
        if (query.dept_id) sqlKnex.whereRaw(`JSON_CONTAINS(a.department->'$[*]',JSON_ARRAY(${query.dept_id}))`);
        if (query.dept_name) sqlKnex.whereRaw(`JSON_CONTAINS(a.department->'$[*]',JSON_ARRAY(${query.dept_name}))`);
        if (query.role_ids && query.role_ids.length) {
            sqlKnex.whereIn("acc_role.role_id", query.role_ids);
        }
        if (query.role_id) {
            sqlKnex.where("acc_role.role_id", query.role_id);
        }
        if (query.auth_type) {
            sqlKnex.leftJoin(`${ACTINFO_TABLE} as acc_info`, "a.id", "acc_info.account_id")
                .where('acc_info.auth_type', query.auth_type)
        }
        if (query.department_id) sqlKnex.whereRaw(`JSON_CONTAINS(a.department->'$[*]',JSON_ARRAY(${query.department_id}))`);
        if (query.account_type) {
            if (Array.isArray(query.account_type)) sqlKnex.whereIn('a.account_type', query.account_type);
            else sqlKnex.where('a.account_type', query.account_type);
        } else {
            sqlKnex.whereIn('a.account_type', [1, 3, 4]);
        }
        if (query.vip_status) sqlKnex.where('a.vip_status', query.vip_status)
        if (query.vip_level) sqlKnex.where('a.vip_level', query.vip_level)
        if (query.channel_id) sqlKnex.where('a.channel_id', query.channel_id)
        if (query.realname_status) sqlKnex.where('a.realname_status', query.realname_status)
        return sqlKnex
    },

    adSearchFilter(knexSql, query, oem_id = 1) {
        if (query.keyword) {
            let keyword = query.keyword.trim()
            knexSql.where(builder => {
                builder.where('adv.id', 'like', `${keyword}%`).orWhere('adv.name', 'like', `${keyword}%`)
            })
        }
        if (query.id) knexSql.where('adv.id', query.id);
        if (query.status) knexSql.where('adv.status', query.status).where('adv.oem_id', oem_id);
        else knexSql.where('adv.status', 1)
        if (query.mount_type) {
            knexSql.whereRaw(`JSON_CONTAINS(adv.mount_type, JSON_ARRAY(${query.mount_type}))`)
        }

        if (query.platform_id) knexSql.where('adv.platform_id', query.platform_id);
        if (query.product_type) knexSql.where('adv.product_type', query.product_type);
        if (query.promotion_type && Number(query.promotion_type)) {
            if (query.promotion_plan == 2) {
                query.promotion_type = 4;
            }
            knexSql.whereRaw(`JSON_CONTAINS(adv.promotion_type, JSON_ARRAY(${query.promotion_type}))`)
        }
        if (Array.isArray(query.promotion_types)) {
            knexSql.where(builder => {
                for (t of query.promotion_types && query.promotion_types.length) {
                    builder.orWhereRaw(`JSON_CONTAINS(adv.promotion_type, JSON_ARRAY(${t}))`)
                }
            })
        }
        if (query.business_type) knexSql.where('adv.business_type', query.business_type);
        if (query.is_test) {
            if (query.is_test == 1 || query.is_test == 2) {
                knexSql.where('adv.is_test', query.is_test)
            } else {
                knexSql.whereIn('adv.is_test', [1, 2])
            }
        } else {
            knexSql.where('adv.is_test', 1)
        }
        return knexSql
    }
}
