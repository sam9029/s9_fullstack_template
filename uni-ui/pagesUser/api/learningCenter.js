import request from "@/utils/request";

// 支付平台列表
export function getCourseList(data) {
	return request({
		url: '/applet/home/course/list',
		method: 'GET',
		data
	})
}