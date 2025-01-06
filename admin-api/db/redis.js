const redisClient = require('redis');
const { redis } = require('../config/index')
const { getUuid, sleep, timestampSec } = require('../utils/tools')
let can_use = false
let locked_ids = []
const client = redisClient.createClient({
    url: redis.url,
    socket: {
        reconnectStrategy: (options) => {
            return Math.max(options * 100, 3000);
        }
    }
});
const crypto = require('crypto'); //加载加密文件
client.on('ready', () => {
    can_use = true
})
client.on('error', async (err) => {
    can_use = false
    if (err.message.indexOf('connect ECONNREFUSED') == -1) console.log('Redis 异常：', err.message)
});
client.connect().catch(err => {
    console.log('Redis 连接异常：', err)
})
async function setKey(key = "", data = {}) {
    can_use = true;
    if (!can_use) return Promise.reject('Redis暂未连接！')
    let value = JSON.stringify(data)
    await client.set(key, value, {
        EX: redis.expire_interface,
        NX: true
    });
}
async function getKey(key = "") {
    can_use = true;
    if (!can_use) return Promise.reject('Redis暂未连接！')
    let data = await client.get(key)
    if (data) return JSON.parse(data)
    return null
}
function getReqUniqueKey(req = {}) {
    let query = JSON.stringify(req.query || {})
    let body = JSON.stringify(req.body || {})
    let token = req.$user ? req.$user.token : ''
    let key = crypto.createHash('md5').update(query).update(body).update(token).digest('hex')
    let account_id = req.$user ? req.$user.id : ''
    return `${account_id}:PATH:${key}`
}
/*
EX：设置过期时间  秒
PX：设置过期时间 毫秒
NX：只有键不存在时，才对键进行set操作
XX：只有键存在时，才对键进行set操作
*/
async function mgetKey(key = "") {
    if (!can_use) return Promise.reject('Redis暂未连接！')
    let data = await client.get(key)
    if (data) return JSON.parse(data)
    return null
}
async function msetKey(data = {}) {
    if (!can_use) return Promise.reject('Redis暂未连接！')
    let value = JSON.stringify(data)
    await client.set(key, value, {
        EX: redis.expire_interface,
        NX: true
    });
}
//设置不会过期的KEY
async function setNEXKey(key = "", value) {
    if (!can_use) return Promise.reject('Redis暂未连接！')
    await client.set(key, value, { NX: true });
}
async function getNEXKey(key = "") {
    if (!can_use) return Promise.reject('Redis暂未连接！')
    let data = await client.get(key)
    return data
}
/**
 * @description EX：设置过期时间  秒
 * @description PX：设置过期时间 毫秒
 * @description NX：只有键不存在时，才对键进行set操作
 * @description XX：只有键存在时，才对键进行set操作
 * @returns
 */
function getRedisClient() {
    // if (!can_use) return Promise.reject('服务繁忙，请稍后重试！')
    return client
}
async function getSession(key = '') {
    if (!can_use) return Promise.reject('Redis暂未连接！')
    let data = await client.get(`xgfx:session:${key}`)
    if (data) return JSON.parse(data)
}
async function setSession(data = {}, res) {
    if (!can_use) return Promise.reject('Redis暂未连接！')
    let uuid = getUuid()
    await client.set(`xgfx:session:${uuid}`, JSON.stringify(data), { EX: 180, NX: true });
    if (res) res.setHeader('koc-session', uuid);
    return uuid
}

async function removeSession(keys = []) {
    if (keys && keys.length) {
        return await client.del(keys.map(key => `xgfx:session:${key}`))
    }
    return
}
async function getCustomCache(key = '', times = 1) {
    if (!can_use) await sleep(1000)
    // if (!can_use) return Promise.reject('Redis暂未连接！')
    if (!key) return Promise.reject('Redis未设置有效key！')
    let data = await client.get(key)
    if (data) return JSON.parse(data)
}
/**
 * @param {{}} [data={}] 设置的缓存数据
 * @param {String} key 设置的Redis key
 * @param {number} [time=60] 默认的Redis过期时间
 * @param {Object} [options={}] Redis 配置，参考description
 * @description EX：设置过期时间  秒
 * @description PX：设置过期时间 毫秒
 * @description NX：只有键不存在时，才对键进行set操作
 * @description XX：只有键存在时，才对键进行set操作
 * @returns
 */
