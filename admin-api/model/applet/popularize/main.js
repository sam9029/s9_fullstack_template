const knex = require('../../../db/knexManager').knexProxy;
const moment = require('moment')
const { getChildrenByPermission } = require("../../public/permission")
const { ACCOUNT_TABLE, PLATFORM_ACCOUNT_TABLE, KOC_KEYWORD, DATA_SPLIT,
    DATA_TABLE, POLICY_TABLE, POLICY_SETTLEMENT_TABLE,
    ADVERTISER_TABLE, TABLE_CONSULTANT, BLOGGER_TABLE, MAX_INCOME, KEYWORD_FEEDBACK } = require('../../../config/setting');
const { has_prm_advertiser } = require('../../../config/index');

const { getAccountType } = require("../../public/operationLog")
async function getProject(query = {}, userInfo = {}) {
    // if (process.env.NODE_ENV != "production") 
    // hasprm_advertiser.push(3, 4, 5, 6, 7)
    // if (process.env.NODE_ENV != "production") hasprm_advertiser.push(8)
    let hasprm_advertiser = [...has_prm_advertiser]
    let { id: account_id } = userInfo || {}
    if (process.env.NODE_ENV == "production" && [10007831, 10007071, 10007830, 10007054,
        10007085, 10007746, 10008018, 10008017].includes(Number(account_id))) hasprm_advertiser.push(9)
    if (!account_id) return Promise.reject('未知账号！')
    let account_type = await getAccountType(account_id)
    if (!account_type) return Promise.reject('当前账户不存在！')
    let accountIds = await getChildrenByPermission(userInfo);
    let data = []
    let joinPeopleSql = knex.select("kfb.advertiser_type")
        .countDistinct('kfb.owner_user_id as join_people_num')
        .from(`${KEYWORD_FEEDBACK} as kfb`)
        .leftJoin(`${BLOGGER_TABLE} as blo`, 'blo.account_id', 'kfb.owner_user_id')
        .whereNotNull('blo.account_id')
        .where(builder => {
            if (accountIds) builder.whereIn('blo.account_id', accountIds)
        })
        .groupBy('kfb.advertiser_type')
        .toString()
    let date_now = moment().format("YYYY-MM-DD")
    switch (account_type) {
        case 1://当前登录账户类型为博主
            let dstSql = knex.select("pol.advertiser_type")
                .select(knex.raw(`MAX(IF(pst.settlement_id = 5, pst.publish_price , 0)) as publish_price`)) //发布作品
                .select(knex.raw(`MAX(IF(pst.settlement_id = 1, pst.publish_price , 0)) as settle_price`)) //拉新单价
                .select(knex.raw(`MAX(IF(pst.settlement_id = 2, pst.publish_price , 0)) as order_price`)) //订单单价
                .from(`${POLICY_TABLE} as pol`)
                .leftJoin(`${POLICY_SETTLEMENT_TABLE} as pst`, 'pst.policy_id', 'pol.id')
                .where({ "pol.offer_account_id": account_id, "pol.verify_status": 3 })
                .whereRaw(`pol.effective_start_date <= '${date_now}' and (pol.effective_end_date IS NULL OR pol.effective_end_date >= '${date_now}')`)
                .groupBy('pol.advertiser_type').toString()
            let dataBloggerSql = knex.select("dat.advertiser_type")
                .select(knex.raw(`SUM(dat.total_price) as total_income`))
                .from(`${DATA_SPLIT} as dat`)
                .leftJoin(`${DATA_TABLE} as dst`, "dst.id", "dat.data_id")
                .where('dat.account_id', account_id)
                .where('dst.status', 1)
                .groupBy("dat.advertiser_type").toString()
            let maxIncomeSql = knex.select(knex.raw(`IFNULL(IF(show_type = 2, edit_income, real_income), 0) as max_income`))
                .from(MAX_INCOME)
                .whereRaw('advertiser_type = sbj.id').toString()
            data = await knex.select('sbj.id', 'sbj.name', 'dst.publish_price', 'dst.settle_price', 'dst.order_price', 'dat.total_income')
                .from(`${ADVERTISER_TABLE} as sbj`)
                .select(knex.raw(`(${maxIncomeSql}) as max_income`))
                .leftJoin(knex.raw(`(${dstSql}) as dst ON dst.advertiser_type = sbj.id`))
                .leftJoin(knex.raw(`(${dataBloggerSql}) as dat ON dat.advertiser_type = sbj.id`))
                .whereIn('sbj.id', hasprm_advertiser)
                .where(builder => {
                    searchFilter(builder, query)
                })
                .orderBy('sbj.id', 'asc')
            data = data.map(i => {
                i.settle_method = []
                if (i.id != 6) i.settle_method.push({
                    method: "拉新量结算",
                    value: i.settle_price
                })
                i.settle_method.push({
                    method: "作品量结算",
                    value: i.publish_price
                })
                if ([1, 6].includes(i.id)) i.settle_method.push({
                    method: "订单量结算",
                    value: i.order_price
                })
                delete i.publish_price
                delete i.settle_price
                delete i.order_price
                return i
            })
            break;
        case 2://当前登录账户类型为投顾
            let dstSql1 = knex.select("pol.advertiser_type")
                .select(knex.raw(`MAX(IF(pst.settlement_id = 5, pst.publish_price , 0)) as publish_price`)) //发布作品
                .select(knex.raw(`MAX(IF(pst.settlement_id = 1, pst.publish_price , 0)) as settle_price`)) //拉新单价
                .select(knex.raw(`MAX(IF(pst.settlement_id = 2, pst.publish_price , 0)) as order_price`)) //订单单价
                .select(knex.raw(`MAX(IF(pst.settlement_id = 5, pst.service_price , 0)) as service_publish_price`)) //发布作品
                .select(knex.raw(`MAX(IF(pst.settlement_id = 1, pst.service_price , 0)) as service_settle_price`)) //拉新单价
                .select(knex.raw(`MAX(IF(pst.settlement_id = 2, pst.service_price , 0)) as service_order_price`)) //订单单价
                .from(`${POLICY_TABLE} as pol`)
                .leftJoin(`${POLICY_SETTLEMENT_TABLE} as pst`, 'pst.policy_id', 'pol.id')
                .where({ "pol.offer_account_id": account_id, "pol.verify_status": 3 })
                .whereRaw(`pol.effective_start_date <= '${date_now}' and (pol.effective_end_date IS NULL OR pol.effective_end_date >= '${date_now}')`)
                .groupBy('pol.advertiser_type').toString()
            let dataConstantSql = knex.select("dat.advertiser_type")
                // .select(knex.raw(`SUM(IF(dat.blogger_id = ${account_id}, 0, dat.total_service_price)) as service_total_income`)) //服务费
                .select(knex.raw(`SUM(dat.total_price) as total_income`))
                .from(`${DATA_SPLIT} as dat`)
                .leftJoin(`${DATA_TABLE} as dst`, "dst.id", "dat.data_id")
                .where('dat.account_id', account_id)
                .where('dst.status', 1)
                .groupBy("dat.advertiser_type").toString()
            data = await knex.select('sbj.id', 'sbj.name', 'dat.total_income', 'jps.join_people_num', 'dst.*')
                .from(`${ADVERTISER_TABLE} as sbj`)
                .leftJoin(knex.raw(`(${joinPeopleSql}) as jps ON jps.advertiser_type = sbj.id`))
                .leftJoin(knex.raw(`(${dataConstantSql}) as dat ON dat.advertiser_type = sbj.id`))
                .leftJoin(knex.raw(`(${dstSql1}) as dst ON dst.advertiser_type = sbj.id`))
                .whereIn('sbj.id', hasprm_advertiser)
                .where(builder => {
                    searchFilter(builder, query)
                })
                .orderBy('sbj.id', 'asc')
            data = data.map(i => {
                delete i.advertiser_type
                i.settle_method = []
                if (i.id != 6) i.settle_method.push({
                    method: "拉新量结算",
                    value: i.settle_price,
                    service: i.service_settle_price
                })
                i.settle_method.push({
                    method: "作品量结算",
                    value: i.publish_price,
                    service: i.service_publish_price
                })
                if ([1, 6].includes(i.id)) i.settle_method.push({
                    method: "订单量结算",
                    value: i.order_price,
                    service: i.service_order_price
                })
                delete i.advertiser_type
                delete i.service_settle_price
                delete i.service_publish_price
                delete i.service_order_price
                delete i.publish_price
                delete i.settle_price
                delete i.order_price
                return i
            })
            break;
        case 3://当前登录账户类型为管理员身份
            let dataMangeSql = knex.select("dat.advertiser_type", "dat.account_id")
                .select(knex.raw(`SUM(IF(dat.settle_type = 1, dat.total_price, 0)) as max_income`)) //最高收益，只算发布收益
                .from(`${DATA_SPLIT} as dat`)
                .leftJoin(`${DATA_TABLE} as dst`, "dst.id", "dat.data_id")
                .where(builder => {
                    if (accountIds) builder.whereIn('dat.account_id', accountIds)
                })
                .where('dst.status', 1)
                .groupBy("dat.advertiser_type", "dat.account_id").toString()
            data = await knex.select('sbj.id', 'sbj.name')
                .max('dat.max_income as max_income')
                .max('jps.join_people_num as join_people_num')
                .from(`${ADVERTISER_TABLE} as sbj`)
                .leftJoin(knex.raw(`(${joinPeopleSql}) as jps ON jps.advertiser_type = sbj.id`))
                .leftJoin(knex.raw(`(${dataMangeSql}) as dat ON dat.advertiser_type = sbj.id`))
                .whereIn('sbj.id', hasprm_advertiser)
                .where(builder => {
                    searchFilter(builder, query)
                })
                .groupBy("sbj.id").orderBy('sbj.id', 'asc')
            // console.log(data.toString());
            data = data.map(i => {
                i.settle_method = []
                if (i.id != 6) i.settle_method.push({ method: "拉新量结算" })
                if ([1, 6].includes(i.id)) i.settle_method.push({ method: '订单量结算' })
                return i
            })
            break;
        default:
            break;
    }
    return { code: 0, account_type, data }
}
async function checkProject(query = {}, userInfo = {}) {
    let { id: account_id } = userInfo || {}
    let { advertiser_type } = query || {}
    if (!account_id) return Promise.reject('未知账号！')
    if (!advertiser_type) return Promise.reject('未设置查询项目！')
    let account_data = (await knex.select('acc.id')
        .select(knex.raw(`IF(blo.account_id IS NOT NULL,1,IF(cst.account_id IS NOT NULL,2,3)) as account_type`))
        .from(`${ACCOUNT_TABLE} as acc`)
        .leftJoin(`${TABLE_CONSULTANT} as cst`, 'cst.account_id', 'acc.id')
        .leftJoin(`${BLOGGER_TABLE} as blo`, 'blo.account_id', 'acc.id')
        .where({ "acc.id": account_id }))[0]
    if (!account_data) return Promise.reject('当前账户不存在！')
    let { account_type } = account_data
    let data = null
    if (account_type == 1) {
        data = await checkAccount(account_id)
        if (data) return { code: 0, account_type, data }
        data = await checkPolicy(account_id, advertiser_type)
    } else if (account_type == 2) {
        data = await checkPolicy(account_id, advertiser_type)
    } else if (account_type == 3) {
        return { code: 0, account_type, data }
    } else {
        return Promise.reject('未知的账户类型！')
    }
    return { code: 0, account_type, data }
}
async function checkAccount(blogger_id) {
    let data = (await knex(PLATFORM_ACCOUNT_TABLE).select('id').where({ blogger_id }).limit(1))[0]
    if (!data) return 2
    return null
}
async function checkPolicy(blogger_id, advertiser_type) {
    let date_now = moment().format("YYYY-MM-DD")
    let data = (await knex.select("pol.id")
        .from(`${POLICY_TABLE} as pol`)
        .where({ "pol.offer_account_id": blogger_id, "pol.verify_status": 3, "pol.advertiser_type": advertiser_type })
        .whereRaw(`pol.effective_start_date <= '${date_now}' and (pol.effective_end_date IS NULL OR pol.effective_end_date >= '${date_now}')`)
        .limit(1))[0]
    if (!data) return 1
    return null
}
function searchFilter(builder, query) {
    if (query.keyword) {
        let keyword = query.keyword.trim()
        builder.where('sbj.id', 'like', `%${keyword}%`).orWhere('sbj.name', 'like', `%${keyword}%`)
    }
}
module.exports = {
    getProject,
    checkProject
}