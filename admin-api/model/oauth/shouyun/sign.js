const crypto = require('crypto');
const querystring = require('querystring');
const { getUuid } = require("../../../utils/tools")
const ak = 'noneKey';
const accessKeySecret = 'noneKey';


// UTF-8 编码字符集按照 RFC3986 规则进行编码
function percentEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/%7E/g, '~')
        .replace(/\+/g, '%20')
        .replace(/\*/g, '%2A')
        .replace(/%20/g, '+');
}

function getSignature(action, method, param = {}, url = apiUrl) {
    // 获取当前时间戳
    let timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    // 构造公共请求参数
    const D = {
        Action: action,
        AccessKeyId: ak,
        SignatureMethod: 'HMAC-SHA1',
        SignatureNonce: getUuid(),
        SignatureVersion: '1.0',
        Timestamp: timestamp,
        Version: '2019-08-08',
        ...param,
    };

    // 对参数进行排序并编码
    const sortedD = Object.keys(D).sort().reduce((acc, key) => {
        acc[key] = D[key];
        return acc;
    }, {});

    // 构造规范化请求字符串
    let canstring = '';
    for (const [key, value] of Object.entries(sortedD)) {
        canstring += `&${percentEncode(key)}=${percentEncode(value.toString())}`;
    }

    // 构造待签名字符串
    let stringToSign = `${method}&%2F&${percentEncode(canstring.slice(1))}`;
    // 计算签名
    const hmac = crypto.createHmac('sha1', accessKeySecret);
    const signature = hmac.update(stringToSign).digest('base64');
    // 将签名添加到请求参数中
    D.Signature = signature;

    // 构造最终请求的 URL
    const finalUrl = `${url}/?${querystring.stringify(D)}`;

    return finalUrl
}




module.exports = {
    getSignature
}
