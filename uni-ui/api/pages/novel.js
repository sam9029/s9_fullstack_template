import request from "@/utils/request.js";

// 首页列表
export function getNovelAppList(data) {
	return request({
		url: '/applet/home/novel/novel_app',
		method: 'get',
		data,
	});
}