const cluster = require("cluster")
const express = require('express');
const settings = require('./config');
const { production } = require('./production')
const { publicUse } = require('./use')
const app = express();
if (cluster.isMaster) {
  console.log("KOC_TASK_API服务启动，当前环境:", process.env.NODE_ENV || 'development');
  console.log('server listen port:', settings.port);
  production()
  for (let i = 0; i < settings.cluster_instance; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  console.log('开启一个子进程处理http请求，进程ID：', process.pid);
  const server = require('http').Server(app);
  publicUse(app, express)
  //修改小果繁星路径
  app.use('/api/login', require('./route/login').router);
  app.use("/api/manage", require('./route/manage.js').router); //pc管理端
  app.use("/api/applet", require('./route/applet.js').router); //小程序端
  app.use("/api/public", require('./route/public/index').router); //公共接口
  app.use("/", (_req, res) => {
    setTimeout(() => {
      return res.send({ message: '功能正在开发测试中...', code: 500 });
    }, 2000);
  });
  server.listen(settings.port);
}

