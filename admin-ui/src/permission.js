import router from './router';
import store from './store';
import { Message } from 'element-ui';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { getToken } from '@/utils/common/auth';

NProgress.configure({ showSpinner: false });

const whiteList = [
  '/login',
  '/auth-redirect',
  '/bind',
  '/register',
  '/auth/privacy',
  '/auth/user',
  '/login/personal',
  '/login/mcn',
];

router.beforeEach((to, from, next) => {
  NProgress.start();
  if (getToken()) {
    to.meta.title && store.dispatch('settings/setTitle', to.meta.title);
    /* has token*/
    if (to.path === '/login') {
      next({ path: '/' });
      NProgress.done();
    } else if (to.path === '/401' || to.path === '/404') {
      next();
      NProgress.done();
    } else {
      if (store.getters.roles.length === 0) {
        // 判断当前用户是否已拉取完user_info信息
        store
          .dispatch('GetInfo')
          .then(() => {
            Promise.all([store.dispatch('queryRoutes'), store.dispatch('queryPermsMapper')]).then(
              (res) => {
                // 根据roles权限生成可访问的路由表
                router.addRoutes(res[0]); // 动态添加可访问路由表
                next({ ...to, replace: true });
              },
            );
          })
          .catch((err) => {
            store.dispatch('LogOut').then(() => {
              Message.error(err);
              next({ path: '/' });
            });
          });
      } else {
        if (whiteList.includes(to.path) || to.meta.hasPermission) {
          next();
        } else {
          console.log('unauthorized path', to.path);
          next({ path: '/401' });
          NProgress.done();
        }
      }
    }
  } else {
    // 没有token
    next();
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next();
    } else {
      next(`/login?redirect=${to.fullPath}`); // 否则全部重定向到登录页
      NProgress.done();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});
