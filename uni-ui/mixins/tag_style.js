const tagStyleMixin = {
  data() {
    return {
      tagStyle: {
        ol: "padding-inline-start:20px;margin:5px 0;line-height:1.5;",
        ul: "padding-inline-start:20px;margin:5px 0;line-height:1.5;",
        th: "min-width: 100rpx;height: 40rpx;color: #ffffff;",
        td: "min-width: 100rpx;height: 40rpx;",
        table: "border-collapse: collapse;",
        p: "letter-spacing: 1px;line-height:1.5;",
        video: "width:100% !important; height:422rpx;display: block",
      },
    };
  },
};

export default tagStyleMixin;
