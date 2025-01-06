import request from "@/utils/request";

// 分享页信息
export function postEditInfo(data) {
	return request({
		url: '/applet/user/account/update',
		method: 'POST',
		data
	})
}