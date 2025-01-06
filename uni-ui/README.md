# koc-joyful-creation
欢乐创小程序

## git命令
- git checkout 要更新的分支
- git merge --no-ff master 将master代码合并到当前分支
随后修复冲突，提交代码即可

### 颜色模式切换

- ##### 字段

  ```ts
  const theme_mode:string = 'light'
  // 'light'浅色模式-所有归属于欢乐创小程序都是浅色主题 挂在再其他平台为暗色主题'dark'
  ```

- ##### 配置方式

  `ad_position`接口传入控制，store/index.js的vuex文件中使用`SET_THEME_MODE`设置theme_mode。

  `App.vue`文件需配置page标签的背景色

### 分享图配置

- ##### 字段

  ```ts
  const share_image:string = '图片地址'
  // share_平台_颜色模式.png文件
  // 1:1图片为share_ks_颜色模式.png
  // 5:4图片为share_wx_颜色模式.png
  ```

- ##### 配置方式

  store/index.js的vuex文件中使用`SET_SHARE_IMAGE`设置

