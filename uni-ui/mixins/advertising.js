import { makeAdVideo, verifyAdVideo } from "@/api/ad.js";
import { mapGetters } from "vuex";
import { getPayInfo } from "@/utils/tools";
const advertising = {
  data() {
    return {
      rewardedVideoAd: null,
      isEnded: false,
      ad_loading: false,
      video_id: null,
      ad_uid: null,
      demo_data: null,
    };
  },
  computed: {
    ...mapGetters(["system", "ad_config"]),
  },
  methods: {
    // 展示激励广告
    async showRewardedVideoAd({ collection_id, video_id }) {
      this.video_id = video_id;
      await this.getMakeAdVideo({ collection_id, video_id });
      if (this.rewardedVideoAd) {
        this.rewardedVideoAd?.show().catch(() => {
          this.rewardedVideoAd
            .load()
            .then(() => this.rewardedVideoAd.show())
            .catch((err) => {
              // console.log("激励视频广告显示失败");
            })
            .finally(() => {
              this.isEnded = false;
            });
        });
      }
    },

    // 初始化激励广告
    initAD() {
      if (!this.ad_config.ad_video.show) return
      // 创建激励视频广告实例
      // #ifdef MP-KUAISHOU
      this.rewardedVideoAd = ks.createRewardedVideoAd({
        type: this.ad_config.ad_video.type,
        unitId: this.ad_config.ad_video.unit_id,
      });
      // #endif
      // #ifdef MP-TOUTIAO
      this.rewardedVideoAd = tt.createRewardedVideoAd({
        adUnitId: this.ad_config.ad_video.unit_id,
      });
      // #endif
      // 监听激励视频广告加载事件
      this.rewardedVideoAd.onLoad(() => {
        // console.log("onLoad event emit----:");
        this.isEnded = false;
      });

      // 监听激励视频广告出错事件
      this.rewardedVideoAd.onError((errCode) => {
        console.log("onError event emit", errCode);
      });

      // 监听激励视频广告关闭事件
      this.rewardedVideoAd.onClose(({ isEnded }) => {
        this.isEnded = isEnded;
        if (isEnded) {
          this.$refs.preVideoRef?.setIsWatched()
          this.getVerifyAdVideo(this.video_id);
        } else {
          // console.log("未完整观看激励视频广告");
        }
      });
    },

    // 获取激励视频广告UID
    getMakeAdVideo({ video_id, collection_id }) {
      this.ad_uid = null;
      let params = {
        video_id,
        collection_id,
        system: this.system,
      };
      params = getPayInfo(params)
      makeAdVideo(params)
        .then((res) => {
          this.ad_uid = res.data.ad_uid;
        })
        .catch((error) => {
          console.error("error:", error);
        });
    },

    // 验证激励视频广告结果
    getVerifyAdVideo(video_id = null) {
      let params = {
        video_id,
        ad_uid: this.ad_uid,
      };
      verifyAdVideo(params)
        .then((res) => {
          // console.log(`res---:`, res);
        })
        .catch((error) => {
          // console.error("error:", error);
        });
    },
  },
  onLoad() { },
  onShow() {
    // console.log(`show-ad--:`, this.ad_config)
    // this.getAdPosition();
  },
  onUnload() {
    this.rewardedVideoAd?.destroy()?.catch(() => { });
    this.rewardedVideoAd = null;
  },
};

export default advertising;
