<template>
  <div class="bottom-btn  bg-white flex justify-center items-center w-full z-50" :class="fixed ? 'fixed bottom-0' : ''">
    <div class="w-full" v-if="data[button_index]">
      <div class="flex flex-row gap-[14px] justify-center items-center m-[14px]">
        <template v-for="(item, index) in data[button_index]">
          <van-button
            :key="index"
            v-if="item"
            :style="{ width: `${item.width || 100 / data[button_index].length + '%'}`, ...item.style }"
            :type="item.type"
            :plain="item.plain"
            :hairline="item.hairline"
            :disabled="item.disabled"
            :loading="item.loading"
            :round="item.round"
            :icon="item.icon"
            :color="item.color"
            :icon-position="item.iconPosition || 'left'"
            :url="item.url"
            :to="item.to"
            :replace="item.replace"
            @click="handle(item)"
            >{{ item.text }}</van-button
          >
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      data: {
        type: Array,
        default: () => [],
      },
      fixed: {
        type: Boolean,
        default: true,
      },
			// 展示 data 的第 index 组按钮
      buttonIndex: {
        type: Number,
        default: 0,
      },
    },
    data() {
      return {
        button_index: 0,
      };
    },
    watch: {
      button_index: {
        deep: true,
        immediate: true,
        handler(v) {},
      },
      buttonIndex: {
        deep: true,
        immediate: true,
        handler(v) {
          if (this.button_index != v) {
            this.button_index = v;
          }
        },
      },
    },
    methods: {
      handle(item) {
        if (item.onClick) {
          this.$emit(item.onClick, item);
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
</style>
