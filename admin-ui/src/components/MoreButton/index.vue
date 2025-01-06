<template>
  <el-popover v-model="moreShow" class="more" placement="left" trigger="click">
    <slot></slot>
    <el-button
      class="icon-arrow-down"
      :class="{ 'icon-arrow-down-show': moreShow }"
      slot="reference"
      icon="el-icon-arrow-down"
      circle
      style="margin-right: 8px"
    />
  </el-popover>
</template>

<script>
  export default {
    data() {
      return {
        moreShow: false,
      };
    },
    methods: {
      scrollHandle() {
        const { top } = this.$el.getBoundingClientRect();
        if (top < 100) {
          this.moreShow = false;
          window.removeEventListener('scroll', this.scrollHandle, true);
        }
      },
    },
    watch: {
      moreShow: {
        handler(val) {
          if (val) {
            window.addEventListener('scroll', this.scrollHandle, true);
          } else {
            window.removeEventListener('scroll', this.scrollHandle, true);
          }
        },
      },
    },
  };
</script>

<style lang="scss" scoped>
  .more {
    .icon-arrow-down {
      transform: rotate(270deg);
      transition: transform 0.5s;
    }
    .icon-arrow-down-show {
      transform: rotate(90deg);
    }
  }
</style>
