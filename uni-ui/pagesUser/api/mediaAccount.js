import request from "@/utils/request";
// 获取媒体账号列表数据
export function mediaAccountList(data) {
	return request({
		url: '/applet/koc_manage/blogger_platform/list',
		method: 'GET',
		data
	})
}

// 添加媒体账号
export function addMediaAccount(data) {
	return request({
		url: '/applet/koc_manage/blogger_platform/add',
		method: 'POST',
		data
	})
}


// 获取媒体账号信息
export function mediaAccountDef(data) {
	return request({
		url: '/applet/koc_manage/blogger_platform/def',
		method: 'GET',
		data
	})
}


// 修改媒体账号信息
export function editMediaAccount(data) {
	return request({
		url: '/applet/koc_manage/blogger_platform/save',
		method: 'POST',
		data
	})
}

// 删除媒体账号
export function deleteMediaAccount(data) {
	return request({
		url: '/applet/koc_manage/blogger_platform/del',
		method: 'POST',
		data
	})
}