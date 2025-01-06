const knex = require("../../../db/knexManager").knexProxy;
const {
    ACCOUNT_TABLE,
    KOC_KEYWORD,
    KEYWORD_FEEDBACK,
    PLATFORM_ACCOUNT_TABLE,
    PLATFORM_TABLE,
    CATEGORY_TABLE,
    SUBJECT_TABLE,
    BUSINESS_TYPE_TABLE,
    DATA_TABLE,
    DATA_SETTLE_TABLE,
    DATA_SETTLED,
    BLOGGER_TABLE,
    DATA_SPLIT,
} = require("../../../config/setting");
const moment = require("moment");
const { getChildrenByPermission } = require("../../public/permission");
const { knexTransaction } = require("../../../utils/tools");
const { insertLog, getLogData, getAccountType } = require("../../public/operationLog")

async function info(query, userInfo) {
    let account_id = userInfo.id
    let account_type = await getAccountType(account_id)
    let formatValue = '%Y-%m-%d'
    let formatDay = 'YYYY-MM-DD'
    query.scroll_type = query.scroll_type || "left"
    if (query.date_type == "day")
        handler.dealDate(query, 29, "day")

    if (query.date_type == "month") {
        formatValue = '%Y-%m'
        formatDay = 'YYYY-MM'
        handler.dealDate(query, 5, "month")
    }

    if (query.date_type == "year") {
        formatValue = '%Y'
        formatDay = 'YYYY'
        handler.dealDate(query, 2, "year")
    }
    let sql = knex.select(knex.raw(`DATE_FORMAT( data_split.date, '${formatValue}') as date`))
        .from(`${DATA_SPLIT} as data_split`)
        .leftJoin(`${DATA_TABLE} as data`, "data_split.data_id", "data.id")
        .where({
            "data.status": 1,
            "data_split.oem_id": userInfo.oem_id,
        })
        .andWhere((builder) => {
            handler.searchFilter(query, builder, "data_split.");
        })
        .groupByRaw(`DATE_FORMAT(data_split.date,'${formatValue}')`);

    if (account_type == 1) {
        sql.select(knex.raw(`SUM(data_split.total_publish_price + data_split.total_settle_price) as blogger_profit`)) //效果收益
            .sum("data_split.total_publish_price as publish_profit") //发布收益
            .select(knex.raw(`SUM(data_split.total_publish_price + data_split.total_settle_price) as profit_blogger`)) //我的收益
            .countDistinct('data_split.keyword_id as keyword_count') //关键词总数
            .select(knex.raw(`SUM(if(data_split.settle_type=1,data_split.settle_num,0)) as settle_num`)) //结算总量
            .where('data_split.account_id', account_id)
    }
    else if (account_type == 2) {
        sql.select(knex.raw(`SUM(IF(data_split.settle_type=1, data_split.total_price, 0)) as blogger_profit`)) //效果收益
            .sum("data_split.total_publish_price as publish_profit") //发布收益
            .select(knex.raw(`SUM(data_split.total_price) as profit_consultant`)) //我的收益
            .select(knex.raw(`SUM(IF(data_split.settle_type=2, data_split.total_service_price, 0)) as service_profit`)) //服务费
            .countDistinct('data_split.keyword_id as keyword_count') //关键词总数
            .countDistinct('data.owner_user_id as blogger_count') //博主总人数
            .select(knex.raw(`SUM(if(data_split.settle_type=1,data_split.settle_num,0)) as settle_num`)) //结算总量
            .where('data_split.account_id', account_id)
    }
    else if (account_type == 3) {
        let account_ids = await getChildrenByPermission(userInfo, [], false) //获取当前查询者的成员
        sql.select(knex.raw(`SUM(IF(data_split.settle_type=2, data_split.total_service_price, 0)) as service_profit`)) //服务费
            .select(knex.raw(`SUM(data_split.total_price) as profit_consultant`)) //博主总收益
            .countDistinct('data_split.keyword_id as keyword_count') //关键词总数
            .countDistinct('data.owner_user_id as blogger_count') //博主总人数
            .select(knex.raw(`SUM(if(data_split.settle_type=1,data_split.settle_num,0)) as settle_num`)) //结算总量
        if (account_ids) sql.whereIn('data_split.account_id', account_ids)
    }

    let blogger_field = ["date", "profit_blogger as profit", "publish_profit", "blogger_profit", "settle_num", "keyword_count"]
    let consultant_field = ["date", "profit_consultant as profit", "publish_profit", "blogger_profit", "service_profit", "settle_num", "keyword_count", "blogger_count"]
    let business_field = ["date", "profit_consultant as profit", "service_profit", "settle_num", "keyword_count", "blogger_count"]
    let field = []
    if (account_type == 1)
        field = blogger_field
    else if (account_type == 2)
        field = consultant_field
    else if (account_type == 3)
        field = business_field

    sql = knex.select(field)
        .from(knex.raw(`(${sql}) as m`))

    let data = await sql

    let daysList = handler.betweenDates(query.begin_date, query.end_date, formatDay, query.date_type)

    let result = []
    daysList.forEach(t => {
        if (data.find(k => k.date == t)) {
            result.push(data.find(k => k.date == t))
        }
        else {
            let obj = {}
            field.forEach(k => {
                if (k == "date")
                    obj.date = t
                else if (k.indexOf("as") > -1)
                    obj.profit = 0
                else
                    obj[k] = 0
            })
            result.push(obj)
        }
    })

    return {
        code: 0,
        data: result,
        table_data: data,
    };
}

