<template>
  <view class="invite-page">
    <GuideToWebsite v-if="showGuide"></GuideToWebsite>
    <template v-else>
			<view class="top-area">
				<MyNavbar bgColor="transparent">
					<template #navbarData>
						<view class="u-flex-row u-row-center u-col-center">
							<text class="u-text-center u-font-32 color-text-black"
								>邀请好友</text
							>
						</view>
					</template>
				</MyNavbar>
			</view>

      <view class="invite-page--container u-p-l-56 u-p-r-56">
        <view id="save-area" ref="save-area" class="save-area u-bg-f u-m-b-28">
          <u--image
            class="invite-bg"
            :src="`${static_path}invite_bg.png`"
            width="100%"
            height="400rpx"
          ></u--image>
          <view class="u-p-32">
            <view class="avatar-area u-p-b-32 u-flex-row u-col-center">
              <u-avatar :src="avatar_icon" shape="circle" size="48"></u-avatar>
              <view class="u-flex-col u-m-l-32">
                <text class="u-font-bold u-font-32 u-line-h-48">{{
                  inviteInfo.name
                }}</text>
                <text class="color-text-less-grey u-font-22 u-line-h-40"
                  >邀请你加入欢乐创APP</text
                >
              </view>
            </view>
            <view
              class="qr-area u-flex-row u-row-between u-col-center u-p-t-32"
            >
              <view class="qr-area--left u-flex-col">
                <text
                  class="color-text-primary u-font-bold u-font-40 u-line-h-56"
                  style="font-style: italic"
                  >HEY~</text
                >
                <text class="color-text-less-grey">请扫码注册加入欢乐创</text>
                <view class="u-flex-row u-col-bottom">
                  <text class="color-text-less-grey u-m-r-8">专属邀请码</text>
                  <text class="u-font-bold u-font-32">{{
                    inviteInfo.invite_code
                  }}</text>
                </view>
              </view>
              <view class="qr-area--right">
                <QrCode
                  :qrValue="inviteInfo.qr_link"
                  :size="144"
                  sizeUnit="rpx"
                  :options="qrOptions"
                  @complete="qrcodeComplete"
                ></QrCode>
              </view>
            </view>
          </view>
        </view>

        <view class="invite-info u-bg-f u-m-b-28 u-p-32">
          <text class="u-font-28 u-line-h-44 color-text-black">邀请说明</text>
          <ul
            class="u-font-24 color-text-less-grey u-line-h-40 u-m-t-16"
            style="padding-left: 32rpx"
          >
            <li>
              用户扫描分享二维码，首次打开页面点击“立即加入”按钮，注册信息无需输入邀请码，系统自动绑定邀请关系。
            </li>
            <li>
              用户扫描分享二维码后，直接下载APP，在APP登录页进行注册，需要输入您的专属邀请码，才能绑定邀请关系。
            </li>
          </ul>
        </view>

        <view
          class="invite-num u-flex-row u-row-between u-col-center u-p-32 u-bg-f"
          @click="goDetail"
        >
          <view class="u-flex-row u-col-center">
            <u--image
              :src="`${static_path}invite_success_icon.png`"
              width="48rpx"
              height="48rpx"
            ></u--image>
            <text class="u-font-28 color-text-black u-m-l-16">{{
              `已成功邀请${inviteInfo.invite_people_num || 0}人`
            }}</text>
          </view>
          <u-icon size="16" color="#2c2c2c" name="arrow-right"></u-icon>
        </view>
      </view>

      <canvas
        id="saveCanvas"
        canvas-id="saveCanvas"
        :style="{
          width: '638px',
          height: '742px',
          position: 'fixed',
          left: '-9999px',
          visibility: 'hidden',
        }"
      ></canvas>

      <view class="widthAll" :style="{ height: `${btnHeight}rpx` }"></view>

      <BottomBtn
        :data="button_list"
        layout="even"
        :buttonIndex="0"
				bgColor="#F6F7FB"
        @save="onSave"
        @copy="onCopy"
        @height="getHeight"
      />
      <base-toast ref="toastRef"></base-toast>
    </template>
  </view>
