import { createApp } from 'vue';
import './assets/style/style.css';
import './assets/style/iconfont.css';
import './assets/style/tailwind.css';
import App from './App.vue';
import 'vant/lib/index.css'; // 已经全部引入了
import { queryToJson } from '@/utils/tools/tools'
import { setToken } from '@/utils/storage/token'
import { setupStore } from '@/store';
import { setupRouter } from '@/routes';
import 'amfe-flexible/index.js';
import { baseLoading } from '@/utils/directive/baseLoading.js';
import './utils/globalThisPolyfills.js' // 兼容 globalThis
import { setChannelId } from '@/utils/storage/user';
import { showNotify } from 'vant';

try {
  let token_info = queryToJson(window.location.href)
  if (token_info?.token) setToken(token_info?.token)
  if (token_info?.channel_id) setChannelId(token_info?.channel_id)
  
} catch (error) {
  console.log('token设置异常！', error);
}

function bootstrap() {
  const app = createApp(App);

  setupStore(app); // 配置 store
  setupRouter(app); // 配置路由

  app.config.globalProperties.$notify = showNotify;
  app.directive('baseLoading', baseLoading) // 挂载 baseLoading 指令

  app.mount('#app');
}

bootstrap();
