import request from "@/utils/request.js";

export const getIncomeTable = (data) => {

	const currentTab = data['currentTab'] || 0;
	const url = currentTab == 0 ? '/applet/user/wallet/applet/wait_detail' : '/applet/user/wallet/advertiser_plan_income_info';
	data["currentTab"] = null;
	return request({
		url: url,
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