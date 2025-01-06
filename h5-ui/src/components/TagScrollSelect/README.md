# TagScrollSelect 组件
标签滚动选择器，支持标签的滚动和选择。

## 组件说明
一个水平滚动的标签选择组件，支持单个标签的选择。

## 属性
| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| businessType | 用于获取对应业务类型的标签列表 | Number |
- `businessType` (Number): 必填，用于获取对应业务类型的标签列表。

## 事件
- `tagSelected`: 当选择标签时触发，返回包含所选标签ID的数组。

## 使用示例
```vue
<template>
  <TagScrollSelect
    :business-type="1"
    @tagSelected="handleTagSelected"
  />
</template>

<script setup>
import TagScrollSelect from '@/components/TagScrollSelect/tagScrollSelect.vue';
const handleTagSelected = (selectedTags) => {
console.log('选中的标签:', selectedTags[0]);
};
</script>
```