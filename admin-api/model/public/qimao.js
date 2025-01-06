const request = require("../../utils/request");
const utils = require("./externalMedia/utils");

const __DEV__ = process.env.NODE_ENV !== "production";
const DOMAIN = __DEV__ ?
  " https://test-openapi-nebula.wtzw.com" :
  " https://openapi-nebula.wtzw.com";

const APP_INFO = __DEV__ ? {
  APP_KEY: "281021",
  SECRET: "4nuAlQ8EuflU8ySZZ05X1F85"
} : {
  APP_KEY: "281021",
  SECRET: "XGkFrirMJ9gfUlzY733rMT1W"
}

async function queryBookInfo(book_ids) {
  if (!Array.isArray(book_ids) || !book_ids.length) return Promise.reject('请传入book_ids');
  let list = [];
  for (let i = 0; i < book_ids.length; i++) {
    let book_id = book_ids[i];
    let full_params = {
      book_id,
    }
    let time = timestamp();
    let sign = sign_params(full_params, time);
    full_params.app_key = APP_INFO.APP_KEY;
    full_params.timestamp = time;
    full_params.sign = sign;

    await request({
      url: DOMAIN + "/kol/v1/book/info",
      method: 'get',
      headers: {
        "content-type": "application/json",
      },
      params: full_params
    }).then(res => {
      if (res?.code == 200 && res?.data) {
        let data = res.data;
        list.push({
          book_id,
          book_author: data.author,
          serialized_status: data.is_over == 1 ? 1 : 2,
          content_summary: data.intro,
          describe: data.intro,
          cover_url: data.cover,
          tag: data.first_category,
        })
      }
      return res
    })
      .catch(err => {
        console.log(err)
      })
  }
  // console.log(list)
  return list;
}

function sign_params(params, timestamp) {
  let str = utils.sort_and_join(params, {}, encodeURI);
  str = `${str}${timestamp}${APP_INFO.APP_KEY}${APP_INFO.SECRET}`
  let md5 = utils.md5(str).toLowerCase();
  return md5;
}

function timestamp() {
  return utils.timestamp_sec();
}

async function createKeywords(list) {
  if (!list.length) throw "请传入关键词！"
  const data = list.map(({ keyword, kol_name, book_id }) => {
    return { book_id, search_keyword: keyword, kol_name, remark: '铂耀' };
  });
  let time = timestamp(), sign = sign_params(null, time);
  let result = await request({
    url: DOMAIN + "/kol/v1/keyword/add_keyword_batch" + `?app_key=${APP_INFO.APP_KEY}&timestamp=${time}&sign=${sign}`,
    method: 'post',
    headers: {
      "content-type": "application/json",
    },
    data: { data }
  }).then(res => {
    if (res?.code == 200 && res?.data) {
      return res.data
    }
  })
    .catch(err => {
      console.log(err)
    })
    return result;
}

async function queryKeywordStatus(ids) {
  if (!ids.length) throw "请传入关键词！"
  let time = timestamp(), sign = sign_params(null, time);
  let result = await request({
    url: DOMAIN + "/kol/v1/keyword/audit_status_batch" + `?app_key=${APP_INFO.APP_KEY}&timestamp=${time}&sign=${sign}`,
    method: 'post',
    headers: {
      "content-type": "application/json",
    },
    data: { id: ids }
  }).then(res => {
    // console.log(res)
    if (res?.code == 200 && res?.data) {
      return res.data
    }
  })
    .catch(err => {
      console.log(err)
    })
  return result;
}

async function createOpus(data) {
  if (!data.length) throw "请传入作品！"
  let time = timestamp(), sign = sign_params(null, time);
  let result = await request({
    url: DOMAIN + "/kol/v1/keyword/add_keyword_link_batch" + `?app_key=${APP_INFO.APP_KEY}&timestamp=${time}&sign=${sign}`,
    method: 'post',
    headers: {
      "content-type": "application/json",
    },
    data: { data }
  }).then(res => {
    if (res?.code == 200 && !res?.data) {
       return "success"
    }
    else throw res?.data?.[0].reason;
  })
  return result;
}

function sign_params(params, timestamp) {
  let str = '';
  if (params) str = utils.sort_and_join(params, {}, encodeURI);
  str = `${str}${timestamp}${APP_INFO.APP_KEY}${APP_INFO.SECRET}`
  let md5 = utils.md5(str).toLowerCase();
  return md5;
}

// queryBookInfo([102193,102650,101916])
// createKeywords([{ keyword: '七猫测试词', platform_account_name: '测试', book_id: 217547 }]);
// queryKeywordStatus([2841955,2841954])
module.exports = {
  queryBookInfo,
  createKeywords,
  queryKeywordStatus,
  createOpus,
}