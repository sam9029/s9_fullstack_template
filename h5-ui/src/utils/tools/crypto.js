// import cryptoJs, { WordArray } from 'crypto-js';
import { getToken } from '@/utils/storage/token';

// export function encrypt(data, key, iv = cryptoJs.lib.WordArray.random(16)) {
//   let text = JSON.stringify(data);

//   const content = cryptoJs.AES.encrypt(text, key || getToken(), {
//     iv,
//   }).ciphertext.toString(cryptoJs.enc.Hex);
//   const ivHex = iv.toString(cryptoJs.enc.Hex); // 使用 iv 实例来获取十六进制字符串

//   return {
//     iv: ivHex,
//     content,
//   };
// }

// export function decrypt(hash = {}, key) {
//   const iv = cryptoJs.enc.Hex.parse(hash.iv);
//   const decrpyted = cryptoJs.AES.decrypt(hash.content, key || getToken(), {
//     iv: iv,
//   });
//   const json_str = decrpyted.toString(cryptoJs.enc.Utf8);
//   console.log(json_str)
//   return JSON.parse(json_str);
// }

import crypto from 'crypto';
const algorithm = 'aes-256-cbc';

export function encrypt(data, key, iv = crypto.randomBytes(16)) {
  let text = JSON.stringify(data);
  const cipher = crypto.createCipheriv(algorithm, key || getToken(), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  };
}

export function decrypt(hash = {}, key, iv) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key || getToken(),
    iv || Buffer.from(hash.iv, 'hex'),
  );
  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, 'hex')),
    decipher.final(),
  ]);
  const json_str = decrpyted.toString();
  // console.log(json_str);
  return JSON.parse(json_str);
}
