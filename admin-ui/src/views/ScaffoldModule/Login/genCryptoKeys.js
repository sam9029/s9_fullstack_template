/**
 * package.json 没有、但是由 webpack4 自身处理并引入的了ctypto依赖模块补丁，
 * 检查其package-lock.json 可知webpack4自身引入一个 node-libs-broswer 库 ，其中包含crypto-browserify*/
const crypto = require('crypto');

//#region ===== 加解密内容处理集
/** 随机生成 RSA 公钥和私钥对，实现客户端的公私钥均不一致 */
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  // 密钥长度，安全性程度，可选 [512(不安全),1024（较低可用）,2048（常用且安全）,4096（最高安全性、计算性能高昂）]
  modulusLength: 1024,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** web crypto api */
// 当你需要生成数字签名并进行验证时，使用 RSA-PSS。
// 当你需要加密敏感信息并确保加密的安全性时，使用 RSA-OAEP。

async function generateRsaKeyPair() {
  try {
    // 1. 生成 RSA 密钥对
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 1024, // 密钥长度，与 Node.js 生成相同，支持 512, 1024、2048、4096 等
        publicExponent: new Uint8Array([1, 0, 1]), // 常用的 0x10001
        hash: 'SHA-256', // 哈希算法，RSA-OAEP 需要指定哈希算法
      },
      true, // 是否可以导出密钥
      ['encrypt', 'decrypt'], // 密钥用途：加密和解密
    );

    // 2. 导出公钥和私钥为 PEM 格式
    const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    // 3. 将 ArrayBuffer 转换为 Base64 字符串并包装为 PEM 格式
    const publicKeyPem = convertArrayBufferToPem(publicKey, 'PUBLIC KEY');
    const privateKeyPem = convertArrayBufferToPem(privateKey, 'PRIVATE KEY');

    console.log('Public Key (PEM):', publicKeyPem);
    console.log('Private Key (PEM):', privateKeyPem);

    return { publicKeyPem, privateKeyPem };
  } catch (error) {
    console.error('Error generating RSA key pair:', error);
  }
}

// 将 ArrayBuffer 转换为 PEM 格式
function convertArrayBufferToPem(buffer, type) {
  const base64String = arrayBufferToBase64(buffer);
  const pemString = `-----BEGIN ${type}-----\n${base64String
    .match(/.{1,64}/g)
    .join('\n')}\n-----END ${type}-----`;
  return pemString;
}

// 将 ArrayBuffer 转换为 Base64 字符串
function arrayBufferToBase64(buffer) {
  const binaryString = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binaryString);
}

// 生成密钥对
generateRsaKeyPair();
