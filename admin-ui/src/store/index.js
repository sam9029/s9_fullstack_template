import Vue from 'vue';
import Vuex from 'vuex';
import app from './modules/app';
import user from './modules/user';
import tagsView from './modules/tagsView';
import permission from './modules/permission';
import settings from './modules/settings';
import sharePage from './modules/sharePage';
import message from './modules/message';
import getters from './getters';
import mutations from './mutations';
Vue.use(Vuex);
const state = {
  //baseForm的校验
  baseForm_err_count: 0,
};
const store = new Vuex.Store({
  modules: {
    app,
    user,
    tagsView,
    permission,
    settings,
    sharePage,
    message,
  },
  state,
  mutations,
  getters,
});

export default store;
