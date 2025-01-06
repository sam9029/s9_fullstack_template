import request from '@/utils/request';

export function list(query) {
  return request({
    url: '/manage/tool/system_config/platform/list',
    method: 'get',
    params: query,
  });
}

export function create(data) {
  return request({
    url: '/manage/tool/system_config/platform/add',
    method: 'post',
    data,
  });
}

export function update(data) {
  return request({
    url: '/manage/tool/system_config/platform/edit',
    method: 'post',
    data,
  });
}

export function remove(data) {
  return request({
    url: '/manage/tool/system_config/platform/del',
    method: 'post',
    data,
  });
}

export function updateStatus(data) {
  return request({
    url: '/manage/tool/system_config/platform/update_status',
    method: 'post',
    data,
  });
}
