<template>
  <component
    :is="wrapComponent"
    :size="$attrs.size || '650px'"
    :showTop="true"
    :submitLoading="loading"
    :title="$props.title"
    v-bind="$attrs"
    v-on="$listeners"
    @close="close"
    @submit="submit"
  >
    <el-form class="container" label-width="90px" label-position="left">
      <slot name="prepend"></slot>
      <el-form-item label="第一步：" v-if="stepShow">
        <!-- slot默认内容的语法兼容 -->
        <slot v-if="$slots.downBtnPlace" name="downBtnPlace"></slot>
        <template v-else>
          <download-button
            :disabled="!$props.id"
            :id="$props.id"
            downloadIcon="el-icon-download"
            style="display: inline-block"
          ></download-button>
        </template>
        <span class="tips">已有模板可以直接进行第二步上传模板</span>
      </el-form-item>
      <el-form-item :label="stepShow?'第二步：':''" style="margin-bottom: 0">
        <div class="uploadBox">
          <el-upload
            ref="uploadRef"
            action=""
            drag
            v-loading="loading"
            :element-loading-text="loadingText"
            :accept="accept"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="uploadExcel"
            :on-remove="removeFile"
          >
            <transition name="el-fade-in">
              <div v-if="file" class="upload-list-view">
                <ul @click.stop="" class="el-upload-list el-upload-list--text">
                  <li class="el-upload-list__item is-ready">
                    <a class="el-upload-list__item-name">
                      <i class="el-icon-document"></i>
                      {{ file.name }}
                    </a>
                    <i class="el-icon-close" @click="removeFile"></i>
                  </li>
                </ul>
                <el-button
                  size="small"
                  plain
                  class="remove-btn"
                  type="primary"
                  round
                  @click="removeFile"
                  >重新选择</el-button
                >
              </div>
              <div v-else>
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或点击上传</div>
                <div v-if="uploadTip">
                  <el-link type="danger" :underline="false">{{ uploadTip }}</el-link>
                </div>
              </div>
            </transition>
          </el-upload>
        </div>
      </el-form-item>
      <slot></slot>

      <template v-if="failList">
        <div class="fail-export-btn">
          <span class="el-form-item__label">导入失败：</span>
          <div class="mr20">
            <DescButton
              icon="el-icon-download"
              circle
              plain
              desc="导出失败数据"
              size="mini"
              @click="exportVisible = true"
            />
          </div>
        </div>
        <el-table stripe :data="failList">
          <el-table-column v-for="col in tableCols" :key="col.prop" v-bind="col"></el-table-column>
        </el-table>
      </template>
    </el-form>

    <template v-if="wrapComponent == 'BaseDialog'">
      <div slot="footer" class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </div>
    </template>
    <ExportExcel
      :tableItem="tableCols"
      @exportCol="exportCol"
      :exportVisible.sync="exportVisible"
    ></ExportExcel>
  </component>
</template>

