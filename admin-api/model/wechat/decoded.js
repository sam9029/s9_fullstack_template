const crypto = require('crypto')
function decryptData(sessionKey, encryptedData, iv, appId) {
    // sessionKey = crypto.Base64
    sessionKey = Buffer.from(sessionKey, 'base64')
    encryptedData = Buffer.from(encryptedData, 'base64')
    iv = Buffer.from(iv, 'base64')
    let decoded = {}
    try {
        // 解密
        const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
        // 设置自动 padding 为 true，删除填充补位
        decipher.setAutoPadding(true)
        decoded = decipher.update(encryptedData, '', 'utf8')
        decoded += decipher.final('utf8')
        decoded = JSON.parse(decoded)

    } catch (err) {
        console.log(err);
        throw new Error('Illegal Buffer')
    }
    if (appId && decoded.watermark.appid !== appId) throw new Error('Illegal Buffer')
    return decoded

}

module.exports = decryptData
