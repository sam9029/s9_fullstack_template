<template>
  <el-dialog
    v-bind="$attrs"
    :appendToBody="appendToBody"
    :center="center"
    :closeOnClickModal="closeOnClickModal"
    :customClass="customClass"
    :destroyOnClose="destroyOnClose"
    :fullscreen="com_fullscreen"
    :lockScroll="lockScroll"
    :modal="modal"
    :modalAppendToBody="modalAppendToBody"
    :showClose="showClose"
    :title="title"
    :top="top"
    :visible.sync="$attrs.visible"
    :width="width"
    v-on="$listeners"
    @close="visibleChange(false, 'close')"
    @closed="visibleChange(false, 'closed')"
    @open="visibleChange(true, 'open')"
    @opened="visibleChange(true, 'opened')"
  >
    <template slot="title">
      <slot name="title"></slot>
    </template>
    <template slot="footer">
      <!-- slot默认内容的语法兼容 -->
      <slot v-if="$slots.footer" name="footer"></slot>
      <template v-else>
        <div class="footer" v-if="showFooter">
          <el-button @click="visibleChange(false, 'cancel')">取 消</el-button>
          <el-button type="primary" :loading="okLoading" @click="visibleChange(true, 'ok')">
            确 定
          </el-button>
        </div>
      </template>
    </template>

    <div v-loading="loading" class="main">
      <slot></slot>
    </div>
  </el-dialog>
</template>

<script>
  import { defaultProps } from './props';
  export default {
    props: defaultProps,
    data() {
      return {
        screenWidth: '',
        screenHeight: '',
      };
    },
    computed: {
      com_fullscreen() {
        if (this.fullscreen) return true;
        if (this.screenWidth < 1024) return true;
        return false;
      },
    },
    methods: {
      visibleChange(val, type) {
        this.$emit('visible-change', val, type);
      },
    },
    mounted() {
      this.screenWidth = document.body.clientWidth;
      this.screenHeight = document.body.clientHeight;
      window.onresize = () => {
        return (() => {
          this.screenWidth = document.body.clientWidth;
          this.screenHeight = document.body.clientHeight;
          // console.log(this.screenHeight);
        })();
      };
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep .el-dialog__title {
    display: inline-block;
    font-weight: 800;
  }
  ::v-deep .el-dialog__header {
    border-bottom: 1px solid #e3e3e3;
  }
  ::v-deep .el-dialog__footer {
    border-top: 1px solid #e3e3e3;
    text-align: none;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  ::v-deep .el-dialog__body {
    max-height: 60vh;
    overflow: scroll;
  }
</style>
