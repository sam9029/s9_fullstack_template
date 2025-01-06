import request from '@/utils/request';

export function list(query) {
  return request({
    url: '/manage/tool/system_config/material/list',
    method: 'get',
    params: query,
  });
}

export function create(data) {
  return request({
    url: '/manage/tool/system_config/material/add',
    method: 'post',
    data,
  });
}

export function update(data) {
  return request({
    url: '/manage/tool/system_config/material/edit',
    method: 'post',
    data,
  });
}

export function remove(data) {
  return request({
    url: '/manage/tool/system_config/material/del',
    method: 'post',
    data,
  });
}

export function updateStatus(data) {
  return request({
    url: '/manage/tool/system_config/material/update_status',
    method: 'post',
    data,
  });
}
