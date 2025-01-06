import request from '@/utils/request';

export function list(query) {
  return request({
    url: '/manage/tool/system_config/reciving_company/list',
    method: 'get',
    params: query,
  });
}

export function create(data) {
  return request({
    url: '/manage/tool/system_config/reciving_company/add',
    method: 'post',
    data,
  });
}

export function update(data) {
  return request({
    url: '/manage/tool/system_config/reciving_company/update',
    method: 'post',
    data,
  });
}