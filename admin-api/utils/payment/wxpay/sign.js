const crypto = require('crypto');
const fs = require("fs")
const path = require('path');
const { cert_path } = require("../../../config")
//serial_no 7A1D3A537FF26140CEE04B7626762225D68C3EEA

function encodeSign(data = '') {
    try {
        let cert = fs.readFileSync(path.join(cert_path, './apiclient_key.pem')); //私钥
        let hash = crypto.createSign('RSA-SHA256').update(data).sign(cert, "hex")
        return Buffer.from(hash).toString('base64')
    } catch (error) {
        console.log(error);
        throw '签名生成失败！'
    }

}
//
function decodeSign(signature = '', str = '') {
    try {
        signature = Buffer.from(signature, 'base64').toString()
        // console.log(signature);
        let cert = fs.readFileSync(path.join(cert_path, './wx_public_key.pem')); //公钥
        let verify = crypto.createVerify('RSA-SHA256').update(str).verify(cert, signature, 'hex')
        if (!verify) throw '签名验证失败！'
        return verify
    } catch (error) {
        console.log(error);
        throw '签名验证失败！'
    }

}
module.exports = {
    encodeSign,
    decodeSign
}
// let sign_str = encodeSign('dhehd')
// console.log(sign_str);
// decodeSign(sign_str, 'dhehd')
// console.log();