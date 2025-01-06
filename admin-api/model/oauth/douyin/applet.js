const { getCountWaitLock, getWaitLock, getCustomCache, setCustomCache } = require("../../../db/redis")
const { RK_DUOLAI_LOGIN_NUM_LOCK, RK_DLKD_TOKEN_LOCK, RK_DLKD_TOKEN } = require("../../../config/redis_key")
const { DUOLAI_ORDERS, DUOLAI_APPLET } = require("../../../config/setting")
const { kuaishou_auth, production_url } = require("../../../config/index")
const { getAppletToken: getToken, makeDYOrder, getOpenId, getOnlineToken, pushDYOrder, queryCommonDYOrder, refoundCommonOrder } = require("./api")
const { getSign, checkSign, getByteAuthorization } = require("./sign")
const { checkKeys } = require("../../../utils/check_type")
const moment = require('moment')
const knex = require("../../../db/knexManager").knexProxy

const { getUuid } = require("../../../utils/tools")
// ca2544aa49de670cad3693715e38d141
// console.log(IOS_PRICE);
async function getUserOpenid(js_code = '', app_id = '') {
    const redis_key = `${RK_DUOLAI_LOGIN_NUM_LOCK}:${app_id}`
    return getCountWaitLock(redis_key, 20, async () => {
        let { app_secret } = await getAccessToken(app_id)
        let user_info = await getOpenId({ secret: app_secret, code: js_code, appid: app_id })
        if (user_info?.err_no) {
            console.log('小程序静默登录失败！：', JSON.stringify(user_info));
            return Promise.reject('用户信息获取异常！')
        }
        return user_info?.data
    }, 10, 200, true)
}
/**
 * 查询快手订单信息，app_id 和 out_order_no
 * @param {*} data 
 * @returns 订单信息
 */
async function queryOrder(data, biz_type, refund_amount) {
    let check_data = checkKeys(data, ['out_order_no', 'app_id', 'create_time', 'video_ids?', 'collection_id?'])
    let send_data = { ...check_data, }
    delete send_data.create_time
    // send_data.sign = getSign(send_data)
    // console.log(access_token, data.app_id);
    let { access_token } = await getAccessToken(data.app_id)
    let order_info = await queryCommonDYOrder({ out_order_no: check_data.out_order_no }, access_token)
    // console.log(order_info);
    if (order_info?.err_no) return Promise.reject(order_info?.err_msg || '订单信息获取异常！')

    // 订单状态为已支付时，需要自动提交结算，但支付时间设置为3天
    // console.log(settle_data);
    // if (order_info?.payment_info?.order_status == 'SUCCESS') {
    //     let video_ids = JSON.parse(check_data?.video_ids || '[]')
    //     let { access_token } = await getAccessToken(data.app_id)
    //     let settle_data = {
    //         app_id: data.app_id,
    //         access_token,
    //         app_name: 'douyin',
    //         order_type: 0,
    //         out_order_no: check_data?.out_order_no,
    //         open_id: data.open_id,
    //         update_time: moment().unix(),
    //         order_status: 4,
    //         order_detail: JSON.stringify({
    //             order_id: check_data?.out_order_no,
    //             create_time: moment(check_data?.create_time).valueOf(),
    //             status: '已核销',
    //             amount: video_ids?.length,
    //             total_price: order_info?.payment_info?.total_fee,
    //             detail_url: "pagesUser/order/index",
    //             item_list: [{
    //                 item_code: String(check_data.collection_id),
    //                 img: 'https://koc-img.domain.cn/duolai/duolai.png',
    //                 title: "剧集观看解锁",
    //                 amount: video_ids?.length,
    //                 price: order_info?.payment_info?.total_fee
    //             }]
    //         }),
    //     }
    //     // console.log(settle_data);
    //     pushDYOrder(settle_data).then(res => {
    //         if (res?.err_code) console.log(res?.err_msg || '订单核销异常！')
    //     }).catch(err => {
    //         console.log(err);
    //     })
    // }

    // return { out_order_no: send_data.out_order_no, ...(order_info?.order_info || {}) }
    return formatOrder({ ...(order_info?.data || {}) }, biz_type, data, refund_amount)
}
const TT_STATUS_MAPPER = {
    TIMEOUT: 1,
    PROCESS: 1,
    FAILED: 1,
    SUCCESS: 2,
    REFUND: 3,
}
const PAYPLATFORM_MAPPER = {
    1: "WXPAY",
    2: "ALIPAY",
    10: "TTPAY",
    20: "DIAMOND",
}
function formatOrder(order_info = {}, biz_type, unified_order_info = {}, refund_amount) {
    let data = {}
    let keys = ['pay_status', 'pay_channel', 'order_id', 'pay_time', 'total_amount']
    keys.forEach(key => {
        switch (key) {
            case 'pay_status':
                if (order_info[key]) data.pay_status = TT_STATUS_MAPPER[order_info[key]] || 9
                if (biz_type == 'REFUND') {
                    data.pay_status = 3
                    if (refund_amount) data.refund_amount = refund_amount
                    data.refund_time = moment().format('YYYY-MM-DD HH:mm:ss')
                    data.refund_date = moment().format('YYYY-MM-DD')
                }
                if (unified_order_info?.pay_status == 3) data.pay_status = 3
                break;
            case 'pay_channel':
                if (order_info[key] && PAYPLATFORM_MAPPER[order_info[key]]) data.pay_platform = PAYPLATFORM_MAPPER[order_info[key]]
                break;
            case 'order_id':
                if (order_info[key]) data.transaction_id = order_info[key]
                break;
            case 'pay_time':
                if (order_info[key]) {
                    data.pay_time = moment(order_info[key]).format('YYYY-MM-DD HH:mm:ss')
                    data.pay_date = moment(data.pay_time).format('YYYY-MM-DD')
                }
                break;
            case 'total_amount':
                if (order_info[key]) {
                    if (order_info.currency == 'DIAMOND') {
                        data.total_amount = order_info[key]
                        data.payer_total_amount = order_info[key]
                        data.diamond_num = order_info['total_currency_amount'] || 0
                    } else {
                        data.total_amount = order_info[key]
                        data.payer_total_amount = order_info[key]
                    }
                }
                break;
            default:
                break;
        }
    })
    if (order_info) data.other_info = JSON.stringify(order_info)
    if (Object.keys(data)?.length) return data
    return null
}
/**
 * @typedef {Object} video_info
 * @property {Number} [account_id] 视频的制作达人ID
 * @property {Array} [video_ids] 视频ID数组
 * @property {Number} [collection_id] 合集ID
 * @property {String} [name] 名称
 * @property {Number} [price] 总价
 * @property {Number} [copyright_id] 
 */
