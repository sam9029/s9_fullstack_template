const { md5 } = require('../../public/externalMedia/utils')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { cert_path } = require('../../../config')
let privateKeyStr = '', platformPublicKey = ''
let hyPlatformPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvyfhO3uzRv/WsX/bwfVd
iG8Vyy3AqG7EDsL87VPLTSNhthuejHODwqD2TVHwabBBVxz/ukNSRPEU2GTJTuiP
JnZwPdJHwVhmtWhGyeQuNc1SMjXejZLEIIJKdV5RRHMfnkbAMTqTM+Xb6WIjol4X
H9nymBS5OU4jCNuLzIXCMY6Kld8/NIYp7Uz7zIk147GXw4k0NhI7rrfJPcf1P4qs
+iaSdQKdGsimWk6j0HN2JWXLhqeniK9knsmRInOfD8IFDYrK+3mlOPvBtbsHM5JI
F9zGafTZizjJJ+i7o9V/dtQG1J40GmInvHoGarZFtq5lc+7L1xQP7dM/OZPHThDq
pQIDAQAB
-----END PUBLIC KEY-----
`
let fxPlatformPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzsur3Bs0fTcgyuYATwHj
9sNdaE8MFvR4Y4rDqqiZJY6sf8OmJLh3Md/ukqr8TYvyf/WKHix0q7JvReMScl60
Z50xYCPBlg5BJy+PciXHAdClSPtIw/mjKb5UTLT4neGfUbop3i+3lb+BQ7oGngfE
SxLY1q2roKRE/1XJIRK3aCG+I5l8w1FjCkcEr4PItfSv+2C5ycdSmpzJLIYGU40p
PKQr+XADi6G93TlIvepImgLXhw4MRInErhW9fMEnYZtworTCjqdQILIaSzhH6qbV
QFb/PyJM859SucW6aP4O7Rpn8b6G6b5Q+ZtVjBGnyn/Fb0s9ZNvhORXBxUR5P82P
KwIDAQAB
-----END PUBLIC KEY-----
`
let whPlatformPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1ibkq2QitiCi6iw4vfUF
iUovo5++3kUpVew7T/3xKKD3ybXgwtr7GOtOSJ+Gm58yzDDPJCZpRcMBPgwwk6zj
3BkNJMlErO71xKmDSMBVma4LhXMqZcUNDQ2b+/YAGNenQrY3/pQv/79pe8gYIXD7
Vlhf7Oi6OU15px0DhjU+/rlFNDcq7rcQd29+c5KmFPoyuc8Ozgd8y1LiMTwnMZ8M
HdQharPAq/U7LGcIG1NJm1U6xeDhNgxvyzjNHQYZGwVJuyfKFYi9DRzkerxvUEWi
757xKfEPwBusQsW8/qgghG/siXMt0Nd1l8tNUt1rloYELP39sJQDZxmZMzH+IZRb
GQIDAQAB
-----END PUBLIC KEY-----
`
let zgPlatformPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArb5+x0uTX9d+FwRKdIXZ
BRYzEyhDuTi9qGMEtOy3JbU8a4M+iee5p79m7EKCewgLcqPN0ToK1tI0Tm818eDA
AhSKDmG7FsO/OyswcGsmhnDnVG/yB2Kthc23/2hingwNQi/1TJQudxhWyrdTQfHN
VTsu23AcrwxY3OdeZSXtXNjownf2PTSGlkH21q+p0LQy55+z/4e4yZBEC9nN64uu
S/AJCIKAVfRqbarz15GOgmGgvahmficVTgW1c4nSkWCErnECnGlQc22uFbaPEimC
DkG8yPgHoHyQCPU5LhoWPCeTMrYXePhu2llTuJB1Y8IhzyaSqkwdUFS3MRjpqc3R
5wIDAQAB
-----END PUBLIC KEY-----
`
try {
    privateKeyStr = Buffer.from(fs.readFileSync(path.join(cert_path, './dy_applet_private_key.pem'))).toString()
    platformPublicKey = Buffer.from(fs.readFileSync(path.join(cert_path, './dy_applet_platform_public_key.pem'))).toString()
} catch (error) {
    console.log(error);
}

const applet_keys = {
    tt5b4d2df0c47bdd2201: { //多来看点
        keyVersion: 3,
        privateKeyStr,
        platformPublicKey,
        salt: 'oD3R3aRzWOi3hlGPlLNlLKuiRmvTOT4S6X6VbWdw'
    },
    tt839df5201ca3d79a01: { //黑岩漫故事
        keyVersion: 2,
        privateKeyStr,
        // 02a424c1b6a62956b325e081385d8a5e145de9f7
        platformPublicKey: hyPlatformPublicKey,
        salt: 'rfU6VvJPwSoj3IiYOI1ljp5p3sk6hq8MCjw6XCKx'
    },
    tt5cfc2a41c3ca3d8601: { //风行天天看点
        keyVersion: 1,
        privateKeyStr,
        platformPublicKey: fxPlatformPublicKey,
        salt: 'rIMDcwUasCS18hZYcOCRwSR3TAyF5kbS6IRUVNlm'
    },
    ttbe17c8aa2121c82101: { //万花故事会
        keyVersion: 1,
        privateKeyStr,
        platformPublicKey: whPlatformPublicKey,
        salt: 'nbanK8d3frBOaqkbHzdQINarJMjAEc5cXwcgjffx'
    },
    // ca2544aa49de670cad3693715e38d141
    ttde05a8b84133a83501: { //钟鼓故事会
        keyVersion: 1,
        privateKeyStr,
        platformPublicKey: zgPlatformPublicKey,
        salt: 'skyiBsH71zz23cuCcSPN1gQBM0EQvOAi0Ke3lPFE'
    }
}

