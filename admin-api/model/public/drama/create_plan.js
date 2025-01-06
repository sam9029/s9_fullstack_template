const request = require("../../../utils/request");
const knex = require("../../../db/knexManager").knexProxy
const { checkKeys } = require("../../../utils/check_type");
// const { get_kocmount_host } = require("../externalMedia/utils");
const { secret } = require("./advertiser_fn");
const { ADVERTISER_TABLE } = require("../../../config/setting");


/**
 * @typedef { Object } RefererConfig
 * @property {number} advertiser_type 
 * @property {any} drama_info 
 * @property {string} name 
 * @property {number} plan_type 
 * @property {string} custom_params 
 * 
 * 
 * @typedef { Object } RefererInfo
 * @property { string } referral_id
 * @property { string? } search_code
 * @property { Object? } extra_pramas
 */

/**
 * @returns { Promise<RefererInfo> }
 */
async function create_plan_from_server(data) {
  const host = get_kocmount_host();
  return request({
    url: host + '/api/public/advertiser_api/create_plan',
    method: 'post',
    data: data
  }).then(res => {
    if (res.code == 0) {
      return res.data;
    } else {
      throw res.message || "创建计划失败！";
    }
  })
}


/**
 * @param {RefererConfig} options 
 */
async function dispatch_advertiser_plan(options) {
  const app_id = (
    await knex(ADVERTISER_TABLE).select("app_id").where("id", options.advertiser_type)
  )[0]?.app_id;
  if(!app_id) throw "项目配置错误，无有效的app_id";

  const params = checkKeys(options, [
    { key: "advertiser_type", type: Number, required: true },
    { key: "plan_type", type: Number, required: true },
    "drama_info", "name", "custom_prefix?", "payload?"
  ])
  params.app_id = app_id;
  if (params.name.length > 50) {
    return Promise.reject("计划名称长度不能超过50！");
  }


  params.token = secret;

  const response = await create_plan_from_server(params);

  return response;
}


module.exports = {
  dispatch_advertiser_plan
}