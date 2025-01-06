import request from '@/utils/request';

// 获取list
export function export_log(params) {
  return request({
    url: '/public/export_log',
    method: 'get',
    params,
  });
}


// 获取下载链接
export function export_download(params) {
  return request({
    url: '/public/export_def',
    method: 'get',
    params,
  });
}