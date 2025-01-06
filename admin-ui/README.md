## 开发

```bash
# 安装依赖
npm install

# 建议不要直接使用 cnpm 安装依赖，会有各种诡异的 bug。可以通过如下操作解决 npm 下载速度慢的问题
npm install --registry=https://registry.npmmirror.com

# 启动服务
npm run dev
```

- 浏览器访问 http://localhost:80
- 项目需要安装 Prettier 插件进行格式化

## 开发规范

- 注意提交代码commit规范（init、add、feat、mod、chore、pref、fix、revert、refactor）
- views目录下**文件夹**名称采用大驼峰式命名(例如：FirstName、LastName)
- views目录下**文件**名称{.vue|.js|...}名称采用小驼峰式命名()(例如：firstName、lastName)

- 搜索组件中input提示格式由`/`划分（例如：请输入用户ID/名称/手机号）
- 表格操作涉及confirm确认提示，需包含`【ID】名字`格式 （例如：确认删除【1540】测试角色2）
- 所有提示使用this.$notify 轻提示（this.$message存在遮挡导航栏主要视图的问题）

## 功能模块

### 脚手架基础模块
```
# 功能
- 登录模块
- 用户模块
- 设置模块

# 基础建设
- [系统]权限配置(路由、按钮)
- [系统]iCON引入(资源CDN引入，svgIcon全局组件使用)
- [系统]常用业务组件(BaseTable、SearchPanel、...)
- [构建]CDN依赖静态引入

```

## 备注


- 冗余清除
    - 依赖清除
        - vue2-scrollspy
        - vue-scrollto
        - jsonwebtoken
        - bootstrap
        - bootstrap-vue
        - sortablejs
        - vue-count-to
        - vxe-table
    - OK冗余页面清除
    - OK冗余API清除

- OK$slots 编译问题 (使用 v-if和v-else 临时解决)
- OK审核模块采用v2
- OKsvgicon处理
    - config
    - icon选取组件
    - svg-icon 不用管
- OK消息改成notify

- 浏览器本地读取icon css/js 文件获取icon枚举
- 升级相关依赖

- cyrpto 加密统一使用一个方案
    - 使用 web crypto api (只有在 HTTPS 协议下或者在 localhost 环境下（用于本地开发）才能正常使用)
~~~js
jsencrypt
crypto
spark-md5
~~~

- BaseTable的高度自定义变化失效的问题


### 远程仓库和本地仓库文件名大小写不一致的处理的问题
使用中间文件夹： 由于 Windows 文件系统对大小写不敏感，Git 无法直接进行同名但大小写不同的重命名操作。
你可以先将文件夹重命名为一个临时名称，然后再将其重命名为目标名称。执行以下命令：
~~~bash

git mv test/iui test/temp_iui  # 先重命名为一个临时名称
git mv test/temp_iui test/Iui  # 再重命名为最终名称

# 提交更改： 重命名后，你可以提交更改：
git add .
git commit -m "Rename iui folder to Iui"

# 推送到远程仓库：
git push origin <your-branch>
# 这种方式可以确保重命名操作不会因为大小写敏感的问题而失败。
~~~