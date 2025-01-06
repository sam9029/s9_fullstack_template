import { messageCount } from '@/api/message.js';
import store from '@/store';
// import { getUserInfo } from '@/utils/user.js';
export default {
  state: {
    message_info: {},
  },
  mutations: {
    SET_MESSAGE_INFO: (state, message_info = {}) => {
      state.message_info = message_info;
    },
  },
  actions: {
    GetMessageCount({ commit, state }) {
      let token = store.getters.token || '';
      if (!token) return;

      messageCount()
        .then((res) => {
          let data = res.data;
          commit('SET_MESSAGE_INFO', data);
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
};
