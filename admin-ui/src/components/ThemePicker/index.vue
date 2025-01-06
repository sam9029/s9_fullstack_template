<template>
  <el-color-picker
    v-model="theme"
    :predefine="[
      '#409EFF',
      '#1890ff',
      '#304156',
      '#212121',
      '#11a983',
      '#13c2c2',
      '#6959CD',
      '#f5222d',
    ]"
    class="theme-picker"
    popper-class="theme-picker-dropdown"
  />
</template>

<script>
  import { changeThemeColor } from '@/utils/theme';
  const version = require('element-ui/package.json').version; // element-ui version from node_modules
  const ORIGINAL_THEME = '#409EFF'; // default color
  let chalk = ''; // content of theme-chalk css

  export default {
    data() {
      return {
        theme: '',
      };
    },
    computed: {
      defaultTheme() {
        return this.$store.getters.effectSettings.theme;
      },
    },
    watch: {
      defaultTheme: {
        handler: function (val, oldVal) {
          this.theme = val;
        },
        immediate: true,
      },
      async theme(val, perVal) {
        this.asyncSetNewTheme(val, perVal);
      },
    },

    methods: {
      async asyncSetNewTheme(newTheme, oldTheme) {
        const $message = this.$notify({
          message: '  Compiling the theme',
          customClass: 'theme-message',
          type: 'success',
          duration: 0,
          iconClass: 'el-icon-loading',
        });
        changeThemeColor(newTheme)
          .then(() => {
            this.$emit('change', newTheme);
            $message.close();
          })
          .catch((err) => {
            $message.close();
            if (err == 'E_NET_ERR') {
              this.theme = oldTheme;
              this.$notify.error('网络错误，配置主题失败，请稍后再试！');
            } else {
              this.$notify.error('配置页面主题色失败，即将重新加载...');
              setTimeout(() => {
                location.reload();
              }, 2000);
            }
          });
      },
    },
  };
</script>

<style>
  .theme-message,
  .theme-picker-dropdown {
    z-index: 99999 !important;
  }
  /* 
.theme-picker .el-color-picker__trigger {
  height: 26px !important;
  width: 26px !important;
  padding: 2px;
} */

  .theme-picker-dropdown .el-color-dropdown__link-btn {
    display: none;
  }
</style>
