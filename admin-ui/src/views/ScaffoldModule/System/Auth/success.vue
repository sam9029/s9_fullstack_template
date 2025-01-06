<template>
  <div class="errPage-container">
    <el-row :gutter="50">
      <el-col :span="12">
        <img
          class="error_401"
          src="https://koc-img.lizhibj.cn/manage/AuthorizationSuccess.svg"
          width="416"
          height="410"
          alt="success"
        />
      </el-col>
      <el-col :span="12">
        <div class="bullshit">
          <!-- <div class="bullshit__oops">认证成功</div> -->
          <div class="bullshit__oops">授权成功</div>
          <!-- <div class="bullshit__headline">找不到网页！</div> -->
          <div class="bullshit__info">{{ message }}</div>
          <!-- <router-link to="/" class="bullshit__return-home"> 返回首页 </router-link> -->
          <el-button @click="closeSelectedTag" class="bullshit__return-home"> 返回首页 </el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  export default {
    name: 'authSuccess',
    computed: {
      message() {
        return this.$route.query.message || '授权成功';
      },
      firstRouter() {
        return (this.$store.getters && this.$store.getters.firstRouter) || '/';
      },
    },
    methods: {
      closeSelectedTag() {
        const visitedViews = this.$store.state.tagsView.visitedViews;
        let obj = {};

        visitedViews.forEach((element) => {
          if (element.name === 'AuthSuccess') obj = element;
        });
        this.$store.dispatch('tagsView/delView', obj);
        this.$router.replace({ path: '/' });
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
        line-height: 14px;
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
