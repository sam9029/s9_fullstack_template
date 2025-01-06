<template>
  <div class="drawer-container">
    <div>
      <div class="setting-drawer-content">
        <div class="setting-drawer-title">
          <h3 class="drawer-title">主题风格设置</h3>
        </div>
        <div class="setting-drawer-block-checbox">
          <template v-for="[sideThemeName, sideItem] in sideThemeColors">
            <div class="menu-item" :key="sideThemeName" @click.stop="handleTheme(sideThemeName)">
              <MenuStyle
                :bgColor="sideItem.bgColor"
                :color="sideItem.color"
                :checked="sideTheme == sideThemeName"
              ></MenuStyle>
            </div>
          </template>
        </div>

        <div class="drawer-item">
          <span>页面主题颜色</span>
          <theme-picker style="float: right; margin: -3px 8px 0 0" @change="themeChange" />
        </div>
      </div>

      <el-divider />

      <h3 class="drawer-title">系统布局配置</h3>

      <div class="drawer-item">
        <span>展示历史标签</span>
        <el-switch v-model="tagsView" class="drawer-switch" />
      </div>

      <div class="drawer-item">
        <span>页面动态标题</span>
        <el-switch v-model="dynamicTitle" class="drawer-switch" />
      </div>

      <el-divider />

      <el-button size="small" type="primary" plain icon="el-icon-document-add" @click="saveSetting"
        >保存配置</el-button
      >
      <el-button size="small" plain icon="el-icon-refresh" @click="resetSetting"
        >重置配置</el-button
      >
    </div>
  </div>
</template>

<script>
  import ThemePicker from '@/components/ThemePicker';
  import MenuStyle from './MenuStyle';
  import { topNavThemeMap } from '@/utils/topNavStyle';

  export default {
    components: { ThemePicker, MenuStyle },
    data() {
      return {
        theme: this.$store.getters.effectSettings.theme,
        sideTheme: this.$store.getters.effectSettings.sideTheme,
        sideThemeColors: topNavThemeMap,
      };
    },
    computed: {
      tagsView: {
        get() {
          return this.$store.getters.effectSettings.tagsView;
        },
        set(val) {
          this.$store.dispatch('settings/changeSetting', {
            key: 'tagsView',
            type: 'user',
            value: val,
          });
        },
      },

      dynamicTitle: {
        get() {
          return this.$store.getters.effectSettings.dynamicTitle;
        },
        set(val) {
          this.$store.dispatch('settings/changeSetting', {
            key: 'dynamicTitle',
            type: 'user',
            value: val,
          });
        },
      },
    },
    methods: {
      themeChange(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'theme',
          type: 'user',
          value: val,
        });
        this.theme = val;
      },
      handleTheme(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'sideTheme',
          type: 'user',
          value: val,
        });
        this.sideTheme = val;
      },
      saveSetting() {
        const loading = this.$loading({
          lock: true,
          fullscreen: false,
          text: '正在保存到本地，请稍后...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)',
        });
        localStorage.setItem(
          'layout-setting',
          `{
            "tagsView":${this.tagsView},
            "dynamicTitle":${this.dynamicTitle},
            "sideTheme":"${this.sideTheme}",
            "theme":"${this.theme}"
          }`,
        );
        setTimeout(loading.close(), 1000);
      },
      resetSetting() {
        this.$loading({
          lock: true,
          fullscreen: false,
          text: '正在清除设置缓存并刷新，请稍后...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)',
        });
        localStorage.removeItem('layout-setting');
        // eslint-disable-next-line no-implied-eval
        setTimeout('window.location.reload()', 1000);
      },
    },
  };
</script>

<style lang="scss" scoped>
  .setting-drawer-content {
    .setting-drawer-title {
      margin-bottom: 12px;
      color: rgba(0, 0, 0, 0.85);
      font-size: 14px;
      line-height: 22px;
      font-weight: bold;
    }

    .setting-drawer-block-checbox {
      display: flex;
      justify-content: flex-start;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .menu-item {
      margin-right: 16px;
    }
  }

  .drawer-container {
    padding: 24px;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;

    .drawer-title {
      margin-bottom: 12px;
      color: rgba(0, 0, 0, 0.85);
      font-size: 14px;
      line-height: 22px;
    }

    .drawer-item {
      color: rgba(0, 0, 0, 0.65);
      font-size: 14px;
      padding: 12px 0;
    }

    .drawer-switch {
      float: right;
    }
  }
</style>
