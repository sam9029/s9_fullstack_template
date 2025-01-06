import request from "@/utils/request";

// 意见反馈
export const userFeedback = (data) => {
	return request({
		url: '/public/user_feedback/add',
		method: 'POST',
		data
	})
}