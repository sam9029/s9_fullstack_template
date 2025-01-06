import request from "@/utils/request.js";

// 投顾收益列表
export function getConsultantList(data) {
  return request({
    url: '/applet/user/wallet/keyword/consultant_list',
    method: 'get',
    data
  })
}

// 投顾收益详情列表
export function getConsultantDef(data) {
  return request({
    url: '/applet/user/wallet/keyword/consultant_def',
    method: 'get',
    data
  })
}

// 博主收益列表
export function getBloggerList(data) {
  return request({
    url: '/applet/user/wallet/keyword/blogger_list',
    method: 'get',
    data
  })
}