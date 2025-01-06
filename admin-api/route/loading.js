const { RK_REQUEST_LOADING } = require("../config/redis_key");
const { getRedisClient, getCustomCache, setCustomCache } = require("../db/redis")

/**
 * @typedef { import("express").RequestHandler } RequestHandler
 */

/**@type { RequestHandler } */
async function use_loading(req, res, next) {
  const req_path = req.path;
  const key = RK_REQUEST_LOADING + ':' + req_path;
  await loading_handler(req, res, next, key);
}


function use_key_loading(identify) {
  return async function(req, res, next) {
    let key = identify;
    if (!key) {
      const req_path = req.path;
      key = RK_REQUEST_LOADING + ':' + req_path
    }
    return await loading_handler(req, res, next, key);
  }
}

async function loading_handler(req, res, next, key) {
  req._$loading_key = key;
  try {
    const lock = await getRedisClient().set(key, 'LOCKED', { EX: 600, NX: true });
    if (!lock) {
      res.status(200).send({ code: 1, message: "请求正在处理中，请稍后再试。" });
    } else {
      next()
    }
  } catch(err) {
    delete req._$loading_key;
    res.status(200).send({ code: 1, message: "请求排队处理异常，请反馈相关人员进行处理。" });
  }
}

module.exports = {
  use_loading,
  use_key_loading,
}