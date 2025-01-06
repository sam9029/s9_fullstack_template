<template>
  <div
    id="login"
    class="login-main-page"
    :class="{
      'login-create-main-page': path != '/login',
    }"
  >
    <LoginCard v-show="path == '/login'" ref="loginForm" />
  </div>
</template>

<script>
  import LoginCard from './loginCard.vue';
  export default {
    name: 'Login',
    components: {
      LoginCard,
    },
    data() {
      return {
        miniprogram: false,
        path: '/login',
      };
    },
    mounted() {
      this.path = this.$route.path;

      // 判断是否在微信小程序中
      if (typeof wx !== 'undefined') {
        wx.miniProgram.getEnv((res) => {
          if (res.miniprogram) this.miniprogram = true;
        });
      }

      // this.$refs.loginForm.open();
    },
    methods: {},
  };
</script>

<style lang="scss" scoped>
  #home {
    background-size: cover;
    background-position: center;
    background-image: url('https://koc-img.lizhibj.cn/2038C5CDC84E445BA9C8C776CFD305FB.jpg');
    overflow: hidden;
    height: 100vh;
    .container {
      max-width: 80%;
    }
  }

  @media (max-width: 576px) {
    #home {
      background-size: cover;
      background-position: 30% 0;
      height: 100vh;
      .container {
        width: 100%;
        max-width: unset;
      }
      .yuanxian {
        width: 100px;
        height: 100px;
        position: absolute;
        left: -45px;
        z-index: 9;
        bottom: -85px;
        color: #fff;
        border: 1px solid #e9a6fe;
        border-radius: 100px;
      }
    }
    .center_576 {
      display: flex;
      justify-content: center;
    }
    .login-main-page {
      .section {
        padding-top: 60px;
        padding-bottom: 60px;
        position: relative;
      }
    }
    .liaojiegengduo {
      margin-top: 0;
    }
  }
  .liaojiegengduo {
    margin-top: 30px;
    background-image: linear-gradient(to right, #e42795, #9d17a1);
    border: none !important;
    color: #fff !important;
    letter-spacing: 2px;
  }
  .login-main-page {
    background-image: url('https://koc-img.lizhibj.cn/2038C5CDC84E445BA9C8C776CFD305FB.jpg');
    height: 100%;
    background-size: 100% 100%;
    font-family: 'Rubik', sans-serif;
    position: relative;
    // overflow-x: hidden !important;
    overflow-y: hidden !important;
    overflow-x: scroll !important;
    min-width: 1200px;
  }

  // 创作者（ MCN & 个人 ）登录样式
  .login-create-main-page {
    background-image: url('https://koc-img.lizhibj.cn/manage/login_create_bg.png');
  }
</style>
<style lang="scss">
  // @import './style.scss';
</style>
