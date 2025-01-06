// 路由白名单，这部分路由为静态访问页面
export const WHITE_LIST = [
  {
    path: '/login',
    component: () => import('@/views/WhiteList/login.vue'),
    name: 'Login',
    meta: {
      name: '登录'
    }
  },
  {
    path: '/register',
    component: () => import('@/views/WhiteList/register.vue'),
    name: 'Register',
    meta: {
      name: '注册'
    }
  },
  {
    path: '/error',
    component: () => import('@/views/WhiteList/error.vue'),
    name: 'Error',
    meta: {
      name: '错误'
    }
  },
];
