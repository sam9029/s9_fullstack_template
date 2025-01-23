import { upload } from "@/utils/request.js";
import request from "@/utils/request";

export function upload_file(data, path) {
  return upload({
    url: '/public/app_upload',
    data
  }, path)
}

// 获取可签约平台
export const getBankConfig=(data)=> {
  return request({
    url: '/public/bank/config',
    method: 'GET',
    data
  })
}
// 获取banner
export function getBanner(data) {
  return request({
    url: '/public/banner',
    method: 'GET',
    data
  })
}

// 获取富文本信息
export function getParseContent(data) {
  return request({
    url: '/public/banner_url',
    method: 'GET',
    data
  })
}

// 获取业务分类
export function getBusinessType(data) {
  return request({
    url: '/public/business_type',
    method: 'GET',
    data
  })
}

// 获取账户平台
export function platform(data) {
  return request({
    url: '/public/platform',
    method: 'get',
    data,
  });
}

// 获取目录
export function category(data) {
  return request({
    url: '/public/category',
    method: 'get',
    data,
  });
}

// 获取项目
export function getAdvertiserType(data) {
  return request({
    url: '/public/advertiser',
    method: 'GET',
    data
  })
}

// 获取内容标签
export function getContentTag(data) {
  return request({
    url: '/public/tag',
    method: 'GET',
    data
  })
}

// 获取消息
export function getMessageUrl(data) {
  return request({
    url: '/public/message_url',
    method: 'GET',
    data
  })
}

// 获取通告列表
export function getPublicNoticelL(data) {
  return request({
    url: '/public/notice',
    method: 'GET',
    data
  })
}

// 更新用户头像及昵称
export function postUserUpdate(data) {
  return request({
    url: '/duolai/user/update',
    method: 'post',
    data
  })
}

export function getAliyunCertifyId(data) {
	return request({
		url: '/applet/user/realname/make_certify_id',
		method: 'post',
		data
	})
}
export const checkAliCertifyResult=(data)=>{
	return request({
		url: '/applet/user/realname/certify_result',
		method: 'post',
		data
	})
}

// 获取用户信息
export function getUserInfo(data) {
  return request({
    url: '/public/account/info',
    method: 'GET',
    data
  })
}

export function getPlatformAcc(data) {
  return request({
    url: '/public/platform_account',
    method: 'GET',
    data
  })
}

// 版权书库下拉
export function getLibrarySelect(data) {
  return request({
    url: '/public/library_enum',
    method: 'GET',
    data
  })
}

// 支付平台列表
export function getBankList(data) {
  return request({
		url: '/public/bank/list',
		method: 'GET',
		data
	})
}

// 人员下拉
export function getAccount(data) {
  return request({
    url: '/public/user',
    method: 'GET',
		data
  })
}