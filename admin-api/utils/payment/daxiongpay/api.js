const DOMAIN = "https://open.daxiongys.com/prod-api"
const request = require("../../request")
const qs = require('qs');
// const utils = require("../../../model/public/externalMedia/utils")
const { getUuid } = require('../../tools')
const { encodeSign, makeSign, decodeSign, verifySign, getHeaders } = require("./sign")
const cooperator = "89900319848416881060"
const fs = require("fs")
const path = require('path');
const { cert_path } = require("../../../config");
const DEV_PAY_IDS = {
    levyId: '1670974993917562882',  // 代征主体id
    // bankId: '600022',  // 招商通道id
    bankId: '600014', // 平安通道id
    taskId: '1693822507630534657' // 任务id
}
const PRO__PAY_IDS = {
    // levyId: '1650763071456821249',
    levyId: '1600771492911640578', //更新为天津的代征主体ID
    // bankId: '600022',
    bankId: '600014', // 平安通道id
    taskId: '1687360858445074433'
}

const wechatPayAppId = 'wx834624da80bcd632'

function getPayIds(payType = 0) {
    if (![0, 1, 2].includes(Number(payType))) return Promise.reject('未知支付类型，获取信道id失败！')
    // let bankId = '600022'; // bankpay
    let bankId = '600014'; // bankpay
    if (payType == 1) { // alipay
        bankId = '600019'
    } else if (payType == 2) { // wechatpay
        bankId = '600023'
    }
    let payIds = process.env.NODE_ENV == "production" ? PRO__PAY_IDS : DEV_PAY_IDS;
    payIds.bankId = bankId;
    return payIds
}

function getParamsConfig(body = {}, funCode) {
    let reqData = encodeSign(JSON.stringify(body))
    // decodeSign(reqData)
    let sign = makeSign(reqData)
    // if(verifySign(sign, reqData)) console.log('签名验证成功');
    let back = {
        reqId: getUuid(),
        funCode,
        cooperator,
        version: "V1.0",
        reqData,
        sign
    }
    // console.log(back);
    return back
}
async function userMakeSign(data = {}, path = '/openapi/v1/soho/register') {
    // data = getParamsConfig(data, funCode)
    let back = await request({
        url: `${DOMAIN}${path}`,
        method: 'POST',
        headers: getHeaders(data, 'POST', path),
        no_need_retry: true,
        data
    })
    // console.log(back);
    if (!['0', '32003', '32008'].includes(back?.code)) return Promise.reject(back?.msg || '签约失败！')
    return back
}
//用户签约
async function userMakeSignOld(data = {}, funCode) {
    data = getParamsConfig(data, funCode)
    let back = await request({
        url: `${DOMAIN}`,
        method: 'post',
        headers: {
            "Content-type": "application/json",
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        },
        no_need_retry: true,
        data
    })
    // console.log(back);
    if (back?.sign && back?.resData) verifySign(back.sign, back.resData)
    if (back?.resData) back = JSON.parse(decodeSign(back.resData))
    // console.log(back);
    if (!['0000', '6016'].includes(back?.resCode)) return Promise.reject(back?.resMsg || '签约失败！')
    return back
}
async function sendPayData(data = {}, path = '/openapi/v1/payment/batchPayment') {
    // let { totalAmt, totalCount, merchantBatchId, payItemList, payType } = data;
    // let payIds = getPayIds(payType);
    // data = { totalAmt, totalCount, merchantBatchId, payItemList, ...payIds, wechatPayAppId };
    let back = await request({
        url: `${DOMAIN}${path}`,
        method: 'POST',
        headers: getHeaders(data, 'POST', path),
        no_need_retry: true,
        data
    })
    if (!['0'].includes(back?.code)) return Promise.reject(back?.msg || '付款失败！')
    if (!back.data || !back.data.orderBatchNo) return Promise.reject('付款未返回商户批次号！')
    return back.data
}
async function sendPayDataOld(data = {}, funCode = 6001) {
    let { totalAmt, totalCount, merBatchId, payItems } = data
    data = { totalAmt, totalCount, merBatchId, merId: cooperator, wechatPayAppId, payItems }
    data = getParamsConfig(data, funCode)
    // console.log(data);
    let back = await request({
        url: `${DOMAIN}`,
        method: 'post',
        headers: {
            "Content-type": "application/json",
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        },
        no_need_retry: true,
        data
    })
    if (back?.resData) back = JSON.parse(decodeSign(back.resData));
    console.log(back);
    return back
}

