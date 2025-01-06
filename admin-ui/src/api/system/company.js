import request from '@/utils/request';

// 查询菜单列表
export function listCompany(query) {
  return request({
    url: '/manage/marking/company/list',
    method: 'get',
    params: query,
  });
}

// 查询菜单列表
export function companyDownList(query) {
  return request({
    url: '/manage/marking/company/down_list',
    method: 'get',
    params: query,
  });
}

// 查询菜单详细
export function getCompany(params) {
  return request({
    url: '/manage/marking/company/def',
    method: 'get',
    params,
  });
}

// 查询菜单下拉树结构
// export function treeselect() {
//   return request({
//     url: '/manage/marking/router/tree',
//     method: 'get'
//   })
// }

// 根据角色ID查询菜单下拉树结构
// export function roleMenuTreeselect(roleId) {
//   return request({
//     url: '/system/menu/roleMenuTreeselect/' + roleId,
//     method: 'get'
//   })
// }

// 新增菜单
export function addCompany(data) {
  return request({
    url: '/manage/marking/company/add',
    method: 'post',
    data: data,
  });
}

// 修改菜单
export function updateCompany(data) {
  return request({
    url: '/manage/marking/company/edit',
    method: 'post',
    data: data,
  });
}

// 删除菜单
export function delCompany(data) {
  return request({
    url: '/manage/marking/company/del',
    method: 'post',
    data: data,
  });
}
