const state = {
  pageOption: {
    showSharePge: false,
    radio: 'ip6',
    shareUrl: '',
    browerStyle: 'ip6',
  },
};
const getter = {
  getOption(state) {
    return state.pageOption;
  },
};
const mutations = {
  setOption(state, option) {
    state.pageOption = option;
  },
};
const actions = {
  setOption: ({ commit, state }, option) => {
    commit('setOption', option);
  },
};
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getter,
};
