import Vue from "vue";
import App from "./App";
import store from "./store";
import useableMixin from './mixins/useable'

Vue.config.productionTip = false;

App.mpType = "app";
import uView from "@/uni_modules/uview-ui";
Vue.use(uView);
uni.$u.setConfig({
	props: {
		notify: {
			// #ifdef H5
			top: 1,
			// #endif
		},
		picker: {
			immediateChange: true,
		},
		checkboxGroup: {
			activeColor: store.getters.theme_color,
		},
		tabs: {
			lineColor: store.getters.theme_color,
			activeStyle: () => {
				return {
					color: store.getters.theme_color,
					fontWeight: 'bold',
				}
			},
			inactiveStyle: () => {
				return {
					color: '#606266',
				}
			}
		},
		radioGroup: {
			activeColor: store.getters.theme_color,
		},
		steps: {
			activeColor: store.getters.theme_color,
		},
		switch: {
			activeColor: store.getters.theme_color,
		},
		modal: {
			confirmColor: store.getters.theme_color,
		},
	},
});
Vue.mixin(useableMixin)
import { noMultipleClicks } from "@/utils/tools.js"; //禁止连点方法 
import { checkAuthority } from "@/utils/authority.js"; //判断按钮权限
Vue.prototype.$noMultipleClicks = noMultipleClicks;
Vue.prototype.$checkAuthority = checkAuthority;
const app = new Vue({
	store,
	...App,
});
app.$mount();
