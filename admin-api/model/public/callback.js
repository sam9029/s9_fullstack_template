const knex = require("../../db/knexManager").knexProxy;
const { xunfeiStatus } = require("../applet/create/tools")
const { aliCallBack } = require("../../utils/payment/alipay/api")
const { wxpayCallback } = require("../../utils/payment/wxpay/api")
const { applePayCallback } = require("../../utils/payment/apple/api")
// const { getOAPublishStatus } = require("../public/drama/index")
const { douyinAutoPublish } = require("../oauth/douyin/index")
// const { callbackPaymentResults } = require("../duolai/tools")
const { xingtuAuthCallback, getXingtuToken } = require("../oauth/xingtu/index");
const { callbackGetResult } = require("../oauth/aliyun");
// const { upload_callback } = require('../channel/creation/upload')



// 讯飞回调更新任务状态
exports.xunfei = async (query) => {
    return await xunfeiStatus(query)
};
// 苹果退款通知
exports.apple = async (body = {}, headers = {}) => {
    // return await xunfeiStatus(query)
    return { code: 0, data: await applePayCallback(body, headers) }
};
// 微信支付回调
exports.wxpay = async (body, headers) => {
    return await wxpayCallback(body, headers)
};
// 支付宝回调
exports.alipay = async (body) => {
    return await aliCallBack(body)
};
// 星图授权回调
exports.xingtu = async (body) => {
    return await xingtuAuthCallback(body)
};
// 星图token
exports.xingtuToken = async (body) => {
    let { token, advertiser_id } = body
    if (token != 'qwertyuiopasdfghjkl') return Promise.reject('请求线上token错误！')
    return { code: 0, data: await getXingtuToken(advertiser_id) }
};
exports.wechat = async (query, body, header) => {
    let { echostr } = query
    console.log('微信发布回调：', JSON.stringify(body));
    await getOAPublishStatus(body)
    // console.log(query);
    return echostr || 'message_get'
};
// 抖音的消息订阅服务
exports.douyin = async (body, header) => {
    let { event, content, from_user_id } = body
    if (event == 'verify_webhook') return content
    let retu = { code: 0, data: 'success', }
    switch (event) {
        case 'create_video':
            douyinAutoPublish(content, from_user_id).catch(err => {
                console.log(err);
            })
            break;

        default:
            break;
    }
    // console.log('抖音异步回调：', JSON.stringify(body));
    // console.log(query);
    return retu
};

// 多来看点支付回调
exports.duolai = async (req) => {
    let other_info = await callbackPaymentResults(req)
    return { code: 0, data: 'success', result: 1, ...other_info }
};

/**
 * 阿里实名认证
 * @param {*} req 
 * @returns 
 */
exports.ali_auth = async (req) => {
    return await callbackGetResult(req.query)
};

// 多来看点文件上传回调
exports.duolai_upload = async (req) => {
    let other_info = req.body
    await upload_callback(other_info)
    return { code: 0, data: other_info }
};