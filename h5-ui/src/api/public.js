import request from '@/utils/request';

// 获取账户分类
export function getCategroy(params) {
  return request({
    url: '/public/categroy',
    method: 'get',
    params,
  });
}

// 获取账户平台
export function getPlatform(params) {
  return request({
    url: '/public/platform',
    method: 'get',
    params,
  });
}

// 用户下拉
export function getUser(params) {
  return request({
    url: '/public/user',
    method: 'get',
    params,
  });
}

// 获取用户信息
export function getUserInfo(params) {
  return request({
    url: '/public/account/info',
    method: 'get',
    params
  })
}

export function upload_file(params, file) {
  const formData = new FormData();
  formData.append('name', file.name);
  formData.append('file', file);
  return request({
    timeout: 120000,
    ...config,
    headers: {
      // 'Content-Type': 'application/octet-stream',
      'Content-Type': 'multipart/form-data',
    },
    url: '/public/applet_upload',
    method: 'post',
    params,
    data: formData,
  });
}