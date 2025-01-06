const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { cert_path } = require("../../../config")
const request = require("../../../utils/request");

const {
  is_empty,
  nonce_str
} = require("../../../model/public/externalMedia/utils");


const CONFIG = {
  xgfx_private_key: "",
  private_decrypt_size: 128,
  gxzh_public_key: "",
  publick_encrypt_size: 117,
}

const TEST_DOMAIN = "http://test.guoxinzhonghui.net/apiServer";
const PROD_DOMAIN = "http://test.guoxinzhonghui.net/apiServer";
const DOMAIN = process.env.NODE_ENV == "production" ? PROD_DOMAIN : TEST_DOMAIN;


const TEST_APPID = "1297929417275797504";
const PROD_APPID = "1297929417275797504";
const APPID = process.env.NODE_ENV == "production" ? PROD_APPID : TEST_APPID;


const TEST_PUBLIC_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDXaDudCwbysrWkkgdIsGjjsLRH
/3ypfzrzY/d8LaSv66NrzVhpVEs69PuSggy/RKvg9xA6zRFIvSuwNQTFxeBgijj4
uh+WFM8sZdIeESdjjjO0GJKV7z3h8ZrCc7/2EjnqIDjYIM/TOc+18ripDgWo7ZlP
hnoLHdYdRChiLduNSQIDAQAB
-----END PUBLIC KEY-----`

function init_key() {
  try {
    CONFIG.xgfx_private_key = Buffer.from(fs.readFileSync(path.join(cert_path, './xgfx_private_key.pem')),).toString();

    if (process.env.NODE_ENV == "production") {
      CONFIG.gxzh_public_key = Buffer.from(fs.readFileSync(path.join(cert_path, './gxzh_public_key.pem')),).toString();
    } else {
      CONFIG.gxzh_public_key = TEST_PUBLIC_PEM;
    }
  } catch (err) {
    console.error(err);
  }
}



const GXZH_Crypto = {
  signature(data_str) {
    try {
      const private_key = CONFIG.xgfx_private_key;
      return crypto.createSign("RSA-SHA256").update(data_str, "utf-8").sign(private_key, "base64")
    } catch (err) {
      console.log(err);
      throw "国信众惠：数据异常，签名失败."
    }
  },

  verify(data_str, sign) {
    try {
      const key = CONFIG.gxzh_public_key;
      return crypto.createVerify('RSA-SHA256').update(data_str, "utf-8").verify(key, sign, "base64")
    } catch (err) {
      console.log(err);
      throw "国信众惠：数据异常，验签失败."
    }
  },

  encrypt(data_str) {
    try {
      // const enc = CryptoJS.RSA.encrypt(
      //   CryptoJS.enc.Utf8.parse(data_str),
      //   encrypt_word,
      //   {
      //     mode: CryptoJS.mode.ECB,
      //     padding: CryptoJS.pad.Pkcs7
      //   }
      // ).toString(CryptoJS.format.Hex);
      // const my_enc = Buffer.from(enc, "hex").toString("base64")

      // Java code
      // Cipher.getInstance(keyFactory.getAlgorithm()); // "RSA"
      // 算法/模式/填充模式 默认 RSA/ECB/PKCS1Padding

      const data_buf = Buffer.from(data_str, "utf-8");
      const data_len = data_buf.length;
      const encrypt_key = CONFIG.gxzh_public_key;
      const block_len = CONFIG.publick_encrypt_size;

      let offset = 0;
      let i = 0;
      const encrypt_bytes = [];

      while (data_len - offset > 0) {
        const end_offset = Math.min(offset + block_len, data_len);
        const block_buf = data_buf.subarray(offset, end_offset);
        const block_bytes = crypto.publicEncrypt({
          key: encrypt_key,
          padding: crypto.constants.RSA_PKCS1_PADDING
        }, block_buf);

        encrypt_bytes.push(block_bytes);

        i++;
        offset = i * block_len;
      }

      return Buffer.concat(encrypt_bytes).toString("base64");

    } catch (err) {
      console.log(err);
      throw "国信众惠：数据异常，加密失败."
    }
  },

  decrypt(data_str) {
    try {
      // const key_word = CryptoJS.enc.Utf8.parse(CONFIG.xgfx_private_key);
      // return CryptoJS.DES.decrypt(data_str, key_word, {
      //   mode: CryptoJS.mode.ECB,
      //   padding: CryptoJS.pad.Pkcs7
      // }).toString(CryptoJS.enc.Utf8)

      // 同 encrypt

      const data_buf = Buffer.from(data_str, "base64");
      const data_len = data_buf.length;
      const decrypt_key = CONFIG.xgfx_private_key;
      const block_len = CONFIG.private_decrypt_size;

      let offset = 0;
      let i = 0;
      const decrypt_bytes = [];

      while (data_len - offset > 0) {
        const end_offset = Math.min(offset + block_len, data_len);
        const block_buf = data_buf.subarray(offset, end_offset);
        const block_bytes = crypto.privateDecrypt({
          key: decrypt_key,
          padding: crypto.constants.RSA_PKCS1_PADDING
        }, block_buf);

        decrypt_bytes.push(block_bytes);

        i++;
        offset = i * block_len;
      }

      return Buffer.concat(decrypt_bytes).toString("utf-8")

    } catch (err) {
      console.log(err);
      throw "国信众惠：数据异常，解密失败."
    }
  }
}



/**
 * @typedef { Object } RequestBody
 * @property { string } sign
 * @property { string } signType
 * @property { string } timestamp
 * @property { string } nonceStr
 * @property { string } reqMsgId
 * @property { string } appid
 */


/**
 * @template T
 * @typedef { Object } ResponseBodyExtend
 * @property { String } code
 * @property { String } message
 * @property { T } data
 */

/**
 * @template T
 * @typedef { RequestBody & ResponseBodyExtend<T>  } ResponseBody
 */


class RequestEncBody {
  #appid = "";
  #raw_data = null;
  #encrypt_data = undefined;
  #other_body = null;


  /**@type { RequestBody! } */
  #body = null;

  constructor(data, appid, other_body) {
    this.#appid = appid;
    this.#raw_data = data;

    if (typeof other_body == "object" && other_body) {
      this.#other_body = other_body;
    }
  }

  encrypt() {
    this.#set_encrypt_data();
    this.#factory_body();
    this.#set_signature();

    return this.#body;
  }

  #sort_object(obj) {
    const new_obj = {};
    for (const [k, v] of Object.entries(obj).sort(this.#sort_fn)) {
      if (is_empty(v)) {
        continue;
      }
      Reflect.set(new_obj, k, v);
    }
    return new_obj;
  }
  #sort_fn(e1, e2) {
    return e1[0] < e2[0] ? -1 : 1
  }

  #set_encrypt_data() {
    if (!this.#raw_data) return;

    let wait_encrypt_data;
    if (Array.isArray(this.#raw_data)) {
      wait_encrypt_data = this.#raw_data.slice();
    } else {
      // fast josn only sort outter prop?????
      wait_encrypt_data = this.#sort_object(this.#raw_data);
    }

    const data_str = JSON.stringify(wait_encrypt_data);
    this.#encrypt_data = GXZH_Crypto.encrypt(data_str);
  }

  #factory_body() {
    const body_obj = {
      appid: this.#appid,
      data: this.#encrypt_data,
      nonceStr: nonce_str(20),
      reqMsgId: nonce_str(32),
      signType: "RSA",
      timestamp: Date.now() + "",
      ...this.#other_body
    };
    this.#body = this.#sort_object(body_obj);
  }
  #set_signature() {
    const data_str = JSON.stringify(this.#body);
    const sign = GXZH_Crypto.signature(data_str);

    Reflect.set(this.#body, "sign", sign);
  }

}



class ResponseDecBody {
  #raw_data = null;

  /**@type { ResponseBody<any> } */
  #body = null;

  constructor(data) {
    this.#raw_data = data;
  }

  decrypt() {
    this.#factory_body();

    const verify = this.#verify_sign();
    if (!verify) {
      throw "国信众惠：数据签名验证未通过."
    }

    if (this.#body.data) {
      let decrypt_data = GXZH_Crypto.decrypt(this.#body.data);

      try {
        decrypt_data = JSON.parse(decrypt_data)
      } catch {
        // not json string
      }

      Reflect.set(this.#body, "data", decrypt_data);
    }

    return this.#body;
  }

  #factory_body() {
    const {
      sign, signType, timestamp, nonceStr, reqMsgId, appid, code, message, data
    } = this.#raw_data;

    this.#body = {
      appid, code, data, message, nonceStr, reqMsgId, signType, timestamp,
    }
  }

  #verify_sign() {
    const { sign } = this.#raw_data;
    const body_str = JSON.stringify(this.#body);
    return GXZH_Crypto.verify(body_str, sign);
  }
}


function encrypt_body(data, appid, other_body) {
  return new RequestEncBody(data, appid, other_body).encrypt()
}

function decrypt_response(response) {
  return new ResponseDecBody(response).decrypt()
}


/**
 * @returns { Promise<ResponseBody> }
 */
async function warp_request(url, data) {
  const enc_body = encrypt_body(data, APPID);
  
  const enc_res = await request({
    url: DOMAIN + url,
    method: "POST",
    data: enc_body,
    retry: 0,
  });

  if (enc_res.code != "200") {
    throw enc_res;
  }
  
  const dec_data = decrypt_response(enc_res);
  return dec_data;
}

init_key();

module.exports = {
  warp_request,
  encrypt_body,
  decrypt_response,
}