</template>

<script>
import GuideToWebsite from "@/components/guide-to-website/index.vue";
import MyNavbar from "@/components/my-navbar/index.vue";
import BottomBtn from "@/components/bottom-button/index.vue";
import QrCode from "../components/koc-qrcode/index.vue";
import permision from "@/js_sdk/wa-permission/permission.js";
import { getInviteInfo } from "../api/invite.js";
import { copy, isMiniProgramBrowser } from "@/utils/tools.js";
import { mapGetters } from "vuex";
export default {
  options: {
    styleIsolation: "shared",
  },
  components: {
    MyNavbar,
    BottomBtn,
    QrCode,
    GuideToWebsite,
  },
  data() {
    return {
      showGuide: false,
      inviteInfo: {
        qr_link: null,
        invite_code: null,
      },
      qrOptions: {
        errorCorrectLevel: "L",
      },
      local_qr_link: "",
      btnHeight: 0,
    };
  },
  computed: {
    ...mapGetters(["static_path", "user_info"]),
    avatar_icon() {
      return this.inviteInfo.avatar || `${this.static_path}no_avatar.png`;
    },
    button_list() {
      return [
        [
          {
            text: "复制邀请码",
            shape: "square",
            plain: true,
            onClick: "copy",
            btnType: "button",
          },
          {
            text: "保存图片",
            shape: "square",
            type: "primary",
            onClick: "save",
            btnType: "button",
            disabled: this.local_qr_link ? false : true,
          },
        ],
      ];
    },
  },
  methods: {
    async onSave() {
      if (isMiniProgramBrowser()) {
        return (this.showGuide = true);
      }
      const { platform, uniPlatform } = uni.getSystemInfoSync();
      if (uniPlatform === "app") {
        if (platform === "ios") {
          permision.judgeIosPermission("photoLibrary");
        } else {
          const res = await permision.requestAndroidPermission(
            "android.permission.WRITE_EXTERNAL_STORAGE"
          );
          if (res != 1) {
            this.toastMsg("拒绝授权无法使用该功能，请开启权限后重试");
            return;
          }
        }
      }
      uni.$u.throttle(this.genrerateImg(), 500);
    },

    genrerateImg() {
      try {
        this.toastMsg("保存中", "loading", -1);

        // 创建canvas context
        const ctx = uni.createCanvasContext("saveCanvas", this);

        // 设置canvas大小（按照保存区域大小）
        const canvasWidth = 638;
        const canvasHeight = 742;

        // 绘制白色背景
        ctx.setFillStyle("#FFFFFF");
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 1. 绘制背景图
        ctx.drawImage(
          `${this.static_path}invite_bg.png`,
          0,
          0,
          canvasWidth,
          400
        );

        // 2. 绘制头像 (adjusted for 84x84 size)
        ctx.save();
        ctx.beginPath();
        ctx.arc(72, 464, 42, 0, 2 * Math.PI); // Adjusted for smaller radius
        ctx.clip();
        ctx.drawImage(this.avatar_icon, 30, 422, 84, 84); // Adjusted position and size
        ctx.restore();

        // 3. 绘制文字 (adjusted X coordinates)
        ctx.setFontSize(32);
        ctx.setFillStyle("#000000");
        ctx.fillText(this.inviteInfo.name, 136, 460);

        ctx.setFontSize(22);
        ctx.setFillStyle("#999999");
        ctx.fillText("邀请你加入欢乐创APP", 136, 496);

        // 4. 绘制分割线 (adjusted Y coordinate)
        ctx.setStrokeStyle("#EEEEEE");
        ctx.setLineDash([32, 16]);
        // ctx.setLineWidth(3);
        ctx.beginPath();
        ctx.moveTo(32, 528);
        ctx.lineTo(606, 528);
        ctx.stroke();

        // 5. 绘制底部文字 (adjusted Y coordinates)
        ctx.setFillStyle("#2979ff");
        ctx.font = "italic bold 40px source-han-sans";
        ctx.fillText("HEY~", 32, 598);
        ctx.font = "normal 40px sans-serif";

        ctx.setFontSize(24);
        ctx.setFillStyle("#999999");
        ctx.fillText("请扫码注册加入欢乐创", 32, 644);

        // 绘制"专属邀请码"文本，不使用加粗样式
        ctx.setFontSize(24);
        ctx.setFillStyle("#999999");
        ctx.fillText("专属邀请码", 32, 698);

        // 设置字体大小和颜色
        ctx.setFontSize(32);
        ctx.setFillStyle("#000000");
        ctx.font = "bold 32px sans-serif"; // 设置字体为加粗
        ctx.fillText(this.inviteInfo.invite_code, 160, 698);

        // 6. 绘制二维码 (adjusted Y coordinate)
        ctx.drawImage(this.local_qr_link, 462, 560, 144, 144);

        // 绘制并保存
        ctx.draw(false, () => {
          setTimeout(() => {
            uni.canvasToTempFilePath(
              {
                canvasId: "saveCanvas",
                success: (res) => {
                  // #ifdef H5
                  const link = document.createElement("a"); // 创建下载链接
                  link.href = res.tempFilePath; // 设置链接地址为生成的图片路径
                  link.download = `invite.png`; // 设置下载文件名
                  document.body.appendChild(link); // 将链接加入到文档中
                  link.click(); // 触发下载
                  document.body.removeChild(link); // 下载后移除链接
                  // #endif
                  // #ifdef APP
                  uni.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                      this.$refs.toastRef?.close();
                      this.toastMsg("保存成功", "success");
                    },
                    fail: () => {
                      this.$refs.toastRef?.close();
                      this.toastMsg("保存失败", "error");
                    },
                  });
                  // #endif
                },
                fail: () => {
                  this.$refs.toastRef?.close();
                  this.toastMsg("生成图片失败", "error");
                },
              },
              this
            );
          }, 200);
        });
      } catch (error) {
        this.toastMsg("保存失败", "error");
      }
    },

    onCopy() {
      copy(
        {
          content: this.inviteInfo.invite_code,
        },
        this
      );
    },

    getDetail() {
      this.toastMsg("加载中", "loading", -1);
      getInviteInfo()
        .then((res) => {
          if (res.code == 0) {
            this.inviteInfo = res.data;
            this.$refs.toastRef?.close();
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        });
    },

    getHeight(height) {
      this.btnHeight = height * 2 + 400;
    },

    // 提示
    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },

    qrcodeComplete(res) {
      this.local_qr_link = res;
    },

    goDetail() {
      uni.navigateTo({
        url: "/pagesUser/invite/record",
      });
    },
  },
  onReady() {
    this.getDetail();
  },
};
</script>

<style lang="scss" scoped>
.invite-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #d3edff 0%, #f6f7fb 60.27%);
	.top-area {
		/* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */
    z-index: 100;
    width: 100%;
    position: sticky;
    top: 0;
    background: linear-gradient(180deg, #d3edff, #d7eeff);
	}
  .invite-page--container {
    padding-top: 48rpx;
  }

  .save-area {
    border-radius: 32rpx;

    ::v-deep .invite-bg .u-image__image {
      border-top-left-radius: 32rpx !important;
      border-top-right-radius: 32rpx !important;
    }
  }

  .avatar-area {
    border-bottom: 2rpx dashed #eeeeee;
  }

  .invite-info {
    border-radius: 32rpx;
  }

  .invite-num {
    border-radius: 32rpx;
  }
}

::v-deep #koc-main-bottom {
  background-color: #f6f7fb;
  border: none;

  .u-botton {
    height: 88rpx;
  }
}

::v-deep .app-grid {
  background: #d3edff;
}
</style>
