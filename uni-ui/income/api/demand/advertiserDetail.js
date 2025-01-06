import request from "@/utils/request.js";

// 汇总
export function getAdvertiserTotal(data) {
  return request({
    url: '/applet/user/wallet/advertiser_plan_income_total',
    method: 'get',
    data
  })
}

// 任务列表
export function getIncomeList(data) {
  return request({
    url: '/applet/user/wallet/advertiser_plan_income_list',
    method: 'get',
    data,
  });
}