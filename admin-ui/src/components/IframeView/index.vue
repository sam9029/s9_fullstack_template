<template>
  <component
    :is="dialog_type"
    :title="title"
    :visible.sync="visible"
    :width="dialog_width"
    :size="dialog_width"
    :append-to-body="true"
    @close="close"
    class="add-wrapper"
  >
    <div class="no-support__wrapper" v-if="is_application_file">
      <div class="mb10">
        <strong> {{ NO_SUPPORT }} 文件类型不支持在线预览 </strong>
      </div>
      <div>
        <strong>
          当前文件: <el-link type="primary"> {{ renderData.name }}</el-link
          >，已自动下载文件，请查看浏览器下载记录！
        </strong>
      </div>
    </div>
    <div class="Iframe__wrapper">
      <div v-if="visible" class="preview_webview mt10">
        <iframe
          :src="renderData.url"
          frameborder="0"
          :width="iframe_width"
          :height="iframe_height"
        ></iframe>
      </div>
    </div>

    <div slot="footer" class="dialog-footer common-margin">
      <el-button type="primary" :loading="submitLoading" @click="close">确 定</el-button>
    </div>
  </component>
</template>

<script>
  // 组件
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseDrawer from '@/components/BaseDrawer/index.vue';

  const NO_SUPPORT_ONLINE_PREVIEW_FILE_TYPE = ['docx', 'doc', 'xls', 'xlsx'];

  export default {
    components: {
      BaseDialog,
      BaseDrawer,
    },

    props: {
      dialog_type: {
        type: String,
        default: 'BaseDrawer',
      },
      dialog_width: {
        type: String,
        default: '1000px',
      },
      iframe_width: { type: [String, Number], default: '100%' },
      iframe_height: { type: [String, Number], default: '100%' },
    },

    computed: {
      is_drawer() {
        return this.dialog_type == 'BaseDrawer' ? true : false;
      },

      is_edit() {
        return this.title.includes('修改') ? true : false;
      },

      is_application_file() {
        if (NO_SUPPORT_ONLINE_PREVIEW_FILE_TYPE.includes(this.renderData.type)) {
          return true;
        }
        return false;
      },
    },

    data() {
      return {
        BaseDialog,
        BaseDrawer,
        NO_SUPPORT: NO_SUPPORT_ONLINE_PREVIEW_FILE_TYPE,
        title: '预览',
        visible: false,
        renderData: {
          type: null,
          name: null,
          url: '',
        },
      };
    },
    methods: {
      open(row) {
        this.visible = true;
        row && row.url && (this.renderData = { ...row });
      },

      close() {
        this.visible = false;
      },
    },
  };
</script>

<style lang="scss" scoped>
  .add-wrapper {
    .common-margin {
      margin: 10px;
    }
    .common-form-style {
      background: #fff;
      padding: 15px 20px 15px 15px;
      border: 1px solid #e6ebf5;
      border-radius: 6px;
    }

    ::v-deep .el-form-item__content {
      .el-input {
        width: 300px;
      }
    }
    .no-support__wrapper {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    ::v-deep {
      .el-dialog {
        margin-top: 10vh !important;
      }
      .el-dialog__body {
        max-height: 70vh;
      }

      .preview_webview {
        overflow: hidden;
        background-repeat: no-repeat;
        background-size: 100%;
        border-radius: 30px;
        padding: 10px 14px 35px;
        width: 100%;
        height: 800px;
      }
    }
  }
</style>
