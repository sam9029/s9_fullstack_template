import request from '@/utils/request';

export function list(query) {
  return request({
    url: '/manage/tool/approval_process_v2/list',
    method: 'get',
    params: query,
  });
}

export function add(data) {
  return request({
    url: '/manage/tool/approval_process_v2/add',
    method: 'post',
    data,
  });
}

export function def(query) {
  return request({
    url: '/manage/tool/approval_process_v2/def',
    method: 'get',
    params: query,
  });
}

export function del(data) {
  return request({
    url: '/manage/tool/approval_process_v2/del',
    method: 'post',
    data,
  });
}
