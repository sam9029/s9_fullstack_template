let stage_key = "UNI_USER_KEY";
let invitee_key = "UNI_INVITEE_KEY";
export function setlocalLate(data) {
  let info = {
    create_time: Date.now(),
    local_late: data
  }
  setStage(invitee_key, info)
}

// 读取用户信息
export function getlocalLate() {
  let data = getStage(invitee_key)
  if (data && Date.now() - data?.create_time <= 12 * 3600000) return data.local_late || 5000
  return 5000
}

// 存储用户信息到本地
export function setUserInfo(data, token) {
  if (data) {
    data = JSON.stringify(data);
    try {
      uni.setStorageSync(stage_key, data);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

// 读取用户信息
export function getUserInfo() {
  try {
    const value = uni.getStorageSync(stage_key);
    if (value) return JSON.parse(value);
    return null;
  } catch (e) {
    return null;
  }
}

export function deleteUserInfo() {
  try {
    uni.removeStorageSync(stage_key);
  } catch (e) {
    // error
  }
}

export function getToken() {
  try {
    return uni.getStorageSync('UNI_USER_TOKEN');
  } catch (error) {
    return null
  }
}

export function setToken(token) {
  try {
    uni.setStorageSync("UNI_USER_TOKEN", token);
    return true
  } catch (error) {
    return false;
  }
}

const crypto = require("crypto");
const algorithm = "aes-128-cbc";
const { getUuid } = require("./tools");
export function encrypt(data, secret_key = 'IDNC464VM53C0ND0') {
  let str_iv = getUuid().substr(0, 16).toLocaleLowerCase();
  const iv = Buffer.from(str_iv, "utf8");
  let text = JSON.stringify(data);
  const cipher = crypto.createCipheriv(algorithm, secret_key || getToken(), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString("utf8"),
    data: encrypted.toString("base64"),
  };
}

export function decrypt(encryptedData) {
  const { iv, data } = encryptedData;
  const decipher = crypto.createDecipheriv(algorithm, 'IDNC464VM53C0ND0' || getToken(), Buffer.from(iv, 'utf8'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]);
  return JSON.parse(decrypted.toString());
}

export function getStage(key) {
  try {
    const value = uni.getStorageSync(key);
    if (value) return JSON.parse(value);
    return null;
  } catch (e) {
    return null;
  }
}

export function setStage(key, data = {}) {
  try {
    uni.setStorageSync(key, JSON.stringify(data));
    return true
  } catch (e) {    
    return false;
  }
}