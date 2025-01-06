import Vue from 'vue';


/** 依赖 */
import lodash from 'lodash';
import Cookies from 'js-cookie';
import VueAwesomeSwiper from 'vue-awesome-swiper';
import 'swiper/css/swiper.css';
import Element from 'element-ui';
import './assets/styles/element-variables.scss';
import VueMeta from 'vue-meta'; // 头部标签插件
import echarts from 'echarts';
import VueClipboard from 'vue-clipboard2';


/** 页面 */
import App from './App';
import store from './store';
import router from './router';


/** 工具 */
import './permission'; // permission control
import permission from './directive/permission';
import directive from './directive/common';
import { checkPermi, checkDropDown } from '@/utils/permission';
import {
  parseTime,
  resetForm,
  addDateRange,
  selectDictLabel,
  selectDictLabels,
  download,
  handleTree,
} from '@/utils/ruoyi';


/** 样式 */
import '@/assets/styles/index.scss'; // global css
import '@/assets/styles/ruoyi.scss'; // ruoyi css


/** API */
import { getDicts } from '@/api/system/dict/data';
import { getConfigKey } from '@/api/system/config';


/** 全局组件 */
import SvgIcon from '@/components/SvgIcon'; //  SVG-ICON
import Pagination from '@/components/Pagination';
import RightToolbar from '@/components/RightToolbar'; // 自定义表格工具扩展
import DescButton from '@/components/DescButton'; // 文字提示按钮
import BankInfoDrawer from '@/components/BankButton/BankInfoDrawer.vue'; // 银行信息组件


/** 全局方法挂载  */
Vue.prototype.getDicts = getDicts;
Vue.prototype.getConfigKey = getConfigKey;
Vue.prototype.parseTime = parseTime;
Vue.prototype.resetForm = resetForm;
Vue.prototype.addDateRange = addDateRange;
Vue.prototype.selectDictLabel = selectDictLabel;
Vue.prototype.selectDictLabels = selectDictLabels;
Vue.prototype.download = download;
Vue.prototype.handleTree = handleTree;
Vue.prototype.$echarts = echarts;
Vue.prototype.$checkPermi = checkPermi;
Vue.prototype.$checkDropDown = checkDropDown;
Vue.prototype.$lodash = lodash;


/** 全局组件挂载 */
Vue.component('Pagination', Pagination);
Vue.component('RightToolbar', RightToolbar);
Vue.component('DescButton', DescButton);
Vue.component('BankInfoDrawer', BankInfoDrawer);
Vue.component('svg-icon', SvgIcon);


/** 全局工具实例挂载 */
Vue.use(permission);
Vue.use(directive);
Vue.use(VueMeta);
Vue.use(VueClipboard);
Vue.use(VueAwesomeSwiper);


Vue.use(Element, {
  size: Cookies.get('size') || 'small', // set element-ui default size
});


Vue.config.productionTip = false;


new Vue({
  el: '#app',
  router,
  store,
  render: (h) => h(App),
});
