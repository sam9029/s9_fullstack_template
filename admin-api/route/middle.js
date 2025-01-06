const express = require('express');
const router = express.Router();

const { getTokenUser, getDuoLaiOpenid } = require("../db/token")

//通过header  查询对应 的数据合并
async function merge(req, res, next) {
    await getTokenUser(req).then(() => {
        next()
    }).catch(err => {
        res.status(401).send({ code: 401, message: String(err.message || err || '未知错误') })
    })
}
/**
 * 多来的小程序需要强制有openid才可以访问，需要调用登录接口
 * 把openid登录后才有效
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function duolaiMiddle(req, res, next) {
    await getDuoLaiOpenid(req).then(() => {
        next()
    }).catch(err => {
        res.status(401).send({ code: 401, message: String(err.message || err || '未知错误') })
    })
}


router.all('/*', merge); // 合并数据

//通过header  查询对应 的数据合并
async function merge_option(req, res, next) {
    await getTokenUser(req).then(() => {
        next()
    }).catch(err => {
        req.$user = { is_visitor: true, id: 1, oem_id: 1, err };
        next()
    })
}

exports.router = router;
exports.mergeOption = merge_option;
exports.duolaiMiddle = duolaiMiddle;
exports.merge = merge;