async function getPayData(service_order_num = '', orderBatchNo = '', path = "/openapi/v1/payment/batchPaymentQuery") {
    let data = { merchantBatchId: service_order_num, orderBatchNo }
    // data = getParamsConfig(data)
    // console.log(data);
    let back = await request({
        url: `${DOMAIN}${path}`,
        method: 'post',
        headers: getHeaders(data, 'POST', path),
        no_need_retry: true,
        data
    })
    if (!['0'].includes(back?.code)) return Promise.reject(back?.msg || '查询付款信息失败！')
    // console.log(back)
    return back.data
}
async function getBankIds(path = "/openapi/v1/merchant/queryCorrelation") {
    // let data = { merchantBatchId: service_order_num, orderBatchNo }
    let data = getParamsConfig()
    // console.log(data);
    let back = await request({
        url: `${DOMAIN}${path}`,
        method: 'post',
        headers: getHeaders(data, 'POST', path),
        no_need_retry: true,
        data
    })
    if (!['0'].includes(back?.code)) return Promise.reject(back?.msg || '查询付款信息失败！')
    // console.log(back.data[0])
    return back.data
}
async function getPayDataOld(service_order_num = '', queryItems = [], funCode = 6002) {
    let data = { merId: cooperator, merBatchId: service_order_num }
    if (queryItems?.length) data.queryItems = queryItems
    data = getParamsConfig(data, funCode)
    // console.log(data);
    let back = await request({
        url: `${DOMAIN}`,
        method: 'post',
        headers: {
            "Content-type": "application/json",
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        },
        no_need_retry: true,
        data
    })
    if (back?.resData) back = JSON.parse(decodeSign(back.resData));
    // console.log(back)
    return back
}
async function queryMonthMoney(idCard = '', path = "/openapi/v1/soho/getSohoLimitQuery") {
    if (!idCard) return Promise.reject('请传入身份证号');
    let payIds = getPayIds();
    let data = { idCard, levyId: payIds.levyId }
    let back = await request({
        url: `${DOMAIN}${path}`,
        method: 'post',
        headers: getHeaders(data, 'POST', path),
        no_need_retry: true,
        data
    })
    if (!['0'].includes(back?.code)) return Promise.reject(back?.msg || '查询月额度失败！');
    let item = back.data;
    return item;
}

async function queryMonthMoneyOld(idCard = '', funCode = 6017) {
    if (!idCard) return Promise.reject('请传入')
    let data = { merId: cooperator, idCard }
    data = getParamsConfig(data, funCode)
    // console.log(data);
    let back = await request({
        url: `${DOMAIN}`,
        method: 'post',
        headers: {
            "Content-type": "application/json",
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        },
        no_need_retry: true,
        data
    })
    if (back?.resData) back = JSON.parse(decodeSign(back.resData));
    return back
}
module.exports = {
    userMakeSign,
    sendPayData,
    getPayData,
    queryMonthMoney,
    DOMAIN,
    getPayIds,
    wechatPayAppId
}
// userMakeSign({ name: '张锦林', cardNo: '17396983034', idCard: '513022199710194578', mobile: '17396983034', authType: 1 }, '/openapi/v1/soho/register')
// sendPayData({
//     totalAmt: 3000,
//     totalCount: 3,
//     merBatchId: getUuid(), // 商单号
//     merId: cooperator,
//     wechatPayAppId: "wx834624da80bcd632",
//     payItems: [{
//         merOrderId: getUuid(), // 订单号
//         amt: 1000,
//         payeeName: "张锦林",
//         payeeAcc: "6214838576265922",
//         idCard: "513022199710194578",
//         mobile: "17396983034",
//         paymentType: 0,
//         accType: 1,
//         payType: 0
//     }, {
//         merOrderId: getUuid(),
//         amt: 1000,
//         payeeName: "张锦林",
//         payeeAcc: "17396983034",
//         idCard: "513022199710194578",
//         mobile: "17396983034",
//         paymentType: 1,
//         accType: 1,
//         payType: 0
//     }, {
//         merOrderId: getUuid(),
//         amt: 1000,
//         payeeName: "张锦林",
//         payeeAcc: "oyp436qo6VbYLzo4bZw79E3u8Rzg",
//         idCard: "513022199710194578",
//         mobile: "17396983034",
//         paymentType: 2,
//         accType: 1,
//         payType: 0
//     }]
// }, 6001).then(res => {
//     console.log(res);
//     // console.log(getUuid());
// }).catch(err => {
//     console.log('err', err);
// })