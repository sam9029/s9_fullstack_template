import request from '@/utils/request';

// 获取路由
// export const getRouters = () => {
//   return request({
//     url: '/manage/marking/user/test',
//     method: 'get'
//   })
// }

export const getRouters = () => {
  return request({
    url: '/manage/marking/user/router',
    method: 'get',
  });
};

export const getPermsMapper = () => {
  return request({
    url: '/manage/marking/user/perms_mapper',
    method: 'get',
  });
};
