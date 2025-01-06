import request from '@/utils/request';

// 查询消息列表
export function list(params) {
  return request({
    url: '/manage/tool/message/list',
    method: 'get',
    params,
  });
}

// 新增消息
export function add(data) {
  return request({
    url: '/manage/tool/message/add',
    method: 'post',
    data: data,
  });
}

// 查询消息详细
export function def(params) {
  return request({
    url: '/manage/tool/message/def',
    method: 'get',
    params,
  });
}

// 删除消息
export function del(data) {
  return request({
    url: '/manage/tool/message/del',
    method: 'post',
    data: data,
  });
}

// 改变消息状态
export function updateStatus(data) {
  return request({
    url: '/manage/tool/message/update',
    method: 'post',
    data,
  });
}

function rs1() {
  return Promise.resolve({
    code: 0,
    data: [
      {
        id: 446399,
        type: 1,
        title: '标题',
        sender_user_id: 10000001,
        send_time: '2023-07-29 07:51:05',
        send_status: 1,
        message: '{}',
        show_message: '[]',
        status: 1,
        create_user_id: 10000001,
        update_user_id: 10000001,
        create_time: '2023-07-29 19:37:10',
        update_time: '2023-07-29 19:51:03',
        oem_id: 1,
        create_user_name: '超级管理员',
        sender_user_name: '超级管理员',
      },
      {
        id: 446399,
        type: 1,
        title: '标题',
        sender_user_id: 10000001,
        send_time: '2023-07-29 07:51:05',
        send_status: 2,
        message: '{}',
        show_message: '[]',
        status: 1,
        create_user_id: 10000001,
        update_user_id: 10000001,
        create_time: '2023-07-29 19:37:10',
        update_time: '2023-07-29 19:51:03',
        oem_id: 1,
        create_user_name: '超级管理员',
        sender_user_name: '超级管理员',
      },
      {
        id: 446399,
        type: 1,
        title: '标题',
        sender_user_id: 10000001,
        send_time: '2023-07-29 07:51:05',
        send_status: 3,
        message: '{}',
        show_message: '[]',
        status: 1,
        create_user_id: 10000001,
        update_user_id: 10000001,
        create_time: '2023-07-29 19:37:10',
        update_time: '2023-07-29 19:51:03',
        oem_id: 1,
        create_user_name: '超级管理员',
        sender_user_name: '超级管理员',
      },
      {
        id: 446399,
        type: 1,
        title: '标题',
        sender_user_id: 10000001,
        send_time: '2023-07-29 07:51:05',
        send_status: 1,
        message: '{}',
        show_message: '[]',
        status: 3,
        create_user_id: 10000001,
        update_user_id: 10000001,
        create_time: '2023-07-29 19:37:10',
        update_time: '2023-07-29 19:51:03',
        oem_id: 1,
        create_user_name: '超级管理员',
        sender_user_name: '超级管理员',
      },
    ],
  });
}
