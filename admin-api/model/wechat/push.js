const { sendWechatMessage } = require("./api")
const { getToken } = require("./token")
const decryptData = require("./decoded")
const { wechat_appid, wechat_secret } = require("../../config/index")
const moment = require("moment");
const TEMPLATE_MAPPER = {
    1: {//聊天消息回复模版
        template_id: 'cD-5AAfGBg4Z7HU5aGG2D6YtCSN9ipfeZRD1pU7xpHU',
        data: {
            "thing5": {
                "value": "339208499"
            },
            "thing4": {
                "value": "2015年01月05日"
            },
            "thing3": {
                "value": "TIT创意园"
            },
            "time1": {
                "value": "广州市新港中路397号"
            }
        }
    }
}
async function sendMessage(data = {}) {
    if (!data) return Promise.reject('未设置回复的消息内容！')
    let { type } = data || {}
    if (!type) return Promise.reject('未设置回复的消息类型！')
}
module.exports = {
    sendMessage
}