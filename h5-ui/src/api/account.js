import request from '@/utils/request';

// 用户状态修改
export function changeAccountStatus(userId, status) {
  const data = {
    userId,
    status,
  };
  return request({
    url: '/system/user/changeStatus',
    method: 'put',
    data: data,
  });
}

// 查询用户个人信息
export function getAccountProfile() {
  return request({
    url: '/system/user/profile',
    method: 'get',
  });
}

// 修改用户个人信息
export function updateAccountProfile(data) {
  return request({
    url: '/system/user/profile',
    method: 'put',
    data: data,
  });
}

// 用户密码重置
export function updateAccountPwd(oldPassword, newPassword) {
  const data = {
    oldPassword,
    newPassword,
  };
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    data: data,
  });
}

// 设置openid
export function setOpenId(data) {
  return request({
    url: `/manage/marking/user/set_openid`,
    method: 'post',
    data,
  });
}

// 获取客服
export function getConcat() {
  return request({
    url: '/login/concat',
    method: 'get',
  });
}
