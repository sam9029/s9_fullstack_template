import { getToken } from '@/utils/user.js';

const crypto = require('crypto');
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