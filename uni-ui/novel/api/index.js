import request from "@/utils/request.js";

/* 获取巨量星图任务列表数据 */
export function getXingTuTaskList(data) {
	return request({
		url: '/applet/popularize/qr_task/xingtu/list',
		method: 'get',
		data,
	});
}
/* 获取巨量星图任务列表数据 */
export function getJuXingTaskList(data) {
	return request({
		url: '/applet/popularize/qr_task/juxing/list',
		method: 'get',
		data,
	});
}
/* 获取星广联投任务列表数据 */
export const getXingGuangTaskList = (data)=> {
	return request({
		url: '/applet/popularize/qr_task/xingguang/list',
		method: 'get',
		data,
	});
}
/* 获取星广联投我的任务列表数据 */
export const getXingGuangMyTaskList = (data)=> {
	return request({
		url: '/applet/popularize/qr_task/xingguang/my_task',
		method: 'get',
		data,
	});
}
