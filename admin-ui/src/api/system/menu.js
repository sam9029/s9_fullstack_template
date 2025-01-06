import request from '@/utils/request';

// 查询菜单列表
export function listMenu(params) {
  return request({
    url: '/manage/marking/router/list',
    method: 'get',
    params,
  });
}

// 查询菜单详细
export function getMenu(params) {
  return request({
    url: '/manage/marking/router/def',
    method: 'get',
    params,
  });
}

// 查询菜单下拉树结构
export function treeselect(params) {
  return request({
    url: '/manage/marking/router/tree',
    method: 'get',
    params,
  });
}

// 根据角色ID查询菜单下拉树结构
export function roleMenuTreeselect(roleId) {
  return request({
    url: '/system/menu/roleMenuTreeselect/' + roleId,
    method: 'get',
  });
}

// 新增菜单
export function addMenu(data) {
  return request({
    url: '/manage/marking/router/add',
    method: 'post',
    data: data,
  });
}

// 修改菜单
export function updateMenu(data) {
  return request({
    url: '/manage/marking/router/edit',
    method: 'post',
    data: data,
  });
}

// 删除菜单
export function delMenu(data) {
  return request({
    url: '/manage/marking/router/del',
    method: 'post',
    data,
  });
}

// 查询数据权限菜单下拉树结构
export function dataTree(params) {
  return request({
    url: '/manage/marking/router/data_tree',
    method: 'get',
    params,
  });
}
