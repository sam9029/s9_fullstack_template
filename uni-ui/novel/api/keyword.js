import request from "@/utils/request.js";

// 关键词列表
export function getLibraryList(data) {
  return request({
    url: "/applet/popularize/keyword/library/list",
    method: "GET",
    data,
  });
}

// 新增关键词
export function postLibraryAdd(data) {
  return request({
    url: '/applet/popularize/keyword/library/add',
    method: 'POST',
    data
  })
}

// 题词配置字段
export function getLibraryConfig(data) {
  return request({
    url: '/applet/popularize/keyword/library/config',
    method: 'GET',
    data
  })
}

// 删除关键词
export function postLibraryDel(data) {
  return request({
    url: '/applet/popularize/keyword/library/delete',
    method: 'POST',
    data
  })
}

// 关键词详情
export function getKeywordLibraryDef(data) {
  return request({
    url: '/applet/popularize/keyword/library/def',
    method: 'GET',
    data
  })
}

// 新增书籍动态字段
export function getLibraryContentConfig(data) {
  return request({
    url: '/applet/popularize/keyword/library/content_config',
    method: 'GET',
    data
  })
}

// 书库手动添加
export function postLibraryAddContent(data) {
  return request({
    url: '/applet/popularize/keyword/library/add_content',
    method: 'POST',
    data
  })
}

// 关键词新增书籍信息
export function postLibraryContentKeywordAdd(data) {
  return request({
    url: '/applet/popularize/keyword/library/content_keyword_add',
    method: 'POST',
    data
  })
}

// 推广说明
export function getAdverDesc(data) {
  return request({
    url: '/applet/popularize/keyword/library/adver_desc',
    method: 'GET',
    data
  })
}

// 识别链接
export function getAnalysisLink(data) {
  return request({
    url: '/applet/realization/drama/workbench/analysis_link',
    method: 'GET',
    data
  })
}