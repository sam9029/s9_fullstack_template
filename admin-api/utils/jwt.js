// 引入模块依赖
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { cert_path } = require("../config/index")
const CryptoJS = require("crypto-js");
// 创建 token 类
class Jwt {
    constructor(data) {
        this.data = data;

    }

    //生成token
    generateToken() {
        let data = this.data;
        let created = Math.floor(Date.now() / 1000);//rsa_public_key rsa_private_key
        let cert = fs.readFileSync(path.join(__dirname, './rsa_public_key.pem')); //私钥 可以自己生成
        let token = jwt.sign({
            data,
            exp: created + 60 * 60 * 24 * 7,//7天过期时间
        }, cert, {
            algorithm: 'RS256'
        });
        return token;
    }

    // 校验token
    verifyToken() {
        let token = this.data;
        let cert = fs.readFileSync(path.join(__dirname, './rsa_private_key.pem')); //公钥 可以自己生成
        let res;
        try {
            let result = jwt.verify(token, cert, {
                algorithms: ['RS256']
            }) || {};
            let {
                exp = 0
            } = result, current = Math.floor(Date.now() / 1000);
            if (current <= exp) {
                res = result.data || {};
            }
        } catch (e) {
            res = 'err';
        }
        return res;
    }
}
const crypto = require('crypto');
const algorithm = 'aes-128-cbc';
// let text = fs.readFileSync(path.join(cert_path, './receipt_data.txt'),'ascii')
// console.log(text);
// console.log(Buffer.from(text,'base64').toString('ascii'));
const config = {
    public_cert: '',
    private_cert: '',
    dx_des_key: "MNC463C0ND0I45DV",
    public_secret_key: "MNC463C0ND0I45DVMNC463C0ND0I45DV"
}
try {
    config.public_cert = fs.readFileSync(path.join(cert_path, './xgfx_public_key.pem'))
    config.private_cert = fs.readFileSync(path.join(cert_path, './xgfx_private_key.pem'))
} catch (error) {

}
/**
 * 加密 aes-256-cbc
 * @param {*} data 
 * @param {*} secretKey 
 * @returns 
 */
function encrypt(data, secretKey, iv = crypto.randomBytes(16)) {
    let text = JSON.stringify(data)
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};
/**
 * @typedef {Object} hash
 * @property  {string} [iv] iv值
 * @property  {string} [content] 加密的密文
 */
/**
 * 解密 aes-256-cbc 
 * @param {hash} hash 
 * @param {String} secretKey 密钥，长度为32位字符串
 * @returns 
 */
function decrypt(hash = {}, secretKey = config.public_secret_key) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]).toString()
    // console.log(decrpyted);
    return JSON.parse(decrpyted);
};

function encodeSign(data = '') {
    try {
        let secret = crypto.publicEncrypt(config.public_cert, Buffer.from(data)).toString('base64')
        console.log('加密内容：', secret);
        return secret
    } catch (error) {
        console.log(error);
        throw '签名生成失败！'
    }

}
//
function decodeSign(secret = '') {
    try {
        let verify = crypto.privateDecrypt(config.private_cert, Buffer.from(secret, 'base64')).toString()
        if (!verify) throw '签名验证失败！'
        // console.log('解密内容：', verify);
        return verify
    } catch (error) {
        console.log(error);
        throw '签名验证失败！'
    }

}
function encodeSignAES(data = '') {
    try {
        // const iv = crypto.randomBytes(16);
        // console.log(iv);
        const iv = Buffer.from('MNC463C0ND0I45DV', 'utf8')
        const cipher = crypto.createCipheriv(algorithm, config.dx_des_key, iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        return {
            iv: iv.toString('utf8'),
            data: encrypted.toString('base64')
            // Buffer.from().toString('base64')
        };
    } catch (error) {
        console.log(error);
        throw '签名生成失败！'
    }

}
//
function decodeSignAES(secret = '', iv = '') {
    try {
        // console.log(Buffer.from(iv, 'hex').toString('hex'));
        // secret = Buffer.from(secret, 'base64').toString('utf8')
        // console.log(secret);
        const decipher = crypto.createDecipheriv(algorithm, config.dx_des_key, Buffer.from(iv, 'utf8'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(secret, 'base64')), decipher.final()]);
        const json_str = decrpyted.toString()
        if (!json_str) throw '签名验证失败！'
        // console.log('解密内容：', json_str);
        return json_str
    } catch (error) {
        // console.log(error);
        throw '签名验证失败！'
    }

}
module.exports = {
    Jwt,
    encrypt,
    decrypt,
    encodeSign,
    decodeSign,
    encodeSignAES,
    decodeSignAES
};