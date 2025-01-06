<template>
  <!-- <section class="app-main"> -->
  <!-- <div class="fixed" v-if="showBar">
      <NewSidebar />
    </div> -->

  <!-- <div :class="classObj"> -->
  <div class="app-main">
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cachedViews">
        <router-view :key="key" />
      </keep-alive>
    </transition>
  </div>
  <!-- </section> -->
</template>

<script>
  import { mapGetters } from 'vuex';
  // import NewSidebar from "./NewSidebar";
  export default {
    name: 'AppMain',
    // components: { NewSidebar },
    data() {
      return {};
    },
    computed: {
      // ...mapGetters(["sidebar"]),
      cachedViews() {
        return this.$store.state.tagsView.cachedViews;
      },
      key() {
        return this.$route.path;
      },
      // classObj() {
      //   return {
      //     hideSidebar: !this.sidebar.opened,
      //     right: this.showBar,
      //     indexRight: !this.showBar
      //   };
      // },
      // showBar() {
      //   return this.$route.matched[0].path ? true : false;
      // }
    },
  };
</script>

<style lang="scss" scoped>
  .app-main {
    height: 100%;
  }
  // $navHeight: 64px;
  // $tagHeight: 34px;
  // .app-main {
  //   min-height: calc(100vh - #{$navHeight});
  //   width: 100%;
  //   position: relative;
  //   overflow: hidden;
  //   padding: 10px 10px 10px 0;
  //   .fixed {
  //     position: fixed;
  //     top: calc(10px + #{$navHeight});
  //   }
  // }

  // .right {
  //   float: right;
  //   width: calc(100vw - 210px);
  // }
  // .hideSidebar {
  //   float: right;
  //   width: calc(100vw - 80px);
  // }
  // .indexRight {
  //   width: 100%;
  // }

  // .fixed-header + .app-main {
  //   padding-top: calc(10px + #{$navHeight});
  // }

  // .hasTagsView {
  //   .app-main {
  //     /* 84 = navbar + tags-view = 50 + 34 */
  //     min-height: calc(100vh - #{$navHeight} - #{$tagHeight});
  //   }

  //   .fixed-header + .app-main {
  //     padding-top: calc(10px + #{$navHeight} + #{$tagHeight});
  //   }

  //   .fixed-header + .app-main .fixed {
  //     position: fixed;
  //     top: calc(10px + #{$navHeight} + #{$tagHeight});
  //   }
  // }
</style>

<style lang="scss">
  // fix css style bug in open el-dialog
  // .el-popup-parent--hidden {
  //   .fixed-header {
  //     padding-right: 15px;
  //   }
  // }
</style>
