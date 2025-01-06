# QrDialog 组件
二维码弹窗组件，支持展示和下载二维码图片。

## Props
| 属性名     | 类型   | 必填 | 默认值                              | 说明                    |
|------------|--------|------|-------------------------------------|-------------------------|
| schemaUrl  | String | 是   | -                                   | 二维码内容链接          |
| note       | String | 否   | '请使用抖音/快手扫描二维码'        | 二维码上方提示文案      |

## Events
| 事件名       | 说明                     | 回调参数              |
|--------------|--------------------------|-----------------------|
| update:show  | 弹窗显示状态变化时触发   | show: boolean         |

## 使用示例
```vue
<template>
  <QrDialog
    v-model:show="showQr"
    schema-url="https://example.com"
    note="扫描二维码访问"
  />
</template>

<script setup>
import QrDialog from '@/components/QrDialog/qrDialog.vue'
import { ref } from 'vue'
const showQr = ref(false)
</script>
```