/**
 * 获取快手预支付接口
 * @param {*} data 支付信息 'open_id', 'total_amount', 'detail', 'attach?', 'detail'
 * @param {video_info} video_info 
 */
async function makeOrder(data, system = 'AND', system_rate = null, video_info = {}, currency = 'CNY') {
    let check_data = checkKeys(data, ['open_id', 'total_amount', 'detail', 'attach?', 'out_order_no'])
    // 通用行业交易参数返回
    return GeneralIndustryTransactions(data, video_info, currency, system)
    /* let send_data = {
        out_order_no: check_data.out_order_no,
        total_amount: check_data.total_amount,
        subject: check_data.detail,
        valid_time: 1800,
        notify_url: `${production_url}/public/callback/duolai_pay/toutiao`,
        body: "剧集观看解锁", //商品名称或者商品描述简介，建议长度在10个汉字以内，在收银台页面、支付账单中供用户查看使用
        app_id: data.app_id,
        // cp_extra: '',//开发者自定义字段，回调原样回传.
        nonce: getUuid()

    }
    send_data.sign = getSign({ ...send_data, app_id: data.app_id })
    // console.log(send_data);
    let order_info = await makeDYOrder(send_data)
    // console.log(order_info);
    if (order_info?.err_no) return Promise.reject(order_info?.err_tips || '订单信息获取异常！')
    return { out_order_no: send_data.out_order_no, ...(order_info?.data || {}), total_amount: send_data.user_pay_amount || send_data.total_amount } */

}
/**
 * 通用交易系统
 * @param {*} data 支付信息 'open_id', 'total_amount', 'detail', 'attach?', 'detail'
 * @param {video_info} video_info 
 */
async function GeneralIndustryTransactions(check_data = {}, video_info = {}, currency = 'CNY', system) {
    let back_info = {
        skuList: [{
            skuId: String(video_info.collection_id),
            price: check_data.total_amount,
            quantity: 1, //video_info?.video_ids?.length || 
            title: `${String(video_info.name).substring(0, 30)}(剧集解锁)`,
            imageList: ['https://koc-img.domain.cn/duolai/duolai.png'],
            type: 401,
            tagGroupId: "tag_group_7272625659888041996",
            entrySchema: {
                path: "play/index",
                params: JSON.stringify({ collection_id: video_info.collection_id })
            }
        }],
        outOrderNo: check_data.out_order_no,
        totalAmount: check_data.total_amount,
        payExpireSeconds: 1800,
        payNotifyUrl: `${production_url}/public/callback/duolai_pay/toutiao`,
        orderEntrySchema: {
            path: "pagesUser/order/index"
        }
    }
    let diamond_num = 0
    if (system == 'IOS' && currency == 'DIAMOND') {
        diamond_num = Math.ceil(check_data.total_amount / 10) // 钻石金额和支付金额比为1:10,向上取整
        back_info.currency = currency // IOS使用钻石支付
        check_data.total_amount = diamond_num * 10
        back_info.totalAmount = diamond_num
        back_info.skuList[0].price = diamond_num
    }
    back_info = JSON.stringify(back_info)
    let byteAuthorization = getByteAuthorization(back_info, check_data.app_id, getUuid())
    return { data: back_info, byteAuthorization, out_order_no: check_data.out_order_no, total_amount: check_data.total_amount, sleep_time: 5000 }
}
/**
 * 获取要支付的总金额
 * @param {*} total_amount 总金额
 * @param {*} system 操作系统
 * @param {*} system_rate 平台费率
 */
