import request from '@/utils/request';

export function getBidAllOptions(params) {
  return request({
    url: `/manage/business/public/down_list`,
    method: 'get',
    params,
  });
}

// 客户全称下拉
export function getCustomOpts(params) {
  return request({
    url: `/manage/business/public/customer_list`,
    method: 'get',
    params,
  });
}

// 获取审批日志
export function getApprovalLog(params) {
  return request({
    url: `/manage/business/quotation/check_process`,
    method: 'get',
    params,
  });
}

// 审核流人员
export function approvalUser(query) {
  return request({
    url: '/manage/marking/user/role_user?koc_role=4',
    method: 'get',
    params: query,
  });
}

//#region 推广项目
export function getProjectList(params) {
  return request({
    url: `/manage/business/public/project/list`,
    method: 'get',
    params,
  });
}
export function createProject(data) {
  return request({
    url: `/manage/business/public/project/add`,
    method: 'post',
    data,
  });
}
export function updateProject(data) {
  return request({
    url: `/manage/business/public/project/edit`,
    method: 'post',
    data,
  });
}
export function deleteProject(data) {
  return request({
    url: `/manage/business/public/project/del`,
    method: 'post',
    data,
  });
}
export function statusProject(data) {
  return request({
    url: `/manage/business/public/project/update_status`,
    method: 'post',
    data,
  });
}
//#endregion

//#region 公司主体
export function getSubjectList(params) {
  return request({
    url: `/manage/business/public/subject/list`,
    method: 'get',
    params,
  });
}
export function getSubjectShortList(params) {
  return request({
    url: `/manage/business/public/subject/short_down_list`,
    method: 'get',
    params,
  });
}
export function createSubject(data) {
  return request({
    url: `/manage/business/public/subject/add`,
    method: 'post',
    data,
  });
}
export function updateSubject(data) {
  return request({
    url: `/manage/business/public/subject/edit`,
    method: 'post',
    data,
  });
}
export function deleteSubject(data) {
  return request({
    url: `/manage/business/public/subject/del`,
    method: 'post',
    data,
  });
}
export function statusSubject(data) {
  return request({
    url: `/manage/business/public/subject/update_status`,
    method: 'post',
    data,
  });
}
//#endregion

//#region 结算方式
export function getMethodList(params) {
  return request({
    url: `/public/settle_type`,
    method: 'get',
    params,
  });
}
//#region 星广结算方式
export function getXGMethodList(params) {
  return request({
    url: `/public/xg_settle_type`,
    method: 'get',
    params,
  });
}
export function createMethod(data) {
  return request({
    url: `/manage/business/public/method/add`,
    method: 'post',
    data,
  });
}
export function updateMethod(data) {
  return request({
    url: `/manage/business/public/method/edit`,
    method: 'post',
    data,
  });
}
export function deleteMethod(data) {
  return request({
    url: `/manage/business/public/method/del`,
    method: 'post',
    data,
  });
}
export function statusMethod(data) {
  return request({
    url: `/manage/business/public/method/update_status`,
    method: 'post',
    data,
  });
}
//#endregion

//#region 结算参数
export function getParamList(params) {
  return request({
    url: `/manage/business/public/param/list`,
    method: 'get',
    params,
  });
}
export function createParam(data) {
  return request({
    url: `/manage/business/public/param/add`,
    method: 'post',
    data,
  });
}
export function updateParam(data) {
  return request({
    url: `/manage/business/public/param/edit`,
    method: 'post',
    data,
  });
}
export function deleteParam(data) {
  return request({
    url: `/manage/business/public/param/del`,
    method: 'post',
    data,
  });
}
export function statusParam(data) {
  return request({
    url: `/manage/business/public/param/update_status`,
    method: 'post',
    data,
  });
}
//#endregion

//#region 推广目的
export function getGoalList(params) {
  return request({
    url: `/manage/business/public/goal/list`,
    method: 'get',
    params,
  });
}
export function createGoal(data) {
  return request({
    url: `/manage/business/public/goal/add`,
    method: 'post',
    data,
  });
}
export function updateGoal(data) {
  return request({
    url: `/manage/business/public/goal/edit`,
    method: 'post',
    data,
  });
}
export function deleteGoal(data) {
  return request({
    url: `/manage/business/public/goal/del`,
    method: 'post',
    data,
  });
}
export function statusGoal(data) {
  return request({
    url: `/manage/business/public/goal/update_status`,
    method: 'post',
    data,
  });
}
//#endregion

//#region 业务类型
// 新增
export function addAdvertiserCategroy(data) {
  return request({
    url: `/manage/business/public/category/add`,
    method: 'post',
    data,
  });
}
// 列表
export function advertiserCategroyList(params) {
  return request({
    url: `/public/business_type`,
    method: 'get',
    params,
  });
}
//#endregion

//#region 内容类型
export function addContentType(data) {
  return request({
    url: `/manage/business/public/content_type/add`,
    method: 'post',
    data,
  });
}
// 列表
export function contentTypeList(params) {
  return request({
    url: `/public/content_type`,
    method: 'get',
    params,
  });
}
//#endregion

//#region 发布平台
export function addPublishPlatform(data) {
  return request({
    url: `/manage/tool/system_config/platform/add`,
    method: 'post',
    data,
  });
}
// 列表
export function publishPlatformList(params) {
  return request({
    url: `/public/platform`,
    method: 'get',
    params,
  });
}
//#endregion

// 获取挂载方式
export function publishMountTypeList(params) {
  return request({
    url: `/public/mount_type`,
    method: 'get',
    params,
  });
}

// 获取 某部门下 所有 商务/商务销售人员
export function businessmanList(params) {
  return request({
    url: `/manage/business/public/user/dept_user`,
    method: 'get',
    params,
  });
}
// 人员下拉
export function userSelect(params) {
  return request({
    url: '/public/user',
    method: 'get',
    params,
  });
}

//#region 会员类型
export function addVipType(data) {
  return request({
    url: `/manage/tool/system_config/vip_type/add`,
    method: 'post',
    data,
  });
}
// 列表
export function vipTypeList(params) {
  return request({
    url: `/public/vip_type`,
    method: 'get',
    params,
  });
}
//#endregion

//#region 会员等级
export function addVipLevel(data) {
  return request({
    url: `/manage/tool/system_config/vip_level/add`,
    method: 'post',
    data,
  });
}
// 列表
export function vipLevelList(params) {
  return request({
    url: `/public/vip_level`,
    method: 'get',
    params,
  });
}
//#endregion

//#region 关联剧集
// 通过业务类型获取剧集列表
export function getDramaList(params) {
  return request({
    url: `/public/drama`,
    method: 'get',
    params,
  });
}
//#endregion
