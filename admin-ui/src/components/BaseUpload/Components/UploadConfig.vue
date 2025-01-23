<template>
  <div class="base-upload__config-inner-wrapper">
    <el-popover width="400" v-model="visible" @hide="cancel">
      <div>
        <el-form size="mini" label-position="left" label-width="110px" :model="form" :rules="rules">
          <el-form-item label="存储云厂商" prop="site">
            <el-radio-group v-model="form.site">
              <el-radio-button
                v-for="item in site_options"
                :key="item.value"
                :label="item.value"
                :value="item.value"
                >{{ item.label }}</el-radio-button
              >
            </el-radio-group>
          </el-form-item>

          <el-form-item label="存储桶" prop="bucket">
            <el-radio-group v-model="form.bucket" :disabled="isDisabled('bucket')">
              <el-radio-button
                v-for="item in render_bucket_options"
                :key="item.value"
                :label="item.value"
                :value="item.value"
                >{{ item.label }}</el-radio-button
              >
            </el-radio-group>
          </el-form-item>

          <el-form-item label="存储文件夹" prop="folder">
            <el-input v-model="form.folder" :disabled="isDisabled('folder')"></el-input>
          </el-form-item>

          <!-- <el-form-item v-if="limit" label="上传数量限制" prop="folder">
            <el-tag> {{ limit }}个</el-tag>
          </el-form-item> -->
          <el-form-item v-if="accept" label="支持文件类型" prop="folder">
            <el-tag> {{ accept === '*' ? '所有类型' : accept }}</el-tag>
          </el-form-item>
          <el-form-item v-if="multiple" label="是否支持多选" prop="folder">
            <el-tag> {{ multiple ? '是' : '否' }}</el-tag>
          </el-form-item>
        </el-form>
      </div>
      <template v-if="$slots.default">
        <div slot="reference"><slot></slot></div>
      </template>
      <template v-else>
        <el-button slot="reference" icon="el-icon-setting" circle size="mini"></el-button>
      </template>
    </el-popover>
  </div>
</template>

<script>
  import {
    initDefaultUploadConfig,
    SITE_MAPPER,
    BUCKET_MAPPER_FOR_WANGSU,
    BUCKET_MAPPER_FOR_ALIYUN,
  } from './config.js';
  import { mapperToOptions } from '@/utils/tools.js';

  export default {
    props: {
      config: {
        type: Object,
        default: initDefaultUploadConfig(),
      },
      // 多选与否
      multiple: Boolean,
      // 文件类型
      accept: String,
      // 限制
      limit: [String, Number],
    },

    computed: {
      render_bucket_options() {
        return {
          WANGSU: this.wangsu_bucket_options,
          ALIYUN: this.aliyun_bucket_options,
        }[this.form.site];
      },
    },

    watch: {
      config: {
        handler(n, o) {
          this.form = {
            ...this.form,
            ...n,
          };
        },
        deep: true,
        immediate: true,
      },

      'form.site': {
        handler(n, o) {
          this.form.bucket = {
            WANGSU: 'duolai-img',
            ALIYUN: 'koc-img',
          }[n];
        },
        immediate: true,
      },
    },

    data() {
      return {
        site_options: mapperToOptions(SITE_MAPPER),
        wangsu_bucket_options: mapperToOptions(BUCKET_MAPPER_FOR_WANGSU),
        aliyun_bucket_options: mapperToOptions(BUCKET_MAPPER_FOR_ALIYUN),

        visible: false,
        form: initDefaultUploadConfig(),
        rules: {
          site: [{ required: true, message: '请选择存储云厂商', trigger: 'change' }],
          bucket: [{ required: true, message: '请选择存储桶', trigger: 'change' }],
          folder: [{ required: true, message: '请输入存储文件夹', trigger: 'blur' }],
        },
      };
    },

    methods: {
      cancel() {
        this.visible = false;
      },

      confirm() {
        this.visible = false;
      },

      isDisabled(prop) {
        const prop_list = ['bucket', 'folder'];
        return prop_list.includes(prop);
      },

      getConfigData() {
        // 开发环境 folder 追加 dev // 生产环境保持原样
        if (process && process?.env && process.env?.NODE_ENV == 'development') {
          // 比如：传入'joyful/public/', 线上是 'joyful/public/', 开发环境就是 'joyful_dev/public/'
          const temp_list = this.form.folder.split('/');
          temp_list[0] = temp_list[0] + '_dev';
          this.form.folder = temp_list.join('/');
        }
        return JSON.parse(JSON.stringify(this.form));
      },
    },

    mounted() {},
  };
</script>

<style lang="scss" scoped>
  .base-upload__config-nameplate {
    padding: 5px;
    position: absolute;
    right: 0px;
    top: 0px;
    font-size: 10px;
    color: #fff;
    background-color: #409eff;
    border-bottom-left-radius: 4px;
    letter-spacing: 1px;
  }
</style>
