const crypto = require('crypto');
const fs = require("fs")
const path = require('path');
const { cert_path } = require("../../../config")
const { getUuid, timestampSec } = require("../../../utils/tools")
const CryptoJS = require("crypto-js");
//serial_no 7A1D3A537FF26140CEE04B7626762225D68C3EEA
const DEV_KEY = {
    'SP-ID': '1692458022516891649', //服务商ID
    'Merchant-ID': '1692457536950702082' //商户号ID
}
const PRO_KEY = {
    'SP-ID': '1692440306031652866',
    'Merchant-ID': '1687326639830142978'
}
const DAXION_KEY = process.env.NODE_ENV == "production" ? PRO_KEY : DEV_KEY
// const config = {
//     api_key: "M5463C0ND0I4AE2ZA2FEOKRTX1MNC5DV",
//     xgfx_private_key: Buffer.from(fs.readFileSync(path.join(cert_path, './xgfx_private_key.pem')),).toString(),
//     dx_public_key: Buffer.from(fs.readFileSync(path.join(cert_path, './dx_public_key.pem'))).toString()
// }
function getHeaders(body = {}, method = '', path = '', nonce_str = '', timestamp = '',) {
    let back = {
        'Nonce-Str': nonce_str || getUuid(),
        'Timestamp': timestamp || timestampSec(),
        "Content-Type": "application/json",
        ...(process.env.NODE_ENV == "production" ? PRO_KEY : DEV_KEY)
    }
    back.Signature = makeSignSHA256(getSignStr(method, path, back.Timestamp, back['Nonce-Str'], JSON.stringify(body)))
    return back
}
function getSignStr(method, path, timestamp, nonce_str, body) {
    let str = method + '\n' + path + '\n' + timestamp + '\n' + nonce_str + '\n' + body + '\n'
    // console.log(str);
    return str
}
function makeSignSHA256(data = '') {
    try {
        let hash = crypto.createSign('RSA-SHA256').update(data).sign(config.xgfx_private_key, "base64")
        return hash
    } catch (error) {
        console.log(error);
        throw '签名生成失败！'
    }

}
function makeSign(data = '') {
    try {
        let hash = crypto.createSign('RSA-SHA1').update(data).sign(config.xgfx_private_key, "base64")
        return hash
    } catch (error) {
        console.log(error);
        throw '签名生成失败！'
    }

}
//
function verifySign(signature = '', str = '') {
    try {
        let verify = crypto.createVerify('RSA-SHA1').update(str).verify(config.dx_public_key, signature, "base64")
        if (!verify) throw '签名验证失败！'
        return verify
    } catch (error) {
        // console.log(error);
        throw '签名验证失败！'
    }

}
function encodeSign(data = '') {
    try {
        let encrypted = CryptoJS.DES.encrypt(data, CryptoJS.enc.Utf8.parse(config.api_key), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString()
        // console.log('加密内容：', encrypted);
        return encrypted
    } catch (error) {
        console.log(error);
        throw '签名生成失败！'
    }

}
//
function decodeSign(secret = '') {
    try {
        // secret = Buffer.from(secret, 'base64').toString()
        const decrypted = CryptoJS.DES.decrypt(secret, CryptoJS.enc.Utf8.parse(config.api_key), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8)
        if (!decrypted) throw '签名验证失败！'
        // console.log('解密内容：', decrypted);
        return decrypted
    } catch (error) {
        console.log(error);
        throw '签名验证失败！'
    }

}
module.exports = {
    encodeSign,
    decodeSign,
    verifySign,
    makeSign,
    getHeaders,
    DAXION_KEY
}
// console.log(getUuid());
// makeSign('123456')
// crypto.createSign('S')
// console.log(crypto.getCiphers().filter(i=>i.indexOf('RSA')!=-1));
// let sign_str = encodeSign('dhehd')
// let sign_str = '123456'
// let sign_data = makeSign(sign_str)
// console.log('签名：', sign_data);
// let sign_str = 'ZE89SVQD6JjU14goi2PfdspKjT6pIn23TyQNGJ/Xsta/4Jlx+9e/G5fs71fRxdGYLt91q1XQlpWSIvT/tRcQWnJge7kEhuOK3/upFLT6oBIxJkCTvTKIVr1s9WXvijt4s2r3fuMtY3MrFy+zEjfI+kVCitq8Xfq6ZHtNFzSFK/0HDkK76AodIROiUGQL6Yz92rLLnHPgtj/hbCwWuF9krh+7WT2dqT9qOy+jhzx+2TZmsDg1F+8SemqjHGhwiTwEeidB4y2DSpptXiET07E3SCbwak9RFyJ5k9K00dHlwWCKILOjNgNDGznEFZBM3TZ8I2AIqs55dbibCXF0kH8c0F/muuxk15KymLNnTnxqdc72Rt5MM+dJc7/wq7l4ppJ86K0cejrRRE6g2xWupAfSnw/Y7GqBLkOExouTjxHdiAze1Me18vJNygd4QDQxrNRKZ/P7jjQt4+lK/Y0EWI3HdxG7Py2o5yg4tU4r71Mm6TrUb66BlMMNHWjY5pAhCwyyYi53qrK4DO8ebhZ+1mqOUAvHY/jEFC31'
// let verify = verifySign('jCSX/PFsf37Uw36Zh0D6rFMqrnw1vG1HmZLmDV5CEvpZDYxGYtZDp09CPRRXgSsid5MpVnrP6G4ONMSk/eL4nSU27iy/LS77X+OZtmYhywomDMhCsc7cmB3zHR9wbpOTLYEXEb/re/o8X/yVo8rC1z4ZTHT9vUmqoZIQ9u0X/oM=', sign_str)
// console.log(verify);
// decodeSign("")
// console.log();