# BackButton 返回组件

返回按钮组件，用于返回上一页。

## Props

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| backType | String | '' | 返回类型，可选值为 'url' 和 '-1', -1 表示返回上一页，url 表示返回指定路径 |
| backPath | String | '' | 返回路径，当 backType 为 'router' 时有效 |
| backQuery | Object | {} | 返回参数，当 backType 为 'router' 时有效 |
| text | String | '' | 按钮文字 |

## 代码演示
```vue
<template>
  <BackButton 
    backType="url" 
    backPath="/realization/home" 
  />
</template>
```