async function setCustomCache(data = {}, key, time = 60, options = {}) {
    if (!can_use) await sleep(1000)
    if (!can_use) return Promise.reject('Redis暂未连接！')
    if (!key) return Promise.reject('Redis未设置有效key！')
    if (time) return await client.set(key, JSON.stringify(data), { EX: time, ...(options || {}) });
    else return await client.set(key, JSON.stringify(data), { ...(options || {}) });
}
async function delCustomCache(keys = []) {
    if (keys && keys.length) {
        return await client.del(keys)
    }
    return
}
// let get_data_key = ['1_3', '1_20']
// getRedisClient().hSet('koc_task_1', { '1_3': 1, '1_8': JSON.stringify(['hsjhsj', 'nxxnskn']) }).then(res => {
//     console.log(res);
//     return getRedisClient().del('koc_task_1')
// }).then(res=>{
//     console.log(JSON.parse(res));
// })
// client.HMGET()
// let data = await getRedisClient().set('koc_task_1', JSON.stringify({ '1_3': 1, '1_2': 3 }), { EX: true })
// await getRedisClient().flushDb()
// let data = await getRedisClient().hSet('koc_task_1', { '1_3': 1, '1_8': 3 })
// console.log('eeee', data);
// data = await getRedisClient().hGetAll('koc_task_1', ['1_3', '1_2'])
// console.log('获取所有key', data);
// // data = await getRedisClient().hSet('koc_task_1', '1_3', 6)
// // console.log('设置6',data);
// data = await getRedisClient().hIncrBy('koc_task_1', '1_3', -1)
// console.log('加6',data);
// data = await getRedisClient().hGet('koc_task_1', '1_3')
// console.log('获取加和',data);
// setSession('jddeiij')
async function delKeys(keys = []) {
    if (keys && keys.length) {
        return await client.del(keys)
    }
    return
}
/**
 * Redis分布式锁，遇到锁返回错误
 * @param {String} lock_key redis锁的key值，一般为特定前缀+数据ID
 * @param {() => Promise<void>} [callback=async () => { }] 需要加锁执行的函数
 * @param {boolean} [default_release_lock=true] 是否默认释放锁，默认释放
 * @param {number} [lock_time=600] 默认的锁时间，单位秒
 * @returns
 */
async function getLock(lock_key = '', callback = async () => { }, default_release_lock = true, lock_time = 600,) {
    if (!lock_key) return Promise.reject("数据锁元数据不存在！");
    if (await getRedisClient().set(lock_key, 'LOCKED', { EX: lock_time, NX: true })) {
        return await callback(lock_key, lock_time).finally(async () => {
            if (default_release_lock) await delKeys([lock_key])
        })
    }
    return Promise.reject("数据正在处理中，请稍后再试！");
}

async function getDataLock(id = null, redis_key) {
    if (!id) throw "数据锁元数据不存在！";
    if (!redis_key) throw "缓存不存在！";
    let lock_key = `${redis_key}:${id}`
    if (await getRedisClient().set(lock_key, 'LOCKED', { EX: 600, NX: true })) {
        locked_ids.push(lock_key)
        return true
    }

    return Promise.reject("数据正在处理中，请稍后再试！");
}
async function releaseLock(id = null, redis_key) {
    if (id) {
        let lock_key = `${redis_key}:${id}`
        if (!locked_ids.includes(lock_key)) return //该ID不存在时，不会释放该ID，防止越界操作
        return await delCustomCache([lock_key])
    }
    await delCustomCache(locked_ids)
}
/**
 * 遇到锁等待执行函数，需设置最大等待时间
 * @param {string} [lock_key=''] redis等待锁的key值
 * @param {() => Promise<void>} [callback=async () => { }] 遇到锁等待执行的函数
 * @param {number} [max_wait_time=10] 最大等待时间，单位秒
 * @param {number} [sleep_time=500] 间隔查询锁的时间，单位毫秒，必须max_wait_time > sleep_time,且sleep_time>100
 * @param {boolean} [random_wait=false] 是否随机等待，等待时间为0<n<sleep_time之间的整数
 * @param {number} [lock_time=600] 默认的锁时间，单位秒,可根据函数执行时间进行延长
 * @param {number} [start_time=timestampSec()] 锁开始执行时刻，不可更改
 * @returns
 */
