# PromotionInstructions 推广说明组件
该组件是一个可折叠的富文本展示组件，用于显示推广相关说明内容。

## 功能特点
- 使用 van-collapse 实现折叠面板效果
- 集成 WangEditor 富文本编辑器进行内容展示
- 只读模式，仅用于内容展示
- 支持动态更新内容

## Methods
| 方法名              | 说明                          | 
|---------------------|-------------------------------|
| open(val: string)   | 打开折叠面板并设置富文本内容  |
| getHtml(val: string) | 更新富文本内容               |


## 使用示例
```vue
<template>
  <PromotionInstructions ref="instructionsRef" />
</template>

<script setup>
const instructionsRef = ref(null);
// 打开面板并设置内容
instructionsRef.value?.open('<p>推广说明内容</p>');
// 更新内容
instructionsRef.value?.getHtml('<p>新的推广说明内容</p>');
</script>
```