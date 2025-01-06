import request from '@/utils/request';

// 列表
export function list(params) {
  return request({
    url: '/manage/tool/system_config/commission_policy/list',
    method: 'get',
    params,
  });
}

// 新增
export function add(data) {
  return request({
    url: '/manage/tool/system_config/commission_policy/add',
    method: 'post',
    data,
  });
}

// 详情
export function def(params) {
  return request({
    url: '/manage/tool/system_config/commission_policy/def',
    method: 'get',
    params,
  });
}

// 删除
export function del(data) {
  return request({
    url: '/manage/tool/system_config/commission_policy/del',
    method: 'post',
    data,
  });
}
