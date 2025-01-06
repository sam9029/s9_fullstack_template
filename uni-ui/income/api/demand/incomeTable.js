import request from "@/utils/request.js";

export const getIncomeTable = (data) => {
	return request({
		url: "/applet/user/wallet/advertiser_plan_income_info",
		method: "get",
		data,
	});
};

export function getBloggerIncomeTable(data) {
	return request({
		url: "/applet/user/wallet/advertiser_blogger_income_list",
		method: "get",
		data,
	});
}

export function getPlanIncomeInfo(data) {
	return request({
		url: "/applet/user/wallet/advertiser_plan_income_detial",
		method: "get",
		data,
	});
}