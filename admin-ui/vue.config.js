'use strict';
const path = require('path');
function resolve(dir) {
  return path.join(__dirname, dir);
}

const name = process.env.VUE_APP_TITLE || 'KOC推广平台'; // 网页标题
const port = process.env.PORT || process.env.npm_config_port || 80; // 端口
const iconfont_url = process.env.VUE_APP_ICONFONT_URL; // iconfont地址--给Index.html用

const { getCdnHost } = require("./build/upload_cdn");
const cdn_host = getCdnHost(process.env.NODE_ENV);

const cdn = {
  // cdn：模块名称和模块作用域命名（对应window里面挂载的变量名称）
  externals: {
    vue: 'Vue',
    vuex: 'Vuex',
    'vue-router': 'VueRouter',
    axios: 'axios',
    echarts: 'echarts',
    'element-ui': 'ELEMENT',
    xlsx: 'XLSX',
    moment: 'moment',
    '@wangeditor/editor': 'wangEditor',
    'ali-oss': 'OSS',
    json2csv: 'json2csv',
    lodash: '_',
    'vue-qr':'vue-qr',
    // quill:"Quill",
  },
  // cdn的js链接
  js: [
    'https://wangsu.lizhibj.cn/open-img/cdn/js/vue.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/vuex.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/vue-router.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/axios.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/echarts.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/element.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/xlsx.full.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/moment.min.js', // 必须先引入moment，否则报错“TypeError: Cannot read property 'default' of undefined”
    'https://wangsu.lizhibj.cn/open-img/cdn/js/aliyun-oss-sdk.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/wang-editor.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/json2csv.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/lodash.min.js',
    'https://wangsu.lizhibj.cn/open-img/cdn/js/vue-qr.min.js',
    // 'https://wangsu.lizhibj.cn/open-img/cdn/js/quill.core.min.js'
  ],
  // icon的js链接
  iconUrl: iconfont_url,
};
// vue.config.js 配置说明
//官方vue.config.js 参考文档 https://cli.vuejs.org/zh/config/#css-loaderoptions
// 这里只列一部分，具体配置参考文档
module.exports = {
  // 多线程打包
  parallel: true,
  // 部署生产环境和开发环境下的URL。
  // 默认情况下，Vue CLI 会假设你的应用是被部署在一个域名的根路径上
  // 例如 https://www.ruoyi.vip/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.ruoyi.vip/admin/，则设置 baseUrl 为 /admin/。
  publicPath: process.env.NODE_ENV === 'production' ? cdn_host : '/',
  // 在npm run build 或 yarn build 时 ，生成文件的目录名称（要和baseUrl的生产环境路径一致）（默认dist）
  outputDir: 'dist',
  // 用于放置生成的静态资源 (js、css、img、fonts) 的；（项目打包之后，静态资源会放在这个文件夹下）
  assetsDir: 'static',
  // 是否开启eslint保存检测，有效值：ture | false | 'error'
  lintOnSave: process.env.NODE_ENV === 'development',
  // 如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建。

  productionSourceMap: false,
  // webpack-dev-server 相关配置
  devServer: {
    host: '0.0.0.0',
    port: port,
    open: true,
    proxy: {
      // detail: https://cli.vuejs.org/config/#devserver-proxy
      [process.env.VUE_APP_BASE_API]: {
        target: process.env.API_URL || `http://127.0.0.1:3020/api`,
        changeOrigin: true,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API]: '',
        },
      },
    },
    disableHostCheck: true,
  },
  configureWebpack: {
    name: name,
    resolve: {
      alias: {
        '@': resolve('src'),
        jquery: 'jquery',
      },
    },
    externals: cdn.externals,
  },
  chainWebpack(config) {
    config.plugins.delete('preload'); // TODO: need test
    config.plugins.delete('prefetch'); // TODO: need test

    config.plugin('html').tap((args) => {
      args[0].cdn = cdn;
      return args;
    });

    config.when(process.env.NODE_ENV !== 'development', (config) => {
      config
        .plugin('ScriptExtHtmlWebpackPlugin')
        .after('html')
        .use('script-ext-html-webpack-plugin', [
          {
            // `runtime` must same as runtimeChunk name. default is `runtime`
            inline: /runtime\..*\.js$/,
          },
        ])
        .end();
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          libs: {
            name: 'chunk-libs',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial', // only package third parties that are initially dependent
          },
          commons: {
            name: 'chunk-commons',
            test: resolve('src/components'), // can customize your rules
            minChunks: 1, //  minimum common number
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      });
      config.optimization.runtimeChunk('single'),
        {
          from: path.resolve(__dirname, './public/robots.txt'), //防爬虫文件
          to: './', //到根目录下
        }
    });
  },
};
