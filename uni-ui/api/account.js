import request from "@/utils/request";

// 查询用户列表
export function listAccount(query) {
  return request({
    url: "/v1/admin/account/list",
    method: "get",
    data: query,
  });
}

// 查询用户详细
export function getLoginUserInfo(data) {
  return request({
    url: `/manage/marking/user/info`,
    method: "get",
    data,
  });
}

// 新增用户
export function addAccount(data) {
  const send = Object.assign({}, data);
  send.roles = JSON.stringify(send.roles);
  return request({
    url: "/v1/admin/account/insert",
    method: "post",
    data: send,
  });
}

// 修改用户
export function updateAccount(data) {
  const send = Object.assign({}, data);
  if (!send.password) delete send.password;
  send.roles = JSON.stringify(send.roles);
  delete send.id;
  return request({
    url: `/v1/admin/account/update/${data.id}`,
    method: "put",
    data: send,
  });
}

// 用户密码重置
export function resetAccountPwd(id, new_password, old_password) {
  const data = {
    new_password,
    old_password,
  };
  return request({
    url: `/v1/admin/account/reset_password/${id}`,
    method: "post",
    data: data,
  });
}

// 用户状态修改
export function changeAccountStatus(userId, status) {
  const data = {
    userId,
    status,
  };
  return request({
    url: "/system/user/changeStatus",
    method: "put",
    data: data,
  });
}

// 查询用户个人信息
export function getAccountProfile() {
  return request({
    url: "/system/user/profile",
    method: "get",
  });
}

// 修改用户个人信息
export function updateAccountProfile(data) {
  return request({
    url: "/system/user/profile",
    method: "put",
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
    url: "/system/user/profile/updatePwd",
    method: "put",
    data: data,
  });
}

// 用户头像上传
export function uploadAvatar(data) {
  return request({
    url: "/system/user/profile/avatar",
    method: "post",
    data: data,
  });
}

// 下载用户导入模板
export function importTemplate() {
  return request({
    url: "/system/user/importTemplate",
    method: "get",
  });
}

export function userInfoEdit(data) {
  return request({
    url: "/applet/user/account/update",
    method: "POST", //默认的是GET,必须大写
    data,
  });
}

// 设置openid
export function setOpenId(data) {
  return request({
    url: `/manage/marking/user/set_openid`,
    method: "post",
    data,
  });
}

// 获取客服
export function getConcat() {
  return request({
    url: "/login/concat",
    method: "get",
  });
}
// 获取客服
export function getConcatOnline(data) {
  return request({
    url: "/public/customer_service",
    method: "get",
    data
  });
}

// 滑动验证码
export function getSlideCode() {
  return request({
    url: "/login/slide_code",
    method: "get",
  });
}

// 获取邀请信息
export function getInviteInfo() {
  return request({
    url: '/applet/user/invite/info',
    method: 'get'
  })
}

// 登录
export function postLogin(data) {
  return request({
    url: '/duolai/login',
    method: 'post',
    timeout: 3000,
    data
  })
}

// 获取导师微信
export function getLeaderWechat(data) {
  return request({
    url: '/applet/user/account/leader_wechat',
    method: 'get',
    data
  })
}