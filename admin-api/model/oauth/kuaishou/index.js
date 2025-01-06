const { getCountWaitLock, getWaitLock, getCustomCache, setCustomCache } = require("../../../db/redis")
const { RK_DUOLAI_LOGIN_NUM_LOCK, RK_DLKD_TOKEN_LOCK, RK_DLKD_TOKEN } = require("../../../config/redis_key")
const { DUOLAI_ORDERS, DUOLAI_APPLET } = require("../../../config/setting")
const { kuaishou_auth, production_url } = require("../../../config/index")
const { getToken, makeKsOrder, getOpenId, queryKsOrder, settleKsOrder,
    makeKsIosOrder, getOnlineToken, refoundKsOrder, addContent, delContent } = require("./api")
const { getSign } = require("./sign")
const { md5 } = require('../../public/externalMedia/utils')
const { checkKeys } = require("../../../utils/check_type")
const moment = require('moment')
const knex = require("../../../db/knexManager").knexProxy
const APP_IMAGE_ID_MAPPER = {
    'ks700309742348504087': '5acfa6c493ca2544aa49de670cad3693715e38d141f95974',// 多来看点
    'ks692146970159089371': '5acfa1c794c82640f41fde660cad3695775a3eda44f95972', //天天看点
    'ks712976116607639441': '5acfa3c7cdc3264ff41fde660cad6c9a775864d143fe5976',//喵星点播
    'ks674695520187268463': '5acfa696cc982140f518de660cad37c4755f3fd51ff85973',//星光漫故事
}
const IOS_PRICE = [100, 150, 180, 200, 250, 280, 300, 350, 380, 400, 450, 480, 500, 550, 580, 600, 650, 680, 700, 750, 780, 800, 850,
    880, 900, 950, 980, 990, 1000, 1080, 1100, 1180, 1200, 1280, 1300, 1380, 1400, 1480, 1500, 1580, 1600, 1680, 1700, 1780, 1800,
    1880, 1900, 1980, 1990, 2000, 2080, 2100, 2180, 2200, 2280, 2300, 2380, 2400, 2480, 2500, 2580, 2600, 2680, 2700, 2780, 2800,
    2880, 2900, 2980, 2990, 3000, 3080, 3100, 3180, 3200, 3280, 3300, 3380, 3400, 3480, 3500, 3580, 3600, 3680, 3700, 3780, 3800, 3880,
    3900, 3980, 3990, 4000, 4080, 4100, 4180, 4200, 4280, 4300, 4380, 4400, 4480, 4500, 4580, 4600, 4680, 4700, 4780, 4800, 4880, 4900,
    4980, 4990, 5000, 5080, 5100, 5180, 5200, 5280, 5300, 5380, 5400, 5480, 5500, 5580, 5600, 5680, 5700, 5780, 5800, 5880, 5900, 5980,
    5990, 6000, 6080, 6100, 6180, 6200, 6280, 6300, 6380, 6400, 6480, 6500, 6580, 6600, 6680, 6700, 6780, 6800, 6880, 6900, 6980, 6990,
    7000, 7080, 7100, 7180, 7200, 7280, 7300, 7380, 7400, 7480, 7500, 7580, 7600, 7680, 7700, 7780, 7800, 7880, 7900, 7980, 7990, 8000,
    8080, 8100, 8180, 8200, 8280, 8300, 8380, 8400, 8480, 8500, 8580, 8600, 8680, 8700, 8780, 8800, 8880, 8900, 8980, 8990, 9000, 9080,
    9100, 9180, 9200, 9280, 9300, 9380, 9400, 9480, 9500, 9580, 9600, 9680, 9700, 9780, 9800, 9880, 9900, 9980, 9990, 10000, 10100,
    10200, 10300, 10400, 10500, 10600, 10700, 10800, 10900, 11000, 11100, 11200, 11300, 11400, 11500, 11600, 11700, 11800, 11900,
    12000, 12100, 12200, 12300, 12400, 12500, 12600, 12700, 12800, 12900, 13000, 13100, 13200, 13300, 13400, 13500, 13600, 13700, 13800,
    13900, 14000, 14100, 14200, 14300, 14400, 14500, 14600, 14700, 14800, 14900, 15000, 15100, 15200, 15300, 15400, 15500, 15600, 15700,
    15800, 15900, 16000, 16100, 16200, 16300, 16400, 16500, 16600, 16700, 16800, 16900, 17000, 17100, 17200, 17300, 17400, 17500, 17600,
    17700, 17800, 17900, 18000, 18100, 18200, 18300, 18400, 18500, 18600, 18700, 18800, 18900, 19000, 19100, 19200, 19300, 19400, 19500,
    19600, 19700, 19800, 19900, 20000, 20300, 20800, 20900, 21000, 21300, 21800, 21900, 22000, 22200, 22300, 22800, 22900, 23000, 23300,
    23800, 23900, 24000, 24300, 24800, 24900, 25000, 25300, 25800, 25900, 26000, 26300, 26800, 26900, 27000, 27300, 27800, 27900, 28000,
    28300, 28800, 28900, 29000, 29300, 29800, 29900, 30000, 30300, 30800, 30900, 31000, 31300, 31800, 31900, 32000, 32300, 32800, 32900,
    33000, 33300, 33800, 33900, 34000, 34300, 34800, 34900, 35000, 35300, 35800, 35900, 36000, 36300, 36800, 36900, 37000, 37300, 37800,
    37900, 38000, 38300, 38800, 38900, 39000, 39300, 39800, 39900, 40000, 40300, 40800, 40900, 41000, 41300, 41800, 41900, 42000, 42300,
    42800, 42900, 43000, 43300, 43800, 43900, 44000, 44300, 44800, 44900, 45000, 45300, 45800, 45900, 46000, 46300, 46800, 46900, 47000,
    47300, 47800, 47900, 48000, 48300, 48800, 48900, 49000, 49300, 49800, 49900, 50000, 50800, 50900, 51800, 51900, 52000, 52800, 52900,
    53800, 53900, 54800, 54900, 55500, 55800, 55900, 56800, 56900, 57800, 57900, 58800, 58900, 59800, 59900, 60800, 60900, 61800, 61900,
    62800, 62900, 63800, 63900, 64800, 64900, 65800, 65900, 66600, 66800, 66900, 67800, 67900, 68800, 68900, 69800, 69900, 70800, 70900,
    71800, 71900, 72800, 72900, 73800, 73900, 74800, 74900, 75800, 75900, 76800, 76900, 77700, 77800, 77900, 78800, 78900, 79800, 79900,
    80800, 80900, 81800, 81900, 82800, 82900, 83800, 83900, 84800, 84900, 85800, 85900, 86800, 86900, 87800, 87900, 88800, 88900, 89800,
    89900, 90800, 90900, 91800, 91900, 92800, 92900, 93800, 93900, 94800, 94900, 95800, 95900, 96800, 96900, 97800, 97900, 98800, 98900,
    99800, 99900, 100000, 104800, 104900, 108800, 109800, 109900, 114800, 114900, 118800, 119800, 119900, 124800, 124900, 128800, 129800,
    129900, 131400, 134800, 134900, 138800, 139800, 139900, 144800, 144900, 148800, 149800, 149900, 154800, 154900, 158800, 159800, 159900,
    164800, 164900, 168800, 169800, 169900, 174800, 174900, 178800, 179800, 179900, 184800, 184900, 188800, 189800, 189900, 194800, 194900,
    198800, 199800, 199900, 204800, 204900, 208800, 209800, 209900, 214800, 214900, 218800, 219800, 219900, 224800, 224900, 228800, 229800,
    229900, 234800, 234900, 238800, 239800, 239900, 244800, 244900, 248800, 249800, 249900, 254800, 254900, 258800, 259800, 259900, 264800,
    264900, 268800, 269800, 269900, 274800, 274900, 278800, 279800, 279900, 284800, 284900, 288800, 289800, 289900, 294800, 294900, 298800,
    299800, 299900, 304800, 304900, 308800, 309800, 309900, 314800, 314900, 318800, 319800, 319900, 324800, 324900, 328800, 329800, 329900,
    334800, 334900, 338800, 339800, 339900, 344800, 344900, 348800, 349800, 349900, 354800, 354900, 358800, 359800, 359900, 364800, 364900,
    368800, 369800, 369900, 374800, 374900, 378800, 379800, 379900, 384800, 384900, 388800, 389800, 389900, 394800, 394900, 398800, 399800,
    399900, 408800, 409800, 409900, 418800, 419800, 419900, 428800, 429800, 429900, 438800, 439800, 439900, 448800, 449800, 449900, 458800,
    459800, 459900, 468800, 469800, 469900]
