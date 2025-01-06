import request from "@/utils/request.js";

// 书库列表
export function getBookList(data) {
  return request({
    url: '/applet/popularize/copyright_library/list',
    method: 'get',
    data,
  });
}
