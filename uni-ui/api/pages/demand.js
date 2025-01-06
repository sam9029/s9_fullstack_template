import request from "@/utils/request.js";

// 首页列表
export function getPreAppletList(data) {
  return request({
    url: '/applet/home/novel/pre_applet',
    method: 'get',
    data,
  });
}
