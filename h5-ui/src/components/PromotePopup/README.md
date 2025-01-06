# PromotePopup 组件
推广弹窗组件，支持二维码展示和平台跳转功能。

## 功能说明
1. 支持二维码展示和下载
2. 支持多平台（抖音/快手/微信）直接跳转
3. 在微信/QQ内打开时会显示二维码弹窗
4. 支持视频上传和发布功能

## Props
| 属性        | 类型    | 默认值 | 说明          |
|-------------|---------|--------|---------------|
| schemaUrl   | String  | -      | 跳转链接      |
| planId      | Number  | -      | 计划ID       |
| showQr      | Boolean | false  | 是否显示二维码 |
| platformId   | Number  | -      | 平台ID       |

  - 1: 抖音
  - 2: 快手
  - 4: 微信

## Methods
| 方法名   | 说明      |
|----------|-----------|
| open()   | 打开弹窗  |
| close()  | 关闭弹窗  |


## 代码演示
```vue
<template>
  <promote-popup
    ref="promotePopupRef"
    :schema-url="schemaUrl"
    :plan-id="planId"
    :show-qr="true"
    :platform-id="1"
    @change="handleChange"
  />
</template>

<script setup>
import { ref } from 'vue';
const promotePopupRef = ref();
// 打开弹窗
const openPopup = () => {
  promotePopupRef.value.open();
};
</script>
```