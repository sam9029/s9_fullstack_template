import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { createVitePlugins } from './vite/plugin';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const port = process.env.port || process.env.npm_config_port || 80; // 端口

function pathResolve(dir) {
  return resolve(process.cwd(), '.', dir);
}

export default defineConfig(async ({ mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      await createVitePlugins(),
      nodePolyfills() // 使用node功能
    ],
    base: mode == 'production' ? 'https://koc-img.lizhibj.cn/cdn/xgfx_h5/' : '/',
    server:
      mode == 'development'
        ? {
            host: '0.0.0.0',
            port: port,
            proxy: {
              [env.VITE_BASE_API]: {
                target: `http://127.0.0.1:3000/api`,
                changeOrigin: true,
                rewrite: (path) => path.replace(env.VITE_BASE_API, ''),
              },
            },
          }
        : undefined,
    envDir: '.',
    resolve: {
      alias: [
        {
          find: /@\//,
          replacement: pathResolve('src') + '/',
        },
      ],
    },
    build: {
      target: 'es2015',
      cssTarget: 'chrome80',
      outDir: 'dist',
      brotliSize: false,
      chunkSizeWarningLimit: 2000,
    },
    css: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
        ]
      }
    }
  };
});
