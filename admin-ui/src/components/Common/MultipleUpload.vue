<template>
  <div v-loading="md5ing_file>0" element-loading-spinner="el-icon-loading" element-loading-text="正在解析文件信息..." class="multiple-upload">
    <div class="multiple-upload-container">
      <div class="multiple-upload-button">
        <el-upload
          multiple
          action=""
          class="upload"
          ref="uploadRef"
          :accept="accept"
          :disabled="loading"
          :before-upload="selfBeforeUpload"
          :http-request="selfAddFiles"
          :show-file-list="false"
          :limit="limit"
          :on-exceed="handleExceed"
        >
          <el-button 
            :type="availableFiles.length ? 'plain' : 'primary'" 
            @click="triggerSelect"
            :disabled="disabled"
            >选择文件</el-button>
        </el-upload>
        <el-button
          :type="availableFiles.length ? 'primary' : 'plain'"
          @click="startBatchUpload"
          :disabled="loading"
          >开始上传</el-button
        >
      </div>

      <div class="upload-file-status">
        <div class="upload-status-count">
          <RadioGroup
            class="mr20"
            :group="statusGroupNum"
            v-model="showType"
            @change="toggleShowFileList"
          ></RadioGroup>
          <el-tooltip content="重新上传所有上传失败文件" placement="top">
            <el-button
              icon="el-icon-refresh-left"
              @click="retryFailUpload"
              :disabled="loading"
            ></el-button>
          </el-tooltip>
        </div>
        <div class="upload-file-status-list">
          <div v-if="custom" class="custom-container">
            <el-card
              class="custom-file-status-item"
              v-for="(fileObj, index) in showFileList"
              :key="fileObj.md5"
            >
              <div class="custom-box">
                <div class="custom-content">
                  <slot name="custom" :file="fileObj" :index="index"></slot>
                </div>
                <div class="custom-file-item-operate">
                  <i 
                    class="el-icon-delete-solid pointer" 
                    style="color: #f56c6c"
                    @click="handleRemoveFile(fileObj)"
                  ></i>
                  <i 
                    v-if="fileObj.status == 'fail'" 
                    class="el-icon-refresh-right mll0 pointer"
                    style="color: #e6a23c"
                    @click="handleRetry(fileObj)"
                  ></i>
                </div>
              </div>
            </el-card>
          </div>
          <div v-else class="base-container">
            <div class="upload-file-status-item" v-for="fileObj in showFileList" :key="fileObj.md5">
              <div>
                <el-tooltip :content="fileObj.name" placement="top">
                  <span class="upload-file-item-name">{{ fileObj.name }}</span>
                </el-tooltip>
              </div>
              <div class="upload-file-item-status">
                <span v-if="fileObj.status == 'uploading'">
                  <i class="el-icon-loading theme-color"></i>
                  <span class="upload-status-desc">上传中</span>
                </span>
                <span v-else-if="fileObj.status == 'success'">
                  <i class="el-icon-success text-success"></i>
                  <span class="upload-status-desc">成功</span>
                </span>
                <span v-else-if="fileObj.status == 'fail'">
                  <el-tooltip :content="fileObj.errMsg" placement="top">
                    <i class="el-icon-question text-danger"></i>
                  </el-tooltip>
                  <span class="upload-status-desc">失败</span>
                </span>
                <span v-else>
                  <i class="el-icon-time text-warning"></i>
                  <span class="upload-status-desc">待上传</span>
                </span>

                <div class="upload-file-item-operate">
                  <el-button type="text" class="mll0" @click="handleRemoveFile(fileObj)"
                    >删除</el-button
                  >
                  <el-button
                    type="text"
                    v-if="fileObj.status == 'fail'"
                    class="mll0"
                    @click="handleRetry(fileObj)"
                    >重试</el-button
                  >
                </div>
              </div>
            </div>
          </div>
          <div v-if="!availableFiles.length" class="empty-file-list">
            <svg-icon iconName="wushuju"></svg-icon>
            <p>请选择文件</p>
          </div>
        </div>
      </div>

      <div class="uploaded-file-list" v-if="showPreview && uploadedFiles.length && !custom">
        <p class="uploaded-file-list-header">已上传</p>
        <el-carousel
          class="uploaded-carousel"
          trigger="click"
          height="114px"
          indicator-position="none"
          arrow="always"
        >
          <el-carousel-item v-for="(uploadedRow, index) in uploadedFiles" :key="index">
            <div class="uploaded-file-row">
              <div class="uploaded-file-item" v-for="fileObj in uploadedRow" :key="fileObj.md5">
                <div class="uploaded-file-video-item">
                  <template v-if="fileType == 'image'">
                    <img fit="contain" height="90" :src="fileObj.stats.blobUrl" />
                  </template>
                  <template v-else-if="fileType == 'video'">
                    <!-- <div class="video-fixable">
                      <i
                        @click="$emit('preview', fileObj.url, 1)"
                        class="el-icon-video-play play-icon pointer"
                      ></i>
                    </div>
                    <img
                      fit="contain"
                      height="90"
                      :src="fileObj.url + '?x-oss-process=video/snapshot,t_1000,f_jpg,m_fast'"
                    /> -->
                    <video
                      class="video-fixable"
                      oncontextmenu="self.event.returnValue=false"
                      :src="fileObj.stats.blobUrl"
                      controls
                      controlsList="nodownload"
                    ></video>
                  </template>
                  <template v-else-if="fileType == 'audio'">
                    <AuidoPlayer :src="fileObj.stats.blobUrl"></AuidoPlayer>
                  </template>
                  <template v-else>
                    <div class="video-fixable">
                      <i class="el-icon-files play-icon"></i>
                    </div>
                  </template>
                </div>
                <div>
                  <el-tooltip effect="dark" :content="fileObj.name" placement="top">
                    <div class="uploaded-item-name-ellipsis">{{ fileObj.name }}</div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>
    <div class="uploading-progress">
      <div v-for="fileObj in uploadingFiles" :key="fileObj.md5">
        <div class="progress-file-name">{{ fileObj.name }}</div>
        <el-progress
          :percentage="fileObj.percentage"
          :format="progressFormat(fileObj)"
        ></el-progress>
      </div>
    </div>
    <BaseDialog
      title="系统提示"
      width="500px"
      :visible.sync="dialogVisible"
      @close="closeDialog"
    >
      <div class="dialog-content">
        <div v-if="showPublishMode" class="publish-mode mb-8">
          <el-form :model="publishData" :rules="publishRules" ref="publishFormRef">
            <el-form-item label="发布模式" prop="online_time">
              <el-radio-group v-model="publishData.mode" type="card" @input="changePublishMode">
                <el-radio label="NOW">
                  立即发布
                </el-radio>
                <el-radio label="TIMING">
                  定时发布
                </el-radio>
              </el-radio-group>
              <div v-if="publishData.mode == 'TIMING'" class="mt-8">
                <el-date-picker
                  v-model="publishData.online_time"
                  type="datetime"
                  value-format="yyyy-MM-dd HH:mm"
                  format="yyyy-MM-dd HH:mm"
                  placeholder="选择日期时间"
                  :pickerOptions="{
                    disabledDate(time) {
                      return time.getTime() < Date.now() - 8.64e7;
                    }
                  }"
                />
              </div>
            </el-form-item>
          </el-form>
          <p class="tip mt-8">定时发布、立即发布在审核之后生效</p>
        </div>
        <span v-show="!isAbleToUpload && !showPublishMode">是否上传所有文件?</span>
        <div v-show="uploadingFiles.length" class="uploading-progress">
          <div v-for="fileObj in uploadingFiles" :key="fileObj.md5">
            <div class="progress-file-name">{{ fileObj.name }}</div>
            <el-progress
              :percentage="fileObj.percentage"
              :format="progressFormat(fileObj)"
            ></el-progress>
          </div>
        </div>
        <el-result v-if="showDialogConfirmStr"  :icon="resultIcon" :title="uploadPStr"></el-result>
      </div>
      <template #footer>
        <div slot="footer" class="form-dialog-footer">
          <el-button @click="closeDialog">取 消</el-button>
          <el-button type="primary" :loading="dialogLoading" @click="submitDialog">{{ dialogLoading ? '上传中...' : '确 定' }}</el-button>
        </div>
      </template>
    </BaseDialog>
  </div>
