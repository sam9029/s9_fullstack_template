<template>
  <el-card
    :shadow="is_shadow"
    :class="['custom-file-upload__wrapper', is_single_mode ? 'single-mode' : '']"
  >
    <div :class="['custom-file-upload__inner-wrapper', disabledUpload ? 'disabled-upload' : '']">
      <template v-if="show_upload">
        <el-upload
          ref="uploadRef"
          drag
          action
          :multiple="is_multiple"
          :http-request="uploadRequest"
          :before-upload="beforeUpload"
          :on-success="handleSuccess"
          :on-error="handleError"
          :on-exceed="handleExceed"
          :on-progress="onProgress"
          :accept="accept"
          :disabled="disabled || disabledUpload || is_single_mode_disable_upload"
          :limit="limit"
          :file-list="choice_upload_file_list"
        >
          <div class="el-upload-content-text">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">
              将文件拖到此处，或
              <em>点击上传</em>
            </div>
          </div>

          <!-- 单文件模式 -->
          <template v-if="is_single_mode">
            <div v-if="success_upload_file_list.length > 0" class="single-file__tip-wrapper">
              <div
                class="single-file__tip-wrapper-mask"
                v-for="itemFile in success_upload_file_list"
                :key="itemFile.uid"
              >
                <FilePreview :file_data="itemFile" />
                <!-- 删除按钮 -->
                <el-button
                  circle
                  class="single-file-del-btn"
                  size="mini"
                  type="danger"
                  icon="el-icon-delete"
                  :disabled="disabled"
                  @click="handleDeleteFile(itemFile, $event)"
                ></el-button>
              </div>
            </div>
          </template>

          <div class="el-upload__tip" slot="tip">
            <div v-if="$slots.tip && is_single_mode" class="tip-text">
              <span>
                <i class="el-icon-warning"></i>
                <slot name="tip"></slot>
              </span>
            </div>
          </div>
          <!-- 阻止默认的已选择的文件列表显示 -->
          <div class="el-upload__file" slot="file"> </div>
        </el-upload>
      </template>

      <!-- 多文件上传模式 -->
      <template v-if="!is_single_mode">
        <div class="file-list-el-upload__tip">
          <!-- 自定义提示 -->
          <div v-if="$slots.tip" class="tip-text">
            <span>
              <i class="el-icon-warning"></i>
              <slot name="tip"></slot>
            </span>

            <span
              >当前上传数 / 最大上传文件数量：{{
                success_upload_file_list.length + ' / ' + limit
              }}</span
            >
          </div>

          <!-- 文件列表 -->
          <div v-if="success_upload_file_list.length > 0" class="file-list__tip-wrapper">
            <div
              class="file-list__item-wrapper"
              v-for="(itemFile, index) in success_upload_file_list"
              :key="itemFile.uid"
            >
              <div class="file-list__item">
                <div class="file-list__item-preview">
                  <div class="file-list__file-option">
                    <!-- 预览组件 -->
                    <FilePreview :file_data="itemFile" />
                    <!-- 文件名 -->
                    <div v-if="show_file_infos" class="ml5 file-list__file-option_name">{{
                      itemFile.file_name
                    }}</div>
                  </div>
                </div>

                <div class="file-list__item-tool-wrapper">
                  <!-- 加载进度条的样式 -->
                  <div class="file-list__item-progress file-list__item-option">
                    <template v-if="itemFile.progress < 100">
                      <el-progress
                        type="circle"
                        width="50"
                        class="progressCircle"
                        :percentage="itemFile.progress"
                        :format="handleFileformat"
                        :status="itemFile.progress == 100 ? 'success' : ''"
                      ></el-progress>
                    </template>
                    <template v-if="itemFile.progress == 100">
                      <i class="icon-dot text-success"></i>
                      已上传
                    </template>
                  </div>

                  <!-- 删除按钮 -->
                  <el-button
                    circle
                    class="file-del-btn__wrapper"
                    size="mini"
                    type="danger"
                    icon="el-icon-delete"
                    :disabled="disabled"
                    @click="handleDeleteFile(itemFile)"
                  ></el-button>
                </div>
              </div>
              <!-- 插槽 -->
              <div class="file-list__item-slot-append">
                <slot name="filePreviewMiddleAppend" :row="itemFile" :index="index"></slot>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 违规时--上传组件的禁用遮罩 -->
      <div
        class="disabled-overlay"
        :style="{ display: uploadFlag ? 'none' : 'block' }"
        @click="$message.warning(uploadMsg)"
      ></div>
    </div>
  </el-card>
