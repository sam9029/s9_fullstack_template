import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from 'unplugin-vue-components/resolvers';
/** 依赖可视化图谱 */
import { configVisualizerConfig } from './visualizer';
/** CDN依赖配置 */
import cdn from 'vite-plugin-cdn-import';

export async function createVitePlugins() {
  const { chunkSplitPlugin } = await import(
    'vite-plugin-chunk-split'
  ); /** vite-plugin-chunk-split 是CJS 要异步引入 */
  const vitePlugins = [
    vue(),
    Components({
      resolvers: [
        VantResolver({
          importStyle: false,
        }),
      ],
    }),
    /** 产物分块策略 */
    chunkSplitPlugin({
      strategy: 'default', // default all-in-one unbundle
      /** 分包策略 1. 支持填包名匹配依赖 , 2. 支持填正则表达式匹配文件夹 */
      customSplitting: {
        /** 依赖包不用单独打包 */

        /** 静态资源 */
        'chunk-assets': [/src\/assets/],

        /** 业务组件&工具&路由&api */
        'chunk-common': [
          /src\/components/,
          /src\/api/,
          /src\/layouts/,
          /src\/routes/,
          /src\/store/,
          /src\/use/,
          /src\/utils/,
        ],

        /** 主体页面 */
        'chunk-main': [/src\/views/],
      },
    }),
    /** 排除指定依赖&CDN配置依赖引入 */
    cdn({
      modules: [
        {
          name: 'lodash',
          var: '_',
          // path: `https://unpkg.com/lodash@4.17.21/lodash.min.js`,
          path: 'https://wangsu.lizhibj.cn/open-img/cdn/js/lodash.min.js',
        },
        {
          name: 'moment',
          var: 'moment',
          // path: `https://unpkg.com/moment@2.29.4/moment.js`,
          path: 'https://wangsu.lizhibj.cn/open-img/cdn/js/moment.min.js',
        },
        {
          name: 'echarts',
          var: 'echarts',
          // path: `https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js`,
          path: 'https://wangsu.lizhibj.cn/open-img/cdn/js/echarts.min.js',
        },
        {
          name: '@wangeditor/editor',
          var: 'wangEditor',
          // path: `https://cdnjs.cloudflare.com/ajax/libs/wangeditor5/5.1.23/index.min.js`,
          path: 'https://wangsu.lizhibj.cn/open-img/cdn/js/wang-editor.min.js',
        },
        {
          name: 'ali-oss',
          var: 'OSS',
          // path: `https://cdnjs.cloudflare.com/ajax/libs/ali-oss/6.17.1/aliyun-oss-sdk.js`,
          path: 'https://wangsu.lizhibj.cn/open-img/cdn/js/aliyun-oss-sdk.min.js',
        },
      ],
    }),
  ];

  vitePlugins.push(configVisualizerConfig());

  return vitePlugins;
}
