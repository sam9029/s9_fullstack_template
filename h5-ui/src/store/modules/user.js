import { defineStore } from 'pinia';
// import { pinia } from '@/store';
import { router } from '@/routes';
import { WHITE_LIST } from '@/routes/whiteList';
import {
  getLocalUser,
  setLocalUser,
  removeLocalUser,
  setPageTitle,
  setLocalInvitee,
} from '@/utils/storage/user';
import { getToken, setToken, removeToken } from '@/utils/storage/token';
import { getChannelId } from '@/utils/storage/user';
import { useAuthStore } from './auth';
import { useAppStoreWithOut } from './app';
// api
import { logout as logout_api } from '@/api/login';
import { getFingerPrint, sendFingerPrint } from '@/utils/request/fingerprint.js';
export const useUserStore = defineStore({
  id: 'user',
  state: () => {
    let user_data = getLocalUser();
    return {
      hasLogin: false,
      token: getToken() || null,
      channel_id: getChannelId() || null,
      channel_name: '',
      userInfo: user_data?.data || {},
      router: [],
      invitee: '', //邀请者
      qr_link: user_data?.qr_link ? user_data?.qr_link : {} || {},
      fingerprint: {},
    };
  },
  getters: {
    account_id: (state) => state.userInfo.id,
    account_name: (state) => state.userInfo.name,
    account_type: (state) => state.userInfo.account_type, // 1、博主 2、投顾 3、其他（管理员商务等）
    avaturl: (state) => state.userInfo.avatar,
    birth: (state) => state.userInfo.birth,
    email: (state) => state.userInfo.email,
    gender: (state) => state.userInfo.gender,
    phone: (state) => state.userInfo.telephone,
    region: (state) => state.userInfo.region,
    user_info: (state) => state.userInfo,
    finger_print: (state) => state.fingerprint,
  },
  actions: {
    SET_FINGERPRENT: (state, data) => {
      state.fingerprint = data;
    },
    GET_FINGERPRINT() {
      return new Promise((resolve, reject) => {
        getFingerPrint()
          .then((res) => {
            this.SET_FINGERPRENT(res);
            resolve(res);
          })
          .catch((err) => { reject(err) });
      });
    },

    SET_CHANNEL_NAME(name) {
      this.channel_name = name;
    },

    SET_CURRENT_USER(data, router) {
      let { setting = {}, qr_link = null } = data; // 设置qr_link的默认值为null
      if (setting?.theme) useAppStoreWithOut().setThemeColor(setting.theme);
      this.userInfo = data;
      this.router = router;
      this.hasLogin = true;
      this.qr_link = qr_link;
      let index = window.location.pathname.indexOf('/h5');
      const whiteList = WHITE_LIST.map((el) => el.path);
      if (index !== -1) {
        let currentPath = window.location.pathname.substring(index + 3);
        if (whiteList.includes(currentPath) && !data?.channel_name) {
          this.SET_CHANNEL_NAME('小果繁星');
          setPageTitle('小果繁星');
        } else if (data?.channel_name) {
          this.SET_CHANNEL_NAME(data?.channel_name);
          setPageTitle(data?.channel_name);
        }
      }

      setLocalUser({ data, qr_link, token: this.token });
    },

    async LOGOUT_ASYNC() {
      await logout_api();

      this.userInfo = {};
      this.hasLogin = false;
      this.token = null;
      removeLocalUser();

      const authStore = useAuthStore();
      authStore.clearAuthority();
      router.replace('/login');
    },
    AFTER_LOGIN(res) {
      if (!res.token) throw new Error('token不存在');
      setToken(res.token);
      this.SET_CURRENT_USER(res.data, res.router);
    },
  },
});
