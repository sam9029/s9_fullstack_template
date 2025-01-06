# FilterItems 筛选组件

一个通用的多组筛选面板组件，支持单选和多选筛选。

## 功能特性

- 支持最多三组筛选条件
- 第一组为单选模式
- 第二组和第三组为多选模式
- 支持重置和确认操作
- 响应式布局，自动适应不同屏幕尺寸

## Props
| 属性               | 类型     | 默认值  | 说明                   |
|-------------------|----------|---------|------------------------|
| v-model:show      | Boolean  | false   | 是否显示筛选面板      |
| title             | String   | '筛选'  | 筛选面板标题          |
| firstGroupTitle   | String   | '分组一'| 第一组筛选标题        |
| secondGroupTitle  | String   | '分组二'| 第二组筛选标题        |
| thirdGroupTitle   | String   | '分组三'| 第三组筛选标题        |
| firstGroupItems   | Array    | []      | 第一组筛选项数据      |
| secondGroupItems  | Array    | []      | 第二组筛选项数据      |
| thirdGroupItems   | Array    | []      | 第三组筛选项数据      |


### 数据格式说明

```javascript
// firstGroupItems 数据格式
[
  { name: '选项1', value: 1 },
  { name: '选项2', value: 2 }
]

// secondGroupItems 数据格式
[
  { label: '标签1', value: 1 },
  { label: '标签2', value: 2 }
]

// thirdGroupItems 数据格式
[
  { name: '其他1', id: 1 },
  { name: '其他2', id: 2 }
]
```

## Events
| 事件名       | 说明                      | 回调参数                   |
| ------------ | ------------------------- | -------------------------- |
| update:show  | 筛选面板显示状态变化时触发 | (show: boolean)           |
| data         | 点击确定按钮时触发       | (filterData: object)      |


### 回调数据格式

```javascript
{
  firstGroup: number | null,    // 第一组选中值
  secondGroup: number[],        // 第二组选中值数组
  thirdGroup: number[]         // 第三组选中值数组
}
```

## 方法

| 方法名 | 说明           |
| ------ | -------------- |
| reset  | 重置所有筛选项 |


## 代码示例

```vue
<template>
  <filter-items
    v-model:show="showFilter"
    title="筛选"
    first-group-title="类型"
    second-group-title="标签"
    third-group-title="其他"
    :first-group-items="[{name: '选项1', value: 1}, {name: '选项2', value: 2}]"
    :second-group-items="[{label: '标签1', value: 1}, {label: '标签2', value: 2}]"
    :third-group-items="[{name: '其他1', id: 1}, {name: '其他2', id: 2}]"
    @data="handleFilterData"
  />
</template>

<script setup>
const showFilter = ref(false);

const handleFilterData = (data) => {
  console.log('筛选数据：', data);
};
</script>
```

## 注意事项

1. 组件依赖 Vant UI 库的 Popup 组件
2. 使用了 lodash 进行节流处理
3. 样式使用了 SCSS
4. 需要确保项目中已正确配置 Vant UI 的主题变量