// console.log(IOS_PRICE);
async function getUserOpenid(js_code = '', app_id = '') {
    const redis_key = `${RK_DUOLAI_LOGIN_NUM_LOCK}:${app_id}`
    return getCountWaitLock(redis_key, 20, async () => {
        let { app_secret } = await getAccessToken(app_id)
        let user_info = await getOpenId({ app_secret, js_code, app_id })
        // console.log(user_info);
        if (user_info?.result != 1) {
            console.log('小程序静默登录失败！：', JSON.stringify(user_info));
            return Promise.reject('用户信息获取异常！')
        }
        return user_info
    }, 10, 200, true)
}
/**
 * 查询快手订单信息，app_id 和 out_order_no
 * @param {*} data 
 * @returns 订单信息
 */
async function queryOrder(data, biz_type, refund_amount) {
    let { access_token, app_secret } = await getAccessToken(data.app_id)
    let check_data = checkKeys(data, ['out_order_no', 'app_id', 'create_time'])
    let send_data = { ...check_data, }
    delete send_data.create_time
    send_data.sign = getSign({ ...send_data, app_id: data.app_id }, app_secret)
    // console.log(access_token, data.app_id);
    let order_info = await queryKsOrder(send_data, access_token)
    // console.log(order_info);
    if (order_info?.result == '10000633') return { pay_status: 1 }
    if (order_info?.result != 1) return Promise.reject(order_info?.error_msg || '用户信息获取异常！')

    // 当快手订单状态为已支付时，需要自动提交结算，但支付时间设置为3天
    // console.log(order_info?.payment_info, biz_type);
    let settle_data = {
        app_id: data.app_id,
        out_order_no: check_data?.out_order_no,
        out_biz_order_no: check_data?.out_order_no,
        open_id: order_info?.payment_info?.open_id,
        order_create_time: moment(check_data?.create_time).valueOf(),
        order_status: 11,
        order_path: "pagesUser/order/index",
        product_cover_img_id: APP_IMAGE_ID_MAPPER[data.app_id]
    }
    settle_data.sign = getSign(settle_data, app_secret)
    // console.log(settle_data);
    if (order_info?.payment_info?.pay_status == 'SUCCESS') settleKsOrder(settle_data, access_token).then(res => {
        if (res?.result != 1) console.log(res?.error_msg || '订单核销异常！')
    }).catch(err => {
        console.log(err);
    })
    // return { out_order_no: send_data.out_order_no, ...(order_info?.order_info || {}) }
    return formatOrder(order_info?.payment_info || {}, biz_type, data, refund_amount)
}
const KUAISHOU_STATUS_MAPPER = {
    TIMEOUT: 1,
    PROCESSING: 1,
    FAILED: 3,
    SUCCESS: 2,
    REFUND: 3,
}
const PAYPLATFORM_MAPPER = {
    WECHAT: "WXPAY",
    ALIPAY: "ALIPAY",
    APPLE_PAY: "APPLE"
}
function formatOrder(order_info = {}, biz_type, unified_order_info = {}, refund_amount) {
    let data = {}
    let keys = ['pay_status', 'pay_channel', 'ks_order_no', 'pay_time', 'total_amount']
    keys.forEach(key => {
        switch (key) {
            case 'pay_status':
                if (order_info[key]) data.pay_status = KUAISHOU_STATUS_MAPPER[order_info[key]] || 9
                if (biz_type == 'REFUND') {
                    data.pay_status = 3
                    if (refund_amount) data.refund_amount = refund_amount
                    data.refund_time = moment().format('YYYY-MM-DD HH:mm:ss')
                    data.refund_date = moment().format('YYYY-MM-DD')
                }
                if (unified_order_info?.pay_status == 3) data.pay_status = 3
                break;
            case 'pay_channel':
                if (order_info[key] && PAYPLATFORM_MAPPER[order_info[key]]) data.pay_platform = PAYPLATFORM_MAPPER[order_info[key]] || order_info[key]
                break;
            case 'ks_order_no':
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
                    data.total_amount = order_info[key]
                    data.payer_total_amount = order_info[key]
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
 * 获取快手预支付接口
 * @param {*} data 支付信息 'open_id', 'total_amount', 'detail', 'attach?', 'detail'
 */
async function makeOrder(data, system = 'AND', system_rate = null) {
    let { access_token, app_secret } = await getAccessToken(data.app_id)
    let { order_type } = checkKeys(data, ['order_type'])
    let check_data = checkKeys(data, ['open_id', 'total_amount', 'detail', 'attach?', 'out_order_no'])

    let send_data = {
        ...check_data,
        // out_order_no: await getOrderSn(),
        // open_id: '',
        // total_amount: 10,
        type: 1273,
        // detail: '',//商品详情。注：不可传入特殊符号、emoji 表情等，否则会影响支付成功，1汉字=2字符。
        expire_time: 1800,
        notify_url: `${production_url}/public/callback/duolai_pay/kuaishou`,
        subject: "剧集观看解锁", //商品名称或者商品描述简介，建议长度在10个汉字以内，在收银台页面、支付账单中供用户查看使用
        app_id: data.app_id,
        // attach: '',//开发者自定义字段，回调原样回传.

    }
    if (system == 'IOS') { //系统为IOS时需走快手的IAP支付
        let count_amount = get_pay_price(check_data.total_amount, system, system_rate, order_type)
        send_data = {
            out_order_no: check_data.out_order_no,
            open_id: check_data.open_id,
            expire_time: 1800,
            type: 1273,
            notify_url: `${production_url}/public/callback/duolai_pay/kuaishou`,
            refund_notify_url: `${production_url}/public/callback/duolai_pay/kuaishou`,
            subject: "剧集观看解锁", //商品名称或者商品描述简介，建议长度在10个汉字以内，在收银台页面、支付账单中供用户查看使用
            app_id: data.app_id,
            detail: check_data.detail,
            order_amount: count_amount,
            user_pay_amount: count_amount
        }
        // console.log(send_data);
    }
    send_data.sign = getSign({ ...send_data, app_id: data.app_id }, app_secret)
    // console.log(send_data);
    let order_info = system == 'IOS' ? await makeKsIosOrder(send_data, access_token) : await makeKsOrder(send_data, access_token)
    if (order_info?.result != 1) return Promise.reject(order_info?.error_msg || '用户信息获取异常！')
    // console.log(order_info);
    return { out_order_no: send_data.out_order_no, ...(order_info?.order_info || {}), total_amount: send_data.user_pay_amount || send_data.total_amount, sleep_time: 4000 }

}
/**
 * 获取要支付的总金额
 * @param {*} total_amount 总金额
 * @param {*} system 操作系统
 * @param {*} system_rate 平台费率
 */
function get_pay_price(total_amount = 0, system, system_rate, order_type = 1) {
    if (system == 'IOS') {
        if (system_rate && Number(system_rate) && order_type == 1) { //向下取整，取最近的价格梯度，仅当剧集解锁时，需要增加费率
            total_amount = Math.round(total_amount * (1 + system_rate / 10000))
        }
        let count_index = IOS_PRICE.findIndex(i => i > total_amount)
        total_amount = IOS_PRICE[count_index - 1] == total_amount ? IOS_PRICE[count_index - 1] : IOS_PRICE[count_index]
    }
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
        token_info = process.env.NODE_ENV != "production" ? (await getOnlineToken({ app_id, provider: 'kuaishou' }))?.data : await getToken({ app_id, app_secret: secrt, grant_type: 'client_credentials' })
        // console.log(token_info);
        if (token_info?.result != 1) return Promise.reject('access_token获取异常！')
        token_info.app_secret = secrt
        await setCustomCache(token_info, redis_key, token_info?.expires_in ? (token_info.expires_in - 800) : 600)
        return token_info
    }, 5, 300)
}
/**
 * 
 */
async function verifyKSSign(body, header) {
    let { app_secret } = await getAccessToken(body.app_id)
    // let app_secret = 'Xgm23lSgws235hlgK'
    let { kwaisign } = header
    let sign_str = JSON.stringify(body) + app_secret
    let sign = md5(sign_str)
    if (!kwaisign || kwaisign != sign) return Promise.reject('非快手订单回调！')
    // console.log(kwaisign, sign);
    return {
        message_id: body.message_id,
        out_order_no: body?.data?.out_order_no,
        biz_type: body?.biz_type,
        refund_amount: body?.data?.refund_amount,
    }

}

// queryOrder({ app_id: 'ks700309742348504087', out_order_no: "XGDL-2024060500001006", create_time: "2024-04-09 13:39:50" }).then(res=>{
//     console.log(res);
// })
// getUserOpenid('0F937BAD7C841D260C5DAFCACE3288FB4D27091A7CAF4A02F0E876A8EFC968C0', 'ks700309742348504087')
/**
 * 用户退款逻辑 'out_order_no', 'app_id', 'reason'
 * @param {*} params 
 */
async function refoundOrders(data = {}) {
    let { out_order_no, app_id, reason, refound_amount } = checkKeys(data, ['out_order_no', 'app_id', 'reason', 'refound_amount'])
    let { access_token, app_secret } = await getAccessToken(data.app_id)
    let send_data = {
        app_id,
        out_order_no,
        out_refund_no: out_order_no,
        reason,
        refund_amount: refound_amount, // 定义退款金额
        // attach:'', //开发者自定义字段，回调原样回传
        notify_url: `${production_url}/public/callback/duolai_refound/kuaishou/${app_id}`,
    }
    send_data.sign = getSign(send_data, app_secret)
    let refound_info = await refoundKsOrder(send_data, access_token)
    if (refound_info?.result != 1) return Promise.reject(refound_info?.error_msg || '订单退款异常！')
    // { result: 1, error_msg: 'success', refund_no: '224080800715101076926' }
    // console.log(refound_info);
    return refound_info.refund_no
}
async function syncContent(data = {}) {
    let { sync_type = 'add', app_id } = checkKeys(data, ['app_id', 'sync_type'])
    let { access_token } = await getAccessToken(app_id)    
    let back_info = { push_status: 1 }
    if (sync_type == 'add') {
        back_info.push_info = JSON.stringify(data)
        let back_data = await addContent(data, access_token).catch(err => {
            back_info.push_status = 2
            back_info.push_message = String(err?.message || err || '创建失败！')
        })
        if (back_data?.result != 1) {
            back_info.push_status = 2
            back_info.push_message = String(back_data?.error_msg || back_data || '创建失败！')
        }
        // console.log(back_data);
    } else {
        back_info.push_status = 3
        let back_data = await delContent(data, access_token).catch(err => {
            back_info.push_status = 2
            back_info.push_message = String(err?.message || err || '删除失败！')
        })
        if (back_data?.result != 1) {
            back_info.push_status = 2
            back_info.push_message = String(back_data?.error_msg || back_data || '创建失败！')
        }
        // console.log(back_data);
    }
    return back_info
}
// getAccessToken('ks674695520187268463').then(res=>console.log(res))
module.exports = {
    getAccessToken,
    makeOrder,
    getUserOpenid,
    queryOrder,
    verifyKSSign,
    get_pay_price,
    refoundOrders,
    syncContent
}