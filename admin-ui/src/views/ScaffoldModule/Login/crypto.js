/**
 * @description 加密类工具集---仅限webpack4使用, 理由见crypto引入处说明
 *
 * 加解密内容处理（对称加密AES）
 * @function encrypt 加密内容函数
 * @function decrypt 解密内容函数
 * 
 * 加解密内容处理（非对称加密RSA）
 * @function encrypt 加密内容函数
 * @function decrypt 解密内容函数
 *
 *  数字签名验证
 * @function sign 数据签名
 * @function verify 验证签名
 *
 *  MD5值
 * @function genMd5 生成MD5--不建议使用--请使用sparkMd5
 */

/**
 * package.json 没有、但是由 webpack4 自身处理并引入的了ctypto依赖模块补丁，
 * 检查其package-lock.json 可知webpack4自身引入一个 node-libs-broswer 库 ，其中包含crypto-browserify*/
const crypto = require('crypto');

//#region =====  公私钥
//
/** 随机生成 RSA 公钥和私钥对，
 * 原本准备使用 crypto.generateKeyPairSync, 但是 generateKeyPairSync 在浏览器环境不支持, 实现客户端的公私钥均不一致
 * 故而手动定制 公私钥
 */
// 默认公私钥皆为 1024 比特
const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCkn8rocvGgrx04+IBirPCnYxCq
bFEeuUTRYJARkzjD8oFjII729oC/HCj3Q8XedQ64eAZX9g7zo6G9DwUDzSM1fd7i
xNnNorYUxN7h2oHG2tboGP8heaLrQnB7SFl0Tyqm1BaWn5CDx4a4LO7GsCLUd3CY
+b7vXzevtJeRsN2CHQIDAQAB
-----END PUBLIC KEY-----`;

const privateKey = `-----BEGIN PRIVATE KEY-----
MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAKSfyuhy8aCvHTj4
gGKs8KdjEKpsUR65RNFgkBGTOMPygWMgjvb2gL8cKPdDxd51Drh4Blf2DvOjob0P
BQPNIzV93uLE2c2ithTE3uHagcba1ugY/yF5outCcHtIWXRPKqbUFpafkIPHhrgs
7sawItR3cJj5vu9fN6+0l5Gw3YIdAgMBAAECgYEAjjxB5HTrsBmc9gw/YQJrKzS8
wYK01AbfHsh/sa+x7BsrD6qh218//d8mxf0YiQw6m8eYM4e1g2xt4huICbDEKaBd
Ib1Xs5K8/0JkOlHfttB37HnqoCpnnk6BcwB9mSMXAqXSCaYTpiXWILH6zEwC2WaF
eNMSFb6QYe133X/2r0ECQQDXg6o6S6abiwj9vD7lP7MajSmRZ2ucxZSyqILs+ebZ
UJoEaR5DfHw6LMhJtlkmhv3I/XHsLkz+fGW5iigw9EXfAkEAw4zDF1o14db7Sa//
YHz+DJvuxR6AKoTnNSTqiCWjvKs44PHnNyBYBSht3JX3mQU1eP99KuJoSdhwQa5i
YBBfgwJAO0iwzxB4aFk6w/HAq3d2YVtrj+APLjT7zpmkSmQEKMuPUp9H//CCi849
2mka5QpFTcDKUdn6vBakNQHYRH8tqQJAcGi1KPJhcO4sy2IRcjzHqSXl7ogm8sot
Ql5zN0ozwlvGuYA1AnpkPqrL5HaMuvjEkUaEhCdb/b8eYJNG16Px0wJBAIOo9AW9
ak+BgsjV+gCWeep9lX4u63H6/CQBTgQRTkSpF+dqbVUEX77gkNI4QlVm0xfZJrrN
vD497GlR/A4A3Mw=
-----END PRIVATE KEY-----
`;

//#endregion

//#region ===== 加解密内容处理(RSA非对称)
/** 公钥加密 */
export function encrypt(content = null) {
  handleVaildParam([{ prop: 'content', value: content, type: 'string' }]);

  const res = crypto.publicEncrypt(publicKey, Buffer.from(content));
  const base64Text = res.toString('base64');

  return base64Text;
}

/** 私钥解密 */
export function decrypt(encryptedData = null) {
  handleVaildParam([{ prop: 'encryptedData', value: encryptedData, type: 'string' }]);

  const bufferData = Buffer.from(encryptedData, 'base64');
  const res = crypto.privateDecrypt(privateKey, bufferData).toString('utf-8');

  return res;
}
//#endregion

//#region ===== 数字签名验证(HMAC算法, 类似JWT) =====
// 签名函数
export function sign(content, secret) {
  handleVaildParam([
    { prop: 'content', value: content, type: 'string' },
    { prop: 'secret', value: secret, type: 'string' },
  ]);

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(content); // 传入数据
  return hmac.digest('hex'); // 返回签名
}

// 验证函数
export function verify(content, secret, signature) {
  handleVaildParam([
    { prop: 'content', value: content, type: 'string' },
    { prop: 'secret', value: secret, type: 'string' },
    { prop: 'signature', value: signature, type: 'string' },
  ]);
  const expectedSignature = sign(content, secret);
  return expectedSignature === signature; // 验证签名
}
//#endregion

//#region ===== MD5值 (!!!不建议使用!!!, 请使用 sparkMd5 库) =====
// 通用 MD5 生成函数，兼容字符串和文件对象
function genMD5(data) {
  if (!data) throw new Error('param0:data Not provided');

  // 处理字符串的 MD5 生成
  if (typeof data === 'string') {
    const hash = crypto.createHash('md5');
    hash.update(data);
    return hash.digest('hex');
  }
  // 处理 Buffer 或者类似文件的数据
  else if (data instanceof Buffer || data instanceof Uint8Array) {
    // no code
    return;
  }
  // 如果是文件对象（带有数据流），通过流计算 MD5
  else if (typeof data === 'object' && data.stream) {
    // no code
    return;
  }

  throw new Error('Unsupported data type for MD5 generation');
}
/** 使用示例 -- 没有 */
//#endregion

//#region ===== common

function handleVaildParam(options = []) {
  for (let i = 0; i < options.length; i++) {
    const param = options[i];

    if (!param.value) throw new Error(`param[${param.prop}] Not provided`);

    const type = Object.prototype.toString.call(param.value).split(' ')[1].split(']')[0];

    if (type.toLowerCase() !== param.type.toLowerCase())
      throw new Error(`param[${param.prop}] must be a ${param.type}!`);
  }
}
//#endregion

//#region ===== 使用示例
/** 加解密内容处理---使用示例 */
let adata = {
  text: 'kdhsaKIHD08D90Da',
  object: JSON.stringify({
    text: 'fkljhklsahjflas',
  }),
};

const encryptedData = encrypt(adata.object);
const originData = decrypt(encryptedData);

// // dev-log >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
console.log(`[Dev_Log][${'encrypt'}_]_>>>`, encryptedData, encryptedData.length);
console.log(`[Dev_Log][${'decrypt'}_]_>>>`, originData);

/** 数字签名验证使用示例 */
const secretKey = 'your_secret_key'; // 自定义密钥
const content = 'This is a c飒飒飒飒撒ntent';

// 生成签名
const signature = sign(content, secretKey);
console.log('Signature1:', signature);

// 验证签名
const isValid = verify(content, secretKey, signature);
console.log('Is valid1:', isValid);
//#endregion
