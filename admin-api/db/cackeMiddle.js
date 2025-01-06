const { getReqUniqueKey, getKey, setKey } = require("./redis")
function getPath(req) {
    let path = String(req.baseUrl + req.path)
    return path.substring(1).replace(/\//g, '_')
}
async function caches(req, res, next) {
    let path = getPath(req)
    let key = getReqUniqueKey(req).replace('PATH', path)
    req.redis_cache = true
    req.redis_key = key
    await getKey(req.redis_key).then(data => {
        if (process.env.NODE_ENV == "production" && data) return res.send(data)
        next()
    }).catch(err => {
        console.log('查询Redis缓存异常！', err);
        next()
    })
}
async function setCaches(req, data) {
    let { redis_key, redis_cache } = req || {}
    if (redis_cache) await setKey(redis_key, data).catch(err => {
        console.log('写入Redis缓存异常！', err);
    })
    return data
}
module.exports = {
    caches,
    setCaches
}