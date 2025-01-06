import request from '@/utils/request';

export function list(query) {
  return request({
    url: '/manage/tool/system_config/category/list',
    method: 'get',
    params: query,
  });
}

export function create(data) {
  return request({
    url: '/manage/tool/system_config/category/add',
    method: 'post',
    data,
  });
}

export function update(data) {
  return request({
    url: '/manage/tool/system_config/category/edit',
    method: 'post',
    data,
  });
}

export function remove(data) {
  return request({
    url: '/manage/tool/system_config/category/del',
    method: 'post',
    data,
  });
}

export function updateStatus(data) {
  return request({
    url: '/manage/tool/system_config/category/update_status',
    method: 'post',
    data,
  });
}
