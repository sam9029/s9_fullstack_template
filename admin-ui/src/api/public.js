import request from '@/utils/request';

// 获取账户平台
export function getPlatform(params) {
  return request({
    url: '/public/platform',
    method: 'get',
    params,
  });
}

// 获取账户分类
export function getCategory(params) {
  return request({
    url: '/public/category',
    method: 'get',
    params,
  });
}

// 获取平台账号
export function getPlatformAccount(params) {
  return request({
    url: `/public/platform_account`,
    method: 'get',
    params,
  });
}

// 根据主页链接获取用户名称及粉丝量
export function getPlatformAccountInfo(data) {
  return request({
    url: '/public/platform_account_info',
    method: 'post',
    data,
  });
}

export function getTemplatelist(params) {
  return request({
    url: '/public/template/list',
    method: 'get',
    params,
  });
}

export function templateAdd(data) {
  return request({
    url: '/public/template/add',
    method: 'post',
    data,
  });
}

export function templateEdit(data) {
  return request({
    url: '/public/template/edit',
    method: 'post',
    data,
  });
}

export function templateDown(params) {
  return request({
    url: '/public/template/download',
    method: 'get',
    params,
  });
}

//#region bank
// 获取/检测银行卡信息
export function bank_info(params) {
  return request({
    url: '/public/bank_info',
    method: 'get',
    params,
  });
}

// 查询单个人的银行信息（根据优先级排序）
export function bank_def(params) {
  return request({
    url: '/public/bank/def',
    method: 'get',
    params,
  });
}

// 添加银行卡信息
export function bank_add(data) {
  return request({
    url: '/public/bank/add',
    method: 'post',
    data,
  });
}

// 修改银行卡信息
export function bank_edit(data) {
  return request({
    url: '/public/bank/edit',
    method: 'post',
    data,
  });
}

// 设置银行卡优先级
export function bank_priority(data) {
  return request({
    url: '/public/bank/sort',
    method: 'post',
    data,
  });
}
//#endregion

export function streamUpload(data, params, config) {
  return request({
    timeout: 120000,
    ...config,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    url: '/public/upload',
    method: 'post',
    params,
    data,
  });
}

// 更新发布日期
export function updatePublishDate(data) {
  return request({
    url: '/public/update_publish',
    method: 'post',
    data,
  });
}

// 消息发送
export function addMessage(data) {
  return request({
    url: '/manage/message/add',
    method: 'post',
    data,
  });
}

// 消息发送
export function editMessage(data) {
  return request({
    url: '/manage/message/edit',
    method: 'post',
    data,
  });
}

// 消息管理列表
export function msg_manage_list(params) {
  return request({
    url: '/manage/message/manage_list',
    method: 'get',
    params,
  });
}

// 消息管理列表
export function msg_manage(data) {
  return request({
    url: '/manage/message/edit_publish',
    method: 'post',
    data,
  });
}

// 任务下拉
export function taskInfo(params) {
  return request({
    url: '/public/task_info',
    method: 'get',
    params,
  });
}

// 获取账号标签
export function getTag(params) {
  return request({
    url: '/public/platform_tag',
    method: 'get',
    params,
  });
}

// 获取项目产品菜单
export function getMenu(params) {
  // params && (params.is_test = 3);
  return request({
    url: '/public/advertiser/menu',
    method: 'get',
    params,
  });
}

// 获取佣金政策
export function getCommissionPolicy(params) {
  return request({
    url: '/public/commission_policy',
    method: 'get',
    params,
  });
}

// 获取内容（书籍）下拉
export function getContent(params) {
  return request({
    url: 'public/content',
    method: 'get',
    params,
  });
}

// 会员卡 下拉
export function getVipCard(params) {
  return request({
    url: 'public/vip_card',
    method: 'get',
    params,
  });
}

// 标签 下拉
export function newTagList(params) {
  return request({
    url: 'public/tag',
    method: 'get',
    params,
  });
}

// 获取渠道
export function getChannel(params) {
  return request({
    url: '/public/channel',
    method: 'get',
    params,
  });
}

// 渠道下拉
export function getChannelSelect(params) {
  return request({
    url: '/manage/channel_manage/channel/search',
    method: 'get',
    params,
  });
}

// 渠道下拉
export function getVideoType(params) {
  return request({
    url: '/public/video_type',
    method: 'get',
    params,
  });
}

// 奖励活动
export function getRewardActivityList(params) {
  return request({
    url: '/public/reward_activity',
    method: 'get',
    params,
  });
}

// 星广任务下拉
export function getXgTaskOptions(params) {
  return request({
    url: '/public/xg_task',
    method: 'get',
    params,
  });
}

// 版权证明下拉
export function getCopyright(params) {
  return request({
    url: '/public/copyright',
    method: 'get',
    params,
  });
}

// 剧集下拉
export function getVideoCollection(params) {
  return request({
    url: '/public/video_collection',
    method: 'get',
    params,
  });
}

// 小程序下拉
export function appSelect(params) {
  return request({
    url: '/public/duolai_applet',
    method: 'get',
    params,
  });
}

// 授权文件
export function authorizeFileList(params) {
  return request({
    url: '/public/authorize_file',
    method: 'get',
    params,
  });
}
