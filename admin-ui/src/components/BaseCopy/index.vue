<template>
  <div class="copy-wrapper">
    <span v-if="label" class="mr5 no-warp">
      {{ label }}
    </span>
    <template v-if="name">
      <el-link
        :title="name"
        @click.stop="onClick"
        :underline="false"
        :disabled="disabled"
        type="primary"
      >
        {{ name }}
      </el-link>
      <el-tooltip content="点击复制" placement="top" class="ml5">
        <i
          @click="doCopy"
          :class="['el-icon-copy-document', 'theme-color', disabled ? 'not-pointer' : 'pointer']"
        ></i>
      </el-tooltip>
    </template>
  </div>
</template>

<script>
let notify = null;
export default {
  props: {
    label: {
      type: [Number, String],
      default: '',
    },
    name: {
      type: [Number, String],
      default: '',
    },
    disabled: Boolean,
  },
  methods: {
    doCopy() {
      if (this.disabled) return;
      this.$copyText(this.name).then(
        (e) => {
          if (notify) notify.close();
          notify = this.$notify({
            title: '成功',
            message: '复制成功！',
            type: 'success',
          });
        },
        (e) => {
          if (notify) notify.close();
          notify = this.$notify.error({
            title: '错误',
            message: '浏览器限制，复制失败！',
          });
        },
      );
    },
    onClick() {
      if (this.disabled) return;
      if (!this.name) return;
      this.name = this.name.trim();
      if (/^https{0,1}:\/\//.test(this.name)) {
        return window.open(this.name, '_blank');
      }
      this.$emit('click');
    },
  },
};
</script>

<style lang="scss" scoped>
.copy-wrapper {
  width: 100%;
  display: inline-flex;
  align-items: center;
}
.el-link {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.no-warp {
  display: inline-block;
  white-space: nowrap;
}
.not-pointer {
  cursor: not-allowed;
  color: var(--theme-light5);
}
::v-deep .el-link--inner {
  width: 100%;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
::v-deep .el-link {
  display: flex;
  align-items: center;
}
</style>
>
