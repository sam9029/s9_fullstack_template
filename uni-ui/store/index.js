import Vue from "vue";
import Vuex from "vuex";
import getters from "./getters";
import popularize from "./popularize";
import { getLimitIntegral } from "@/api/recort.js";
Vue.use(Vuex);
import { 
  getUserInfo, 
  setUserInfo, 
  deleteUserInfo, 
  setlocalLate, 
  getlocalLate, 
  setStage, 
  getStage,
  setToken,
  getToken
} from "@/utils/user.js";
import { userInfoEdit, postLogin } from "@/api/account.js";
import { getUserInfo as userInfoReq } from "@/api/public";
import { getAdPosition, getLocalLate } from "@/api/ad.js";
import { wxLogin, sleep, setThemeColor, setSystemInfo } from "@/utils/tools";
let show_model = false
function showUnloginModel(message, relaunch = false) {
  if (show_model) return
  show_model = true
  uni.showModal({
    title: "登录失败", content: message, showCancel: false, complete: () => {
      store.commit("LOGOUT", relaunch);
      show_model = false
    }
  })
}
const main_image_url = "https://koc-img.lizhibj.cn/applet/";
let user_data = getUserInfo();
const store = new Vuex.Store({
  state: {
    image: {
      data: `${main_image_url}data.png`,
      404: `${main_image_url}404.png`,
      address: `${main_image_url}address.png`,
      car: `${main_image_url}car.png`,
      message: `${main_image_url}message.png`,
      message_list: `${main_image_url}message_list.png`,
      order: `${main_image_url}order.png`,
      search: `${main_image_url}search.png`,
      wifi: `${main_image_url}wifi.png`,
      premission: `${main_image_url}premission.png`,
      bank: `${main_image_url}bank.png`,
      empty: `${main_image_url}empty.png`,
      lock: `${main_image_url}lock.png`,
      unlock: `${main_image_url}unlock.png`,
      data_main: `${main_image_url}data_main.png`,
      extension: `${main_image_url}extension.png`,
      building: `${main_image_url}building.png`,
      no_data_list: `/static/images/list_empty.png`,
    },
    forcedLogin: false,
    hasLogin: getToken() ? true : false,
    hasRelunch: false,
    logining: false,
    ad_loading: false,
    diskrouter: null,
    navbarHeight: 0, //px
    tabbarHeight: 0, //px
    invitee: null,// getlocalLate(), //邀请者
    token: user_data ? user_data.token || null : null,
    userInfo: user_data ? user_data.data || {} : {},
    // #ifndef APP
    staticPath: process.env.NODE_ENV != "development" ? 'https://wangsu.lizhibj.cn/open-img/cdn/joyful/applet/' : 'http://192.168.50.104:5500/',
    // #endif
    tabar: {
      current: 0,
      show: true,
      bgColor: "#ffffff",
      borderTop: true,
      list: [
        {
          text: '小说推文',
          name: 'novel'
        },
        {
          text: '超前点播',
          name: 'demand'
        },
        {
          text: '收益',
          name: 'income'
        },
        {
          text: '我的',
          name: 'mine'
        }
      ],
      midButton: false,
      inactiveColor: "#909399",
      activeColor: "#5EA7FD",
    },
    button_authority: [],
    router_authority: [],
    home_refresh_flag: null,
    // advertiser_mapper: {}
    applet_id: null,
    duolai_account_id: null,
    user_name: null,
    user_avatar: null,
    system: '',
    fingerprint: getStage('USER_LOCAL_DEVICE_ID'),
    local_late: getlocalLate(), //本地延迟，默认5000
    themeColor: '#408CFF',
    // #ifdef MP-KUAISHOU || MP-TOUTIAO
    themeMode: 'dark',
    share_image: 'https://koc-img.lizhibj.cn/duolai/share_ks_dark.png',
    // #endif
    // #ifdef MP-WEIXIN
    themeMode: 'light',
    share_image: 'https://koc-img.lizhibj.cn/duolai/share_wx_light.png',
    // #endif
    sleep_time: 2000,
    pay_info: getStage('PAY_SOURCE_AD') || {},
    ad_config: {
      ad_video: {},
      play_page: {},
      user_center: {},
      data_im_id: 'suiyueli5763',
      integral_mode: false
    },
    integralInfo: {},
    scanData: {
      uuid: null,
      time: null
    }
  },
  modules: {
    popularize,
    // message
  },
  mutations: {
    LOGOUT(state) {
      state.token = null;
      state.user_name = null;
      state.user_avatar = null;
      state.userInfo = {};
      state.hasLogin = false;
      deleteUserInfo();
    },
    SET_SYSTEM(state, system) {
      state.system = system
    },
    SET_PAY_INFO(state, pay_info) {
      pay_info = pay_info || {}
      state.pay_info = pay_info;
      delete pay_info.spl//该spl属性不用存放于stage中
      setStage('PAY_SOURCE_AD', { ...pay_info, spl: 0 })
    },
    SET_SLEEP_TIME(state, time) {
      state.sleep_time = time;
    },
    SET_TOKEN(state, token) {
      state.token = token;
    },
    SET_APPLET_ID(state, applet_id) {
      uni.setStorageSync('applet_id', applet_id);
      state.applet_id = applet_id;
    },
    SET_NAVBAR_HEIGHT(state, height) {
      state.navbarHeight = height;
    },
    SET_SHARE_IMAGE(state, image) {
      state.share_image = image;
    },
    SET_TABBAR_HEIGHT(state, height) {
      state.tabbarHeight = height;
    },
    SET_AVATURL(state, avatar) {
      state.userInfo.avatar = avatar;
    },
    SET_NAME(state, name) {
      state.userInfo.name = name;
    },
    SET_GENDER(state, gender) {
      state.userInfo.gender = gender;
    },
    SET_REGION(state, region) {
      state.userInfo.region = region;
    },
    SET_BIRTH(state, birth) {
      state.userInfo.birth = birth;
    },
    NAVIGATE(state, path) {
    },
    SET_CURRENT_TAB(state, current) {
      state.tabar.current = current;
    },
    SET_AUTHORITY(state, getData) {
      let { router, button } = getData || {};
      state.button_authority = button || [];
      state.router_authority = router || [];
    },
    SET_HOME_REFRESH_FLAG(state, data) {
      state.home_refresh_flag = data;
    },
    SET_THEME_COLOR(state, color) {
      state.themeColor = color
    },
    SET_THEME_MODE(state, mode) {
      state.themeMode = mode
    },
    SET_SLIENT_INFO(state, data) {
      const { token, name, avatar } = data;
      state.token = token;
      state.user_name = name;
      state.user_avatar = avatar;
      state.hasLogin = true;
      state.userInfo = data;
      if (token) setToken(token);
      if (token && data) setUserInfo(data, token)
    },
    SET_AD_CONFIG(state, ad_config) {
      if (ad_config) state.ad_config = { ...state.ad_config, ...ad_config }
    },
    SET_LOCAL_LATE(state, late) {
      state.local_late = late
    },

    SET_FINGERPRENT: (state, data) => {
      state.fingerprint = data;
    },

    SET_USER_INFO: (state, data) => {
      state.userInfo = data;
    },

    SET_SCAN_DATA: (state, data) => {
      state.scanData = data;
    }
  },
  actions: {
    LogOut({ commit, state }, relaunch = true) {
      commit("LOGOUT", relaunch);
    },
    GetFingerPrint({ commit, state }) {
      const fingerprint = getStage('USER_LOCAL_DEVICE_ID') || uni.$u.guid(32)
      setStage('USER_LOCAL_DEVICE_ID', fingerprint)
      commit('SET_FINGERPRENT', fingerprint)
      return fingerprint
    },
    TemporaryToken({ commit, state }, token) {
      commit("SET_TOKEN", token);
    },
    SetAvatar({ commit }, data) {
      // {id, avatar}
      userInfoEdit(data)
        .then((res) => {
          if (res.code == 0) {
            if (res.avatar) commit("SET_AVATURL", res.avatar);
            if (res.name) {
              commit("SET_NAME", res.name);
            }
          } else return Promise.reject(re.message);
        })
        .catch((err) => {
          uni.$u.toast(err.message);
        });
    },
    /**
  * @description: 静默登录逻辑
  * @description: 首先执行uni.login获取code，默认provider登录为kuaishou，然后走接口传递{js_code:string,provider:string}
  * @description: 最后将返回的token和openid保存
  * @return {*}
  */
    async autoLogin({ commit, state }, refresh_token = true) {
      state.logining = true
      let time = Date.now()
      let provider = 'kuaishou'
      // #ifdef MP-KUAISHOU
      provider = 'kuaishou'
      // #endif
      // #ifdef MP-TOUTIAO
      provider = 'toutiao'
      // #endif
      // #ifdef MP-WEIXIN
      provider = 'weixin'
      // #endif
      // let func = wxLogin
      // if (user_data?.token && refresh_token) func = (provider) => new Promise((resol, reject) => resol({ code: 'FAST-LOGIN' }))
      return await wxLogin(provider).then((res) => {
        console.log('func获取耗时', Date.now() - time)
        let send_data = { provider, js_code: res?.code, origin_info: state.pay_info }
        if (refresh_token) send_data.token = user_data?.token || null
        if (res.code) return postLogin(send_data)
        return Promise.reject('授权失败！')
      }).then((loginRes) => {
        commit('SET_SLIENT_INFO', loginRes.data)
        console.log('登录完成耗时', Date.now() - time)
        return Promise.resolve(loginRes.data)
      }).catch((err) => {
        if (err?.message_code == 'BACKLIST_LOGIN') return showUnloginModel(err.message)
        if (user_data?.token && refresh_token) return showUnloginModel(err.message || '登录失败，请重新登录！', true)
        // return Promise.reject(err?.message || err || '授权失败！')
      }).finally(() => state.logining = false)
    },

    /**
     * @description: 查询看点
     * @param {*} commit
     * @param {*} state
     * @return {Promise}
     */
    queryIntegral({ commit, state }) {
      return new Promise((resolve, reject) => {
        getLimitIntegral()
          .then((res) => {
            if (res.code == 0) {
              state.integralInfo = res.data;
              resolve(res.data);
            }
          })
          .catch((error) => {
            reject(error)
          });
      })
    },

    async lockLogin({ commit, state, dispatch }) {
      if (state.hasLogin) return state.hasLogin
      do {
        if (state.hasLogin) return state.hasLogin
        if (!state.logining) return await dispatch('autoLogin')
        await sleep(50)
      } while (state.logining);
      return state.hasLogin
    },
    async getAdConfig({ commit, state }) {
      if (state.ad_loading) return
      state.ad_loading = true
      // 本地分流延迟
      getLocalLate().then(res => {
        if (res?.code == 0 && res?.back_difftime) {
          setlocalLate(res.back_difftime)
          commit('SET_LOCAL_LATE', res.back_difftime)
        }
      }).catch(err => { })

      // 获取系统信息
      setSystemInfo().then((res) => {
        commit("SET_SYSTEM", res);
      }).catch((err) => { });

      return await getAdPosition().then(res => {
        if (res?.data) commit("SET_AD_CONFIG", res.data);
        commit('SET_THEME_MODE', 'light')
        setThemeColor('light')
        // # ifdef MP-WEIXIN
        commit('SET_SHARE_IMAGE', 'https://koc-img.lizhibj.cn/duolai/share_wx_light.png')
        // # endif
        // # ifdef MP-KUAISHOU || MP-TOUTIAO
        commit('SET_SHARE_IMAGE', 'https://koc-img.lizhibj.cn/duolai/share_ks_light.png')
        // # endif
      }).catch(err => { })
    },

    queryUserInfo({ commit, state }) {
      return new Promise((resolve, reject) => {
        userInfoReq()
          .then(res => {
            if(res.code == 0) {
              commit('SET_SLIENT_INFO', { ...res.data, token: res.token })
              resolve(res.data)
            }
          })
          .catch(error =>  {
            reject(error)
          })
      })
    }
  },
  getters,
});

export default store;
