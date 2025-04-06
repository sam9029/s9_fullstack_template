<template>
  <div>
    <slot v-if="$slots.default"></slot>
    <span v-else>
      <span>{{ format(value) }}</span>
    </span>
    <el-popover placement="right" width="200" v-if="editable" trigger="click" @show="show">
      <el-input-number
        v-model="value_new"
        size="mini"
        :controls="false"
        :precision="precision"
      ></el-input-number>
      <div class="edit-box">
        <span class="cancel-button" @click="closePopover">取消</span>
        <el-button type="primary" size="mini" @click="updateValue">修改</el-button>
      </div>
      <i slot="reference" class="el-icon-edit list-icon theme-color"></i>
    </el-popover>
  </div>
</template>

<script>
  export default {
    props: {
      value: [String, Number],
      precision: {
        type: Number,
        default: 0,
      },
      format: {
        type: Function,
        default: (value) => value,
      },
      unit: {
        type: Number,
        default: 1,
      },
      editable: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        value_new: '',
      };
    },
    methods: {
      show() {
        this.value_new = this.value / this.unit;
      },
      closePopover() {
        document.body.click();
      },
      updateValue() {
        this.$emit('change', this.value_new * this.unit);
        this.closePopover();
      },
    },
  };
</script>

<style lang="scss" scoped>
  .list-icon {
    margin-left: 3px;
    cursor: pointer;
  }
  .edit-box {
    text-align: right;
    margin-top: 8px;
    ::v-deep .el-button--mini {
      padding: 4px 9px;
      margin-left: 10px;
    }
    .cancel-button {
      cursor: pointer;
      color: var(--theme-default);
    }
  }
</style>
