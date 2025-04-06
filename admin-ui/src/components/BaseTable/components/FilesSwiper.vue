<template>
  <div>
    <div class="files-container showBox-table-inline-swiper" v-if="files.length">
      <Swiper class="swiper" :options="renderSwiperOption">
        <!-- 爆款标记 -->
        <i v-if="isPopular" class="mr5 isPopular">
          <el-tooltip class="item" effect="dark" :content="popularContent" placement="top-start">
            <svg
              t="1688003149527"
              class="icon"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="2347"
              width="18"
              height="18"
            >
              <path
                d="M834.1 469.2c-19.5-43.8-47.4-82.6-82.9-115.2l-29.1-26.7c-4.3-3.8-11.1-2.1-13 3.3l-13 37.3c-8.1 23.4-23 47.3-44.1 70.8-1.4 1.5-3 1.9-4.1 2-1.1 0.1-2.8-0.1-4.3-1.5-1.4-1.2-2.1-3-2-4.8 3.7-60.2-14.3-128.1-53.7-202C555.3 171 510 123.1 453.4 89.7l-41.3-24.3c-5.4-3.2-12.3 1-12 7.3l2.2 48c1.5 32.8-2.3 61.8-11.3 85.9-11 29.5-26.8 56.9-47 81.5-14.2 17.2-30.1 32.7-47.5 46.1-42.1 32.3-76.8 74.4-100.3 121.5C172.5 503.3 160 556.6 160 610c0 47.2 9.3 92.9 27.7 136 17.8 41.5 43.2 78.9 75.5 110.9 32.4 32 70 57.2 111.9 74.7C418.5 949.8 464.5 959 512 959s93.5-9.2 136.9-27.3c41.9-17.5 79.6-42.6 111.9-74.7 32.4-32 57.8-69.4 75.5-110.9 18.4-43.1 27.7-88.8 27.7-136 0-48.8-10-96.2-29.9-140.9z"
                p-id="2348"
                fill="#F56C6C"
              ></path>
            </svg>
          </el-tooltip>
        </i>
        <SwiperSlide
          style="height: 90px"
          v-for="(item, index) in files"
          :key="'cusswiper' + item.cover_url + index"
        >
          <div class="image-video-card">
            <el-image
              v-if="item.type == 'image'"
              style="height: 90px"
              :src="item.cover_url"
              :preview-src-list="images"
              fit="contain"
            ></el-image>
            <div class="video-play-card" v-else>
              <!-- 暂时固定处理 网宿的 视频链接，方式显示错误 -->
              <template v-if="item.cover_url.includes('wangsu')">
                <video :controls="false" controlslist="nodownload" height="90">
                  <source :src="item.cover_url.split('?')[0]" />
                </video>
              </template>
              <template v-else>
                <img fit="contain" height="90" :src="item.cover_url" />
              </template>
              <div class="video-fixable">
                <i @click="playVideo(item)" class="el-icon-video-play play-icon"></i>
              </div>
            </div>
          </div>
        </SwiperSlide>
        <div class="swiper-pagination" slot="pagination"></div>
        <div class="swiper-button-prev" v-if="files.length > 1" slot="button-prev">
          <i class="el-icon-caret-left"></i>
        </div>
        <div class="swiper-button-next" v-if="files.length > 1" slot="button-next">
          <i class="el-icon-caret-right"></i>
        </div>
      </Swiper>
    </div>
    <div class="panoramaImg" v-if="authButons.length">
      <template v-for="(btn, index) in authButons">
        <el-button @click="spark(btn.click)" :disabled="btn.disabled" :key="index" type="text">{{
          btn.label
        }}</el-button>
      </template>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      files: {
        type: Array,
        default: () => [],
      },
      /**@type { { label:string; click?:string; disabled?: boolean; auth?: string[] }[] }  */
      buttons: {
        type: Array,
        default: () => [],
      },

      /* 自定义 swiper 组件的选项 */
      customSwiperOptions: {
        type: Array,
        default: () => ({}),
      },

      /*爆款标记*/
      isPopular: {
        type: Boolean,
        default: false,
      },
      popularContent: {
        type: String,
        default: '爆款',
      },
    },
    data() {
      return {
        swiperOption: {
          clickable: true,
          pagination: {
            el: '.swiper-pagination',
            type: 'fraction',
          },
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          simulateTouch: false,
        },
      };
    },
    computed: {
      authButons() {
        const authBtns = [];
        this.buttons.forEach((v) => {
          if (!v.auth) {
            authBtns.push(v);
          } else if (this.$checkPermi(v.auth)) {
            authBtns.push(v);
          }
        });
        return authBtns;
      },
      images() {
        const images = [];
        this.files.forEach((file) => {
          if (file.type == 'image')
            // images.push({
            //   source: file.url,
            //   thumbnail: file.url + "?x-oss-process=image/resize,h_90/quality,q_90",
            // });
            images.push(file.url);
        });
        return images;
      },
      renderSwiperOption() {
        return {
          ...this.swiperOption,
          ...this.customSwiperOptions,
        };
      },
    },
    methods: {
      playVideo(item) {
        this.$emit('playVideo', item);
      },
      spark(evName) {
        if (evName) this.$emit(evName);
      },
    },
  };
</script>

<style lang="scss" scoped>
  .showBox-table-inline-swiper {
    user-select: none;
    .swiper-pagination-fraction {
      bottom: 0px;
      color: #999 !important;
    }

    .swiper-container {
      &:hover {
        .swiper-button-prev {
          display: block;
        }

        .swiper-button-next {
          display: block;
        }
      }
    }

    .swiper-button-prev {
      text-align: center;
      padding-right: 2px;
      color: #ddd;
      background-color: rgba(31, 45, 61, 0.3);
      display: none;
      font-size: 18px;
      line-height: 26px;
      width: 25px;
      left: 2px;
      transition: all 0.3s;
      height: 25px;
      border-radius: 50%;
      margin-top: -10px;

      &::after {
        display: none;
      }
    }

    .swiper-button-next {
      text-align: center;
      color: #ddd;
      padding-left: 2px;
      background-color: rgba(31, 45, 61, 0.3);
      display: none;
      transition: all 0.3s;
      font-size: 18px;
      line-height: 26px;
      width: 25px;
      right: 2px;
      height: 25px;
      border-radius: 50%;
      margin-top: -10px;

      &::after {
        display: none;
      }
    }

    .swiper-button-disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: all;
    }
  }
  .files-container {
    height: 90px;
    width: 160px;
  }
  .image-video-card {
    width: 160px;
    height: 90px;
    background-color: rgba(128, 123, 123, 0.7);
    border-radius: 4px;
    ::v-deep .el-image__inner {
      border-radius: 4px;
      cursor: pointer;
    }
    ::v-deep .el-image {
      width: 160px;
    }
  }
  .video-play-card {
    position: relative;
    text-align: center;
    video{
      border-radius: 3px;
    }
    .video-fixable {
      position: absolute;
      width: 160px;
      height: 90px;
      background-color: rgba(0, 0, 0, 0.1);
      top: 0;
      left: 0;
      border-radius: 3px;
      line-height: 110px;
      text-align: center;
    }
    .play-icon {
      font-size: 35px;
      color: #fff;
      z-index: 9999;
      cursor: pointer;
    }
  }
  .panoramaImg {
    display: flex;
    width: 160px;
    justify-content: space-evenly;
  }
  .isPopular {
    position: absolute;
    top: 5px;
    left: 5px;
    font-size: 24px;
    z-index: 99;
  }
</style>
