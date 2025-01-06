<template>
  <view>
    <canvas
      canvas-id="myCanvas"
      :style="{
        width: canvasWidth + 'px',
        height: canvasHeight + 'px',
        position: 'fixed',
        left: '-9999px',
        visibility: 'hidden',
      }"
    ></canvas>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
export default {
  name: "saveQrCode",
  props: {
    title: {
      type: String,
      default: "标题",
    },
    qrUrl: {
      type: String,
      default: "",
    },
    saveName: {
      type: String,
      default: "qrcode",
    },
    fontSize: {
      type: Number,
      default: 14,
    },
    canvasWidth: {
      type: Number,
      default: 300,
    },
    canvasHeight: {
      type: Number,
      default: 400,
    },
    qrCodeSize: {
      type: Number,
      default: 300, // 默认与canvas宽度相同
    },
  },
  data() {
    return {};
  },
  methods: {
    /**
     * @description: 绘制多行文本
     * @param {*} ctx - Canvas 上下文
     * @param {*} text - 要绘制的文本
     * @param {*} x - 文本起点的 x 坐标
     * @param {*} y - 文本起点的 y 坐标
     * @param {*} lineHeight - 每行文本的高度
     * @param {*} fitWidth - 文本绘制区域的宽度
     * @return {*}
     */
    drawTextMultiline(ctx, text, x, y, lineHeight, fitWidth) {
      fitWidth = fitWidth || 0; // 如果没有提供 fitWidth，则默认为 0

      if (fitWidth <= 0) {
        const textWidth = ctx.measureText(text).width; // 计算文本的宽度
        const xCenter = x + (fitWidth - textWidth) / 2; // 计算文本居中的 x 坐标
        ctx.fillText(text, xCenter, y); // 绘制文本
        return; // 退出函数
      }

      let lines = []; // 存放分割后的多行文本

      // 首先将文本分成多行
      for (let idx = 1; idx <= text.length; idx++) {
        const str = text.substr(0, idx); // 获取当前字符串
        const strWidth = ctx.measureText(str).width; // 计算当前字符串的宽度
        if (strWidth > fitWidth && idx > 1) {
          // 如果超出规定宽度且长度大于 1
          lines.push(text.substr(0, idx - 1)); // 将当前行加入数组
          text = text.substr(idx - 1); // 剩余文本更新
          idx = 1; // 重置索引
        }
      }
      if (text.length > 0) {
        lines.push(text); // 将剩余文本加入数组
      }

      // 然后逐行绘制，每行居中
      lines.forEach((line, index) => {
        const textWidth = ctx.measureText(line).width; // 计算每行的宽度
        const xCenter = x + (fitWidth - textWidth) / 2; // 计算居中后的 x 坐标
        ctx.fillText(line, xCenter, y + index * lineHeight); // 绘制当前行
      });
    },

    /**
     * @description: 保存二维码
     * @return {*}
     */
    saveQRCode() {
      const ctx = uni.createCanvasContext("myCanvas", this); // 创建画布上下文
      const that = this; // 保存外部 this
      const lineHeight = 20; // 每行文字的高度
      const yPosition = this.canvasHeight - 70; // 文字的起始 y 坐标

      // 设置canvas背景色
      ctx.setFillStyle("#F6F7FB"); // 设置背景色为浅灰色
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight); // 填充整个canvas区域

      // 绘制二维码
      const qrX = (this.canvasWidth - this.qrCodeSize) / 2; // 计算二维码的X坐标使其居中
      const qrY = 0; // 保持在顶部
      ctx.drawImage(this.qrUrl, qrX, qrY, this.canvasWidth, this.canvasWidth); // 将二维码图像绘制到画布

      // 绘制标题
      ctx.setFontSize(this.fontSize); // 设置字体大小
      ctx.setFillStyle("#000000"); // 设置文本颜色为黑色
      this.drawTextMultiline(
        // 调用绘制多行文本函数
        ctx,
        this.title, // 要绘制的标题
        10, // x 坐标
        yPosition, // y 坐标
        lineHeight, // 每行高度
        this.canvasWidth - 20 // 宽度为画布宽度减去左右边距
      ); // 20为左右边距

      // 绘制到canvas上
      ctx.draw(false, () => {
        // 将canvas保存为图片
        uni.canvasToTempFilePath(
          {
            canvasId: "myCanvas", // canvas的ID
            success: (res) => {
              // #ifdef H5
              const link = document.createElement("a"); // 创建下载链接
              link.href = res.tempFilePath; // 设置链接地址为生成的图片路径
              link.download = `${this.saveName}.png`; // 设置下载文件名
              document.body.appendChild(link); // 将链接加入到文档中
              link.click(); // 触发下载
              document.body.removeChild(link); // 下载后移除链接
              // #endif
              // #ifdef MP || APP
              // 调用uniapp的API保存图片到相册
              uni.saveImageToPhotosAlbum({
                filePath: res.tempFilePath, // 设置保存的文件路径
                success: function () {
                  that.toastMsg("保存成功", "success");
                },
                fail: function (err) {
                  that.toastMsg("保存失败", "error");
                  console.error(err); // 输出错误信息到控制台
                },
              });
              // #endif
            },
            fail: function (err) {
              that.toastMsg("生成图片失败", "error");
              console.error(err); // 输出错误信息到控制台
            },
          },
          this
        );
      });
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
};
</script>

<style lang="scss" scoped></style>
