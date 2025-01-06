import request from '@/utils/request';

export function list(params) {
  return request({
    url: '/manage/tool/system_config/keyword_content/list',
    method: 'get',
    params,
  });
}

export function add(data) {
  return request({
    url: '/manage/tool/system_config/keyword_content/add',
    method: 'post',
    data,
  });
}

export function update_status(data) {
  return request({
    url: '/manage/tool/system_config/keyword_content/update_status',
    method: 'post',
    data,
  });
}

export function edit(data) {
  return request({
    url: '/manage/tool/system_config/keyword_content/edit',
    method: 'post',
    data,
  });
}

export function def(params) {
  return request({
    url: '/manage/tool/system_config/keyword_content/def',
    method: 'get',
    params,
  });
}

export function def_url(data) {
  return request({
    url: '/manage/tool/system_config/keyword_content/def_url',
    method: 'post',
    data,
  });
}

export function import_data(data) {
  return request({
    url: '/manage/tool/system_config/keyword_content/import_data',
    method: 'post',
    data,
  });
}
