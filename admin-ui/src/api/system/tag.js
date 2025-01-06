import request from '@/utils/request';

export function list(query) {
  return request({
    url: '/manage/tool/system_config/platform_tag/list',
    method: 'get',
    params: query,
  });
}

export function create(data) {
  return request({
    url: '/manage/tool/system_config/platform_tag/add',
    method: 'post',
    data,
  });
}

export function update(data) {
  return request({
    url: '/manage/tool/system_config/platform_tag/edit',
    method: 'post',
    data,
  });
}

export function remove(data) {
  return request({
    url: '/manage/tool/system_config/platform_tag/del',
    method: 'post',
    data,
  });
}

export function updateStatus(data) {
  return request({
    url: '/manage/tool/system_config/platform_tag/update_status',
    method: 'post',
    data,
  });
}

// ------------内容标签------------------
//列表
export function tagList(params) {
  return request({
    url: '/manage/tool/system_config/tag/list',
    method: 'get',
    params,
  })
}

//新增
export function createTag(data) {
  return request({
    url: '/manage/tool/system_config/tag/add',
    method: 'post',
    data
  })
} 

//编辑
export function editTag(data) {
  return request({
    url: '/manage/tool/system_config/tag/edit',
    method: 'post',
    data
  })
}

//删除
export function deleteTag(data) {
  return request({
    url: '',
    method: 'post',
    data
  })
}