async function getWaitLock(lock_key = '', callback = async () => { }, max_wait_time = 10, sleep_time = 500, random_wait = false, lock_time = 600, start_time = timestampSec()) {
    if (!lock_key) return Promise.reject("数据锁元数据不存在！");
    if (timestampSec() - start_time > max_wait_time) return Promise.reject("等待超时，请稍后重试！");
    let lock_flag = await getRedisClient().set(lock_key, 'LOCKED', { EX: lock_time, NX: true }) //首先尝试获取锁，获取成功后执行函数
    if (lock_flag) return await callback().finally(async () => {
        await delKeys([lock_key])
    })
    let random_time = Math.floor(Math.random() * (sleep_time - 100) + 100)
    if (random_wait) await sleep(random_time)
    else await sleep(sleep_time)
    return await getWaitLock(lock_key, callback, max_wait_time, sleep_time, random_wait, lock_time, start_time)
}
/**
 * 设置redis缓存
 * @param {string} [cache_key=''] 
 * @param {() => Promise<void>} [callback=async () => { }] 
 * @param {number} [cache_time=600] 缓存时间，单位秒
 * @param {boolean} [refresh=false] 是否强制刷新，默认false 不进行强制刷新
 * @param {boolean} [cache_all=false] 是否缓存所有数据，即使null也缓存，默认false null时不缓存
 */
async function useCustomCache(cache_key = '', callback = async () => { }, cache_time = 600, refresh = false, cache_all = false) {
    let data = await getCustomCache(cache_key)
    if (data && !refresh) return data == 'NO_DATA' ? null : data
    data = await callback()
    if (cache_all) setCustomCache(data || 'NO_DATA', cache_key, cache_time)
    else {
        if (data) setCustomCache(data, cache_key, cache_time)
    }
    return data
}
/**
 * 最大并发锁，需设置最大等待时间，以及最大并发量
 * @param {string} [lock_key=''] redis等待锁的key值
 * @param {number} [concurrency=3] 最大并发量，默认3
 * @param {() => Promise<void>} [callback=async () => { }] 遇到锁等待执行的函数
 * @param {number} [max_wait_time=10] 最大等待时间，单位秒
 * @param {number} [sleep_time=500] 间隔查询锁的时间，单位毫秒，必须max_wait_time > sleep_time,且sleep_time>100
 * @param {boolean} [random_wait=false] 是否随机等待，等待时间为0<n<sleep_time之间的整数
 * @param {number} [lock_time=600] 默认的锁时间，单位秒,可根据函数执行时间进行延长
 * @param {number} [start_time=timestampSec()] 锁开始执行时刻，不可更改
 * @returns
 */
async function getCountWaitLock(lock_key = '', concurrency = 3, callback = async () => { }, max_wait_time = 10, sleep_time = 500, random_wait = false, start_time = timestampSec()) {
    if (!lock_key) return Promise.reject("数据锁元数据不存在！");
    if (timestampSec() - start_time > max_wait_time) return Promise.reject("等待超时，请稍后重试！");
    let [has_set, count] = await getRedisClient().multi().set(lock_key, 0, { NX: true, }).incrBy(lock_key, 1).exec()
    // console.log(has_set, count);
    if (count <= concurrency) {
        return await callback().finally(async () => {
            let [diff_count] = await getRedisClient().multi().decrBy(lock_key, 1).exec() //释放一个子进程数量
            // console.log('diff_count', diff_count);
        })
    }
    await getRedisClient().multi().decrBy(lock_key, 1).exec()
    if (random_wait) await sleep(Math.floor(Math.random() * (sleep_time - 100) + 100))
    else await sleep(sleep_time)
    return await getCountWaitLock(lock_key, concurrency, callback, max_wait_time, sleep_time, random_wait, start_time)
}
module.exports = {
    setKey, getReqUniqueKey, getKey, setNEXKey, getNEXKey, getRedisClient, setSession, useCustomCache, getCountWaitLock,
    getSession, getCustomCache, setCustomCache, delCustomCache, removeSession, delKeys, getLock, getDataLock, releaseLock, getWaitLock
}