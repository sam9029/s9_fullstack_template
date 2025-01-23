### baseupload 基础使用

```html
<template>
  <BaseUpload
    accept=".pdf,.jpg,.jpeg,.png"
    :limit="1"
    :file_list="uploadFileList"
    :uploadConfig="{ site:'WANGSU',bucket:'duolai-img', folder: 'joyful/public/' }"
    :onSuccess="onSuccess"
    @onRemove="handleRemove"
  >
  </BaseUpload>
</template>

<script>
  import BaseUpload from '@/components/BaseUpload/index.vue';

  export default {
      components:{
          BaseUpload,
      },
      data(){
          return {
              uploadFileList:[],
          }
      }
      methods:{
          onSuccess(response, file, fileList) {
              if (response) {
                  const url = response.cdn_url;
              }
          },

          handleRemove(file) {},
      }
  }
</script>
```

### API

### Attribute

| 参数 | 说明     | 类型   | 可选值      | 默认值 |
| ---- | -------- | ------ | ----------- | ------ |
| mode | 组件模式 | string | light、Main | light  |

### Light Mode Attribute

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| drag | 拖拽模式 | Boolean | — | true |
| file_list | 上传的文件列表, 例如: [{name: 'food.jpg', url: 'https://xxx.cdn.com/xxx.jpg'}] | array | — | [] |
| limit | 最大允许上传个数 | number | — | — |
| accept | 接受上传的[文件类型](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-accept) | string | — | — |
| disabled | 是否禁用 | boolean | — | false |
| customUploadRequest | 覆盖默认的上传行为(uploadV3)，可以自定义上传的实现 | function(requestBody, config) | requestBody.file 是上传文件、requestBody 为上传的所有信息; config 是上传的 UploadConfig 配置信息 | — |
| onBeforeUpload | 上传文件之前的钩子，参数为上传的文件，若返回 false 或者返回 Promise 且被 reject，则停止上传。 | function(file) | — | — |
| onSuccess | 文件上传成功时的钩子 | function(response, file, fileList) | — | — |
| onError | 文件上传失败时的钩子 | function(err, file, fileList) | — | — |
| uploadConfig | 文件上传配置，见下方 UploadConfig Options | Object | — | — |
| shadow | 外边框阴影 | Boolean | — | false |
| show_upload | 展示上传组件 | Boolean | — | true |
| show_upload_config | 展示上传配置组件 | Boolean | — | true |
| show_file_list | 展示文件列表 | Boolean | — | true |

### UploadConfig Options

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| site | 存储云厂商 | string | WANGSU、ALIYUN | WANGSU |
| bucket | 存储桶 BUCKET | string | WANGSU:['duolai-img']、ALIYUN:['koc-img','koc-material','duolai-img'] | — |
| folder | 存储文件夹 | string | 自定义、只允许两级路径 | 'xxx/public' (xxx 为本项目的名称如：'joyful/public') |

### Slot

| name | 说明         |
| ---- | ------------ |
| tip  | 提示说明文字 |

### Events

| 方法名     | 说明                     | 参数                               |
| ---------- | ------------------------ | ---------------------------------- |
| onRemove   | 移除某个文件             | function(file, fileList)           |
| onProgress | 文件上传进度钩子         | function(progress, file, fileList) |
| onExceed   | 文件超出个数限制时的钩子 | —                                  |

### Methods

| 方法名  | 说明         | 参数 |
| ------- | ------------ | ---- |
| onClear | 清除所有文件 | —    |

### 其他

#### 上传组件

场景

- （🆗XGFX & 🆗joyful）banner （单个）
- （🆗joyful）对工回填账单上传 （单个）
- （XGFX & 🆗joyful）版本 APK （单个）
- 版权 （有单个，有多个）
- 课程管理 （多个，重量级）

#### light 轻量上传组件

    - 🆗设置面板（没有prop的现在）
        site
        bucket
        folder
        文件上传数量
        文件可接受上传类型
        文件上传大小限制UN
        文件上传并发数量UN
    - 🆗数量
        - 单个
        - 多个
    - 🆗上传
        - 按钮模式
        - 拖拽框模式
    - 🆗插槽位置
        - 提示信息
    - 🆗prop
        - 自定义上传函数/(默认上传)-上传前检验
        - baseupload成功失败的回调处理
    - 🆗emit回调函数
    - 🆗设置上传信息面板
        - 上传前的传参函数处理
    - 🆗上传进度
    - 🆗可预览文件与否
        - 音频预览
    - 🆗文件去重
    - 🆗单文件上传的progress-loading
    - 🆗列表的FilesSwiper 视频类型· 回显不了 网宿的视频封面(暂时死解决)
    - 是否压缩图片
    - 预览图存 vuex 统一维护和释放内存
    -

#### main 上传组件

    - 并发管理
    - 切片上传
