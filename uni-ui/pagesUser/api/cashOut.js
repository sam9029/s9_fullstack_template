import request from "@/utils/request";

// 支付平台列表
export function getBankList(data) {
  return request({
		url: '/public/bank/list',
		method: 'GET',
		data
	})
}
// 查询签约详情
export function getBankDef(data) {
  return request({
		url: '/public/bank/def',
		method: 'GET',
		data
	})
}
// 支付平台签约
export function postBankSign(data) {
	return request({
		url: '/public/bank/sign',
		method: 'POST',
		data
	})
}

// 解绑
export function postBankUnbind(data) {
  return request({
		url: '/public/bank/unbind',
		method: 'POST',
		data
	})
}

// 身份信息预检
export function postBankCheck(data) {
  return request({
		url: '/public/bank/check',
		method: 'POST',
		data
	})
}