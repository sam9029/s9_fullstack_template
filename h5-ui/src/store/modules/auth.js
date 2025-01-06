import { defineStore } from 'pinia';
// import { pinia } from '@/store';

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => {
    return {
      button_authority: [],
      router_authority: [],
    };
  },
  getters: {
    all_auth: (state) => {
      // /**@type {string[]} */
      // const arr = [];

      /**@type { [x: string]: string; } */
      const map = {};

      state.router_authority.forEach((v) => {
        if (v.meta?.hasPermission) {
          if (v.perms) {
            // arr.push(v.perms);
            map[v.perms] = 'router';
          }
        }
      });
      state.button_authority.forEach((v) => {
        if (v.perms) {
          // arr.push(v.perms);
          map[v.perms] = 'button';
        }
      });

      // return arr;
      return map;
    },
  },
  actions: {
    setAuthority(getData) {
      let { router, button } = getData || {};
      this.button_authority = button || [];
      this.router_authority = router || [];
    },
    clearAuthority() {
      this.$reset();
    },
    /**
     * @param {string | string[]} auth
     * @returns {boolean}
     */
    checkAuthority(auths) {
      if (!auths || !auths.length) return true;
      if (!Array.isArray(auths)) {
        auths = [auths];
      }

      return auths.every((auth) => !!this.all_auth[auth]);
    },
  },
});
