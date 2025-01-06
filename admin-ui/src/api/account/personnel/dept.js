import request from '@/utils/request';

// 查询部门列表
export function listDept(query) {
  return request({
    url: '/manage/marking/dept/list',
    method: 'get',
    params: query,
  });
}

// 查询部门列表（排除节点）
// export function listDeptExcludeChild(deptId) {
//   return request({
//     url: '/system/dept/list/exclude/' + deptId,
//     method: 'get'
//   })
// }

// 查询部门详细
export function getDept(params) {
  return request({
    url: '/manage/marking/dept/def',
    method: 'get',
    params,
  });
}

// 查询部门下拉树结构,目前部门非树形结构，为水平结构
export function treeselect() {
  return request({
    url: '/manage/marking/dept/tree',
    method: 'get',
  });
}

// 根据角色ID查询部门树结构
// export function deptDeptTreeselect(deptId) {
//   return request({
//     url: '/system/dept/deptDeptTreeselect/' + deptId,
//     method: 'get'
//   })
// }

// 新增部门
export function addDept(data) {
  return request({
    url: '/manage/marking/dept/add',
    method: 'post',
    data: data,
  });
}

// 修改部门
export function updateDept(data) {
  return request({
    url: '/manage/marking/dept/edit',
    method: 'post',
    data: data,
  });
}

// 删除部门
export function delDept(data) {
  return request({
    url: '/manage/marking/dept/del',
    method: 'post',
    data,
  });
}

export function dataScope(data) {
  return request({
    url: '/system/role/dataScope',
    method: 'post',
    data: data,
  });
}
