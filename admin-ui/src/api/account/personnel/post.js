import request from '@/utils/request';

// 查询部门列表
export function postDropdownList(query) {
  return request({
    url: '/manage/marking/post/drop_down_list',
    method: 'get',
    params: query,
  });
}
