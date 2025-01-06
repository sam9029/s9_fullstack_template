import { defineStore } from 'pinia';
import { pinia } from '@/store';

export const useAppStore = defineStore({
  id: 'app',
  state: () => ({
    themeMode: 'light', // light dark
    themeColor: '#1989fa',
    dramaItem: {}
  }),
  getters: {
    getThemeMode: (state) => state.themeMode,
    getThemeColor: (state) => state.themeColor,
    getDramaItem: (state) => state.dramaItem
  },
  actions: {
    setThemeColor(themeColor) {
      this.themeColor = themeColor;
    },
    setDramaItem(dramaItem) {
      this.dramaItem = dramaItem
    }
  },
});

// Need to be used outside the setup
export function useAppStoreWithOut() {
  return useAppStore(pinia);
}