</template>
<script>
  // import { templateAdd, templateDown, streamUpload } from '@/api/public.js';
  import { promiseFileMd5 } from '@/utils/common/tools.js';
  import { uploadV3 } from '@/utils/common/uploadV3.js';

  import FilePreview from './FilePreview.vue';

  export default {
    props: {
      // id: { type: Number, default: 0 },
      // downloadIcon: { type: String, default: '' },
      // title: { type: String, default: '点击上传' },
      // align: {
      //   type: String,
      //   default: 'center', // 'flex-start' || 'center' || 'flex-end'
      // },

      has_shadow: { type: Boolean, default: false },
      file_list: { type: [Object, Array], default: [] },
      disabled: { type: Boolean, default: false },
      multiple: { type: Boolean, default: true },
      accept: { type: String, default: '*' },
      limit: { type: [String, Number], default: 10 },

      // 展示上传组件
      show_upload: { type: Boolean, default: true },
      // 展示文件信息
      show_file_infos: { type: Boolean, default: true },

      uploadFlag: { type: Boolean, default: true },
      uploadMsg: { type: String, default: '请按要求操作！' },
    },
    components: { FilePreview },

    computed: {
      is_shadow() {
        return this.has_shadow == true ? 'always' : 'never';
      },

      is_single_mode() {
        return this.limit == 1;
      },

      is_single_mode_disable_upload() {
        return this.is_single_mode && this.success_upload_file_list.length;
      },

      is_multiple() {
        if (this.limit > 1) {
          return this.multiple || true;
        } else {
          return false;
        }
      },
    },

    data() {
      return {
        loading: false,
        disabledUpload: false,
        // 选中上传的文件
        choice_upload_file_list: [],
        // 上传成功的文件 -- (新增时:一定是空数组; 编辑时：赋值已有文件数组)
        success_upload_file_list: [],
      };
    },

    watch: {
      file_list: {
        handler(n, o) {
          if (n && n.length) this.success_upload_file_list = JSON.parse(JSON.stringify(n));
        },
        deep: true,
        immediate: true,
      },
    },

    methods: {
      beforeUpload(file) {
        let flag = true;
        this.disabledUpload = true;
        if (this.success_upload_file_list.length >= this.limit) {
          this.$notify.warning(`超出文件上传数量限制，最大上传${this.limit}个文件！`);
          flag = false;
        }
        this.disabledUpload = false;
        return flag;
      },

      onUploadProgress(file_info) {
        // 解构重命名
        let { progress: _progress, file_name: _file_name, file_uid: _file_uid } = file_info;
        let item = this.success_upload_file_list.find((item) => item.file_uid == _file_uid);
        // 初次上传时不存在该文件就加入 本地缓存的上传列表
        if (!item) {
          this.success_upload_file_list.push({ ...file_info });
        }
        // 上传过程时仅更新 上传进度
        else {
          this.success_upload_file_list.map((file) => {
            if (file.file_uid == _file_uid) {
              file.progress = _progress;
            }
          });
        }

        if (_progress == 100) {
          this.disabledUpload = false;
        }
      },

      handleExceed() {
        this.$notify.warning(`超出文件上传数量限制，最大上传${this.limit}个文件！`);
      },

      handleSuccess(response, file, choice_upload_file_list) {
        // 储存上传视频信息
        this.choice_upload_file_list = choice_upload_file_list;
      },

      handleError() {},

      // 上传
      async uploadRequest(file) {
        uploadV3(
          {
            folder: 'public',
            bucket: 'duolai-img',
            // mime_type: 'mp4' // 默认不使用
            // file_name: '' // 默认不使用
          },
          file.file,
          this.onUploadProgress,
        )
          .then((res) => {
            // 成功上传的话
            if (res.progress == 100) {
              // this.success_upload_file_list.push(res);
              // 更新父组件的响应式数据
            }
            // 上传失败就踢除失败上传文件
            else {
              this.success_upload_file_list = this.success_upload_file_list.filter(
                (file) => file.file_name != res.file_name,
              );
            }
            this.updateRealUploadFileList();
          })
          .catch((err) => {
            this.disabledUpload = false;
          });
      },

      // 删除指定上传文件数据
      handleDeleteFile(fileinfo, event) {
        this.success_upload_file_list = this.success_upload_file_list.filter(
          (file) => file.file_uid != fileinfo.file_uid,
        );
        this.choice_upload_file_list = this.choice_upload_file_list.filter(
          (file) => file.uid != fileinfo.file_uid,
        );
        this.updateRealUploadFileList();
        this.$emit('deleteFileEmit', fileinfo);
        event.stopPropagation();
      },

      // 向外部更新上传文件数据
      updateRealUploadFileList() {
        this.$emit('update:file_list', this.success_upload_file_list);
      },

      clearData() {
        this.choice_upload_file_list = [];
        this.success_upload_file_list = [];
      },

      reset() {
        this.$refs.uploadRef.clearFiles();
        this.choice_upload_file_list = [];
        this.success_upload_file_list = [];
      },
    },
  };
