const knex = require("../../db/knexManager").knexProxy;
const { MESSAGE_SUBSCRIPT, ACTINFO_TABLE } = require("../../config/setting")
const { wechat_tempid_mapper, system_account_id } = require("../../config/index")
const { getToken } = require("./token")
const { add: addSystemMessage } = require("../public/message/index")
const { sendWechatMessage } = require("./api")
const TEMPLATE_MAPPER = {
    'VTIju9TGM4Udq8SXbby0ew4Bcim5TQd65oAsoigakgc': { //提现审核通知
        '提现账号': 'thing9',
        '提现状态': 'phrase6',
        '提现金额': 'amount3',
        '处理时间': 'date2',
        '备注': 'thing5',
    },
    'gwYncwjxiJr4BtIYBJqym9s3aiirBnqw3LFCP-JDngU': { //提现成功通知
        '提现产品': 'thing7',
        '提现时间': 'date3',
        '提现金额': 'amount6',
        '到账时间': 'time9',
        '备注': 'thing8',
    },
    'oAMc9heyJ_lwmBF4OM8g8URLxhjoF71_Sa7DnJyVyEI': { //活动奖励通知
        '奖励内容': 'thing4',
        '活动名称': 'thing6',
        '到账时间': 'time2',
        '备注': 'thing5',
    }
}
// {
//     "type": 3,
//     "receiver_user_ids": [item.account_id],
//     "advertiser_type": item.advertiser_type,
//     "sender_user_id": system_account_id,
//     "sub_type": 301,
//     "message": {
//         "date": jump_date,
//         "income": '¥' + item.income
//     },
//     "path": `/pageData/data?advertiser_type=${item.advertiser_type}&new_income_date=${jump_date}`
// }
function getMessage(template_id = '', send_data = {}, openid = '', page = '') {
    if (!template_id || !openid || !send_data) return
    let m_obj = TEMPLATE_MAPPER[template_id]
    if (!m_obj) return
    let data = {
        touser: openid,
        page,
        lang: 'zh_CN',
        data: {},
        template_id: template_id,
        miniprogram_state: "formal"
    }
    let message = {}
    Object.keys(m_obj).forEach(key => {
        let m_key = m_obj[key]
        message[m_key] = { value: send_data[m_key] || '' }
    })
    data.data = message
    if (!page) delete data.page
    return data
}
async function getOpenIdMapper(data = []) {
    let info = await knex.select('acf.wechat_openid as openid', 'acf.account_id', 'msc.cashout_status', 'msc.applove_status', 'msc.cashout_success')
        .from(`${ACTINFO_TABLE} as acf`)
        .leftJoin(`${MESSAGE_SUBSCRIPT} as msc`, 'msc.account_id', 'acf.account_id')
        .whereIn('acf.account_id', data.map(i => i.account_id))
    let mapper = {}
    info.forEach(element => {
        mapper[element.account_id] = element
    });
    return mapper
}
async function pushMessage(data = {}, access_token = '') {
    let { account_id, template_type } = data
    if (!account_id) return
    let back = await sendWechatMessage(data, access_token)
    if (back && back.errcode) {
        return console.log('消息订阅发送失败:', back.errmsg);
    }
    if (template_type) {
        await knex(MESSAGE_SUBSCRIPT).decrement(template_type, 1)
            .where({ account_id })
            .where(template_type, '>', 0)
    }
}
async function sendMessage(data = [], userInfo = {}) {
    if (!data || !data.length) return Promise.reject('未设置消息列表！')
    // if (!template_id) return Promise.reject('消息类型错误！')
    let openid_mapper = await getOpenIdMapper(data)
    let messages = []
    let system_msg = []
    let sub_type_mapper = {
        'cashout_success': 403,
        'cashout_status': 402,
        'activity_reword': 404 //活动奖励
    }
    data.forEach(item => {
        let { account_id, template_type, advertiser_type } = item
        let template_id = wechat_tempid_mapper[template_type]
        let info_item = openid_mapper[account_id] || {}
        let page = `pageData/bankRecord?id=${item.id}`
        let sub_type = sub_type_mapper[template_type]
        if (sub_type) system_msg.push({
            type: 4,
            receiver_user_ids: [account_id],
            sub_type,
            advertiser_type,
            message: item,
            sender_user_id: system_account_id,
            path: `/${page}`
        })
        // console.log(openid_mapper);
        // {openid,cashout_status,cashout_success}
        if (template_id && info_item.openid) { //&& info_item[template_type] > 0
            let new_item = JSON.parse(JSON.stringify(item))
            // if (new_item.thing9) new_item.thing9 = new_item.bank_sort_num || '0000'
            let message_item = getMessage(template_id, new_item, info_item.openid, page)
            message_item && messages.push({ ...message_item, account_id, template_type })
        }
    })
    if (system_msg.length) Promise.all(system_msg.map(item => addSystemMessage(item, userInfo))).catch(err => {
        console.log('系统消息发送失败！', err);
    })
    // console.log(messages);
    if (!messages.length) return
    let { access_token } = await getToken()
    for (let index = 0; index < messages.length; index++) {
        const element = messages[index];
        await pushMessage(element, access_token)
    }
}
module.exports = {
    sendMessage
}
let send_data = [{
    id: 56,//提现记录ID,
    account_id: 10010107,
    template_type: 'cashout_success',
    thing7: '番茄小说项目',
    date3: '2022-08-15',
    amount6: '￥1200',
    time9: '2022-09-15',
    thing8: '提现已到账成功，请及时查收！'
}, {
    id: 56,//提现记录ID,
    account_id: 10010107,
    template_type: 'cashout_status',
    thing9: '招商银行（4578）',
    phrase6: '提现失败',
    amount3: '￥1200',
    date2: '2022-09-15',
    thing5: '提现已到账成功，请及时查收！'
}]
// sendMessage(send_data).then(res => {

// })
