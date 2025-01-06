import request from "@/utils/request.js";

// 任务列表
export function getTaskList(data) {
  return request({
    url: '/applet/realization/drama/workbench/task_list',
    method: 'get',
    data,
  });
}

// 我的任务
export function getMyTaskList(data) {
  return request({
    url: '/applet/realization/drama/workbench/my_drama_task',
    method: 'get',
    data,
  });
}

// 我的推广
export function getMyPlanList(data) {
  return request({    
    url: '/applet/realization/drama/workbench/my_plan',
    method: 'get',
    data,
  })
}

// 推广详情页
export function fetchPlanDetail(data) {
  return request({    
    url: '/applet/realization/drama/workbench/task_def',
    method: 'get',
    data,
  })
}
//我的账号列表
export const fetchMyAccount = (data) =>{
	return request({
	  url: '/applet/koc_manage/blogger_platform/list',
	  method: 'get',
	  data
	})
}

//创建推广计划
export const createPlan = (data) => {
  return request({
    url: '/applet/realization/drama/workbench/create_plan',
    method: 'post',
    data
  })
}
//删除推广计划
export const deletePlan = (data) => {
  return request({
    url: '/applet/realization/drama/workbench/plan_status',
    method: 'post',
    data
  })
}
//生成微信链接
export const postWxUrl = (data) => {
  return request({
    url: '/applet/realization/drama/workbench/wx_publish',
    method: 'post',
    data
  })
}