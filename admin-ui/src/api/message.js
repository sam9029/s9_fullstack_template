import request from '@/utils/request.js';

export function messageList(params) {
  return request({
    url: '/manage/message/list',
    method: 'get',
    params,
  });
}

export function messageCount(params) {
  return request({
    url: '/manage/message/count',
    method: 'get',
    params,
  });
}

export function messageSave(data) {
  const send = Object.assign({}, data);
  return request({
    url: '/manage/message/save',
    method: 'post',
    data: send,
  });
}
