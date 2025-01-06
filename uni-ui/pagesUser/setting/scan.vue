<template>
  <view id="barcode">
  </view>
</template>

<script>
import { mapMutations } from "vuex";
export default {
  data() {
    return {
      isFlash: false,
      // 码类型
      barcode: [
        plus.barcode.QR,
        plus.barcode.EAN13,
        plus.barcode.EAN8,
        plus.barcode.UPCA,
        plus.barcode.UPCE,
        plus.barcode.CODABAR,
        plus.barcode.CODE39,
        plus.barcode.CODE93,
        plus.barcode.CODE128,
        plus.barcode.ITF,
      ],
    };
  },
  onLoad() {
    var pages = getCurrentPages();
    var page = pages[pages.length - 1];
    var currentWebview = page.$getAppWebview();

    this.barcode = plus.barcode.create("barcode", this.barcode, {
      top: "0",
      left: "0px",
      width: "100%",
      height: "100vh",
      position: "static",
      frameColor: "#FFF",
      scanbarColor: "#2FC47D",
    });

    // 绑定事件
    this.barcode.onmarked = this.onMarked;
    this.barcode.onerror = this.onError;
    currentWebview.append(this.barcode);

    // 创建view
    this.createView(currentWebview);

    const { platform } = uni.getSystemInfoSync();
    // 安卓机
    if (platform == "android") {
      this.barcode.start();
    }
  },
  onUnload() {
    this.barcode.setFlash(false);
    this.barcode.close();
    this.barcode.cancel();
  },
  methods: {
    ...mapMutations(["SET_SCAN_DATA"]),
    // 创建页面元素
    createView(currentWebview) {
      let { statusBarHeight,screenWidth } = uni.getSystemInfoSync();

      // 返回按钮
      var backVew = new plus.nativeObj.View(
        "backVew",
        {
          top: statusBarHeight + 16 + "px",
          left: "14px",
          height: "80px",
          width: "80px",
        },
        [
          {
            tag: "img",
            id: "backBar",
            src: "/static/images/scan_go_back_icon.png",
            position: {
              top: "0px",
              left: "0px",
              width: "24px",
              height: "24px",
            },
          },
        ]
      );

      // 标题
      var pageTitle = new plus.nativeObj.View(
        "pageTitle",
        {
          top: statusBarHeight + 16 + "px",
          left: "80px",
          height: "22px",
          width: screenWidth - 160 + "px",
        },
        [
          {
            tag: "font",
            id: "font",
            text: "扫一扫",
            textStyles: {
              size: "16px",
              color: "#ffffff",
            },
          },
        ]
      );

      // 返回按钮
      backVew.addEventListener(
        "click",
        (e) => {
          uni.navigateBack();
      });

      var scanBarVew = new plus.nativeObj.View(
        "scanBarVew",
        {
          top: "55%",
          left: "40%",
          height: "10%",
          width: "20%",
        },
        [
          {
            tag: "font",
            id: "font",
            text: "轻触点亮",
            textStyles: {
              size: "10px",
              color: "#ffffff",
            },
          },
        ]
      );

      var scanTips = new plus.nativeObj.View(
        "scanTips",
        {
          top: "63%",
          left: "0",
          height: "10%",
          width: "100%",
        },
        [
          {
            tag: "font",
            id: "font",
            text: "将二维码放到框内即可自动扫描",
            textStyles: {
              size: "14px",
              color: "#ffffff",
            },
          },
        ]
      );

      // 点亮手电筒
      scanBarVew.addEventListener("click", (e) => {
        this.isFlash = !this.isFlash;
        this.barcode.setFlash(this.isFlash);
      });

      backVew.interceptTouchEvent(true);
      scanBarVew.interceptTouchEvent(true);
      currentWebview.append(backVew);
      currentWebview.append(pageTitle);
      currentWebview.append(scanBarVew);
      currentWebview.append(scanTips);
    },
    onMarked(type, result) {
      this.barcode.cancel();
      this.analysisUrl(result).then((res) => {
        uni.redirectTo({
          url: '/pagesUser/scanLogin/index'
        });
      });
    },

    onReset() {
      this.barcode.cancel(); // 取消当前扫码
      this.barcode.start(); // 重新开始扫码
    },

    analysisUrl(url) {
      return new Promise((resolve, reject) => {
        try {
          const scanUrlPattern =
            /^xiaoguofanxing:\/\/scan_auth\?uuid=[\w\d]+&time=\d+$/;

          // 检查URL格式是否正确
          if (!scanUrlPattern.test(url)) {
            uni.showModal({
              title: "系统提示",
              content: "二维码不正确，请重新扫描！",
              success: (res) => {
                if (res.confirm || res.cancel) {
                  this.onReset();
                }
              },
            });
            return;
          }

          const queryString = url.split("?")[1];
          let uuid, time;
          // 如果有查询参数
          if (queryString) {
            // 以&分割各个参数
            const params = queryString.split("&");

            // 循环遍历参数，找到uuid和time
            params.forEach((param) => {
              const [key, value] = param.split("=");
              if (key === "uuid") {
                uuid = decodeURIComponent(value); // 解码处理
              } else if (key === "time") {
                time = decodeURIComponent(value); // 解码处理
              }
            });
          }
          this.SET_SCAN_DATA({ uuid, time });
          resolve({ uuid, time });
        } catch (error) {
          reject(error);
        }
      });
    },
    onError(err) {
      this.barcode.start();
    },
  },
};
</script>

<style lang="scss" scoped></style>
