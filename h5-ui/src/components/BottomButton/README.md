# BottomButton 底部按钮组件

## 介绍
该组件位于页面底部，用于触发页面的主要操作。

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| data | Array | [] | 按钮列表，具体说明见下方 |
| fixed | Boolean | true | 是否固定在底部 |
| buttonIndex | Number | 0 | 默认选中的按钮索引 |

## Data属性说明

data属性是一个数组，数组的每一项为一个按钮组，一个按钮组可由多个按钮组成。
### 按钮Props
| 属性           | 类型                 | 默认值 | 说明                                     |
|----------------|----------------------|--------|------------------------------------------|
| text           | String               | --     | 按钮文字                                 |
| type           | String               | default| 按钮类型，可选值：default、primary、success、warning、danger |
| onClick        | String               | --     | 按钮所绑定的函数名                      |
| width          | String               | --     | 按钮宽度，单位px                        |
| style          | Object               | --     | 按钮样式                                 |
| plain          | Boolean              | false  | 是否为镂空按钮                           |
| hairline       | Boolean              | false  | 是否为细边框按钮                         |
| disabled       | Boolean              | false  | 是否禁用按钮                             |
| loading        | Boolean              | false  | 是否显示加载中状态                       |
| round          | Boolean              | false  | 是否为圆角按钮                           |
| icon           | String               | --     | 左侧图标名称或图片链接，等同于 Icon 组件的 name 属性 |
| color          | String               | --     | 按钮颜色                                 |
| icon-position   | String               | left   | 图标展示位置，可选值为 right            |
| url            | String               | --     | 点击后跳转的链接地址                   |
| to             | [String, Object]     | --     | 点击后跳转的目标路由对象，等同于 Vue Router 的 to 属性 |
| replace        | Boolean              | false  | 是否在跳转时替换当前页面历史           |


### 按钮Events
| 事件名 | 说明 | 回调参数 |
| --- | --- | --- | 
| click | 点击按钮时触发 | event: MouseEvent |
| touchstart | 触摸开始时触发 | event: TouchEvent |

## 代码演示
```vue
<template>
  <BottomBtn 
    :data="buttonData"  
    :buttonIndex="btnIndex" 
    @handleClick1="handleClick1"
    @handleClick2="handleClick2" 
    @handleClick3="handleClick3"
  />
</template>
<script>
const btnIndex = ref(0)
const buttonData = ref([
  // 第一组按钮
  [
    {
      text: '按钮1',
      type: 'primary',
      onClick: 'handleClick1'
    },
    {
      text: '按钮2',
      type: 'default',
      onClick: 'handleClick2'
    }
  ],
  // 第二组按钮
  [
    {
      text: '按钮3',
      type: 'default',
      onClick: 'handleClick3'
    }
  ]
])

// 按钮点击事件可处理显示哪一个按钮组
const handleClick1 = () => {
  btnIndex.value = 1
}
</script>
```
如果需要动态设置按钮属性，可以把data放入computed中
```js
const buttonData = computed(() => {
  return [
    {
      text: showStr.value == 1 ? '按钮1' : '按钮2',
      ...
    }
  ]
})
```