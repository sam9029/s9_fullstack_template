<template>
  <div class="errPage-container">
    <el-row :gutter="50">
      <el-col :span="12">
        <img
          class="error_401"
          src="https://koc-img.lizhibj.cn/manage/404.svg"
          width="416"
          height="410"
          alt="http error 401"
        />
      </el-col>
      <el-col :span="12">
        <div class="bullshit">
          <div class="bullshit__oops">404错误!</div>
          <div class="bullshit__headline">找不到网页！</div>
          <div class="bullshit__info"
            >对不起，您正在寻找的页面不存在。尝试检查URL的错误，然后按浏览器上的刷新按钮或尝试在我们的应用程序中找到其他内容。</div
          >
          <!-- <router-link to="/" class="bullshit__return-home"> 返回首页 </router-link> -->
          <router-link :to="firstRouter" class="bullshit__return-home"> 返回首页 </router-link>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  export default {
    name: 'Page404',
    computed: {
      message() {
        return '';
      },
      firstRouter() {
        return (this.$store.getters && this.$store.getters.firstRouter) || '/';
      },
    },
  };
</script>

<style lang="scss" scoped>
  .errPage-container {
    margin-top: 150px;
    .error_401 {
      float: right;
    }
    .bullshit {
      position: relative;
      float: left;
      width: 300px;
      padding: 100px 0;
      overflow: hidden;
      &__oops {
        font-size: 32px;
        font-weight: bold;
        line-height: 40px;
        color: var(--theme-default);
        opacity: 0;
        margin-bottom: 20px;
        animation-name: slideUp;
        animation-duration: 0.5s;
        animation-fill-mode: forwards;
      }
      &__headline {
        font-size: 20px;
        line-height: 24px;
        color: #222;
        font-weight: bold;
        opacity: 0;
        margin-bottom: 10px;
        animation-name: slideUp;
        animation-duration: 0.5s;
        animation-delay: 0.1s;
        animation-fill-mode: forwards;
      }
      &__info {
        font-size: 13px;
        line-height: 21px;
        color: grey;
        opacity: 0;
        margin-bottom: 30px;
        animation-name: slideUp;
        animation-duration: 0.5s;
        animation-delay: 0.2s;
        animation-fill-mode: forwards;
      }
      &__return-home {
        display: block;
        float: left;
        width: 110px;
        height: 36px;
        background: var(--theme-default);
        border-radius: 100px;
        text-align: center;
        color: #ffffff;
        opacity: 0;
        font-size: 14px;
        line-height: 36px;
        cursor: pointer;
        animation-name: slideUp;
        animation-duration: 0.5s;
        animation-delay: 0.3s;
        animation-fill-mode: forwards;
      }
      @keyframes slideUp {
        0% {
          transform: translateY(60px);
          opacity: 0;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }
    }
  }
</style>
