<template>
  <el-radio-group class="custom-radio-group" size="small" v-model="curr" v-on="$listeners">
    <template v-for="item in group">
      <el-badge :hidden="item.badgeHidden" :key="item.radioLabel" :value="item.badgeNum">
        <el-radio-button :label="item.radioLabel">{{item.label}}</el-radio-button>
      </el-badge>
    </template>
  </el-radio-group>
</template>

<script>
export default {
  props: {
    group: {
      type: Array,
      default: () => [],
    },
    value: {
      //
    }
  },
  data() {
    return {
      //
    }
  },
  computed: {
    curr: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val);
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.custom-radio-group {
  ::v-deep .el-badge__content.is-fixed {
    z-index: 1;
  }

  ::v-deep .el-radio-button .el-radio-button__inner {
    min-width: 80px;
  }
}
</style>