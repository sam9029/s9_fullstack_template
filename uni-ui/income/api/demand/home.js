import request from "@/utils/request.js";

export const getIncomeTotal=(data)=>{
	return request({
	  url: '/applet/user/wallet/advertiser_settle_total',
	  method: 'get',
	  data
	})
}

export const getIncomeList=(data)=>{
	return request({
	  url: '/applet/user/wallet/advertiser_settle_list',
	  method: 'get',
	  data
	})
}