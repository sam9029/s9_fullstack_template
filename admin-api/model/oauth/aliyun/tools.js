const knex = require("../../../db/knexManager").knexProxy;
const { RK_ALI_AUTH_ORDER_SN_LOCK } = require("../../../config/redis_key")
const { getRequestIP, getBaseStation, sleep, knexTransaction } = require('../../../utils/tools')
const moment = require("moment")
const { insertLog, getLogData } = require("../../public/operationLog")
const { getWaitLock, getRedisClient, getCustomCache, setCustomCache, delCustomCache } = require('../../../db/redis');
const { checkKeys } = require("../../../utils/check_type");

async function getOrderSn(table = '') {
    return await getWaitLock(RK_ALI_AUTH_ORDER_SN_LOCK, async () => {
        let date = moment().format('YYYYMMDD')
        let count_key = `${RK_ALI_AUTH_ORDER_SN_LOCK}:${date}`
        let expire_sec = 3 * 24 * 60 * 60
        let data = await getCustomCache(count_key)
        if (!data) { //当天没有订单计数key时，尝试获取数据库当天的count最大值
            let count = (await knex(table).count('id as count').where('create_date', moment().format('YYYY-MM-DD')))[0]?.count
            await getRedisClient().multi().set(count_key, count, { NX: true, EX: expire_sec }).exec()
        }
        let prefix = process.env.NODE_ENV == "production" ? "ALISMRZ" : "DEVSMRZ"
        let [_add_status, order_count] = await getRedisClient().multi().set(count_key, 0, { NX: true, EX: expire_sec })
            .incrBy(count_key, 1).exec()
        let sn = `${prefix}-${date}${String(order_count).padStart(8, '0')}`
        // console.log(sn);
        return sn
    }, 5, 300)
}

module.exports = {
    getOrderSn,
}