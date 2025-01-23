import request from "@/utils/request.js";

// 回填记录列表
export function getBackfillList(data) {
  return request({
    url: "/applet/popularize/keyword/publish/list",
    method: "get",
    data,
  });
}

// 新增
export function postPublishAdd(data) {
  return request({
    url: "/applet/popularize/keyword/publish/add",
    method: "post",
    data,
  });
}

// 编辑
export function postPublishUpdate(data) {
  return request({
    url: "/applet/popularize/keyword/publish/update",
    method: "post",
    data,
  });
}

// 详情
export function getPublishDef(data) {
  return request({
    url: "/applet/popularize/keyword/publish/def",
    method: "get",
    data,
  });
}

// 删除
export function postPublishDel(data) {
  return request({
    url: "/applet/popularize/keyword/publish/del",
    method: "post",
    data,
  });
}

// 配置字段
export function getPublishConfig(data) {
  return request({
    url: '/applet/popularize/keyword/publish/config',
    method: 'get',
    data
  })
}
