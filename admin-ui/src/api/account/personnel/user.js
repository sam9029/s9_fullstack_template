import request from '@/utils/request';
import store from '@/store';

import { praseStrEmpty } from '@/utils/ruoyi';

// 查询用户列表
export function listUser(query) {
  return request({
    url: '/manage/marking/user/list',
    method: 'get',
    params: query,
  });
}

// 查询用户列表下拉
/*传值*/ 
// koc_role: 1 表示商务
// role_id: (1:超级管理员 2:投顾 3:博主 4:渠道管理员 5:拍剪 6:后期 147:管理员)
// 另外的 public.js 中 userSelect 也可搜索人员
export function downUser(query) {
  return request({
    url: '/manage/marking/user/down_list',
    method: 'get',
    params: query,
  });
}

// 查询用户详细
export function getUser(params) {
  return request({
    url: '/manage/marking/user/def',
    method: 'get',
    params,
  });
}

// 新增用户
export function addUser(data) {
  return request({
    url: '/manage/marking/user/add',
    method: 'post',
    data: data,
  });
}

// 修改用户
export function updateUser(data) {
  return request({
    url: '/manage/marking/user/edit',
    method: 'post',
    data: data,
  });
}

// 个人中心 修改用户
export function updateSelfUser(data) {
  return request({
    url: '/public/account/edit',
    method: 'post',
    data: data,
  });
}

// 删除用户
export function delUser(userId) {
  return request({
    url: '/system/user/' + userId,
    method: 'delete',
  });
}

// 导出用户
export function exportUser(query) {
  return request({
    url: '/system/user/export',
    method: 'get',
    params: query,
  });
}

// 用户密码重置
export function resetUserPwd(userId, password) {
  const data = {
    userId,
    password,
  };
  return request({
    url: '/system/user/resetPwd',
    method: 'put',
    data: data,
  });
}

// // 用户状态修改
// export function changeUserStatus(userId, status) {
//   const data = {
//     userId,
//     status
//   }
//   return request({
//     url: '/system/user/changeStatus',
//     method: 'put',
//     data: data
//   })
// }

// 修改用户个人信息
export function updateUserProfile(data) {
  return request({
    url: '/system/user/profile',
    method: 'put',
    data: data,
  });
}

// 用户密码重置
export function updateUserPwd(data) {
  return request({
    // url: `/manage/marking/user/update_password`,
    url: `/public/account/change_password`,
    method: 'post',
    data: data,
  });
}

// 用户头像上传
export function uploadAvatar(data, params) {
  return request({
    url: '/manage/marking/user/avatar',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    method: 'post',
    data: data,
    params,
  });
}

// 完善资质信息
export function qualificationUpload(data) {
  return request({
    url: '/manage/creator_manage/upload',
    method: 'post',
    data,
  });
}

// 下载用户导入模板
export function importTemplate() {
  return request({
    url: '/system/user/importTemplate',
    method: 'get',
  });
}

//
export function upperUser(params) {
  return request({
    url: '/manage/marking/user/upper_user',
    method: 'get',
    params,
  });
}

export function subUser(params) {
  return request({
    url: '/manage/marking/user/sub_user',
    method: 'get',
    params,
  });
}

//
export function roleAuthTree(params) {
  return request({
    url: '/manage/marking/user/role_auth_tree',
    method: 'get',
    params,
  });
}

export function updateBankInfo(data) {
  return request({
    url: '/manage/marking/user/update_bank_info',
    method: 'post',
    data,
  });
}
