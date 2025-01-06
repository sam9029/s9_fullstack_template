import request from "@/utils/request.js";

// 首页列表
export function getRecordList(data) {
  return request({
    url: "/duolai/video/record_list",
    method: "get",
    data,
  });
}

// 查询看点余额
export function getLimitIntegral(data) {
  return request({
    url: '/duolai/user/limit_integral',
    method: 'get',
    data
  })
}

// 获取看点消费记录
export function getIntegralLog(data) {
  return request({
    url: '/duolai/order/integral_log',
    method: 'get',
    data
  })
}