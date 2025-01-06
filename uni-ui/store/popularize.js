export default {
  namespaced: true,
  state: {
    allocateWords: [],
  },
  mutations: {
    SET_ALLOCATE_WORDS: (state, words = []) => {
      state.allocateWords = words;
    }
  },
}