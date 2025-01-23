<template>
  <el-card
    :shadow="is_shadow"
    :class="['custom-file-upload__wrapper', is_single_mode && drag ? 'single-mode--drag' : '']"
  >
    <div :class="['custom-file-upload__inner-wrapper', disabledUpload ? 'disabled-upload' : '']">
      <template v-if="show_upload">
        <el-upload
          ref="uploadRef"
          action
          :drag="drag"
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
          :file-list="el_upload_inner_file_list"
          :show-file-list="false"
        >
          <template v-if="drag">
            <div class="el-upload-content-text">
              <i class="el-icon-upload"></i>
              <div class="el-upload__text"> 将文件拖到此处，或<em>点击上传</em> </div>
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
                    @click="handleRemoveFile(itemFile)"
                  ></el-button>

                  <template v-if="itemFile.progress < 100">
                    <div class="single-progress-circle__wrapper">
                      <div class="single-progress-circle__inner-mask"></div>
                      <el-progress
                        type="circle"
                        width="80"
                        :percentage="itemFile.progress"
                        :status="itemFile.progress == 100 ? 'success' : ''"
                      ></el-progress>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </template>

          <template v-else>
            <el-button-group>
              <el-button type="primary" icon="el-icon-upload">点击上传</el-button>
              <el-button icon="el-icon-setting" @click.stop></el-button>
            </el-button-group>
          </template>

          <div class="el-upload__tip" slot="tip">
            <div v-if="$slots.tip && is_single_mode && drag" class="tip-text">
              <span>
                <i class="el-icon-warning"></i>
                <slot name="tip"></slot>
              </span>
            </div>
          </div>

          <!-- 阻止默认的已选择的文件列表显示 -->
          <div class="el-upload__file" slot="file"></div>
        </el-upload>
      </template>

      <!-- <el-button @click="logData">TEST查看</el-button> -->

      <!-- 文件展示列表 -->
      <template v-if="is_show_file_list">
        <div class="file-list-el-upload__tip">
          <!-- 自定义提示 -->
          <div class="tip-text">
            <span v-if="$slots.tip">
              <i class="el-icon-warning"></i>
              <slot name="tip"></slot>
            </span>

            <span
              >当前上传数 / 最大上传数：{{ success_upload_file_list.length + ' / ' + limit }}</span
            >
          </div>

          <!-- 文件列表 -->
          <template v-if="show_file_list">
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
                      <FilePreview :file_data="itemFile" :isShowFileName="false" />
                      <!-- 文件名 -->
                      <div class="ml5 file-list__file-option_name">{{ itemFile.file_name }}</div>
                    </div>
                  </div>

                  <div class="file-list__item-tool-wrapper">
                    <!-- 加载进度条的样式 -->
                    <div class="file-list__item-progress file-list__item-option">
                      <template v-if="itemFile.progress < 100">
                        <el-progress
                          type="circle"
                          width="50"
                          class="multiple-progress-circle"
                          :percentage="itemFile.progress"
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
                      @click="($event) => handleRemoveFile(itemFile, $event)"
                    ></el-button>
                  </div>
                </div>
                <!-- 插槽 -->
                <div class="file-list__item-slot-append">
                  <slot name="filePreviewMiddleAppend" :row="itemFile" :index="index"></slot>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <template v-if="show_upload_config">
        <UploadConfig
          ref="uploadConfigRef"
          :class="[
            'base-upload__config-wrapper',
            !drag ? 'base-upload__config-wrapper--notdrag' : '',
          ]"
          :config="uploadConfig"
          :multiple="multiple"
          :accept="accept"
          :limit="limit"
        />
      </template>
    </div>
  </el-card>
