<template>
  <div class="logo-container" :is-both="effectSettings.logoMode == 'both'">
    <template v-if="sideTheme === 'white'">
      <img
        src="https://koc-img.lizhibj.cn/manage/jyggpt.png"
        class="logo-img"
        style="padding-top: 4px; width: 178px"
      />
    </template>
    <template v-else>
      <template v-if="effectSettings.logoMode == 'both'">
        <div class="logo-img-box">
          <img :src="effectSettings.logo" class="logo-img" />
        </div>
        <el-divider direction="vertical" class="logo-divider"></el-divider>
        <div class="logo-title">{{ effectSettings.title }}</div>
      </template>
      <template v-else-if="effectSettings.logoMode == 'image'">
        <img
          src="https://koc-img.lizhibj.cn/61421990DDE84CF1BFF59D86D6767468.png"
          class="only-img"
        />
        <!-- <img :src="effectSettings.logo || logo" class="only-img" /> -->
      </template>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {};
  },
  computed: {
    ...mapGetters(['effectSettings']),
    sideTheme() {
      return this.$store.state.settings.effectSettings.sideTheme;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/layout/index.scss';
.logo-container {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 100%;
  max-width: 230px;
  margin-left: 12px;
  .logo-title {
    font-size: 16px;
    font-weight: bolder;
    color: var(--kj-nav-selected-color);
  }

  &[is-both='true'] {
    width: 170px;
    margin-left: 15px;

    .logo-img-box {
      display: flex;
      align-items: center;
      justify-content: center;
      .logo-img {
        width: 50px;
        height: 50px;
      }
      .logo-divider {
        height: 1.5em;
      }
    }
  }
  .only-img {
    // height: 50px;
    width: 160px;
    object-fit: contain;
  }
}
// .lizhi {
//   width: 156px;
//   height: 50px;
//   font-size: 36.967px;
//   fill: var();
//   font-family: "Source Han Sans CN";
//   font-weight: 800;
// }
</style>
