import request from "@/utils/request.js";
import unitMoney from "@/utils/tools.js";

export function getTotalData(data) {
	return request({
		url: '/applet/user/wallet/advertiser_def_total',
		method: 'get',
		data,
	});
}

// 收益数据
export function getIncomeList(data) {
	return request({
		url: '/applet/user/wallet/advertiser_def_list',
		method: 'get',
		data,
	});
}