<template>
  <el-upload
    v-bind="$attrs"
    ref="uploadRef"
    action=""
    :http-request="uploadFile"
    :before-upload="selfBeforeUpload"
    :show-file-list="true"
    v-loading="loading"
  >
    <!-- <slot :filename="name"></slot> -->
    <el-button size="small" type="primary">点击上传</el-button>
  </el-upload>
</template>


<script>
import { streamUpload } from '@/api/public.js';
import { promiseFileMd5 } from '@/utils/common/tools';
import { aliOssUpload, utils } from '@/utils/common/upload.js';
export default {
  props: {
    type: {
      type: String, // stream | aliOss
    },
    repeat: {
      type: Boolean,
      default: true, // only aliOss
    },
    value: {}, // fileObj
    beforeUpload: {
      type: Function, // (file: File) => Promise<any>
      default: () => Promise.resolve(),
    },
    bucket: {
      type: String,
      default: 'koc-img', // 上传设置的存储路径
    },
    dir: {
      type: String,
      default: null, // 上传设置的文件夹
    },
  },
  data() {
    return {
      name: '',
      percentage: 0,
      loading: false,
    };
  },
  watch: {
    value(val) {
      if (!val) {
        this.name = '';
      }
    },
  },
  methods: {
    selfBeforeUpload(file) {
      return promiseFileMd5(file)
        .then((md5) => {
          file.md5 = md5;
          return this.getFileStats(file);
        })
        .then(() => {
          return this.beforeUpload(file);
        });
    },
    getFileStats(file) {
      let fileType = '';
      if (file.type.startsWith('image')) {
        fileType = 'image';
      } else if (file.type.startsWith('video')) {
        fileType = 'video';
      }

      if (!fileType) {
        file.stats = {};
        return Promise.resolve();
      }
      const promiseFunc = fileType == 'video' ? utils.videoStats : utils.imageStats;
      return promiseFunc(file)
        .then((stats) => {
          file.stats = stats;
          if (file.stats?.blobUrl) {
            URL.revokeObjectURL(file.stats.blobUrl);
            delete file.stats.blobUrl;
          }
        })
        .catch((err) => {
          this.$notify.error(err.message || err);
          throw err;
        });
    },
    setPercentage(p) {
      this.percentage = Math.min(Math.round(p * 100), 100);
    },
    clearUploadFile() {
      this.$refs.uploadRef?.clearFiles();
    },
    uploadFile(options) {
      if (this.type == 'stream') {
        return this.streamUploadFile(options);
      } else {
        return this.aliUploadFile(options);
      }
    },
    aliUploadFile(options) {
      // this.fileObj = null;
      this.percentage = 0;
      const { file } = options;
      const fileObj = {
        md5: file.md5,
        name: file.name,
        stats: file.stats,
        status: '',
        raw: file,
        onprogress: this.setPercentage,
        allowRepeat: this.repeat,
      };
      delete file.md5;
      delete file.stats;
      this.loading = true;
      if (this.bucket) fileObj.bucket = this.bucket;
      if (this.dir) fileObj.dir = this.dir;
      return aliOssUpload(fileObj)
        .then((data) => {
          this.loading = false;
          if (fileObj.status == 'abort') return;
          delete fileObj.cancelSource;
          // 手动抛出的code1 不在request处理范围内
          if (data.code == 0) {
            fileObj.response = data;
            fileObj.url = data.url;
            fileObj.status = 'success';
            delete fileObj.raw;
            delete fileObj.onprogress;
            // this.fileObj = fileObj;
            // this.$emit('input', fileObj);
            this.name = fileObj.name;
            this.$emit('input', data.url);
          } else {
            throw data;
          }
        })
        .catch((e) => {
          this.loading = false;
          if (fileObj.status == 'abort') return;
          delete fileObj.cancelSource;
          this.clearUploadFile();
          fileObj.status = 'fail';
          if (e.isAxiosError) {
            this.$notify.error('网络错误，请稍后再试！');
          } else {
            this.$notify.error(e.message || e || '未知错误');
          }
        });
    },
    streamUploadFile(options) {
      const { file } = options;
      const fileObj = {
        name: file.name,
        md5: file.md5,
      };
      delete file.md5;
      delete file.stats;
      this.loading = true;
      streamUpload(file, fileObj, this.setPercentage)
        .then((data) => {
          this.loading = false;
          // { oss_key, upload_id, url }
          // fileObj.url = data.data.url;
          // this.$emit('input', fileObj);
          this.name = fileObj.name;
          this.$emit('input', data.data.url);
        })
        .catch((e) => {
          this.loading = false;
          this.clearUploadFile();
          if (e.isAxiosError) {
            this.$notify.error('网络错误，请稍后再试！');
          } else {
            this.$notify.error(e.message || e || '未知错误');
          }
        });
    },
  },
};
</script>