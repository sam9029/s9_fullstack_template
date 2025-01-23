# Base DatePicker 使用文档

## 组件概述

`Base DatePicker` 是一个日期选择组件，允许用户选择日期范围或特定日期。组件支持多种类型的日期选择，包括快速选择、自定义选择和列表选择。

## 组件属性

### Props

| 属性名           | 类型    | 默认值                | 描述                                             |
| ---------------- | ------- | --------------------- | ------------------------------------------------ |
| `title`          | String  | "标题"                | 组件的标题                                       |
| `btnHeight`      | String  | "72rpx"               | 按钮的高度                                       |
| `baseBtn`        | Boolean | true                  | 是否展示默认按钮                                 |
| `type`           | Array   | `["quick", "custom"]` | 组件支持的类型，支持 `quick`、`custom` 和 `list` |
| `showBottomBtns` | Boolean | true                  | 是否展示底部按钮                                 |

## 组件数据

### Data

| 数据名                | 类型    | 描述                         |
| --------------------- | ------- | ---------------------------- |
| `showSelect`          | Boolean | 控制选择组件的显示状态       |
| `showStartDatePicker` | Boolean | 控制开始日期选择器的显示状态 |
| `showEndDatePicker`   | Boolean | 控制结束日期选择器的显示状态 |
| `currentBtn`          | Object  | 当前选择的按钮信息           |
| `store_date`          | Array   | 存储选择的日期               |
| `submit_date`         | Array   | 提交的日期                   |
| `listBtns`            | Array   | 列表按钮的集合               |
| `dateList`            | Array   | 快速选择的日期列表           |

## 组件方法

### Methods

| 方法名                       | 描述                             |
| ---------------------------- | -------------------------------- |
| `setDate(value, needReturn)` | 设置日期并可选择是否返回日期数组 |
| `switchComps()`              | 切换日期选择组件的显示状态       |
| `closeComps()`               | 关闭日期选择组件                 |
| `openDatePicker(index)`      | 打开指定的日期选择器             |
| `confirmStart(value)`        | 确认开始日期的选择               |
| `confirmEnd(value)`          | 确认结束日期的选择               |
| `submitValid()`              | 提交前的有效性检查               |
| `beforeSubmit()`             | 提交数据前的检查和处理           |
| `submitComps()`              | 提交选择的日期                   |
| `cancelComps()`              | 取消选择并重置日期               |
| `chooseDate(item)`           | 选择日期并设置相应的值           |
| `chooseListItem(item)`       | 在列表模式下选择按钮并返回结果   |

## 使用示例

```vue
<template>
  <base-datepicker
    :title="'选择日期'"
    :btnHeight="'72rpx'"
    :baseBtn="true"
    :type="['quick', 'custom']"
    :showBottomBtns="true"
    @submit="handleSubmit"
  />
</template>

<script>
export default {
  methods: {
    handleSubmit(submitDate, currentBtn) {
      console.log("提交的日期:", submitDate);
      console.log("当前按钮:", currentBtn);
    },
  },
};
</script>
```

## 样式

组件使用了 SCSS 进行样式定义，支持自定义样式。可以通过修改 `.filter-btn`、`.date-btns`、`.select-date` 等类名来调整样式。

## 注意事项

- 确保在使用组件时，正确传递所需的属性。
- 组件的功能依赖于 Vuex 的状态管理，确保在使用前已正确配置 Vuex。

## 结论

`Base DatePicker` 是一个灵活且功能强大的日期选择组件，适用于多种场景。通过配置不同的属性和方法，可以满足大多数日期选择需求。