</script>

<style lang="scss" scoped>
  .custom-file-upload__wrapper {
    width: 100%;

    .el-card__body {
      width: 100%;
      display: flex;
      justify-content: center;
      align-content: center;
    }

    .custom-file-upload__inner-wrapper {
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: column;
      color: #606266;
      font-size: 12px;

      ::v-deep {
        .el-upload-list {
          max-width: 360px;
        }

        // 单文件上传模式 CSS
        .el-upload {
          position: relative;
          .single-file__tip-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            top: 0;
            left: 0;
            backdrop-filter: blur(10px);

            .files-container,
            .swiper-slide,
            .image-video-card,
            .el-image {
              width: 100% !important;
              height: 100% !important;
            }

            .single-file-del-btn {
              position: absolute;
              top: 5px;
              right: 5px;
              z-index: 99;
            }
          }
        }

        .el-upload__tip {
          width: 100%;
          margin: 0;
          color: #606266;
          font-size: 12px;
        }

        .file-list-el-upload__tip {
          width: 100%;

          .tip-text {
            color: #606266;
            font-size: 12px;
            width: 100%;
            display: inline-flex;
            justify-content: space-between;
          }
        }
      }
    }
  }

  .single-mode {
    width: 402px;
  }

  // 多文件上传模式 CSS
  .file-list__tip-wrapper {
    overflow: hidden;

    .file-list__item-wrapper {
      margin-bottom: 10px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 10px;
      .file-list__item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;

        // .file-list__item-option {
        //   min-width: 80px;
        // }
        .file-list__item-preview {
          max-width: 300px;

          .file-list__file-option {
            display: flex;
            align-items: center;

            .file-list__file-option_name {
              min-width: fit-content;
            }
          }
        }

        .file-list__item-tool-wrapper {
          width: 100px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;

          .file-list__item-progress {
            .icon-dot {
              display: inline-block;
              height: 6px;
              width: 6px;
              border-radius: 50%;
              vertical-align: middle;
              margin-bottom: 3px;
              margin-right: 6px;
            }

            .text-success {
              background-color: #67c23a;
            }
            .text-danger {
              background-color: #ed5565;
            }
          }

          .file-del-btn__wrapper {
            width: 30px !important;
            height: 30px !important;
            border-radius: 4px !important;
          }
        }
      }
      .file-list__item-slot-append {
        margin: 10px 0;
      }
    }
  }

  .disabled-upload {
    ::v-deep {
      .el-upload-dragger {
        cursor: not-allowed;
      }
    }
  }

  .disabled-overlay {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    width: 360px;
    height: 180px;
    z-index: 999;
    background-color: rgba(0, 0, 0, 0.2);
  }
</style>
