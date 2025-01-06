const { isNumber } = require('lodash')
const { access_user } = require('./marking')
function errorFormat(error) {
    let evn = process.env.NODE_ENV || 'dev'
    let isSql = null
    if (error && error.sqlMessage) isSql = error.sqlMessage
    let code = isNumber(error?.code) ? (error.code || 1) : 1
    // console.log(error);
    let message = String(error?.message || error || '未知异常')
    let back = {
        code: code,
        message: formatMessage(message, isSql)
    }
    if (evn == 'dev') back.raw_message = message
    if (access_user.includes(this?.req?.$user?.id)) back.raw_message = message
    if (this && this.req) {
        console.log(message, this.req?.path);
    }
    return back

}
function formatMessage(message, isSql = null) {
    let message_str = (message || '未知异常').toUpperCase()
    if (isSql) {
        if (isSql.indexOf('Duplicate entry') != -1) return '已存在相同数据，操作失败！'
        if (message_str.indexOf('OSS') != -1) return '后台服务异常(OSS)，请稍后重试'
    }
    if (message_str.indexOf('SQL') != -1 || isSql) return '后台服务异常(SQL)，请反馈技术'
    if (message_str.indexOf('OSS') != -1) return '后台服务异常(OSS)，请稍后重试'
    if (message_str.indexOf('REFRESH_TOKEN') != -1) return '后台服务异常(TOKEN刷新失效)'
    if (message_str.indexOf('INTERNAL SERVICE ERROR') != -1) return 'MKT服务异常，请稍后重试'
    if (message_str.indexOf('STATUS CODE 502') != -1) return '服务异常，状态码502，请稍后重试'
    if (message_str.indexOf('STATUS CODE 504') != -1) return '服务异常，状态码504，请稍后重试'
    if (message_str.indexOf('READ ECONNRESET') != -1) return "文件异常，连接重置"
    if (message_str.indexOf('WRITE ECONNRESET') != -1) return "文件异常，连接重置"
    if (message_str.indexOf('SOCKET HANG UP') != -1) return "服务繁忙，请稍后重试"
    if (message_str.indexOf('TIMEOUT OF') != -1) return "推送超时，请稍后重试"
    return message_str
}
module.exports = errorFormat