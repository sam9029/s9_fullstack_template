FROM registry.cn-beijing.aliyuncs.com/yoboo/node-16.18.0
LABEL name="zhangjinlin@bjjiayin.com"
WORKDIR /home/www/koc-task-node-api
ADD ./package.json /home/www/koc-task-node-api/
RUN npm config set sharp_binary_host "https://npmmirror.com/mirrors/sharp"
RUN npm config set sharp_libvips_binary_host "https://npmmirror.com/mirrors/sharp-libvips"
RUN npm config set registry https://registry.npmmirror.com
RUN npm install --registry=https://registry.npmmirror.com
RUN \
	rm /etc/localtime && \
	ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
EXPOSE 3013
ENV \
	NODE_ENV=production \
	PORT=3013

ADD . /home/www/koc-task-node-api
CMD npm start
