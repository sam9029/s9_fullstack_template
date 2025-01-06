<template>
  <div>
    <el-upload
      action
      :before-upload="beforeUpload"
      :http-request="exportData"
      v-if="!com_id"
      :show-file-list="false"
      :disabled="com_disabled"
    >
      <el-button size="small" type="primary" :disabled="com_disabled">
        {{ title }}
      </el-button>
    </el-upload>

    <template v-else>
      <el-button
        v-if="downloadBtnType=='button'"
        size="small"
        type="primary"
        @click="downTemplate"
        :loading="loading"
        :icon="downloadIcon"
        :disabled="com_disabled"
        >{{ downloadBtnText }}</el-button
      >
      <el-link
        v-if="downloadBtnType=='link'"
        size="small"
        type="primary"
        @click="downTemplate"
        :underline="false"
        :loading="loading"
        :disabled="com_disabled"
        >{{ downloadBtnText }}</el-link
      >
    </template>
  </div>
</template>
<script>
  import request from '@/utils/request';
  import { promiseFileMd5 } from '@/utils/common/tools.js';
  import { templateAdd, templateDown, streamUpload } from '@/api/public.js';

  export default {
    props: {
      id: {
        type: Number,
        default: 0,
      },
      downloadBtnType: {
        type: String,
        default: 'button',  // button || link
      },
      downloadIcon: {
        type: String,
        default: '',
      },
      downloadBtnText: {
        type: String,
        default: '下载模板',
      },
      title: {
        type: String,
        default: '点击上传',
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        loading: false,
      };
    },
    computed: {
      com_id() {
        return this.id;
      },
      com_disabled() {
        return this.disabled;
      },
    },
    methods: {
      beforeUpload(file) {
        // const isTrue = file.type === 'application/vnd.ms-excel';

        // if (!isTrue) {
        //   this.$notify.error('上传头像图片只能是 excel 格式!');
        // }
        // return isTrue;
        return true;
      },
      async exportData(data) {
        const { file } = data;

        const md5 = await promiseFileMd5(file);

        const params = { name: file.name, md5: md5 };

        streamUpload(file, params)
          .then(({ data }) => {
            const { identical, url } = data;
            !identical && this.saveInDatabase({ name: file.name.split('.')[0], url: url });
            identical && this.$notify.error('数据库中已存在，请勿重复上传');
          })
          .catch((e) => {
            console.log(e);
          });
      },

      saveInDatabase(data) {
        templateAdd(data)
          .then((res) => {
            if (res.code == 0) {
              this.$emit('uploadOk');
              this.$notify.success('上传成功');
            } else {
              this.$notify.error('上传失败');
            }
          })
          .catch((e) => {
            this.$notify.error('上传失败');
            console.log(e);
          });
      },

      downTemplate() {
        this.loading = true;
        templateDown({ id: this.id })
          .then((data) => {
            if (data.code == 0) {
              let url = data.data;
              let elemIF = document.createElement('iframe');
              elemIF.src = url;
              elemIF.style.display = 'none';
              document.body.appendChild(elemIF);
            } else {
              this.$notify.error(data.message || '错误');
            }
            this.loading = false;
          })
          .catch((e) => {
            this.loading = false;
            this.$notify.error(e.message || e || '错误');
          });
      },
    },
  };
</script>
