# SlideVerify 滑动验证组件
该组件用于实现滑动验证功能，用户需要通过滑动滑块来完成拼图验证

## 使用方法
```vue
<template>
  <SlideVerify @diff="handleDiff" />
</template>

<script setup>
import SlideVerify from '@/components/SlideVerify/slideVerify.vue';

const handleDiff = (diffValue) => {
  // 处理滑动验证的结果
  console.log('滑动验证差值:', diffValue);
};
</script>
```

## Props
| 参数 | 说明   | 类型   | 默认值 |
| ---- | ------ | ------ | ------ |
| rate | 缩放倍率 | Number | 0.5   |


## Events
| 事件名 | 说明                     | 回调参数 |
| ------ | ------------------------ | -------- |
| diff   | 当滑动验证完成时触发   | 差值     |


## Methods
| 方法名          | 说明                            | 参数   |
| ---------------- | ------------------------------- | ------ |
| open()           | 打开滑动验证组件               | -      |
| close()          | 关闭滑动验证组件               | -      |  
| refresh(flag)    | 重置验证状态，`flag` 为 `true` 时重新获取验证图片 | Boolean |
