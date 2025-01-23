<template>
  <div class="base-upload__file-preview-wrapper">
    <div class="preview-file-name mb8" v-if="isShowFileName">
      {{ renderfile.file_name }}
    </div>

    <template v-if="renderfile.type == 'image'">
      <FilesSwiper :files="[renderfile]" :customSwiperOptions="{ pagination: {} }" />
    </template>

    <template v-else-if="renderfile.type == 'video'">
      <video width="160" height="90" controls="controls" :src="renderfile.url"></video>
    </template>

    <template v-else-if="renderfile.type == 'audio'">
      <audio width="160" height="90" controls="controls" :src="renderfile.url"></audio>
    </template>

    <template v-else>
      <div class="other-type-file-preview__wrapper">
        <div><i class="el-icon-document" :style="{ fontSize: '60px' }"></i></div>
        <div v-if="isSupportPreview">
          <!-- 之后 补齐预览 -->
          <el-link type="primary" @click="openIframeView(renderfile)">预览 </el-link>
        </div>
      </div>
      <IframeView dialog_type="BaseDialog" ref="IframeViewRef" />
    </template>
  </div>
</template>

<script>
  import FilesSwiper from '@/components/BaseTable/components/FilesSwiper.vue';
  import IframeView from '@/components/IframeView/index.vue';

  import { sizeTostr } from '@/utils/tools.js';
  import { generateVideoScreenshot, createDownLoadClick } from '@/utils/common/tools.js';

  /** 名称类型：通俗泛类、后缀名、真实mime_type */
  const IMAGE_MIME_TYPE = ['image', 'png', 'image/png', 'jpg', 'image/jpeg', 'jpeg', 'image/jpeg'];
  const VIDEO_MIME_TYPE = ['video', 'mp4', 'video/mp4', 'mov', 'video/quicktime'];
  const AUDIO_MIME_TYPE = ['audio', 'mp3', 'audio/mpeg'];
  const APK_MIME_TYPE = ['apk', 'application/vnd.android.package-archive'];
  const SUPPORT_PREVIEW_MIME_TYPE = [
    'pdf',
    'application/pdf',
    'xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls',
    'application/vnd.ms-excel',
    'mov',
    'video/quicktime',
    'bmp',
    'image/bmp',
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt',
    'text/plain',
  ];

  export default {
    props: {
      file_data: {
        type: Object,
        default: {
          // 必要属性如下：
          // [file_name | name]: 'sasa.xxx'
          // [file_type | type]: 'mp4' || 'jpg' || ...
          // preview_url: 'blob:http://localhost/44bd6077-b1f7-47e6-aa79-1fab09a78488'
        },
      },
      isShowFileName: {
        type: Boolean,
        default: true,
      },
    },

    components: {
      FilesSwiper,
      IframeView,
    },

    computed: {
      isSupportPreview() {
        return SUPPORT_PREVIEW_MIME_TYPE.includes(this.file_data?.type || this.file_data?.file_type);
      },
      
      renderfile() {
        let item = this.file_data;

        let file_type = item?.type || item?.file_type;
        let file_name = item?.name || item?.file_name;

        let file_size = item?.size || item?.file_size;
        if (file_size) {
          file_size = sizeTostr(file_size);
          file_name = `${file_name} (${file_size})`;
        }

        // preview_url 网络链接 && local_preview_url 本地 blob
        let file_preview_url = item?.preview_url || item?.local_preview_url || item?.url;

        if (IMAGE_MIME_TYPE.includes(file_type)) {
          return {
            type: 'image',
            file_name,
            url: file_preview_url,
            cover_url: file_preview_url,
          };
        } else if (VIDEO_MIME_TYPE.includes(file_type)) {
          return {
            type: 'video',
            file_name,
            url: file_preview_url,
            cover_url: generateVideoScreenshot(file_preview_url), // 视频截图
          };
        } else if (AUDIO_MIME_TYPE.includes(file_type)) {
          return {
            type: 'audio',
            file_name,
            url: file_preview_url,
          };
        } else {
          return {
            type: item.file_type,
            file_name,
            url: file_preview_url,
          };
        }
      },
    },

    data() {
      return {};
    },

    methods: {
      openIframeView(row) {
        this.$nextTick(() => {
          this.$refs.IframeViewRef.open(row);
        });
      },
    },

    mounted() {},
  };
</script>

<style lang="scss" scoped>
  .base-upload__file-preview-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .preview-file-name {
    }

    .other-type-file-preview__wrapper {
      display: flex;
      flex-direction: column;
    }
  }
</style>
