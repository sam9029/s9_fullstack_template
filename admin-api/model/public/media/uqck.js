const { checkKeys } = require("../../../utils/check_type");
const request = require("../../../utils/request");
const { extractProp } = require("../../../utils/tools");
const utils = require("../externalMedia/utils");

const HOST = "https://material-ug.uc.cn";


function get_config(advertiser_type) {
  switch (Number(advertiser_type)) {
    case 1007: // uc
      return {
        clientId: 10,
        secret: "8a0b010deb4b45b786553219c95d0ad0",
        product: "UC",
      };
    case 1006: // 夸克
    case 1013:
      return {
        clientId: 227,
        secret: "9069a98fb96042619787a87f2f4fafe4",
        product: "QUARK",
      };
    default:
      throw "error advertisertype"
  }
}


function sign_params(params, advertiser_type) {
  const exclude_keys = ["clientId", "timestamp", "sign"];
  extractProp(params, exclude_keys);
  const str = utils.sort_and_join(params, {
    handler: (key, val) => `${key}=${encodeURIComponent(val)}`
  })

  const { clientId, secret } = get_config(advertiser_type);

  const timestamp = Date.now();
  let sign_str = `${str}${timestamp}${clientId}${secret}`;
  const sign = utils.md5(sign_str);
  params.timestamp = timestamp;
  params.clientId = clientId;
  params.sign = sign;
  return params;
}




function fetch_apply_original_keyword(data, advertiser_type) {
  const params = sign_params({}, advertiser_type);
  return request({
    url: HOST + "/material/2.0/openapi/search_word/applyKeywordsForOriginalSearch",
    method: "POST",
    params,
    data,
  }).then(res => {
    if (res.code != 'Sys.000') {
      throw res.message;
    }
    return res.data;
  })
}


function fetch_apply_change_keyword(data, advertiser_type) {
  const params = sign_params({}, advertiser_type);
  return request({
    url: HOST + "/material/2.0/openapi/search_word/applyKeywordsForChangeSearch",
    method: "POST",
    params,
    data,
  }).then(res => {
    if (res.code != 'Sys.000') {
      throw res.msg;
    }
    return res.data;
  })
}


function fetch_task_result(query, advertiser_type) {
  const params = sign_params(query, advertiser_type);
  return request({
    url: HOST + "/material/2.0/openapi/search_word/getResultForKeywordsApplication",
    method: "GET",
    params,
  }).then(res => {
    if (res.code != 'Sys.000') {
      throw res.message;
    }
    return res.data;
  })
}


/**
 * AUDITTING 处理中（提词申请接⼝必返回此状态）
 * AUDITTED 处理完成（可投放）
 * FINAL_CHECKED 完成最终检查
 * @typedef { 'AUDITTING' | 'AUDITTED' | 'FINAL_CHECKED'  } TaskStatus
 */

/**
 * @typedef { Object } ApplyResult
 * @property {number} taskId
 * @property {TaskStatus} status
 * @property {number} unpassedKeywordsCount
 * @property {string[]} unpassedKeywords
 */

async function apply_original_keywords(keywords, advertiser_type) {
  if (!Array.isArray(keywords)) throw "TypeError: keywords is Array";
  if (keywords.length > 500 || keywords.length == 0) {
    throw "keywords length > 0 or <= 500";
  }
  keywords.forEach(v => {
    checkKeys(v, ["keyword", "url", "tag"]);
  })

  const data = {
    product: "UC",
    materialType: "STORY",
    keywords
  };

  /**@type { ApplyResult } */
  const res = await fetch_apply_original_keyword(data, advertiser_type);

  return res
}

async function apply_change_keywords(keywords, advertiser_type) {
  const { product } = get_config(advertiser_type);
  if (!Array.isArray(keywords)) throw "TypeError: keywords is Array";
  if (keywords.length > 500 || keywords.length == 0) {
    throw "keywords length > 0 or <= 500";
  }
  keywords.forEach(v => {
    checkKeys(v, ["keyword", "changeKeyword", "tag", "title?", "url?", "description?"]);
  })

  const data = {
    product: product,
    keywords
  };

  /**@type { ApplyResult } */
  const res = await fetch_apply_change_keyword(data, advertiser_type);

  return res
}


async function query_apply_status(task_id, advertiser_type) {
  const params = {
    taskId: task_id
  };

  /**@type { ApplyResult } */
  const res = await fetch_task_result(params, advertiser_type);

  return res;
}



module.exports = {
  apply_original_keywords, // uc
  apply_change_keywords, // 夸克
  query_apply_status,
}


// apply_original_keywords([
//   {
//     "keyword": "测试原词kye搜索1",
//     "url": "www.baidu.com",
//     "tag": "搜索直达_UC故事会会员"
//   },
//   {
//     "keyword": "测试原词搜索2",
//     "url": "www.baidu.com",
//     "tag": "搜索直达_UC故事会会员"
//   }
// ], 1007)


// apply_change_keywords([
//   {
//     "keyword": "测试换Q搜索3",
//     "changeKeyword": "新Q1",
//     "tag": "单本"
//   },
//   {
//     "keyword": "测试换Q搜索4",
//     "changeKeyword": "新Q2",
//     "tag": "单本",
//     "title": "测试标题",
//     "url": "www.baidu.com",
//     "description": "测试描述"
//   }
// ], 1006)


// query_apply_status(1180943, 1007);
// query_apply_status(1180945, 1006);