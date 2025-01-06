<template>
  <div>
    <div class="preview-file-name mb8" v-if="isShowFileName">
      {{ renderfile.name }}
    </div>

    <template v-if="renderfile.type == 'image'">
      <FilesSwiper :files="[renderfile]" :customSwiperOptions="{ pagination: {} }" />
    </template>

    <template v-else-if="renderfile.type == 'video'">
      <video width="160" height="90" controls="controls" :src="renderfile.url"></video>
    </template>

    <template v-else>
      <div>
        <!-- 之后 补齐预览 -->
        <el-link type="primary" @click="openIframeView(renderfile)"
          >预览 {{ renderfile.name }}
        </el-link>
      </div>
      <IframeView dialog_type="BaseDialog" ref="IframeViewRef" />
    </template>
  </div>
</template>

<script>
  import FilesSwiper from '@/components/BaseTable/components/FilesSwiper.vue';
  import IframeView from '@/components/IframeView/index.vue';
  import { generateVideoScreenshot, createDownLoadClick } from '@/utils/common/tools.js';

  export default {
    props: {
      file_data: {
        type: Object,
        default: {
          // 必要属性如下：
          // file_type:'mp4' || 'jpg' || ...
          // preview_url:'blob:http://localhost/44bd6077-b1f7-47e6-aa79-1fab09a78488'
        },
      },
      isShowFileName: {
        type: Boolean,
        default: false,
      },
    },

    components: {
      FilesSwiper,
      IframeView,
    },

    computed: {
      renderfile() {
        let item = this.file_data;
        // preview_url 网络链接 && local_preview_url 本地 blob
        let file_preview_url = item.preview_url || item.local_preview_url;

        if (['jpg', 'jpeg', 'png'].includes(item.file_type)) {
          return {
            type: 'image',
            url: file_preview_url,
            name: item.file_name,
            cover_url: file_preview_url,
          };
        } else if (['mp4', 'bmp'].includes(item.file_type)) {
          return {
            type: 'video',
            url: file_preview_url,
            name: item.file_name,
            cover_url: generateVideoScreenshot(file_preview_url),
          };
        } else {
          // 如 ['docx', 'xlsx', 'pdf']
          return {
            type: item.file_type,
            name: item.file_name,
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
  .preview-file-name {
    color: #c0c4cc;
  }
</style>
