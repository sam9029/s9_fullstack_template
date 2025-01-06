<template>
  <div id="app">
    <router-view />
    <BankInfoDrawer />
  </div>
</template>

<script>
  let _ = require('lodash');
  import { decrypt, encrypt } from '@/utils/auth';
  export default {
    name: 'App',
    metaInfo() {
      return {
        title:
          this.$store.getters.effectSettings.dynamicTitle && this.$store.state.settings.pageTitle,
        titleTemplate: (title) => {
          return title ? `${title} - ${process.env.VUE_APP_TITLE}` : process.env.VUE_APP_TITLE;
        },
      };
    },
    // beforeDestroy() {
    //   window.removeEventListener('resize', this.setBodyZoom);
    //   this.$socketIo && this.$socketIo.disconnect(true);
    // },
    methods: {
      setBodyZoom() {
        const ratio = this.getResize();
        if (ratio == 1) {
          document.body.style.zoom = '';
        } else {
          document.body.style.zoom = 1 / ratio;
        }
      },
      getResize() {
        let ratio = 0;
        const screen = window.screen;
        return (screen.width * (window.outerHeight / window.innerHeight)) / 1920;
        const ua = navigator.userAgent.toLowerCase();

        if (window.devicePixelRatio !== undefined) {
          ratio = window.devicePixelRatio;
        } else if (~ua.indexOf('msie')) {
          if (screen.deviceXDPI && screen.logicalXDPI) {
            ratio = screen.deviceXDPI / screen.logicalXDPI;
          }
        } else if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
          ratio = window.outerWidth / window.innerWidth;
        }
        return ratio;
      },
      weakPwdNotify() {
        this.$confirm('当前登录密码强度较弱, 是否前往修改密码?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          router.push('/user/profile')
        }).catch(console.log);
      }
    },
    created() {
      // let data = encrypt([{ id: 3646 }]);
      // console.log(data, decrypt(data));
      const { href, protocol } = window.location;
      if (href && process.env.NODE_ENV == 'production' && protocol == 'http:') {
        let new_href = href.replace(/http:/g, 'https:');
        window.location.href = new_href;
        return;
      }
      const userInfo = this.$store.getters.userInfo;
      if (userInfo?.weak_pwd) {
        this.weakPwdNotify();
      }
    },
    // mounted() {
    //   window.addEventListener('resize', this.setBodyZoom);
    //   this.setBodyZoom();
    // },
  };
</script>

<style lang="scss" scoped>
  // .el-message {
  //   z-index: 2005 !important;
  // }
</style>
