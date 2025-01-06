import { login, logout, getInfo, scanLogin } from '@/api/login';
import { getToken, setToken, removeToken } from '@/utils/common/auth';
import { getUserData } from '@/utils/common/user';
import router from '../../router';
import { filterAsyncRouter } from './dealTree';
import { getFingerPrint, sendFingerPrint } from '@/utils/fingerprint';
import { USER_DEFAULT_AVATAR } from '@/utils/config/constants';

const user = {
  state: {
    token: getToken(),
    name: '',
    avatar: '',
    roles: [],
    permissions: [],
    currentUserData: getUserData(),
    userInfo: {}, //个人信息
    fingerprint: {},
    isManufacturer: false,
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token;
    },
    SET_NAME: (state, name) => {
      state.name = name;
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar;
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles;
      roles.forEach((el) => {
        if (el.id == 6) {
          state.isManufacturer = true;
        }
      });
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions;
    },
    SET_CURRENT_USER_DATA: (state, data) => {
      state.currentUserData = data;
    },
    SET_PERSONAL_INFO: (state, data) => {
      state.userInfo = data;
    },
    SET_FINGERPRENT: (state, data) => {
      state.fingerprint = data;
    },
    SET_ISMANUFACTURER: (state, data) => {
      state.isManufacturer = data;
    },
  },

  actions: {
    // 登录
    // 退出系统
    async GetFingerPrint({ commit, state }) {
      const fingerprint = await getFingerPrint()
      commit('SET_FINGERPRENT', fingerprint)
      return fingerprint
    },
    async Login({ commit, state, dispatch }, userInfo) {
      const username = userInfo.username.trim();
      const password = userInfo.password;
      const captcha_code = userInfo.captcha_code;
      const check_realname = userInfo.check_realname;
      let fingerprint = await dispatch('GetFingerPrint')
      return new Promise((resolve, reject) => {
        login(username, password, captcha_code, check_realname, fingerprint)
          .then((res) => {
            if (res.code == 0) {
              setToken(res.token);
              commit('SET_TOKEN', res.token);
              Promise.all([
                dispatch('setInfo', res.data),
                dispatch('setRoutes', res.routers),
                dispatch('setPermsMapper', res.mapper),
              ]).then(() => {
                const rdata = JSON.parse(JSON.stringify(res.routers.router));
                const rewriteRoutes = filterAsyncRouter(rdata, false, true);
                if (res.routers?.first_router) {
                  rewriteRoutes.push({
                    hidden: true,
                    path: '/',
                    redirect: res.routers.first_router,
                  });
                }
                router.addRoutes(rewriteRoutes);
                resolve(res);
              });
            } else {
              resolve(res || { err: '未知错误' });
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    ScanCodeLogin({ commit, state, dispatch }, { uuid, time, check_realname = false }) {
      return new Promise((resolve, reject) => {
        scanLogin({ uuid, time, check_realname })
          .then((data) => {
            if (data.code == 0) {
              setToken(data.token);
              commit('SET_TOKEN', data.token);
              Promise.all([
                dispatch('setInfo', data.data),
                dispatch('setRoutes', data.router),
                dispatch('setPermsMapper', data.mapper),
              ]).then(() => {
                const rdata = JSON.parse(JSON.stringify(data.routers.router));
                const rewriteRoutes = filterAsyncRouter(rdata, false, true);
                if (data.routers?.first_router) {
                  rewriteRoutes.push({
                    hidden: true,
                    path: '/',
                    redirect: data.routers.first_router,
                  });
                }
                router.addRoutes(rewriteRoutes);
                resolve(data);
              });
            } else {
              resolve(data || { err: '未知错误' });
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 获取用户信息
    GetInfo({ commit, state, dispatch }) {
      return new Promise((resolve, reject) => {
        getInfo()
          .then((res) => {
            if (!res || res.code !== 0) {
              reject('获取用户信息失败');
            }
            dispatch('setInfo', res.data).then(() => {
              resolve(res.data);
            });
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    setInfo({ commit, state, dispatch }, user_data) {
      return new Promise((resolve, reject) => {
        const platform_setting = JSON.parse(user_data.setting || '{}');
        const avatar = user_data.avatar || USER_DEFAULT_AVATAR;

        if (user_data.role && user_data.role.length > 0) {
          // 验证返回的roles是否是一个非空数组
          commit('SET_ROLES', user_data.role);
          // 个人信息存储
          commit('SET_PERSONAL_INFO', user_data);
        } else {
          commit('SET_ROLES', ['ROLE_DEFAULT']);
        }
        commit('SET_NAME', user_data.name);
        commit('SET_AVATAR', avatar);
        dispatch('settings/changeCompanySetting', platform_setting).then(() => resolve(user_data));
      }).catch((error) => {
        throw error;
      });
    },

    // 退出系统
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        commit('SET_TOKEN', '');
        commit('SET_ROLES', []);
        commit('SET_PERMISSIONS', []);
        removeToken();
        resolve();
      });
    },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise((resolve) => {
        commit('SET_TOKEN', '');
        removeToken();
        resolve();
      });
    },
  },
};

export default user;
