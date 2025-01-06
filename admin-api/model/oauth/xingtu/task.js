const moment = require("moment");
const JSONbig = require("json-bigint")
const request = require("../../../utils/request");
const { sleep } = require("../../../utils/tools");
const { getXingtuToken } = require("./index");
const { isFunction } = require("lodash");


// https://bytedance.larkoffice.com/docx/KEVHdwYmSof9GgxMZIDcS41InYd


const Host = "https://api.oceanengine.com";


function transform_json_bigint(data) {
  if (!data) return data;
  try {
    return JSONbig.parse(data)
  } catch (error) {
    throw {
      response_data: data,
      error: new Error('E_JSON_PARSE')
    };
  }
}

async function fetch_unparticipated_task(params, count = 0) {
  const token = await getXingtuToken(params.star_id);

  const res = await request({
    url: Host + '/open_api/2/star/mcn/get_unparticipated_task/',
    method: 'GET',
    params,
    headers: {
      "Access-Token": token,
    },
    transformResponse: [transform_json_bigint],
  });
  if (res.code != 0) {
    if(res.message == "Internal service timed out. Please retry in sometime." && count < 2) {
      count++ 
      await sleep(200)
      return await fetch_unparticipated_task(params, count)
    }
    throw res.message;
  }
  // const { data, page_info } = res.data;
  return res.data
}


async function fetch_contracted_task(params) {
  const token = await getXingtuToken(params.star_id);

  const res = await request({
    url: Host + '/open_api/2/star/mcn/get_contracted_challenge_list/',
    method: 'GET',
    params,
    headers: {
      "Access-Token": token,
    },
    transformResponse: [transform_json_bigint],
  });

  if (res.code != 0) {
    throw res.message;
  }
  // const { data, page_info } = res.data;
  return res.data
}


/**
 * 设置分成比例
 * @param {string} demand_id MCN承包任务ID
 * @param {number} mcn_profit_rate 0-100，MCN分成比例。千分之一，例如50%，写入500
 */
async function contract_challenge(advertiser_id, demand_id, mcn_profit_rate) {
  if (mcn_profit_rate < 0 || mcn_profit_rate > 1000) {
    throw "MCN分成比例数值应在0-1000内"
  }
  const params = {
    star_id: advertiser_id,
    demand_id: demand_id,
    mcn_profit_rate: mcn_profit_rate,
  };
  const send = `{ "star_id" : ${advertiser_id}, "demand_id": ${demand_id}, "mcn_profit_rate": ${mcn_profit_rate} }`
  // console.log(params, JSONbig.parse(send));
  const token = await getXingtuToken(params.star_id);

  const res = await request({
    url: Host + '/open_api/2/star/mcn/contract_challenge/',
    method: 'POST',
    data: send,
    headers: {
      "Access-Token": token,
      'Content-Type': 'application/json'
    }
  });
  // console.log(res);
  if (res.message == '已经承包了该投稿任务!') return res
  if (res.code != 0) throw res.message;
  // const { result: bool } = res.data;
  return res.data
}


/**
 * 获取任务链接
 * @param {string} demand_id MCN承包任务ID
 * @param {number} channel_id 机构自定义参数，由机构传入。平台拼接加入任务链接中。
 */
async function get_challenge_url(advertiser_id, demand_id, channel_id) {
  const params = {
    star_id: advertiser_id,
    demand_id: demand_id,
  }
  if (channel_id) {
    params.channel_id = channel_id;
  }

  const token = await getXingtuToken(params.star_id);

  const res = await request({
    url: Host + '/open_api/2/star/mcn/get_contracted_challenge_url/',
    method: 'GET',
    params: params,
    headers: {
      "Access-Token": token,
    }
  });

  if (res.code != 0) {
    throw res.message;
  }
  // const { task_url: string } = res.data;
  return res.data
}



async function fetch_challenge_author_item_list(params) {
  const token = await getXingtuToken(params.star_id);

  const res = await request({
    url: Host + '/open_api/2/star/mcn/get_contract_challenge_author_item_list_v2/',
    method: 'GET',
    params: params,
    headers: {
      "Access-Token": token,
    },
    transformResponse: [transform_json_bigint],
  });
  if (res.code != 0) {
    throw res.message;
  }
  // const { data, page_info } = res.data;
  return res.data
}


/**
 * 获取未参与任务
 */
async function get_unparticipated_task(advertiser_id, query = {}, format = null) {
  const params = {
    star_id: advertiser_id,
    // pay_type: 0,
    page: 1,
    page_size: 10
  };

  if (query?.date_range?.length) {
    params.min_create_time_stamp = moment(query?.date_range?.[0]).startOf('day').unix();
    params.max_create_time_stamp = moment(query?.date_range?.[1]).endOf('day').unix();
  }
  if (query?.pay_type) params.pay_type = query.pay_type
  if (query?.keyword) params.keyword = query.keyword

  let task_list = [];

  for (let page = 1; ; page++) {
    params.page = page;
    const obj = await fetch_unparticipated_task(params).catch(()=>{

    });
    await sleep(200)
    if(!obj?.data) break;
    task_list = task_list.concat(obj.data);
    if (!obj.page_info.has_more) { break; }
  }
  if (format && isFunction(format)) return task_list.map(i => format(i))
  return task_list;
}


/**
 * 获取已参与任务
 */
async function get_contracted_task(advertiser_id, query = {}, format = null) {
  const params = {
    star_id: advertiser_id,
    // pay_type: 0,
    page: 1,
    page_size: 50
  };
  if (query?.pay_type) params.pay_type = query?.pay_type
  if (query?.date_range?.length) {
    params.min_create_time_stamp = moment(query?.date_range[0]).startOf('day').unix();
    params.max_create_time_stamp = moment(query?.date_range[1]).endOf('day').unix();
  }

  let task_list = [];

  for (let page = 1; ; page++) {
    params.page = page;

    const { data, page_info } = await fetch_contracted_task(params);
    task_list = task_list.concat(data);
    if (!page_info.has_more) { break; }
  }
  if (format && isFunction(format)) return task_list.map(i => format(i))
  return task_list;
}



/**
 * 获取投后数据信息
 * @param {*} advertiser_id 
 * @param {*} demand_id MCN承包任务ID
 */
async function get_challenge_author_item_list(advertiser_id, demand_id, format = null) {
  const params = {
    star_id: advertiser_id,
    demand_id: demand_id,
    page: 1,
    page_size: 10
  }

  let data_list = [];

  for (let page = 1; ; page++) {
    params.page = page;
    const { data, page_info } = await fetch_challenge_author_item_list(params);
    data_list = data_list.concat(data);
    if (!page_info.has_more) { break; }
  }
  if (format && isFunction(format)) return data_list.map(i => format(i))
  return data_list;
}


// get_unparticipated_task("1755341270488139", ["2024-10-18", "2024-10-18"])

// get_contracted_task("1755341270488139", ["2024-10-01", "2024-10-21"])

// demand_id 
// 7330188086340632613 7330101397759131702 7330101376053329956 7330100694521593897 7330086667275272203 
// 7330085998871511103 7330085849033703463 7329851227997487113 7329803028084211739 7329802579742343194

// get_challenge_url("1755341270488139", "7330188086340632613");

// get_challenge_author_item_list("1755341270488139", "7427052561251041330")

module.exports = {
  get_unparticipated_task,
  get_contracted_task,
  contract_challenge,
  get_challenge_url,
  get_challenge_author_item_list,
}