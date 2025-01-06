# SelectPopup 组件
底部弹出的选择器组件，基于 vant 的 Popup 组件封装。

## Props
| 参数          | 说明                       | 类型   | 默认值       |
|---------------|----------------------------|--------|--------------|
| list          | 选项列表，每项需包含 value/label/icon | Array  | []           |
| visiable      | 是否显示弹窗               | Boolean| false        |
| customStyle   | 自定义弹窗样式             | String | 'height: 30%'|
| title         | 弹窗标题                   | String | '请选择'     |
| currentSelect | 当前选中项                 | Object | {}           |
| loading       | 是否显示加载状态           | Boolean| false        |


## Events
| 事件名       | 说明                   | 回调参数           |
|--------------|------------------------|--------------------|
| update:show  | 弹窗显示状态变更      | show: boolean       |
| change       | 选择选项时触发        | item: 选中项数据    |


## Methods
| 方法名 | 说明   |
|--------|--------|
| close  | 关闭弹窗 |


## 使用示例
```vue
<template>
  <SelectPopup
    v-model:show="showPopup"
    :list="optionsList"
    :current-select="currentSelect"
    :title="'选择渠道'"
    @change="handleSelect"
  />
</template>

<script setup>
const showPopup = ref(false);
const currentSelect = ref({});
const optionsList = [
{ value: 1, label: '选项1', icon: 'icon-url-1' },
{ value: 2, label: '选项2', icon: 'icon-url-2' }
];
const handleSelect = (item) => {
currentSelect.value = item;
};
</script>
```