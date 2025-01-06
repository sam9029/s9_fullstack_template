import { constantRoutes } from '@/router';
import { getRouters, getPermsMapper } from '@/api/menu';
import { filterAsyncRouter } from './dealTree';

const permission = {
  state: {
    routes: [],
    addRoutes: [],
    defaultRoutes: [],
    topbarRouters: [],
    sidebarRouters: [],
    permsMapper: {},
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes;
      state.routes = constantRoutes.concat(routes);
    },
    SET_DEFAULT_ROUTES: (state, routes) => {
      state.defaultRoutes = constantRoutes.concat(routes);
    },
    SET_TOPBAR_ROUTES: (state, routes) => {
      // 顶部导航菜单默认添加统计报表栏指向首页
      const index = [
        // {
        //   path: "/index",
        //   meta: { title: "首页", icon: "dashboard" }
        // }
      ];
      state.topbarRouters = index.concat(routes);
    },
    SET_SIDEBAR_ROUTERS: (state, routes) => {
      state.sidebarRouters = routes;
    },
    SET_PERMS_MAPPER: (state, routes) => {
      state.permsMapper = routes;
    },
    SET_FIRST_ROUTER: (state, firstRouter) => {
      state.firstRouter = firstRouter;
    },
  },
  actions: {
    //#region ===== 路由
    // 向后端请求路由数据
    queryRoutes({ commit, state, dispatch }) {
      return new Promise((resolve) => {
        getRouters()
          .then((res) => {
            if (!res || res.code !== 0) throw res;
            dispatch('setRoutes', res.data).then((_rewriteRoutes) => {
              resolve(_rewriteRoutes);
            });
          })
          .catch((error) => {
            throw error;
          });
      });
    },
    setRoutes({ commit }, data) {
      return new Promise((resolve) => {
        const sdata = JSON.parse(JSON.stringify(data.router));
        const rdata = JSON.parse(JSON.stringify(data.router));

        const sidebarRoutes = filterAsyncRouter(sdata);
        const rewriteRoutes = filterAsyncRouter(rdata, false, true);

        rewriteRoutes.push({ path: '*', redirect: '/404', hidden: true });

        const permsButton = data.button.map((v) => v.id);
        const firstRouter = data.first_router ? data.first_router : '';

        commit('SET_ROUTES', rewriteRoutes);
        commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat(sidebarRoutes));
        commit('SET_DEFAULT_ROUTES', sidebarRoutes);
        commit('SET_TOPBAR_ROUTES', sidebarRoutes);
        commit('SET_PERMISSIONS', permsButton); //按钮权限
        commit('SET_FIRST_ROUTER', firstRouter); //按钮权限

        if (firstRouter)
          rewriteRoutes.push({
            hidden: true,
            path: '/',
            redirect: firstRouter,
          });
        resolve(rewriteRoutes);
      });
    },

    //#endregion

    //#region =====  按钮权限
    // 向后端按钮权限mapper
    queryPermsMapper({ commit }) {
      return new Promise((resolve) => {
        getPermsMapper().then((data) => {
          const mapper = JSON.parse(JSON.stringify(data.data));
          commit('SET_PERMS_MAPPER', mapper);
          resolve(mapper);
        });
      });
    },
    setPermsMapper({ commit }, data) {
      return new Promise((resolve) => {
        const mapper = JSON.parse(JSON.stringify(data));
        commit('SET_PERMS_MAPPER', mapper);
        resolve(mapper);
      });
    },
    //#endregion
  },
};

export default permission;
