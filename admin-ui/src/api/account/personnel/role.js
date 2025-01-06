import request from '@/utils/request';

// 查询角色列表
export function listRole(query) {
  return request({
    url: '/manage/marking/role/list',
    method: 'get',
    params: query,
  });
}
// 查询角色列表
export function upperRole(query) {
  return request({
    url: '/manage/marking/role/upper',
    method: 'get',
    params: query,
  });
}
// 查询角色树形结构
export function treeRole(query) {
  return request({
    url: '/manage/marking/role/tree',
    method: 'get',
    params: query,
  });
}
// 查询角色详细
export function getRole(params) {
  return request({
    url: '/manage/marking/role/def',
    method: 'get',
    params,
  });
}

// 新增角色
export function addRole(data) {
  return request({
    url: '/manage/marking/role/add',
    method: 'post',
    data: data,
  });
}

// 修改角色
export function updateRole(data) {
  return request({
    url: '/manage/marking/role/edit',
    method: 'post',
    data: data,
  });
}

// 角色数据权限
export function dataScope(data) {
  return request({
    url: '/system/role/dataScope',
    method: 'put',
    data: data,
  });
}

// 角色状态修改
// export function changeRoleStatus(roleId, status) {
//   const data = {
//     roleId,
//     status
//   }
//   return request({
//     url: '/system/role/changeStatus',
//     method: 'put',
//     data: data
//   })
// }

// 删除角色
export function delRole(data) {
  return request({
    url: '/manage/marking/role/del',
    method: 'post',
    data: data,
  });
}

// 导出角色
export function exportRole(query) {
  return request({
    url: '/system/role/export',
    method: 'get',
    params: query,
  });
}

export function postTree(params) {
  return request({
    url: '/manage/marking/role/post_tree',
    method: 'get',
    params,
  });
}
