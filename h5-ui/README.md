# h5-ui脚手架

## 集成tailwindcss
网址: https://www.tailwindcss.cn/docs/installation

## 消息提示
```vue
<script setup>
import { getCurrentInstance } from 'vue';
const { proxy } = getCurrentInstance();

const xxx = () => {
  proxy.$notify({
    type: 'success',
    message: '提示信息'
  })
}
</script>
```

## 组件
`BackButton` 返回按钮
`BaseLoading` 基础加载动画
`BottomButton` 底部按钮组
`FilterItems` 通用的多组筛选面板组件,支持单选和多选筛选
`FloatingBubble` 悬浮气泡
`PromotePopup` 推广弹窗组件，支持二维码展示和平台跳转功能
`PromotionInstructions` 可折叠的富文本展示组件，用于显示推广相关说明内容
`QrDialog` 二维码弹窗组件，支持展示和下载二维码图片
`SelectPopup` 底部弹出的选择器组件
`SelectPopupV2` 底部弹出的选择器组件，支持平台和子项目的选择
`TagScrollSelect` 标签滚动选择器
`SlideVerify` 验证码滑块组件