async function compare(query, userInfo) {
    let account_id = userInfo.id
    let account_type = await getAccountType(account_id)

    query.scroll_type = "left"
    let formatValue = '%Y-%m-%d'
    let formatDay = 'YYYY-MM-DD'
    if (query.date_type == "day")
        handler.dealDate(query, 1, "day")

    if (query.date_type == "month") {
        formatValue = '%Y-%m'
        formatDay = 'YYYY-MM'
        handler.dealDate(query, 1, "month")
    }

    if (query.date_type == "year") {
        formatValue = '%Y'
        formatDay = 'YYYY'
        handler.dealDate(query, 1, "year")
    }

    let sql = knex
        .select(knex.raw(`DATE_FORMAT(data_split.date,'${formatValue}') as date`))
        .from(`${DATA_SPLIT} as data_split`)
        .where({
            "data_split.oem_id": userInfo.oem_id,
        })
        .andWhere((builder) => {
            handler.searchFilter(query, builder, "data_split.");
        })
        .groupByRaw(`DATE_FORMAT(data_split.date,'${formatValue}')`)
        .orderByRaw(`DATE_FORMAT(data_split.date,'${formatValue}') desc`)

    if (account_type == 1) {
        sql.select(knex.raw(`SUM(data_split.total_publish_price + data_split.total_settle_price) as blogger_profit`)) //效果收益
            .sum("data_split.total_publish_price as publish_profit") //发布收益
            .where('data_split.account_id', account_id)
    }
    else if (account_type == 2) {
        sql.select(knex.raw(`SUM(IF(data_split.settle_type=1, data_split.total_price, 0)) as blogger_profit`)) //效果收益
            .sum("data_split.total_publish_price as publish_profit") //发布收益
            .select(knex.raw(`SUM(IF(data_split.settle_type=2, data_split.total_service_price, 0)) as service_profit`)) //服务费
            .where('data_split.account_id', account_id)
    }
    let data = await sql
    let result = {
        blogger_differ: 0,
        publish_differ: 0,
        service_differ: 0,
    }
    if (data.length == 1) {
        if (data[0].date == moment(query.end_date).format(formatDay))
            result = {
                blogger_differ: data[0].blogger_profit,
                publish_differ: data[0].publish_profit,
                service_differ: data[0].service_profit
            }
        else
            result = {
                blogger_differ: 0 - data[0].blogger_profit,
                publish_differ: 0 - data[0].publish_profit,
                service_differ: 0 - data[0].service_profit
            }
    }
    //存在昨日、上月、昨年数据
    if (data.length > 1) {
        result.blogger_differ = data[0].blogger_profit - data[1].blogger_profit
        result.publish_differ = data[0].publish_profit - data[1].publish_profit
        if (query.account_type == 2)
            result.service_differ = data[0].service_profit - data[1].service_profit
    }

    return {
        code: 0,
        data: result,
    };
}

const handler = {
    async searchFilter(query, builder, table1) {
        if (query.advertiser_type) {
            builder.where(`${table1}advertiser_type`, query.advertiser_type);
        }
        if (query.begin_date && query.end_date) {
            builder.where(`${table1}date`, ">=", query.begin_date).andWhere(`${table1}date`, "<=", query.end_date);
        }
    },
    betweenDates(startDate, endDate, formatDay, date_type) {
        let daysList = [];
        const start = moment(startDate);
        const end = moment(endDate);
        const day = end.diff(start, date_type);
        daysList.push(start.format(formatDay));
        for (let i = 1; i <= day; i++) {
            daysList.push(start.add(1, date_type).format(formatDay));
        }
        return daysList;
    },
    dealDate(query, day, type) {
        if (query.scroll_type == "left") {
            query.begin_date = moment(query.date).subtract(day, type).format('YYYY-MM-DD');
            query.end_date = moment(query.date).endOf(type).format("YYYY-MM-DD");
        }
        else if (query.scroll_type == "right") {
            let end_date = moment(query.date).add(day, type).endOf(type).format('YYYY-MM-DD');
            query.begin_date = moment(query.date).format('YYYY-MM-DD')
            query.end_date = moment().diff(moment(end_date), type) > 0 ? end_date : moment().format('YYYY-MM-DD')
        }
    }
};

module.exports = {
    info,
    compare,
};