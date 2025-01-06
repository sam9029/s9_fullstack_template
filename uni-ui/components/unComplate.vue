<template>
  <view class="u-p-t-150 u-text-center">
    <u-empty width="238" height="130" text="正在开发中，敬请期待！" :icon="image.building"> </u-empty>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  computed: {
    ...mapGetters(["image", "tabar"]),
  },
};
</script>

<style lang="scss" scoped>
</style>