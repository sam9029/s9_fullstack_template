<template>
  <div>
    <van-floating-bubble :gap="6" v-model:offset="offset" axis="xy" magnetic="x" @click="qrClick" v-if="qr_link">
      <template v-slot:default>
        <van-icon class="text-[24px]" name="qr" />
      </template>
    </van-floating-bubble>
    <van-popup v-model:show="show" round @close="close">
      <div class="image-box">
        <img :src="qr_link" width="100%" mode="widthFix" />
      </div>
    </van-popup>
  </div>
</template>

<script>
  import { useUserStore } from '@/store/modules/user';
  export default {
    data() {
      return {
				offset: { y: 400 },
        show: false,
      };
    },
    computed: {
      qr_link() {
        return useUserStore()?.qr_link?.qr_link;
      },
      account_id() {
        return useUserStore().account_id;
      },
    },
    mounted() {
      this.init();
    },
    methods: {
      init() {
        if (
          this.qr_link && localStorage.getItem(`home_floating_show`) != `${this.getNowTime() + '-' + this.account_id}`
        ) {
          this.show = true;
        }
      },
      qrClick() {
        this.show = true;
      },
      close() {
        localStorage.setItem(
          `home_floating_show`,
          `${this.getNowTime() + '-' + this.account_id}`,
        );
        this.show = false;
      },
      getNowTime() {
        let data = new Date();
        let year = data.getFullYear();
        let month = data.getMonth() + 1;
        let day = data.getDate();
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;
        const Time = `${year}-${month}-${day}`;
        return Time;
      },
    },
  };
</script>

<style lang="scss" scoped>
  :deep(.image-box) {
    // border-radius: 5px;
    min-width: 200px;
    max-width: 300px;
    max-height: 500px;
    overflow: scroll;

    img,
    image,
    ._img {
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
    }
  }
</style>
