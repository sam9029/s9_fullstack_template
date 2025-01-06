<script>
import store from "@/store/index.js";
import { checkUpdate, setPayInfo, appCheckUpdate } from "@/utils/tools.js";
import { screenShotMonitor } from "@/utils/screenshot";
import { mapGetters } from "vuex";
import { getUserInfo } from "@/utils/user.js";
export default {
  data() {
    return {};
  },
  // #ifdef H5
  computed: {
    ...mapGetters(["theme_color"]),
  },
  mounted() {
    const root = document.documentElement;
    root.style.setProperty("--boyao-primary-color", this.theme_color);
    root.style.setProperty(
      "--boyao-primary-color-1",
      uni.$u.colorToRgba(this.theme_color, 0.9)
    );
    root.style.setProperty(
      "--boyao-primary-color-2",
      uni.$u.colorToRgba(this.theme_color, 0.8)
    );
    root.style.setProperty(
      "--boyao-primary-color-3",
      uni.$u.colorToRgba(this.theme_color, 0.6)
    );
    root.style.setProperty(
      "--boyao-primary-color-4",
      uni.$u.colorToRgba(this.theme_color, 0.4)
    );
    root.style.setProperty(
      "--boyao-primary-color-5",
      uni.$u.colorToRgba(this.theme_color, 0.2)
    );
  },
  // #endif
  onLaunch: function ({ query }) {
    // setPayInfo(query); // 支付信息
    // #ifdef  MP
    screenShotMonitor(); // 记录截屏事件
    checkUpdate(); //检查更新
    // #endif
    const userInfo = getUserInfo();
    if (userInfo) {
      store.commit("SET_USER_INFO", userInfo);
      store.dispatch("queryUserInfo");
    }
	
	// #ifdef  APP
	appCheckUpdate(); //检查更新 
	// #endif
  },
  onHide: function () {
    // console.log("App Hide");
  },
};
</script>

<style lang="scss">
@import "@/uni_modules/uview-ui/index.scss";
@import "@/static/public.scss";
@font-face {
  font-family: "uniicons"; /* Project id 1387774 */
  src: url("https://at.alicdn.com/t/c/font_1387774_nc1dh9ulvwe.woff2?t=1704956969838")
      format("woff2"),
    url("https://at.alicdn.com/t/c/font_1387774_nc1dh9ulvwe.woff?t=1704956969838")
      format("woff"),
    url("https://at.alicdn.com/t/c/font_1387774_nc1dh9ulvwe.ttf?t=1704956969838")
      format("truetype");
}

.uniicons {
  font-family: "uniicons" !important;
  font-size: 28rpx;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
page {
  background-color: #f6f7fb;
  box-sizing: border-box;
}
.bottom-tabar {
  position: fixed;
  bottom: 0;
  width: 750rpx;
  z-index: 999;
}
.uni-status_bar {
  height: var(--status-bar-height);
  width: 100%;
}
</style>
