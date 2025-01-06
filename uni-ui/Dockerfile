# FROM node:11
# MAINTAINER zhangjinlin "zhangjinlin@bjjiayin.cn"
# WORKDIR /mkt_ui
# COPY production.json /mkt_ui/package.json
# COPY server.js /mkt_ui/server.js
# RUN npm install --production --registry=https://registry.npm.taobao.org
# COPY dist /mkt_ui
# ENV NODE_ENV production
# ENV PORT 8080
# EXPOSE 8080

# CMD npm run server
FROM registry.cn-beijing.aliyuncs.com/yoboo/nginx
LABEL MAINTAINER="zhangjinlin@bjjiayin.cn"
WORKDIR /koc_mount_h5_ui
COPY default.conf /etc/nginx/conf.d/default.conf
COPY unpackage/dist/build/web /usr/share/nginx/html/h5
EXPOSE 80