<template>
  <view class="koa-qrcode u-flex-row u-col-center u-row-center">
    <uqrcode
      v-if="!hide"
      ref="qrcode"
      :value="qrValue"
      canvas-id="qrcode"
      :size="size"
      type="2d"
      :options="options"
      :sizeUnit="sizeUnit"
      :hide="hide"
      @complete="saveLocal"
    ></uqrcode>
    <u--image
      v-if="hide"
      :width="`${size}${sizeUnit}`"
      :height="`${size}${sizeUnit}`"
      :src="qr_code"
    ></u--image>
  </view>
</template>

<script>
import { downloadFile } from "@/utils/tools.js";
export default {
  name: "kocQRCode",
  props: {
    size: {
      type: [String, Number],
      default: 200,
    },
    qrValue: {
      type: [String, Number],
    },
    options: {
      type: Object,
      default: () => {},
    },
    sizeUnit: {
      type: String,
      default: "px",
    },
  },
  data() {
    return {
      hide: false,
      qr_code: "",
    };
  },
  methods: {
    saveLocal(val) {
      if (val) {
        // #ifndef MP
        uni.canvasToTempFilePath({
          destWidth: 500,
          destHeight: 500,
          canvasId: "qrcode",
          success: (res) => {
            // 在H5平台下，tempFilePath 为 base64
            if (res.tempFilePath) {
              this.hide = true;
              this.qr_code = res.tempFilePath;
              this.$emit("complete", res.tempFilePath)
            }
          },
          fail: (err) => {
            uni.showToast({
              icon: "none",
              mask: true,
              title: "若保存失败，请长按二维码保存",
            });
            // console.log(err);
          },
        });
        // #endif

        // #ifdef MP
        this.$refs.qrcode.toTempFilePath({
          success: (res) => {
            if (res.tempFilePath) {
              this.hide = true;
              this.qr_code = res.tempFilePath;
            }
          },
          fail: (err) => {
            uni.showToast({
              icon: "none",
              mask: true,
              title: "若保存失败，请长按二维码保存",
            });
            // console.log(err);
          },
        });
        // #endif
      }
    },
    saveImageToPhotosAlbum(vm = this) {
      if (!this.qr_code) return;
      //#ifdef APP || MP
      uni.saveImageToPhotosAlbum({
        filePath: this.qr_code,
        success: function () {
          // 成功提示
          uni.hideLoading();
          uni.showToast({
            icon: "none",
            mask: true,
            title: "保存成功", //保存路径
            duration: 3000,
          });
        },
        fail: () => {
          //下载失败
          uni.hideLoading();
          uni.showToast({
            icon: "none",
            mask: true,
            title: "若保存失败，请长按二维码保存",
          });
        },
      });
      //#endif
      //#ifdef H5
      downloadFile("image", this.qr_code, "二维码", vm);
      //#endif
    },
  },
};
</script>

<style lang="scss" scoped></style>
