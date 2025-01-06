import request from "@/utils/request.js";

export const doWithdraw = (data) => {
	return request({
		url: '/applet/user/wallet/withdraw',
		method: 'post',
		data,
	});
}

export const doReWithdraw = (data) => {
	return request({
		url: '/applet/user/wallet/rewithdraw',
		method: 'post',
		data,
	});
}
export function getWithdrawRecordData(data) {
	return request({
		url: '/applet/user/wallet/withdraw_log',
		method: 'get',
		data,
	});
}

export function getWithdrawDetails(data) {
	return request({
		url: '/applet/user/wallet/withdraw_details',
		method: 'get',
		data,
	});
}