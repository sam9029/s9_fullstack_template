import request from '@/utils/request';


// 下拉
export function adverDownList(params) {
  params && (params.is_test = 3);
  return request({
    url: '/public/advertiser',
    method: 'get',
    params,
  });
}
export function promotionDownList(params) {
  return request({
    url: '/public/promotion',
    method: 'get',
    params,
  });
}
export function contentDownList(params) {
  return request({
    url: '/public/content_type',
    method: 'get',
    params,
  });
}

// list
export function advertiserList(params) {
  return request({
    url: '/manage/advertiser/list',
    method: 'get',
    params,
  });
}

// 新增广告主
export function advertiserAdd(data) {
  return request({
    url: '/manage/advertiser/add',
    method: 'post',
    data,
  });
}

export function getDetails (params) {
  return request({
    url: `/manage/advertiser/def`,
    method: "get",
    params,
  })
}

export function advertiserSave(data) {
  return request({
    url: '/manage/advertiser/save',
    method: 'post',
    data,
  });
}

// 广告主商务
export function adverSalerList(params) {
  return request({
    url: '/manage/advertiser/manage_list',
    method: 'get',
    params,
  });
}
export function adverSalerSave(data) {
  return request({
    url: '/manage/advertiser/manage_update',
    method: 'post',
    data,
  });
}

// 广告主--推广类目
export function adverPromoteList(params) {
  return request({
    url: '/manage/advertiser/promotion/list',
    method: 'get',
    params,
  });
}
export function adverPromoteAdd(data) {
  return request({
    url: '/manage/advertiser/promotion/add',
    method: 'post',
    data,
  });
}
export function adverPromoteSave(data) {
  return request({
    url: '/manage/advertiser/promotion/save',
    method: 'post',
    data,
  });
}

export function getCreativeCategoryList (params) {
  return request({
    url: `/manage/advertiser/promotion/industry`,
    method: "get",
    params,
  })
}