<script>
  import { promiseFileMd5 } from '@/utils/common/tools.js';
  import { streamUpload } from '@/api/public.js';
  import { exportXlsxData } from '@/utils/common/tableExport';

  export default {
    props: {
      stepShow: { type: Boolean, default: true }, // 是否显示步骤，为false是只有导入框
      wrapper: { type: String, default: 'dialog' }, // dialog | drawer
      title: { type: String },
      id: { type: [Number, String], default: 40 }, // 下载模板id
      accept: { type: String, default: '.xlsx,.xls,.csv' }, // upload accept
      fileTypes: { type: Array, default: () => ['xlsx', 'xls', 'csv'] }, // 文件尾缀
      beforeSubmit: { type: Function }, // 返回Promise.reject或false终止提交 () => Promise | false | any
      upload: { type: Function }, // 导入数据方法 required
      formatFail: { type: Function }, // 存在部分成功时，该方法返回upload请求结果失败部分 (uploadRes) => any[]
      tableCols: { type: Array }, // 失败数据table列 { prop:string; label:string, ...el-table-column's props }[]
    },
    components: {
      BaseDrawer: () => import('@/components/BaseDrawer'),
      BaseDialog: () => import('@/components/BaseDialog'),
      DownloadButton: () => import('@/components/Upload/template'),
      ExportExcel: () => import('./ExportExcel'),
    },
    data() {
      return {
        exportVisible: false,
        file: null,
        file_name: null,
        failList: null,
        loading: false,
        loadingText: '',
      };
    },
    computed: {
      wrapComponent() {
        return this.wrapper == 'dialog' ? 'BaseDialog' : 'BaseDrawer';
      },
      uploadTip() {
        if (this.fileTypes?.length) {
          return `支持文件类型：${this.fileTypes.join('、')}`;
        }
      },
    },
    methods: {
      exportCol(val) {
        if (!this.failList || !this.failList.length) return;
        if (!val || !val.length) return;
        let export_data = this.failList.map((i) => {
          let back_item = {};
          val.forEach((element) => {
            back_item[element.label] = i[element.prop];
          });
          return back_item;
        });
        exportXlsxData(export_data, `${this.file_name}-导入失败数据`);
      },
      beforeUpload(file) {
        if (this.fileTypes?.length) {
          const nameArr = file.name.split('.');
          if (nameArr.length <= 1) {
            return this.$notify.warning('未知类型文件！');
          }
          const type = nameArr.pop().toLowerCase();
          if (!this.fileTypes.includes(type)) {
            this.$notify.warning('请选择正确类型的文件！');
            return false;
          }
        }
        return true;
      },
      uploadExcel(options) {
        const { file } = options;
        this.file = file;
        this.file_name = this.getFileName(file?.name);
        this.$refs.uploadRef?.clearFiles();
      },
      getFileName(val) {
        if (!val) return '';
        let str = val;
        str = str.split('.');
        str.pop();
        return str.join('.');
      },
      removeFile(file) {
        this.file = null;
        this.$refs.uploadRef?.clearFiles();
      },
      submit() {
        const res = this.beforeSubmit?.();
        if (res === false) return;
        if (res instanceof Promise) {
          return res.then(this.uploadSubmit).catch(console.error);
        } else {
          return this.uploadSubmit();
        }
      },
      uploadSubmit() {
        if (!this.file) {
          return this.$notify.warning('请先选择模板文件！');
        }
        this.showLoading('上传文件中...');
        promiseFileMd5(this.file)
          .then((md5) => {
            const params = {
              name: this.file.name,
              md5,
            };
            return streamUpload(this.file, params);
          })
          .then((uploadRes) => {
            this.failList = null;
            this.showLoading('文件解析中...');
            const { url, upload_id } = uploadRes.data;
            return this.upload(url, upload_id).then((importData) => {
              this.hideLoading();
              const failList = this.formatFail?.(importData);
              if (failList) {
                if (this.wrapper == 'dialog') {
                  this.$emit('success');
                }
                this.failList = failList;
              } else {
                this.$notify.success(importData.message || '导入数据成功！');
                this.close();
                this.$emit('success');
              }
            });
          })
          .catch((err) => {
            this.hideLoading();
            this.$notify.error(err.message || err || '导入数据失败！');
          });
      },
      showLoading(text) {
        this.loading = true;
        this.loadingText = text;
      },
      hideLoading() {
        this.loading = false;
        this.loadingText = '';
      },
      close() {
        this.failList = null;
        this.removeFile();
        this.hideLoading();
        this.$emit('update:visible', false);
      },
    },
  };
</script>
<style lang="scss" scoped>
  ::v-deep.el-table .el-table__header-wrapper th,
  ::v-deep.el-table .el-table__fixed-header-wrapper th {
    word-break: break-word;
    background-color: #f8f8f9;
    color: #515a6e;
    height: 40px;
    font-size: 13px;
  }
  .upload-list-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: normal;
    transition: all 0.3s;
    .remove-btn {
      margin-top: 10px;
      display: none;
    }
    &:hover {
      background-color: rgba($color: #000000, $alpha: 0.5);
      .el-upload-list__item {
        background-color: #fff !important;
      }
      .remove-btn {
        margin-top: 10px;
        display: inline-block;
      }
    }
  }
  .fail-export-btn {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .container {
    padding: 15px 20px;
  }
  .tips {
    // font-size: 12px;
    margin-left: 5px;
  }
  .uploadBox {
    display: inline-block;
    vertical-align: top;
  }
  ::v-deep .el-drawer .drawer-main {
    background-color: #fff;
  }
</style>