</template>
<script>
  import FilePreview from '../Components/FilePreview.vue';
  import UploadConfig from '../Components/UploadConfig.vue';

  import { sizeTostr } from '@/utils/tools.js';
  import { promiseFileMd5, generatePreviewLink } from '@/utils/common/tools.js';
  import { uploadV3ForCdnUrl as defaultUploadRequest } from '@/utils/common/uploadV3ForCdnUrl.js';
  import { initDefaultUploadConfig } from '../Components/config';

  /** 回调枚举 */
  const EMIT_UPDATE_FILE_LIST = 'update:file_list';
  const EMIT_REMOVE = 'onRemove';
  const EMIT_PROGRESS = 'onProgress';
  const EMIT_EXCEED = 'onExceed';

  export default {
    props: {
      /***************** 上传配置props  */
      // 上传文件列表
      file_list: { type: [Object, Array], default: [] },
      // 拖拽模式
      drag: { type: Boolean, default: true },
      // 禁用
      disabled: { type: Boolean, default: false },
      // 多选与否
      multiple: { type: Boolean, default: true },
      // 文件类型
      accept: { type: String, default: '*' },
      // 限制
      limit: { type: [String, Number], default: 10 },
      // 上传参数配置（云厂商、储存桶、）
      uploadConfig: {
        type: Object,
        default: initDefaultUploadConfig(),
      },
      // 自定义上传函数
      customUploadRequest: Function,
      // 上传前函数
      onBeforeUpload: Function,
      // 上传成功函数
      onSuccess: Function,
      // 上传失败函数
      onError: Function,

      /***************** 组件样式props  */
      // 外边框阴影
      shadow: { type: Boolean, default: false },
      // 展示上传组件
      show_upload: { type: Boolean, default: true },
      // 展示上传配置组件
      show_upload_config: { type: Boolean, default: true },
      // 展示文件列表
      show_file_list: { type: Boolean, default: true },
    },

    components: { FilePreview, UploadConfig },

    computed: {
      is_shadow() {
        return this.shadow == true ? 'always' : 'never';
      },

      is_single_mode() {
        return this.limit == 1;
      },

      is_single_mode_disable_upload() {
        return this.is_single_mode && this.success_upload_file_list.length;
      },

      is_multiple() {
        if (this.limit > 1) {
          return this.multiple;
        } else {
          return false;
        }
      },

      is_show_file_list() {
        // 多文件上传模式 || 非拖拽上传 时展示
        return !this.is_single_mode || !this.drag;
      },
    },

    data() {
      return {
        loading: false,
        disabledUpload: false,
        // 选中上传的文件 -- el-upload内部的数据（未给外部仅本组件数据查看使用）
        el_upload_inner_file_list: [],
        // 上传成功的文件 -- (新增时:一定是空数组; 编辑时：赋值已有文件数组)
        success_upload_file_list: [],
      };
    },

    watch: {
      file_list: {
        handler(n, o) {
          if (n && n.length) {
            this.success_upload_file_list = JSON.parse(JSON.stringify(n));
          } else {
            // （场景：关闭dialog，再打开回显数据时，清空上传成功的文件列表）
            this.success_upload_file_list = [];
            this.el_upload_inner_file_list = [];
          }
        },
        deep: true,
        immediate: true,
      },
    },

    methods: {
      beforeUpload(file) {
        return new Promise(async (resolve, reject) => {
          this.disabledUpload = true;

          // 解析文件MD5
          try {
            file.md5 = await promiseFileMd5(file);
          } catch (error) {
            this.$notify.error('解析文件MD5失败，请重新上传！');
            reject(false);
            this.handleRemoveFile(file);
            this.disabledUpload = false;
          }

          // 重复文件校验
          if (this.validRepeatFile(file.md5)) return;

          // 解析文件大小
          file.size_label = sizeTostr(file.size);
          // 创建本地预览链接
          file.preview_url = generatePreviewLink(file)

          // 储存上传文件必要信息
          this.success_upload_file_list.push({
            name: file.name,
            md5: file.md5,
            type: file.type, // 文件类型
            preview_url: file.preview_url,
          });

          // 若无前置上传函数
          if (!this.onBeforeUpload) {
            resolve(true);
            this.disabledUpload = false;
          }

          // 若有前置上传函数--触发
          if (this.onBeforeUpload) {
            const before = this.onBeforeUpload(file);

            /** 若为promise */
            if (before && before.then) {
              before
                .then(
                  () => {
                    resolve(true);
                  },
                  () => {
                    reject(false);
                    this.handleRemoveFile(file);
                  },
                )
                .finally(() => {
                  this.disabledUpload = false;
                });
            } else if (before !== false) {
              /** 若为普通函数的 非false值 执行上传流程*/
              resolve(true);
              this.disabledUpload = false;
            } else {
              /** 若为普通函数的 非true值 终止上传流程*/
              reject(false);
              this.handleRemoveFile(file);
              this.disabledUpload = false;
            }
          }
        });
      },

      onUploadProgress(_cur_file) {
        // 解构重命名
        let { progress: _progress, file_md5: _md5 } = _cur_file;
        let item = this.success_upload_file_list.find((item) => item.md5 == _md5);

        if (!item) {
          // 初次上传时不存在该文件就加入 本地缓存的上传列表
          this.success_upload_file_list.push({ ..._cur_file });
        } else {
          // 上传过程时更新信息和上传进度
          this.success_upload_file_list = this.success_upload_file_list.map((file) => {
            if (file.md5 == _md5) file = { ...item, ..._cur_file };
            return file;
          });
        }

        // 回调
        this.$emit(EMIT_PROGRESS, _progress, _cur_file, this.success_upload_file_list);
        // 上传完成
        if (_progress == 100) this.disabledUpload = false;
      },

      handleExceed() {
        this.$notify.warning(`超出文件上传数量限制，最大上传${this.limit}个文件！`);
        this.$emit(EMIT_EXCEED);
      },

      // 删除指定上传文件数据
      handleRemoveFile(fileinfo, event) {
        this.success_upload_file_list = this.success_upload_file_list.filter(
          (file) => file.md5 != fileinfo.md5,
        );
        this.el_upload_inner_file_list = this.el_upload_inner_file_list.filter(
          (file) => file.raw.md5 != fileinfo.md5,
        );
        /** 防止冒泡 */
        event?.stopPropagation();
        /** 更新 */
        this.updateRealUploadFileList();
        /** 释放内存 */
        fileinfo?.preview_url && this.handleRevokeObjectURLAll([fileinfo.preview_url]);
        /** 回调 */
        this.$emit(EMIT_REMOVE, fileinfo, this.success_upload_file_list);
      },

      // 清空数据
      onClearData(flag = true) {
        this.$refs.uploadRef?.clearFiles();
        this.el_upload_inner_file_list = [];
        this.success_upload_file_list = [];
        /** 同步数据 */
        this.updateRealUploadFileList();
        /** 释放内存 */
        this.handleRevokeObjectURLAll(this.success_upload_file_list.map((v) => v.preview_url));
      },

      handleSuccess(response, file, file_list) {
        // 储存上传视频信息
        this.el_upload_inner_file_list = file_list;
      },

      handleError(response, file, file_list) {},

      validRepeatFile(md5) {
        const valid = this.success_upload_file_list.some((item) => item.md5 == md5);
        valid && this.$notify.warning('已存在重复文件，请重新上传！');
        this.disabledUpload = false;
        return valid;
      },

      // 向外部更新上传文件数据
      updateRealUploadFileList() {
        this.$emit(EMIT_UPDATE_FILE_LIST, this.success_upload_file_list);
      },

      /**
       * 上传
       * @param {Object} requestBody  真实 file 为 requestBody.file
       */
      async uploadRequest(requestBody) {
        try {
          this.disabledUpload = true;

          let uploadConfig = this.$refs.uploadConfigRef.getConfigData();

          // 自定义上传事件
          if (this.customUploadRequest) {
            const res = await this.customUploadRequest(requestBody, uploadConfig);
            // 成功的回调
            this.onSuccess && this.onSuccess(res, requestBody.file, this.success_upload_file_list);
          } else {
            // 组件默认上传事件
            const res = await defaultUploadRequest(
              uploadConfig,
              requestBody.file,
              this.onUploadProgress,
            );
            // uploadV3ForCdnUrl成功上传的条件判断
            if (res.progress == 100) {
              this.$notify.success('上传成功！');
              /** 成功事件执行 */
              this.onSuccess && this.onSuccess(res, requestBody.file, this.success_upload_file_list);
            }
          }
        } catch (error) {
          this.$notify.error(error?.message || '上传失败');
          /** 清除上传失败 */
          this.handleRemoveFile(requestBody.file);
          /** 失败事件执行 */
          this.onError && this.onError(error, requestBody.file, this.success_upload_file_list);
        } finally {
          // 更新上传文件数据
          this.updateRealUploadFileList();
          this.disabledUpload = false;
        }
      },

      // 清除副作用：释放本地链接占用的缓存
      handleRevokeObjectURLAll(list = []) {
        if (list.length) {
          list.forEach((url) => {
            /** 使用本地 blob 协议时 */
            if (new URL(url).protocol == 'blob:') URL.revokeObjectURL(url);
          });
        }
      },

      logData() {
        // // dev-log >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        console.log(`[Dev_Log][${'logData'}_]_>>>`, {
          el_upload_inner_file_list: this.el_upload_inner_file_list,
          success_upload_file_list: this.success_upload_file_list,
        });
      },
    },

    beforeDestroy() {
      this.onClearData(false);
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
          // max-width: 360px;
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

        .el-upload-list .file-list-el-upload__tip {
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

  .single-mode--drag {
    width: 402px;
  }

  // 多文件上传模式 CSS
  .file-list__tip-wrapper {
    overflow: hidden;

    .file-list__item-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 10px;

      .file-list__item {
        width: 100%;
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

  .single-progress-circle__wrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;

    .single-progress-circle__inner-mask {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.5);
    }

    ::v-deep {
      .el-progress {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        .el-progress__text {
          color: #f1f1f1;
        }
      }
    }
  }

  .multiple-progress-circle {
  }

  .base-upload__config-wrapper {
    position: absolute;
    left: 5px;
    top: 5px;
    z-index: 99;

    &.base-upload__config-wrapper--notdrag {
      top: 2px;
      left: 104px;
      opacity: 0;
    }
  }
</style>
