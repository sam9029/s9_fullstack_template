import { createRouter, createWebHistory } from 'vue-router';
import { WHITE_LIST } from './whiteList';
const modules = import.meta.glob('@/views/**/**/*.vue');

const _import = (path) => {
  return modules[`/src/views/${path}.vue`];
};
const basicRoutes = [
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    redirect: '/scenario/home',
    children: [
      //静态页白名单路由，勿动
      ...WHITE_LIST,
    ],
  },
  // 下面写H5 推广、变现页面的路由，使用路由懒加载 示例
  {
    path: '/scenario',
    component: () => import('@/layouts/index.vue'),
    redirect: '/scenario/home',
    children: [
      // 首页
      {
        path: 'home',
        component: _import('Scenario/home'),
        name: 'Home',
        meta: {
          name: '首页'
        }
      },
    ],
  },
];

export const router = createRouter({
  // 创建一个 hash 历史记录。
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
  // 应该添加到路由的初始路由列表。
  routes: basicRoutes,
  // 是否应该禁止尾部斜杠。默认为假
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

// config router
export function setupRouter(app) {
  app.use(router);
}
