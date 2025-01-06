# SelectPopupV2 组件
底部弹出的选择器组件，支持平台和子项目的选择。

## Props
| 参数         | 说明           | 类型   | 默认值         |
|--------------|----------------|--------|----------------|
| subList      | 子项目列表     | Array  | []             |
| customStyle  | 自定义样式     | String | 'height: 30%'  |
| title        | 标题文本       | String | '请选择'       |
| loading      | 加载状态       | Boolean| false          |
| mode         | 模式           | String | 'default'      |


## Events
| 事件名      | 说明                   | 回调参数                |
|-------------|------------------------|-------------------------|
| changeMain  | 选择主选项时触发      | item: 选中的主选项       |
| changeSub   | 选择次选项时触发      | item: 选中的次选项       |
| close       | 关闭时触发            | {main, sub, flag}      |


## Methods
| 方法名   | 说明               | 参数                       |
|----------|--------------------|----------------------------|
| open     | 打开选择器         | (main_id, sub_type)       |
| close    | 关闭选择器         | (flag = true)             |
| setMain  | 设置当前主选项     | (value: Number)           |
| setSub   | 设置当前次选项     | (obj: {value, label, icon}) |


## 使用示例
```vue
<template>
  <SelectPopupV2
    ref="selectPopupRef"
    :subList="subList"
    @changeMain="handleMainChange"
    @changeSub="handleSubChange"
    @close="handleClose"
  />
</template>
```