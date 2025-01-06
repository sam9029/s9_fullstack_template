import { messageCount } from "@/api/message.js";
import { getUserInfo } from "@/utils/user.js";
export default {
  namespaced: true,
  state: {
    message_info: {},
  },
  mutations: {
    SET_MESSAGE_INFO: (state, message_info = {}) => {
      state.message_info = message_info;
    }
  },
  actions: {
    GetMessageCount({ commit, state }) {
      //用于小程序初始化数据，获取当前用户的未读消息
      let user_data = getUserInfo();
      if (!user_data || !user_data.token) return
      messageCount().then((res) => {
        let data = res.data
        commit("SET_MESSAGE_INFO", data);
        if (data && data.total > 0) {
          let badge = data.total > 99 ? '99+' : String(data.total)
          uni.setTabBarBadge({ index: 3, text: badge, fail: (err) => { console.log(err); } })
        } else {
          uni.removeTabBarBadge({ index: 3 })
        }
      }).catch(err => {
        console.log(err);
      });
    },
  },
}