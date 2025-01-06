import request from "@/utils/request.js";

// 收益汇总
export function getCreateTotal(data) {
  return request({
    url: '/applet/user/wallet/creator/income_total',
    method: 'get',
    data
  })
}

// 收益列表
export function getCreateList(data) {
  return request({
    url: '/applet/user/wallet/creator/income_list',
    method: 'get',
    data
  })
}

// 剧集收益汇总
export function getCreateDetailTotal(data) {
  return request({
    url: '/applet/user/wallet/creator/detail_total',
    method: 'get',
    data
  })
}

// 剧集收益列表
export function getCreateDetailList(data) {
  return request({
    url: '/applet/user/wallet/creator/detail_list',
    method: 'get',
    data
  })
}