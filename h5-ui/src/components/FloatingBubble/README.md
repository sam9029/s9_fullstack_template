# FloatingBubble 组件
悬浮气泡组件，用于展示二维码。

## 功能特点
- 可拖拽的悬浮气泡按钮
- 支持 X/Y 轴移动
- X 轴磁吸效果
- 点击展示二维码弹窗
- 每日首次访问自动展示二维码
- 支持本地存储记忆状态

## 使用说明
1. 组件依赖 `vant` 组件库的 `floating-bubble`、`popup` 和 `icon` 组件
2. 需要配合 `useUserStore` 使用，store 中需提供：
   - `qr_link`：二维码图片链接
   - `account_id`：用户账号ID

## 样式说明
- 图片容器宽度：200px - 300px
- 图片容器最大高度：500px
- 支持图片自适应显示