function get_pay_price(total_amount = 0, system, system_rate) {
    return total_amount
}
/**
 * 
 * @param {*} app_id 获取token的APPID
 * @param {*} refresh 是否强制刷新，默认false
 * @returns 
 */
async function getAccessToken(app_id = '', trx = knex, refresh = false) {
    if (!app_id) return Promise.reject('app_id不存在！')
    const lock_key = `${RK_DLKD_TOKEN_LOCK}:${app_id}`
    const redis_key = `${RK_DLKD_TOKEN}:${app_id}`
    let token_info = await getCustomCache(redis_key)
    if (token_info && !refresh) return token_info
    return await getWaitLock(lock_key, async () => {
        token_info = await getCustomCache(redis_key)
        if (token_info) return token_info
        let secrt = (await trx(DUOLAI_APPLET).select('secret').where('app_id', app_id).limit(1))[0]?.secret
        if (!secrt) return Promise.reject('app_id错误或不存在！')
        token_info = process.env.NODE_ENV != "production" ? await getOnlineToken({ app_id, provider: 'toutiao' }) : await getToken({ client_key: app_id, client_secret: secrt, grant_type: 'client_credential' })
        if (!token_info?.data) return Promise.reject('access_token获取异常！')
        token_info = token_info.data
        if (!token_info?.access_token) return Promise.reject('access_token获取异常！')
        token_info.app_secret = secrt
        await setCustomCache(token_info, redis_key, token_info?.expires_in ? (token_info.expires_in - 800) : 600)
        return token_info
    }, 5, 300)
}
/**
 * 
 */
async function verifyDYSign(body, header, query) {
    let order_info = await checkSign(body, header, query)
    // console.log(order_info);
    if (body?.type == 'refund') {
        order_info.out_order_no = order_info.out_refund_no
        if (order_info.currency == 'DIAMOND' && order_info.refund_total_amount) order_info.refund_total_amount = order_info.refund_total_amount * 10
    }
    return {
        err_no: 0, err_tips: 'success',
        out_order_no: order_info?.out_order_no,
        biz_type: body?.type ? String(body.type).toLocaleUpperCase() : null,
        refund_amount: order_info?.refund_total_amount || null
    }
}

// queryOrder({ app_id: 'tt839df5201ca3d79a01', out_order_no: "XGDL-2024092400005983", create_time: "2024-04-09 13:39:50" }).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(err);

// })
// getUserOpenid('0F937BAD7C841D260C5DAFCACE3288FB4D27091A7CAF4A02F0E876A8EFC968C0','ks700309742348504087')
// getAccessToken('tt5b4d2df0c47bdd2201').then(res=>{
//     console.log(res);
// })
/**
 * 用户退款逻辑 'out_order_no', 'app_id', 'transaction_id', 'total_amount'
 * @param {*} data 
 */
async function refoundOrders(data = {}) {
    let { out_order_no, app_id, transaction_id, total_amount, refound_amount, currency } = checkKeys(data, ['out_order_no', 'app_id', 'transaction_id', 'total_amount', 'refound_amount', 'currency'])
    let { access_token } = await getAccessToken(data.app_id)
    let send_data = {
        out_refund_no: out_order_no,
        order_id: transaction_id,
        // refund_all: true,
        refund_total_amount: refound_amount, // 定义退款金额
        order_entry_schema: {
            path: "pagesUser/order/index"
        },
        // cp_extra:'', //开发者自定义字段，回调原样回传
        notify_url: `${production_url}/public/callback/duolai_refound/toutiao/${app_id}`,
        refund_reason: [{ code: 101, text: "不想要了" }]
    }
    if (total_amount && total_amount == refound_amount) send_data.refund_all = true
    if (!send_data.refund_all) {
        send_data.item_order_detail = [{ item_order_id: transaction_id, refund_amount: refound_amount }]
    }
    if (currency == 'DIAMOND') send_data.currency = currency
    let refound_info = await refoundCommonOrder(send_data, access_token)
    // console.log(refound_info);
    if (refound_info?.err_no) return Promise.reject(refound_info?.err_msg || '订单退款异常！')
    // { data: { refund_id: 'motb74006632519625792387581' }}
    // console.log(refound_info);
    return refound_info.data.refund_id
}
module.exports = {
    getAccessToken,
    makeOrder,
    getUserOpenid,
    queryOrder,
    verifyDYSign,
    get_pay_price,
    refoundOrders
}