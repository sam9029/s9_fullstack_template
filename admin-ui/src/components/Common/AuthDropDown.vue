<template>
  <el-dropdown v-if="authItems.length" v-bind="$attrs" v-on="$listeners">
    <!-- slot默认内容的语法兼容 -->
    <slot v-if="$slots.default"></slot>
    <template v-else>
      <el-button>
        批量操作
        <i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
    </template>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item
        v-for="item in authItems"
        :key="item.command"
        :command="item.command"
        :disabled="item.disabled"
        >{{ item.label }}</el-dropdown-item
      >
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
  export default {
    props: {
      items: {
        type: Array,
        default: () => [],
      },
    },
    computed: {
      authItems() {
        return this.items.filter((v) => !v.auth || this.$checkPermi(v.auth));
      },
    },
  };
</script>
