import request from "@/utils/request";

// 分享页信息
export function getInviteInfo(data) {
	return request({
		url: '/applet/user/invite/info',
		method: 'GET',
		data
	})
}

// 邀请记录统计
export function getInviteTotal(data) {
	return request({
		url: '/applet/user/invite/total',
		method: 'GET',
		data
	})
}

// 邀请记录列表数据
export function getInviteRecordList(data) {
	return request({
		url: '/applet/user/invite/list',
		method: 'GET',
		data
	})
}
