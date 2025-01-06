const { ADVERTISER_TABLE } = require("../../../config/setting");
const request = require("../../../utils/request");
const knex = require("../../../db/knexManager").knexProxy
const { get_kocmount_host } = require("../externalMedia/utils")
const { secret } = require("./advertiser_fn")

async function sync_orders_from_server(data) {
  const host = get_kocmount_host();
  return request({
    url: host + '/api/public/advertiser_api/sync_order',
    method: 'post',
    data: data,
    timeout: 300 * 1000
  }).then(res => {
    if (res.code == 0) {
      return res.data;
    } else {
      throw res.message || "同步订单失败！";
    }
  })
}



async function sync_order_list(date, advertiser_type) {
  const app_id = (
    await knex(ADVERTISER_TABLE).select("app_id").where("id", advertiser_type)
  )[0]?.app_id;
  if(!app_id) throw "项目配置错误，无有效的app_id";

  const body = {
    advertiser_type: advertiser_type,
    app_id,
    date: date,
    token: secret,
  };

  const orders = await sync_orders_from_server(body);
  // const { orders, ad_orders, ad_success } = response;

  transform_server_orders(orders, advertiser_type);

  return  { orders };
}

function transform_server_orders(orders = [], advertiser_type) {
  orders.forEach(v => {
    // status_name -> pay_status
    v.pay_status = v.status_name || "NOTPAY";
    if (v.pay_status == "UNKNOW") v.pay_status = "NOTPAY";
    delete v.status_name;

    //#CONT PLAN  -+ app_id
    delete v.app_id;
    v.advertiser_type = advertiser_type;
    v.smt_id = 3;
  })
}

module.exports = {
  sync_order_list
}