async function checkSign(body, header, query) {
    // const { timestamp, msg, nonce, msg_signature } = body;
    const { msg } = body;
    let info = JSON.parse(msg)
    const { "byte-timestamp": timestamp, "byte-nonce-str": nonce_str, "byte-signature": signature } = header
    let verify_info = verify(JSON.stringify(body), timestamp, nonce_str, signature, info?.app_id)
    if (!verify_info) return Promise.reject('签名验证异常！')
    return info
}
function verify(http_body = '', timestamp = '', nonce_str = '', sign = '', app_id = '') {
    const data = `${timestamp}\n${nonce_str}\n${http_body}\n`;
    let { platformPublicKey: PublicKey } = applet_keys[app_id] || {}
    if (!PublicKey) throw new Error("Invalid public key");
    // 创建验证对象
    const verif = crypto.createVerify('SHA256');
    verif.update(data);
    verif.end();
    // 验证签名
    const isVerified = verif.verify(PublicKey, Buffer.from(sign, 'base64'));
    return isVerified;
}

function getSign(map) {
    let rList = [];
    for (let [k, v] of Object.entries(map)) {
        if (k === "other_settle_params" || k === "app_id" || k === "sign" || k === "thirdparty_id") {
            continue;
        }

        let value = String(v).trim();
        if (Array.isArray(v)) {
            value = arrayToStr(v);
        }

        let len = value.length;
        if (len > 1 && value[0] === '"' && value[len - 1] === '"') {
            value = value.substring(1, len - 1);
        }
        value = value.trim();
        if (value === "" || value === "null") {
            continue;
        }
        rList.push(value);
    }
    pay_salt = applet_keys[map?.app_id]?.salt || ''
    rList.push(pay_salt);
    rList.sort();
    return md5(rList.join('&'))
}

function arrayToStr(map) {
    let isMap = isArrMap(map);
    let result = "";
    if (isMap) {
        result = "map[";
    }

    let keyArr = Object.keys(map);
    if (isMap) {
        keyArr.sort();
    }

    let paramsArr = [];
    for (let k of keyArr) {
        let v = map[k];
        if (isMap) {
            if (Array.isArray(v)) {
                paramsArr.push(`${k}:${arrayToStr(v)}`);
            } else {
                paramsArr.push(`${k}:${String(v).trim()}`);
            }
        } else {
            if (Array.isArray(v)) {
                paramsArr.push(arrayToStr(v));
            } else {
                paramsArr.push(String(v).trim());
            }
        }
    }

    result = `${result}${paramsArr.join(" ")}`;
    if (!isMap) {
        result = `[${result}]`;
    } else {
        result = `${result}]`;
    }

    return result;
}

function isArrMap(map) {
    for (let k in map) {
        if (map.hasOwnProperty(k) && typeof k === 'string') {
            return true;
        }
    }
    return false;
}

function getSignature(method, url, timestamp, nonce, data, privateKey) {
    // console.log(`method: ${method}\n url: ${url}\n timestamp: ${timestamp}\n nonce: ${nonce}\n data: ${data}`);
    const targetStr = `${method}\n${url}\n${timestamp}\n${nonce}\n${data}\n`;
    const sign = crypto.createSign('SHA256');
    sign.update(targetStr);
    sign.end();
    const signature = sign.sign(privateKey, 'base64');
    return signature;
}

// 生成 byteAuthorization
function getByteAuthorization(data = '', appId = '', nonceStr = '', timestamp = new Date().getTime()) {
    // 读取私钥
    let { keyVersion, privateKeyStr: privateKey } = applet_keys[appId] || {}
    if (!privateKey) throw new Error("Invalid private key");
    // 生成签名
    const signature = getSignature("POST", "/requestOrder", timestamp, nonceStr, data, privateKey);
    if (!signature) return null;
    // 构造 byteAuthorization
    let byteAuthorization = `SHA256-RSA2048 nonce_str="${nonceStr}",timestamp="${timestamp}",key_version="${keyVersion}",appid="${appId}",signature="${signature}"`;
    return byteAuthorization
}
// getSignature('POST', '/requestOrder', 1718109350410, 'C6D3EF173181427E93F3438C7B15A71E', , privateKeyStr)
module.exports = {
    getSign,
    checkSign,
    getByteAuthorization
}