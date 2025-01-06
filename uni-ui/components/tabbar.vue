<template>
  <u-tabbar
    ref="tabbar"
    :value="tabar.current"
    :show="showTab"
    :bg-color="tabar.bgColor"
    :border-top="tabar.borderTop"
    :mid-button="tabar.midButton"
    :inactive-color="tabar.inactiveColor"
    :activeColor="tabar.activeColor"
    @change="changeTab"
    @height="setHeight"
  >
    <u-tabbar-item
      v-for="(item, index) in tabar.list"
      :key="index"
      :text="item.text"
      :icon="item.iconPath"
    ></u-tabbar-item>
  </u-tabbar>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
export default {
  data() {
    return {};
  },
  props: {
    showTab: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    ...mapGetters(["tabar"]),
  },
  onReady() {
    // console.log(this.$refs.tabbar.placeholderHeight,uni.$u.props)
  },
  methods: {
    ...mapMutations(["SET_CURRENT_TAB", "NAVIGATE", "SET_TABBAR_HEIGHT"]),
    changeTab(name) {
      let url = "";
      switch (name) {
        case 0:
          url = "/pages/novel/novel";
          break;
        case 1:
          url = "/pages/demand/demand";
          break;
        case 2:
          url = "/pages/income/income";
          break;
        case 3:
          url = "/pages/mine/mine";
          break;
      }
      uni.switchTab({
        url,
      });
      this.$store.commit("SET_CURRENT_TAB", name);
      this.$store.commit("NAVIGATE", name);
    },
    setHeight(val) {
      this.$store.commit("SET_TABBAR_HEIGHT", val);
      // console.log(val)
    },
  },
};
</script>

<style lang="scss" scoped></style>
