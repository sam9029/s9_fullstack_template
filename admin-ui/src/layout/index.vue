<template>
  <section
    class="ant-layout"
    id="baseLayout"
    :class="{ hasTagsView: needTagsView, 'main-container': !topNav }"
  >
    <header class="ant-layout-header">
      <navbar />
      <tags-view v-if="needTagsView" />
    </header>
    <section class="ant-layout ant-layout-has-sider" style="margin-top: 10px">
      <aside
        class="ant-layout-sider ant-layout-sider-has-trigger"
        style="flex: 0 0 auto; padding: 0; margin: 0"
        v-if="showBar"
      >
        <NewSidebar />
      </aside>
      <section class="ant-layout" style="overflow-x: hidden">
        <main class="ant-layout-content">
          <app-main />
        </main>
      </section>
    </section>

    <RightPanel>
      <settings />
    </RightPanel>
    <RightTip></RightTip>
    <!-- <public-style></public-style> -->
  </section>
  <!-- <div
    :class="classObj"
    class="app-wrapper"
    :style="{ '--current-color': theme }"
  >
    <div
      v-if="device === 'mobile' && sidebar.opened"
      class="drawer-bg"
      @click="handleClickOutside"
    />
    <sidebar
      v-show="!topNav"
      class="sidebar-container"
      :style="{
        backgroundColor:
          sideTheme === 'theme-dark' ? variables.menuBg : variables.menuLightBg
      }"
    />
    <div :class="{ hasTagsView: needTagsView, 'main-container': !topNav }">
      <div
        :class="{ 'fixed-header': fixedHeader, wid100: topNav }"
        style="zIndex:2002"
      >
        <navbar />
        <tags-view v-if="needTagsView" />
      </div>

      <app-main />

      <right-panel v-if="showSettings">
        <settings />
      </right-panel>
    </div>
    <public-style></public-style>
  </div> -->
</template>

<script>
  import RightPanel from '@/components/RightPanel';
  import { AppMain, Navbar, Settings, TagsView, PublicStyle } from './components';
  import ResizeMixin from './mixin/ResizeHandler';
  import { mapState } from 'vuex';
  import variables from '@/assets/styles/variables.scss';
  import NewSidebar from './components/NewSidebar';

  export default {
    name: 'Layout',
    components: {
      AppMain,
      Navbar,
      NewSidebar,
      RightPanel,
      Settings,
      TagsView,
      PublicStyle, // <style>标签基本有scope v-deep+import不能作用到弹窗等元素
      RightTip: () => import('@/components/RightTip')
    },
    data() {
      return {
        menuHover: false,
      };
    },
    mixins: [ResizeMixin],
    computed: {
      ...mapState({
        theme: (state) => state.settings.effectSettings.theme,
        sideTheme: (state) => state.settings.effectSettings.sideTheme,
        sidebar: (state) => state.app.sidebar,
        device: (state) => state.app.device,
        showSettings: (state) => state.settings.effectSettings.showSettings,
        needTagsView: (state) => state.settings.effectSettings.tagsView,
        fixedHeader: (state) => state.settings.effectSettings.fixedHeader,
      }),
      classObj() {
        return {
          hideSidebar: !this.sidebar.opened,
          openSidebar: this.sidebar.opened,
          withoutAnimation: this.sidebar.withoutAnimation,
          mobile: this.device === 'mobile',
        };
      },
      variables() {
        return variables;
      },
      topNav: {
        get() {
          return this.$store.getters.effectSettings.topNav;
        },
      },
      showBar() {
        // return this.$route.matched[0].meta?.show_sidebar == 1 ? true : false;
        return this.$route.meta?.show_sidebar == 1 ? true : false;
        // return this.$route.matched[0].path ? true : false;
      },
    },
    methods: {
      handleClickOutside() {
        this.$store.dispatch('app/closeSideBar', { withoutAnimation: false });
      },
    },
  };
</script>

<style lang="scss" scoped>
  $navHeight: 64px;
  $tagHeight: 34px;

  #baseLayout {
    height: 100%;
    min-width: 1024px;
  }

  .ant-layout {
    display: flex;
    flex: auto;
    flex-direction: column;
    min-height: 0;
  }

  .ant-layout-sider {
    position: relative;
    min-width: 0;
    transition: all 0.2s;
  }

  .ant-layout-header {
    flex: 0 0 auto;
    // height: $navHeight;
    // line-height: $navHeight;
  }
  .hasTagsView {
    .ant-layout-header {
      flex: 0 0 auto;
      height: calc(#{$tagHeight} + #{$navHeight});
    }
  }

  .ant-layout-sider-has-trigger {
    padding-bottom: 48px;
  }

  .ant-layout.ant-layout-has-sider {
    flex-direction: row;
  }
  .ant-layout-content {
    padding: 0 12px 12px;
    flex: auto;
    min-height: 0;
  }
</style>