</template>
<script>
import moment from 'moment';
import { promiseFileMd5 } from '@/utils/common/tools';
// import { MATERIAL_TYPE_ENUM } from '@/utils/mapper';
import { aliOssUpload, utils } from '@/utils/common/upload.js';
const default_promise_reslove = () => Promise.resolve(true);

/**
 * Oss上传参数
 * @typedef {Object} FileObj
 * @property { File } raw 原始文件对象
 * @property { string } name
 * @property { string } md5
 * @property { Object } stats 文件信息（宽、高、大小、时长...）
 * @property { string } status 上传状态
 * @property { string } [percentage] 上传进度
 * @property { string } [url] 上传成功后的url
 * @property { string } [response] api返回结果
 */

export default {
  props: {
    accept: {
      type: String,
      default: 'video/mp4',
    },
    fileType: {
      type: String,
      default: 'video', // video | image | audio
    },
    beforeUpload: {
      type: Function,
      default: default_promise_reslove,
    },
    onSuccess: {
      type: Function,
      default: default_promise_reslove,
    },
    onRemove: {
      type: Function,
      default: default_promise_reslove,
    },
    allFiles: {
      type: Array,
      default: () => [],
    },
    showPreview: {
      type: Boolean,
      default: true,
    },
    custom: {
      // 自定义文件回传信息
      type: Boolean,
      default: false,
    },
    formValid: {
      // 表单校验
      type: Boolean,
      default: true,
    },
    bucket: {
      type: String,
      default: 'koc-img', // 上传设置的存储路径
    },
    dir: {
      type: String,
      default: null, // 上传设置的文件夹
    },
    limit: {
      type: [Number, null],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    startUploadErrorMsg: {
      type: String,
      default: '请先选择文件！'
    },
    showPublishMode: {  // 是否展示发布模式
      type: Boolean,
      default: false,
    }
  },
  components: {
    RadioGroup: () => import('./RadioGroup'),
    AuidoPlayer: () => import('./AuidoPlayer'),
    BaseDialog: () => import('../BaseDialog/index.vue'),
  },
  data() {
    return {
      loading: false,
      file_loading:false,
      showType: 'all',
      uploadSign: 0, // 上传批次标志，防止上次中止的上传影响
      uploadingPromiseArr: [],
      uploadingFiles: [],
      fileFormValid: false,
      md5ing_file:0,//正在MD5的文件数量
      dialogVisible: false,
      isAbleToUpload: false, // 展示上传前提示文案
      uploadIconColor: '',
      uploadPStr: null, // 上传标识
      publishData: {
        online_time: null, // 定时发布字段 null-立即发布，其他值-定时发布
        mode: 'NOW', // 发布类型
      },
      publishRules: {
        online_time: [{ required: true, validator: (rule, value, callback) => {
          if(!value) {
            return callback(new Error('请选择发布时间'));
          } else if(value < moment().format('YYYY-MM-DD HH:mm')) {
            return callback(new Error('发布时间不能早于当前时间'));
          } else {
            callback();
          }
        }, trigger: 'change' }]
      }
    };
  },
  computed: { 
    dialogLoading() {
      return this.uploadingFiles.length ? true : false;
    },
    availableFiles() {
      return this.allFiles.filter((v) => v.status != 'abort');
    },
    statusList() {
      const status = {
        wait: [],
        success: [],
        fail: [],
      };
      this.availableFiles.forEach((v) => {
        if (!v.status) {
          status.wait.push(v);
        } else if (v.status == 'success') {
          status.success.push(v);
        } else if (v.status == 'fail') {
          status.fail.push(v);
        }
      });
      return status;
    },
    statusGroupNum() {
      const { wait, success, fail } = this.statusList;
      return [
        { label: '全部', radioLabel: 'all', badgeHidden: true },
        { label: '待上传', radioLabel: 'wait', badgeNum: wait.length },
        { label: '上传成功', radioLabel: 'success', badgeNum: success.length },
        { label: '上传失败', radioLabel: 'fail', badgeNum: fail.length },
      ];
    },
    showFileList() {
      return this.statusList[this.showType] || this.availableFiles;
    },
    uploadedFiles() {
      if (!this.showPreview) return [];
      const uploadedFiles = [];
      let uploadedRow = [];
      this.allFiles.forEach((fileObj) => {
        if (fileObj.status == 'success') {
          uploadedRow.push(fileObj);
          if (uploadedRow.length >= 4) {
            uploadedFiles.push(uploadedRow);
            uploadedRow = [];
          }
        }
      });
      if (uploadedRow.length) {
        uploadedFiles.push(uploadedRow);
        uploadedRow = [];
      }
      return uploadedFiles;
    },
    showDialogConfirmStr() {
      return this.isAbleToUpload && !this.uploadingFiles.length
    },
    resultIcon() {
      const { success, fail } = this.statusList;
      if(success.length && !fail.length) {
        this.uploadPStr = '上传成功'
        return 'success'
      }
      else if(fail.length && success.length) {
        this.uploadPStr = '有上传失败文件，请检查'
        return 'warning'
      }
      else if(fail.length && !success.length) {
        this.uploadPStr = '上传失败'
        return 'error'
      }
    },
  },
  watch: {
    formValid: {
      handler(newVal) {
        this.fileFormValid = newVal;
      },
      immediate: true
    },
    uploadPStr: {
      handler(newVal) {
        if(newVal && this.dialogVisible) {
          // 如果上传标识存在并且弹窗打开时
          setTimeout(() => {
            this.closeDialog()
            this.$emit('confirmDialog')
          }, 800)
        }
      }
    },
    allFiles: {
      handler(newVal) {
        // 如果limit为1，并且newVal的长度大于1，则只保留第一个数组项
        if (this.limit === 1 && newVal.length > 1) {
          this.$notify.warning(`当前限制选择${this.limit}个文件`);
          newVal.splice(1);
        }
      }
    }
  },
  methods: {
    changePublishMode() {
      this.$refs.publishFormRef?.resetFields()
    },

    selfBeforeUpload(file) {
      // let time = new Date().getTime();
      // this.file_loading = true 
      this.md5ing_file ++
      return promiseFileMd5(file)
        .then((md5) => {
          file.md5 = md5;
          this.md5ing_file --
          // console.log('获取视频MD5耗时：', new Date().getTime() - time);
          const existFile = this.allFiles.find((v) => v.md5 == file.md5);
          if (existFile) {
            if (existFile.status !== 'abort') {
              this.$notify.warning(`${file.name}已在上传列表中！`);
              return Promise.reject();
            } else {
              return Promise.resolve();
            }
          }
          return this.getFileStats(file);
        })
        .then(() => {
          // console.log('获取视频信息耗时：', new Date().getTime() - time);
          return this.beforeUpload(file);
        });
    },

    handleExceed(files, fileList) {
      this.$notify.warning(`当前限制选择${this.limit}个文件`);
    },

    getFileStats(file) {
      let promiseFunc = utils.defaultStats;
      if (file.type.startsWith('video')) {
        promiseFunc = utils.videoStats;
      } else if (file.type.startsWith('image')) {
        promiseFunc = utils.imageStats;
      } else if (file.type.startsWith('audio')) {
        promiseFunc = utils.audioStats;
      }
      return promiseFunc(file)
        .then((stats) => {
          file.stats = stats;
        })
        .catch((err) => {
          this.$notify.error(err.message || err);
          throw err;
        });
    },
    selfAddFiles(options) {
      const { file } = options;
      const abortFile = this.allFiles.find((v) => v.md5 == file.md5);
      if (abortFile) {
        abortFile.status = '';
        // 清除上次记录的uploadId abort或complete的会报错
        delete abortFile.__MKT_UPLOAD_CPT;
        // 防止文件改名后未更新名字
        abortFile.name = file.name;
        abortFile.percentage = 0;
      } else {
        const newAllFiles = this.allFiles.slice();
        newAllFiles.push({
          md5: file.md5,
          name: file.name,
          stats: file.stats,
          status: '',
          percentage: 0,
          raw: file,
        });
        this.$refs.uploadRef?.clearFiles();
        this.$emit('update:allFiles', newAllFiles);
      }
      delete file.md5;
      delete file.stats;
    },
    startBatchUpload() {
      if (!this.availableFiles.length) {
        return this.$notify.warning(this.startUploadErrorMsg);
      }

      if (this.custom) {
        this.$emit('pointBtn');
        // 自定义表单校验失败
        this.$nextTick(() => {
          if (!this.fileFormValid) {
            return;
          } else {
            this.uploadSign++;
            this.splitQueueUpload(this.uploadSign);
          }
        });
      } else {
        this.uploadSign++;
        this.splitQueueUpload(this.uploadSign);
      }
    },
    retryFailUpload() {
      if (!this.statusList.fail.length) {
        return;
      }
      this.uploadSign++;
      this.splitQueueUploadFailed(this.uploadSign);
    },
    splitQueueUpload(uploadSign) {
      this.$emit('on-start'); // 会多次调用
      this.uploadingFiles = [];
      this.uploadingPromiseArr = [];
      for (let i = 0; i < this.allFiles.length; i++) {
        const fileObj = this.allFiles[i];
        if (!fileObj.status) {
          fileObj.percentage = 0;
          this.uploadingFiles.push(fileObj);
          this.uploadingPromiseArr.push(this.uploadFile(fileObj));
          if (this.uploadingFiles.length >= 3) break;
        }
      }
      if (!this.uploadingPromiseArr.length) {
        return this.$emit('on-finish');
      }
      this.loading = true;
      Promise.all(this.uploadingPromiseArr).finally(() => {
        this.loading = false;
        if (uploadSign == this.uploadSign) {
          return this.splitQueueUpload(uploadSign);
        }
      });
    },
    splitQueueUploadFailed(uploadSign) {
      this.$emit('on-start'); // 会多次调用
      this.uploadingFiles = [];
      this.uploadingPromiseArr = [];
      for (let i = 0; i < this.allFiles.length; i++) {
        const fileObj = this.allFiles[i];
        // 防止重传失败一直循环
        if (fileObj.status == 'fail' && !fileObj.retry) {
          // code 1为重复上传
          if (fileObj.response?.code == 1) continue;
          fileObj.retry = true;
          fileObj.percentage = 0;
          this.uploadingFiles.push(fileObj);
          this.uploadingPromiseArr.push(this.uploadFile(fileObj));
          if (this.uploadingFiles.length >= 3) break;
        }
      }
      if (!this.uploadingPromiseArr.length) {
        // 重传结束后清空标记
        this.allFiles.forEach((v) => {
          delete v.retry;
        });
        return this.$emit('on-finish');
      }
      this.loading = true;
      Promise.all(this.uploadingPromiseArr).finally(() => {
        this.loading = false;
        if (uploadSign == this.uploadSign) {
          return this.splitQueueUploadFailed(uploadSign);
        }
      });
    },
    uploadFile(fileObj) {
      fileObj.status = 'uploading';
      fileObj.onprogress = function (p) {
        fileObj.percentage = Math.min(Math.round(p * 100), 100);
      };
      if (this.bucket) fileObj.bucket = this.bucket;
      if (this.dir) fileObj.dir = this.dir;
      return aliOssUpload(fileObj)
        .then((data) => {
          if (fileObj.status == 'abort') return;
          delete fileObj.cancelSource;
          // 手动抛出的code1 不在request处理范围内
          if (data.code == 0) {
            fileObj.response = data;
            fileObj.url = data.url;
            fileObj.status = 'success';
            this.onSuccess(fileObj, data);
          } else {
            fileObj.response = data;
            fileObj.status = 'fail';
            fileObj.errMsg = data.message || '内部错误';
          }
        })
        .catch((e) => {
          if (fileObj.status == 'abort') return;
          delete fileObj.cancelSource;
          fileObj.status = 'fail';
          if (e.isAxiosError) {
            fileObj.errMsg = '网络错误';
          } else {
            fileObj.errMsg = e.message || e || '未知错误';
          }
        });
    },
    progressFormat(fileObj) {
      return () => {
        if (fileObj.status == 'uploading') {
          if (fileObj.percentage == 100) return '文件处理中...';
          return `${fileObj.percentage}%`;
        } else {
          if (fileObj.status == 'abort') return '取消上传中...';
          return fileObj.status == 'success' ? '上传成功' : '上传失败';
        }
      };
    },
    getUploadedFiles(onlyUpload = false) {
      const uploadedFiles = [];
      this.allFiles.forEach((fileObj) => {
        if (fileObj.status == 'success') {
          if (onlyUpload && !fileObj.response) return;
          uploadedFiles.push(fileObj);
        }
      });
      return uploadedFiles;
    },
    toggleShowFileList(type) {
      this.showType = type;
    },
    handleRetry(fileObj) {
      if (fileObj.response?.code == 1) {
        return this.$notify.warning(fileObj.response.message);
      }
      fileObj.status = '';
      if (!this.loading) {
        this.startBatchUpload();
      }
    },
    handleRemoveFile(fileObj) {
      this.$emit('deleteSingle', fileObj)
      this.onRemove(fileObj).then(() => {
        this.abortUpload(fileObj, 'remove uploading file');
      });
    },
    clear() {
      // 防止上传中退出
      this.allFiles.forEach((v) => {
        this.abortUpload(v, 'clear file');
        if (v.stats.blobUrl) {
          URL.revokeObjectURL(v.stats.blobUrl);
        }
        delete v.raw;
      });
      this.$emit('update:allFiles', []);
      this.uploadingPromiseArr = [];
      this.uploadingFiles = [];
      this.$refs.uploadRef?.clearFiles();
      this.showType = 'all';
      this.loading = false;
      this.uploadSign++;
    },
    abortUpload(fileObj, reason) {
      if (fileObj.status == 'uploading') {
        // check md5等阶段没有cancel
        if (fileObj.cancelSource) {
          fileObj.cancelSource.cancel('Cancel Request: ' + reason);
        }
        delete fileObj.cancelSource;
      }
      fileObj.status = 'abort';
    },

    // 触发选择
    triggerSelect() {
      this.$emit('triggerSelect');
    },

    closeDialog() {
      this.isAbleToUpload = false;
      this.uploadPStr = null;
      this.dialogVisible = false
    },

    openDialog() {
      this.dialogVisible = true;
    },

    submitDialog:_.debounce(function func() {
      if(this.showPublishMode) {
        this.$emit('publishData', this.publishData.online_time)
      }
      let publishFlag = true;
      if(this.showPublishMode && this.publishData.mode == 'TIMING' && !this.online_time) {
        this.$refs.publishFormRef.validate(valid => {
          publishFlag = valid;
        })
      }
      if(!publishFlag) return;

      this.startBatchUpload()
      // 展示上传文案
      this.isAbleToUpload = true;
    },500),

    /**
     * @description: 父组件点击保存触发
     * @return {*}
     */    
    validFatherSubmit(flag = false) {
      if(flag) {
        this.dialogVisible = true;
      }
    }
  },
  beforeDestroy() {
    this.clear();
  },
};
</script>

<style lang="scss" scoped>
.multiple-upload-container {
  .upload-file-status {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    padding: 10px;
  }
  .multiple-upload-button {
    margin-bottom: 8px;
    .upload {
      display: inline-block;
      margin-right: 10px;
    }
  }
}
.upload-status-count {
  margin-bottom: 10px;
  .upload-status-count-item {
    min-width: 50px;
    padding: 5px 10px;
    text-align: center;
    margin-right: 120px;
  }
}
.upload-file-status-list {
  display: grid;
  grid-gap: 10px;
  max-height: 35vh;
  overflow-y: auto;
}
.empty-file-list {
  height: 20vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #ddd;
  font-size: 12px;
  .icon {
    font-size: 40px;
  }
}
.base-container .upload-file-status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .upload-file-item-name {
    display: inline-block;
    padding-right: 15px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .upload-file-item-status {
    display: inline-block;
    .upload-status-desc {
      margin-left: 5px;
    }
    .upload-file-item-operate {
      width: 80px;
      display: inline-block;
    }
  }
}

.custom-container {
  display: grid;
  grid-gap: 10px;
  .custom-box {
    position: relative;
    padding-top: 10px;
  }
  .custom-file-item-operate {
    position: absolute;
    top: -10px;
    right: -10px;
  }
}

.multiple-upload-start-button {
  text-align: center;
}
.uploading-progress {
  margin-top: 10px;
  ::v-deep .el-progress-bar {
    padding-right: 145px;
    margin-right: -150px;
  }
}
.dialog-content {
  ::v-deep .el-progress-bar {
    padding-right: 0;
    margin-right: 0;
  }
  ::v-deep .el-progress {
    display: flex;
    justify-content: center;
    align-items: center;
    .el-progress__text {
      white-space: nowrap;
    }
  }
}
.uploaded-file-list {
  margin-top: 10px;
  .uploaded-file-list-header {
    margin-bottom: 10px;
  }
  .uploaded-carousel {
    ::v-deep .el-carousel__arrow--left {
      left: 0;
    }
    ::v-deep .el-carousel__arrow--right {
      right: 0;
    }
  }
  .uploaded-file-row {
    height: 114px;
    padding: 0 45px;
    > :last-child {
      margin-right: 0px;
    }
  }
}
.uploaded-file-item {
  display: inline-block;
  margin-right: 10px;
}
.uploaded-file-video-item {
  position: relative;
  text-align: center;
  width: 160px;
  height: 90px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  .video-fixable {
    position: absolute;
    left: 0;
    top: 0;
    width: 160px;
    height: 90px;
    line-height: 110px;
    text-align: center;
  }
  .play-icon {
    font-size: 35px;
    color: #fff;
    z-index: 9999;
  }
}
.uploaded-item-name-ellipsis {
  overflow: hidden;
  width: 160px;
  height: 24px;
  font-size: 14px;
  line-height: 24px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mll0 {
  margin-left: 10px;
}
.timing-box {
  display: grid;
  grid-gap: 10px;
}
.tip {
  font-size: 12px;
  color: #999;
}
</style>
